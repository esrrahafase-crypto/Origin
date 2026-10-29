import type { Idea } from "./types";

/** Form shortcuts only. Every submitted example is analyzed by the live API. */
export const EXAMPLE_IDEAS: Idea[] = [
  {
    language: "en",
    title: "AI study planner for exam season",
    description:
      "A web app that helps university students plan revision for exams by breaking courses into topics, estimating effort, and adapting the schedule when students fall behind.",
  },
  {
    language: "ar",
    title: "مساعد ذكي لتسجيل المقررات",
    description:
      "تطبيق يساعد الطلاب على اختيار المقررات المناسبة لكل فصل بناءً على الخطة الدراسية والمتطلبات السابقة وتعارض المواعيد، مع إجابة الأسئلة الشائعة باللغة العربية.",
  },
  {
    language: "en",
    title: "Accessible event check-in",
    description:
      "A check-in system for campus events that works for students with visual impairments, using audio cues and large, high-contrast QR scanning screens.",
  },
];
