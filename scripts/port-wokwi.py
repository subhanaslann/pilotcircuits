# -*- coding: utf-8 -*-
"""Port the Wokwi Elements drawings into React components.

Converts each upstream Lit element's SVG template into a JSX fragment:
attributes to camelCase, lit bindings dropped, and every <defs> id scoped to the
drawn copy — `useSvgPrefix()` per rendered instance, then the part's own name —
so neither two parts nor two copies of one part can capture each other's
gradients, patterns, filters and clip paths.

    python scripts/port-wokwi.py --dest src/components/canvas/parts/wokwi

Sources are fetched from GitHub unless --src points at a local checkout of
https://github.com/wokwi/wokwi-elements (MIT).

Read src/components/canvas/parts/wokwi/README.md before re-running: the pin
tables in src/lib/circuit/wokwi.ts are NOT generated and have to be checked
against upstream in the same pass.
"""
import argparse
import io
import os
import re
import sys
import xml.etree.ElementTree as ET
from urllib.request import urlopen

RAW = "https://raw.githubusercontent.com/wokwi/wokwi-elements/main/src/%s.ts"

# Local name -> path under the upstream `src/`. The LED is absent on purpose:
# upstream wraps it in a <div> with a label, so only its inner renderSVG() is
# wanted and led-artwork.tsx is maintained by hand.
NEEDED = {
    "arduino-uno": "arduino-uno-element",
    "hc-sr04": "hc-sr04-element",
    "servo": "servo-element",
    "pir-motion-sensor": "pir-motion-sensor-element",
    "resistor": "resistor-element",
    "patterns-pins-female": "patterns/pins-female",
}


def fetch(src_dir, name, upstream, cache):
    """Element source, from a local checkout if given, else from GitHub."""
    path = os.path.join(cache, name + ".ts")
    if src_dir:
        body = io.open(os.path.join(src_dir, upstream + ".ts"), encoding="utf-8").read()
    elif os.path.exists(path):
        return path
    else:
        sys.stderr.write("fetching %s\n" % upstream)
        body = urlopen(RAW % upstream).read().decode("utf-8")
    io.open(path, "w", encoding="utf-8", newline="\n").write(body)
    return path


CAMEL_KEEP = {'viewBox','patternUnits','gradientUnits','patternTransform','gradientTransform',
              'spreadMethod','stdDeviation','baseFrequency','numOctaves','primitiveUnits',
              'filterUnits','maskUnits','maskContentUnits','clipPathUnits','markerWidth',
              'markerHeight','markerUnits','refX','refY','preserveAspectRatio','textLength',
              'lengthAdjust','pathLength','startOffset','systemLanguage','xChannelSelector',
              'yChannelSelector','tableValues','surfaceScale','specularConstant',
              'specularExponent','limitingConeAngle','pointsAtX','pointsAtY','pointsAtZ',
              'diffuseConstant','kernelMatrix','divisor','targetX','targetY','edgeMode'}


TAG_MAP = {t.lower(): t for t in (
    'clipPath', 'linearGradient', 'radialGradient', 'textPath', 'foreignObject',
    'feGaussianBlur', 'feOffset', 'feBlend', 'feColorMatrix', 'feComposite',
    'feFlood', 'feMerge', 'feMergeNode', 'feMorphology', 'feDropShadow',
    'feSpecularLighting', 'feDiffuseLighting', 'fePointLight', 'feSpotLight',
    'feDistantLight', 'feTurbulence', 'feDisplacementMap', 'feImage', 'feTile',
    'feComponentTransfer', 'feFuncR', 'feFuncG', 'feFuncB', 'feFuncA',
    'animateMotion', 'animateTransform',
)}


def kebab_to_camel(name):
    if name.startswith('data-') or name.startswith('aria-'):
        return name
    if name == 'class':     return 'className'
    if name == 'tabindex':  return 'tabIndex'
    if name == 'xlinkhref': return 'xlinkHref'
    if name in CAMEL_KEEP:  return name
    if '-' not in name:     return name
    head, rest = name.split('-')[0], name.split('-')[1:]
    return head + ''.join(p[:1].upper() + p[1:] for p in rest)


def css_to_obj(css, exprs):
    out = []
    for decl in css.split(';'):
        if ':' not in decl:
            continue
        k, v = decl.split(':', 1)
        k, v = k.strip(), v.strip()
        if not k:
            continue
        ck = re.sub(r'-(\w)', lambda m: m.group(1).upper(), k)
        if v in exprs:
            out.append('%s: %s' % (ck, exprs[v]))
        else:
            out.append("%s: '%s'" % (ck, v))
    return '{{ ' + ', '.join(out) + ' }}'


def extract_template(src):
    """Grab the backtick template following html` or svg`."""
    m = re.search(r'(?:html|svg)`', src)
    if not m:
        raise SystemExit('no template found in ' + src[:40])
    i = m.end()
    depth = 0
    out = []
    while i < len(src):
        c = src[i]
        if c == '\\':
            out.append(src[i:i + 2]); i += 2; continue
        if c == '$' and src[i + 1:i + 2] == '{':
            depth += 1; out.append(c); i += 1; continue
        if c == '}' and depth:
            depth -= 1; out.append(c); i += 1; continue
        if c == '`' and depth == 0:
            break
        out.append(c); i += 1
    return ''.join(out)


def placehold(tpl):
    """Replace ${...} with __EXPRn__ tokens, brace-matched."""
    exprs = {}
    out = []
    i = 0
    n = 0
    while i < len(tpl):
        if tpl[i] == '$' and tpl[i + 1:i + 2] == '{':
            j = i + 2
            depth = 1
            while j < len(tpl) and depth:
                if tpl[j] == '{':
                    depth += 1
                elif tpl[j] == '}':
                    depth -= 1
                j += 1
            key = '__EXPR%d__' % n
            n += 1
            exprs[key] = tpl[i + 2:j - 1].strip()
            out.append(key)
            i = j
        else:
            out.append(tpl[i]); i += 1
    return ''.join(out), exprs


def expr_text(s, exprs, pad):
    if s in exprs:
        return pad + '{%s}' % exprs[s]
    if '__EXPR' in s:
        parts = re.split(r'(__EXPR\d+__)', s)
        return pad + ''.join('{%s}' % exprs[p] if p in exprs else p for p in parts)
    return pad + s


def scoped(name, prefix):
    """An id, inside the drawn copy's own id space.

    `${uid}` is the component's `useSvgPrefix()` — see
    src/components/canvas/svg-ids.ts. The part prefix stays after it so the id
    still says what it is when you look at the DOM; on its own it separated
    part types and never two copies of one part.
    """
    return '${uid}-%s-%s' % (prefix, name)


def to_jsx(el, exprs, prefix, indent=2):
    tag = el.tag.split('}')[-1]
    tag = TAG_MAP.get(tag.lower(), tag)
    pad = ' ' * indent
    attrs = []
    for k, v in el.attrib.items():
        k = k.split('}')[-1] if '}' in k else k
        # `tabindex` came with an upstream click handler we do not port; left in,
        # it would put a dead tab stop in the middle of the canvas.
        if k[:1] in ('@', '?', '.') or k.startswith('xmlns') or k == 'tabindex':
            continue
        jk = kebab_to_camel(k)
        if k == 'id':
            attrs.append('%s={`%s`}' % (jk, scoped(v, prefix))); continue
        if k == 'style':
            attrs.append('style=%s' % css_to_obj(v, exprs)); continue
        v2 = re.sub(r'url\(#([^)]+)\)',
                    lambda m: 'url(#%s)' % scoped(m.group(1), prefix), v)
        if jk in ('href', 'xlinkHref') and v2.startswith('#'):
            v2 = '#' + scoped(v2[1:], prefix)
        if v2 in exprs:
            attrs.append('%s={%s}' % (jk, exprs[v2])); continue
        if '__EXPR' in v2 or '${uid}' in v2:
            parts = re.split(r'(__EXPR\d+__)', v2)
            tpl = ''.join('${%s}' % exprs[p] if p in exprs else p for p in parts)
            attrs.append('%s={`%s`}' % (jk, tpl)); continue
        attrs.append('%s="%s"' % (jk, v2.replace('"', '&quot;')))

    multiline = False
    astr = ''
    if attrs:
        joined = ' '.join(attrs)
        if len(joined) + len(tag) + indent < 92:
            astr = ' ' + joined
        else:
            multiline = True
            astr = '\n' + '\n'.join(pad + '  ' + a for a in attrs) + '\n' + pad

    kids = list(el)
    text = (el.text or '').strip()

    if not kids and not text:
        return '%s<%s%s/>' % (pad, tag, astr if multiline else astr + ' ')

    body = []
    if text:
        body.append(expr_text(text, exprs, pad + '  '))
    for k in kids:
        body.append(to_jsx(k, exprs, prefix, indent + 2))
        tail = (k.tail or '').strip()
        if tail:
            body.append(expr_text(tail, exprs, pad + '  '))
    return '%s<%s%s>\n%s\n%s</%s>' % (pad, tag, astr, '\n'.join(body), pad, tag)


def convert(path, prefix, indent=2, emit_root=False):
    src = io.open(path, encoding='utf-8').read()
    tpl = extract_template(src)
    tpl, exprs = placehold(tpl)
    tpl = re.sub(r'\s[@?.][\w-]+=(__EXPR\d+__|"[^"]*")', '', tpl)
    tpl = re.sub(r'=(__EXPR\d+__)', r'="\1"', tpl)
    tpl = tpl.replace('xmlns:xlink=', 'xmlnsxlink=').replace('xlink:href=', 'xlinkhref=')
    tpl = re.sub(r'<!--(.*?)-->', '', tpl, flags=re.S)
    root = ET.fromstring(tpl.strip())
    if emit_root:
        return to_jsx(root, exprs, prefix, indent)
    out = []
    if (root.text or '').strip():
        out.append(expr_text(root.text.strip(), exprs, ' ' * indent))
    for child in root:
        out.append(to_jsx(child, exprs, prefix, indent))
        t = (child.tail or '').strip()
        if t:
            out.append(expr_text(t, exprs, ' ' * indent))
    return '\n'.join(out)


HEADER = '''/**
 * Wokwi Elements artwork, ported to React.
 *
 * Source: https://github.com/wokwi/wokwi-elements (MIT). The upstream parts are
 * Lit web components that each render a self-contained <svg>; a custom element
 * cannot be placed inside our scene's <svg> without a foreignObject, and inside
 * one it would keep its own shadow DOM — out of reach of the dim, highlight and
 * ghost states the canvas paints parts with. So the drawings are carried over
 * as plain React <g> fragments instead: same geometry, same pin positions, but
 * they compose with the rest of the scene like anything else we draw.
 *
 * Every `id` is scoped to the drawn copy — `useSvgPrefix()` first, the part's
 * own name after it — and every `url(#…)` is built from the same value. Ids are
 * document-global, so a name fixed at porting time is shared by every copy on
 * the page: a bench with three resistors on it defined `res-body` three times
 * and all three uses resolved to the first, and a clip path shared between two
 * <svg> roots at different scales clipped its bands away entirely.
 *
 * Generated by scripts/port-wokwi.py — do not edit by hand.
 */
'''

TEMPLATE = '''
/** {title} — {vb} in {unit}. Origin is the top-left of {origin}. */
export function {name}({params}) {{
{pre}  return (
    <g{gattrs}>
{body}
    </g>
  );
}}
'''


def fix_uno(body, pins_female):
    # The upstream pattern arrives as an imported lit fragment.
    body = re.sub(r'^[ ]*\{pinsFemalePattern\}$', pins_female, body, flags=re.M)

    # Nested svg`` fragments for the indicator glows.
    def glow(m):
        return ('{%s ? (\n          <circle\n            cx="%s"\n'
                '            cy="%s"\n            r="%s"\n            fill="%s"\n'
                '            filter={`url(#%s)`}\n          />\n        ) : null}' %
                (m.group('flag'), m.group('cx'), m.group('cy'),
                 m.group('r'), m.group('fill'), scoped('ledFilter', 'uno')))
    body = re.sub(
        r'\{(?P<flag>\w+) &&\s*\n?\s*svg`<circle cx="(?P<cx>[\d.]+)" cy="(?P<cy>[\d.]+)" '
        r'r="(?P<r>[\d.]+)" fill="(?P<fill>[^"]+)" filter="url\(#ledFilter\)" />`\}',
        glow, body)
    return body


def generate(src_dir, dest):
    os.makedirs(dest, exist_ok=True)

    pins_female = convert(os.path.join(src_dir, 'patterns-pins-female.ts'),
                          'uno', indent=6, emit_root=True)

    specs = [
        dict(file='arduino-uno', prefix='uno', name='UnoArtwork',
             title='Arduino Uno R3', vb='72.58 x 53.34', unit='millimetres',
             origin='the PCB, 4mm left of it (the USB shell overhangs)',
             params=('{ led13, ledPower, ledTX, ledRX }: { led13?: boolean; '
                     'ledPower?: boolean; ledTX?: boolean; ledRX?: boolean }'),
             gattrs=' fontFamily="monospace" fontSize={2}',
             post=lambda b: fix_uno(b, pins_female)),
        dict(file='hc-sr04', prefix='sr04', name='Hcsr04Artwork',
             title='HC-SR04 ultrasonic sensor', vb='45 x 25', unit='millimetres',
             origin='the module board', params='', gattrs=' fontFamily="monospace"'),
        dict(file='servo', prefix='servo', name='ServoArtwork',
             title='SG90 micro servo', vb='170.08 x 119.55', unit='CSS pixels',
             origin='the lead ends, left of the case',
             params=('{ angle = 0, hornColor = "#ccc", horn = "single" }: '
                     '{ angle?: number; hornColor?: string; horn?: HornType }'),
             imports='\nimport { hornPath, type HornType } from "./helpers";\n',
             gattrs=''),
        dict(file='pir-motion-sensor', prefix='pir', name='PirMotionSensorArtwork',
             title='PIR motion sensor (HC-SR501)', vb='90.7 x 92.4',
             unit='CSS pixels',
             origin='the module board; the three pins hang below it',
             params='', gattrs=''),
        dict(file='resistor', prefix='res', name='ResistorArtwork',
             title='Axial resistor', vb='15.645 x 3', unit='millimetres',
             origin='the left lead',
             params='{ ohms }: { ohms: number }',
             imports='\nimport { resistorBands } from "./helpers";\n',
             pre='  const [band1Color, band2Color, band3Color] = resistorBands(ohms);\n',
             gattrs=''),
    ]

    index = []
    for s in specs:
        body = convert(os.path.join(src_dir, s['file'] + '.ts'), s['prefix'], indent=6)
        if s.get('post'):
            body = s['post'](body)
        # `this.` belongs to the Lit class; these are props here.
        body = body.replace('this.hornColor', 'hornColor').replace('this.angle', 'angle')
        body = body.replace('this.hornPath()', 'hornPath(horn)')
        # Only the drawings that actually define an id take the hook, so a part
        # with no <defs> does not carry an unused binding past the linter.
        uses_uid = '${uid}' in body
        imports = s.get('imports', '')
        pre = s.get('pre', '')
        if uses_uid:
            imports = ('\nimport { useSvgPrefix } from "@/components/canvas/svg-ids";\n'
                       + imports.lstrip('\n'))
            pre = ('  /* This copy\'s own id space — see `useSvgPrefix`. */\n'
                   '  const uid = useSvgPrefix();\n') + pre
        out = HEADER + imports + TEMPLATE.format(
            title=s['title'], vb=s['vb'], unit=s['unit'], origin=s['origin'],
            name=s['name'], params=s['params'], gattrs=s['gattrs'], body=body,
            pre=pre)
        path = os.path.join(dest, s['file'] + '-artwork.tsx')
        io.open(path, 'w', encoding='utf-8', newline='\n').write(out)
        index.append('%-22s %5d lines' % (s['file'] + '-artwork.tsx', out.count('\n')))
    print('\n'.join(index))



def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dest", required=True,
                    help="src/components/canvas/parts/wokwi")
    ap.add_argument("--src", default=None,
                    help="a local wokwi-elements/src checkout; omit to fetch")
    ap.add_argument("--cache", default=".wokwi-src",
                    help="where fetched sources are kept")
    args = ap.parse_args()

    os.makedirs(args.cache, exist_ok=True)
    for name, upstream in NEEDED.items():
        fetch(args.src, name, upstream, args.cache)

    generate(args.cache, args.dest)


if __name__ == "__main__":
    main()
