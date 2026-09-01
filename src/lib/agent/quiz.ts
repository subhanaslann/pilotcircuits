import type { Copy } from "@/content/i18n";
import type { ProjectId } from "@/lib/projects/catalog";

/**
 * The knowledge check belongs to the chapter it is checking.
 *
 * There was one question for the whole product and it was the capstone's, so
 * finishing chapter one — three parts, no sensor, no Echo pin — asked why the
 * Echo wire has to match the sketch. G-12's entire job is to prove the lesson
 * landed, and it was asking about a different lesson.
 *
 * A lookup rather than an index, because the two ready chapters have questions
 * and the four previews do not: a chapter with nothing to ask asks nothing, and
 * `KnowledgeCheck` renders nothing rather than the wrong thing.
 */

export interface Quiz {
  question: string;
  options: { id: string; label: string }[];
  correctId: string;
  correct: string;
  incorrect: string;
}

export function quizFor(copy: Copy, projectId: ProjectId): Quiz | undefined {
  const chapters: Record<string, Quiz | undefined> =
    copy.agentPanel.knowledge.chapters;
  return chapters[projectId];
}
