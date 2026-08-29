import type { Metadata } from "next";
import { LabNav } from "@/components/lab/lab-nav";
import { getServerCopy } from "@/content/copy-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerCopy()).lab.shell.nav.labTitle };
}

export default function LabLayout({ children }: LayoutProps<"/lab">) {
  return (
    <div className="flex min-h-screen">
      <LabNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
