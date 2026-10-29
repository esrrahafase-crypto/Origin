import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Idea, RetrievalResponse, Suggestion } from "@/services/types";

export type Lang = "en" | "ar";

const en = {
  nav: { home: "Home", workspace: "Explore", about: "How it works" },
  toggle: "عربي",
  toggleLabel: "Switch to Arabic",
  hero: {
    eyebrow: "For graduation project ideas",
    title1: "Explore the Past",
    title2: "Shape What's Next",
    sub: "Share your graduation project idea, explore related projects from past students, and find clear ways to make your idea stronger.",
    cta: "Explore your idea",
    secondary: "How it works",
    stepsTitle: "Three simple steps",
    steps: [
      {
        t: "Submit your own idea",
        d: "Add a title and a short description, in Arabic or English.",
      },
      { t: "Explore related projects", d: "See the past projects closest to your idea." },
      {
        t: "Find ways to improve",
        d: "Get practical suggestions, each linked to the projects behind it.",
      },
    ],
    refinedTitle: "Your Idea, Refined.",
    refinedBody:
      "Explore related projects, discover ways to strengthen your idea, and move forward with confidence.",
    bilingualTitle: "Arabic & English",
    bilingualBody: "Write in the language you think in.",
    clearTitle: "Clear next steps",
    clearBody: "Suggestions you can discuss with your supervisor.",
  },
  ws: {
    eyebrow: "Explore",
    heading: "Submit your own idea",
    sub: "Describe it the way you'd explain it to your supervisor. The more specific you are, the more helpful the results.",
    title: "Project title",
    titlePh: "e.g. Smart course registration assistant",
    desc: "Description",
    descPh: "What problem does it solve, for whom, and how?",
    lang: "Idea language",
    langAuto: "Detect automatically",
    langAr: "Arabic",
    langEn: "English",
    langHint:
      "The language your idea is written in. To change the site language, use the switch at the top.",
    examples: "Try an example",
    analyze: "Explore related projects",
    analyzing: "Finding related projects…",
    clear: "Clear",
    errTitle: "Add a title of at least 4 characters.",
    errDesc: "Add a description of at least 30 characters.",
    chars: "characters",
    emptyTitle: "Your results will appear here",
    emptyBody: "Submit your idea to see related past projects and ways to improve it.",
    demoBadge: "Sample results for preview only",
    submitted: "Your idea",
    findTitle: "What you'll find",
    findItems: [
      "Five past projects related to your idea, closest first.",
      "Suggestions to help your idea stand out.",
      "Links from each suggestion to the projects it draws on.",
    ],
    tabRelated: "Related projects",
    tabSuggest: "Ways to improve",
    contextNote: "Use these projects to see what's been done and where your idea can go further.",
    rank: "Rank",
    sourcePage: "Source page",
    showMore: "Read more",
    showLess: "Show less",
    fictional: "Sample project",
    why: "Why this helps",
    cites: "Based on",
    edit: "Edit idea",
    error: "Something went wrong. Please try again.",
    errorBusy: "The analysis service is temporarily busy. Please try again shortly.",
    errorNetwork: "Could not connect to the analysis service. Check your connection and retry.",
    errorInvalid: "The service returned an incomplete result. Please retry the analysis.",
    errorTimeout: "The analysis took too long. Please try again.",
    previousResults: "The new search failed. Previous successful results are shown below.",
    enhancementUnavailable:
      "Related projects were found, but AI comparisons and improvement suggestions are temporarily unavailable.",
    kinds: {
      differentiation: "Stand out",
      scope: "Scope",
      evaluation: "Evaluation",
      audience: "Audience",
    } as Record<string, string>,
    kindFallback: "Suggestion",
    tabCompare: "How your idea compares",
    compareIntro: "See what your idea shares with each related project.",
    compareSample: "Sample comparison",
    compareGeneral:
      "These comparisons are general examples for preview. Personalised comparisons for your exact idea will appear here later.",
    inCommon: "What they have in common",
    different: "What makes your idea different",
    viewProject: "View project",
    noSuggestions: "No suggestions to show yet.",
    noComparisons: "No comparisons to show yet.",
  },
  about: {
    eyebrow: "How it works",
    heading: "From idea to a stronger plan",
    sub: "Origin helps you understand where your idea fits and how to take it further.",
    steps: [
      {
        t: "Submit your own idea",
        d: "Write a title and a short description of your project, in Arabic or English.",
      },
      {
        t: "Explore related projects",
        d: "See the five past projects closest to your idea, and read what each one covered.",
      },
      {
        t: "Find ways to improve",
        d: "Review suggestions on focus, scope, testing and audience — each linked to the projects it's based on.",
      },
      {
        t: "Move forward with confidence",
        d: "Take your refined idea to your supervisor with a clearer picture of what makes it yours.",
      },
    ],
    tipsTitle: "Tips for better results",
    tips: [
      "Name the problem and who it's for.",
      "Mention the main features or approach.",
      "Keep it to a few clear sentences.",
    ],
    cta: "Start exploring",
  },
  footer: { tag: "Explore the Past. Shape What's Next.", proto: "Preview version" },
  notFound: "Page not found",
  home: "Go home",
};

type Dict = typeof en;

const ar: Dict = {
  nav: { home: "الرئيسية", workspace: "استكشف", about: "كيف يعمل" },
  toggle: "EN",
  toggleLabel: "التبديل إلى الإنجليزية",
  hero: {
    eyebrow: "لأفكار مشاريع التخرج",
    title1: "استكشف الماضي",
    title2: "واصنع ما هو قادم",
    sub: "شارك فكرة مشروع تخرجك، واستكشف مشاريع مشابهة لطلاب سابقين، واكتشف طرقًا واضحة لتقوية فكرتك.",
    cta: "استكشف فكرتك",
    secondary: "كيف يعمل",
    stepsTitle: "ثلاث خطوات بسيطة",
    steps: [
      { t: "قدّم فكرتك الخاصة", d: "أضف عنوانًا ووصفًا قصيرًا، بالعربية أو الإنجليزية." },
      { t: "استكشف المشاريع المشابهة", d: "اطّلع على أقرب المشاريع السابقة إلى فكرتك." },
      {
        t: "اكتشف طرق التحسين",
        d: "احصل على اقتراحات عملية، كلٌّ منها مرتبط بالمشاريع التي بُني عليها.",
      },
    ],
    refinedTitle: "فكرتك، بصورة أفضل.",
    refinedBody: "استكشف المشاريع المشابهة، واكتشف طرقًا لتقوية فكرتك، وانطلق بثقة.",
    bilingualTitle: "العربية والإنجليزية",
    bilingualBody: "اكتب باللغة التي تفكّر بها.",
    clearTitle: "خطوات تالية واضحة",
    clearBody: "اقتراحات يمكنك مناقشتها مع مشرفك.",
  },
  ws: {
    eyebrow: "استكشف",
    heading: "قدّم فكرتك الخاصة",
    sub: "صِفها كما لو كنت تشرحها لمشرفك. كلما كانت أوضح، كانت النتائج أنفع.",
    title: "عنوان المشروع",
    titlePh: "مثال: مساعد ذكي لتسجيل المقررات",
    desc: "الوصف",
    descPh: "ما المشكلة التي يحلّها، ولمن، وكيف؟",
    lang: "لغة الفكرة",
    langAuto: "تحديد تلقائي",
    langAr: "العربية",
    langEn: "الإنجليزية",
    langHint: "اللغة التي كتبت بها فكرتك. لتغيير لغة الموقع، استخدم زر التبديل في الأعلى.",
    examples: "جرّب مثالًا",
    analyze: "استكشف المشاريع المشابهة",
    analyzing: "جارٍ البحث عن مشاريع مشابهة…",
    clear: "مسح",
    errTitle: "أضف عنوانًا لا يقل عن ٤ أحرف.",
    errDesc: "أضف وصفًا لا يقل عن ٣٠ حرفًا.",
    chars: "حرفًا",
    emptyTitle: "ستظهر نتائجك هنا",
    emptyBody: "قدّم فكرتك لترى المشاريع السابقة المشابهة وطرق تحسينها.",
    demoBadge: "نتائج نموذجية للمعاينة فقط",
    submitted: "فكرتك",
    findTitle: "ما الذي ستجده",
    findItems: [
      "خمسة مشاريع سابقة مرتبطة بفكرتك، الأقرب أولًا.",
      "اقتراحات تساعد فكرتك على التميّز.",
      "روابط من كل اقتراح إلى المشاريع التي استند إليها.",
    ],
    tabRelated: "المشاريع المشابهة",
    tabSuggest: "طرق التحسين",
    contextNote: "استعن بهذه المشاريع لتعرف ما أُنجز سابقًا وأين يمكن لفكرتك أن تذهب أبعد.",
    rank: "الترتيب",
    sourcePage: "صفحة المصدر",
    showMore: "اقرأ المزيد",
    showLess: "عرض أقل",
    fictional: "مشروع نموذجي",
    why: "لماذا يفيدك هذا",
    cites: "استنادًا إلى",
    edit: "عدّل الفكرة",
    error: "حدث خطأ ما. يُرجى المحاولة مرة أخرى.",
    errorBusy: "خدمة التحليل مشغولة مؤقتًا. جرّبي مرة أخرى بعد قليل.",
    errorNetwork: "تعذر الاتصال بخدمة التحليل. تحققي من الاتصال وأعيدي المحاولة.",
    errorInvalid: "أعادت خدمة التحليل نتيجة غير مكتملة. أعيدي المحاولة.",
    errorTimeout: "استغرق التحليل وقتًا أطول من المتوقع. أعيدي المحاولة.",
    previousResults: "فشل البحث الجديد. النتائج الظاهرة أدناه تخص آخر بحث ناجح.",
    enhancementUnavailable:
      "تم العثور على المشاريع ذات الصلة، لكن المقارنات واقتراحات التطوير بالذكاء الاصطناعي غير متاحة مؤقتًا.",
    kinds: {
      differentiation: "التميّز",
      scope: "النطاق",
      evaluation: "التقييم",
      audience: "الجمهور",
    } as Record<string, string>,
    kindFallback: "اقتراح",
    tabCompare: "كيف تتقاطع فكرتك مع المشاريع السابقة",
    compareIntro: "تعرّف على ما تشترك فيه فكرتك مع كل مشروع مشابه.",
    compareSample: "مقارنة نموذجية",
    compareGeneral:
      "هذه المقارنات أمثلة عامة للمعاينة. ستظهر هنا لاحقًا مقارنات مخصّصة لفكرتك بالتحديد.",
    inCommon: "أوجه التشابه",
    different: "ما يميّز فكرتك",
    viewProject: "عرض المشروع",
    noSuggestions: "لا توجد اقتراحات لعرضها بعد.",
    noComparisons: "لا توجد مقارنات لعرضها بعد.",
  },
  about: {
    eyebrow: "كيف يعمل",
    heading: "من الفكرة إلى خطة أقوى",
    sub: "يساعدك أوريجن على فهم موقع فكرتك وكيف تطوّرها أكثر.",
    steps: [
      { t: "قدّم فكرتك الخاصة", d: "اكتب عنوانًا ووصفًا قصيرًا لمشروعك، بالعربية أو الإنجليزية." },
      {
        t: "استكشف المشاريع المشابهة",
        d: "اطّلع على أقرب خمسة مشاريع سابقة إلى فكرتك، واقرأ ما تناوله كلٌّ منها.",
      },
      {
        t: "اكتشف طرق التحسين",
        d: "راجع اقتراحات حول التركيز والنطاق والتقييم والجمهور — كلٌّ منها مرتبط بالمشاريع التي بُني عليها.",
      },
      { t: "انطلق بثقة", d: "اعرض فكرتك المطوّرة على مشرفك بصورة أوضح لما يميّزها." },
    ],
    tipsTitle: "نصائح لنتائج أفضل",
    tips: [
      "حدّد المشكلة ولمن تُوجَّه.",
      "اذكر أهم الميزات أو طريقة التنفيذ.",
      "اكتفِ ببضع جمل واضحة.",
    ],
    cta: "ابدأ الاستكشاف",
  },
  footer: { tag: "استكشف الماضي. واصنع ما هو قادم.", proto: "نسخة للمعاينة" },
  notFound: "الصفحة غير موجودة",
  home: "العودة إلى الرئيسية",
};

const dicts = { en, ar };

interface Ctx {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
  idea: Idea;
  setIdea: (i: Idea) => void;
  result: RetrievalResponse | null;
  setResult: (r: RetrievalResponse | null) => void;
  suggestions: Suggestion[];
  setSuggestions: (s: Suggestion[]) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [idea, setIdea] = useState<Idea>({ title: "", description: "", language: "auto" });
  const [result, setResult] = useState<RetrievalResponse | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <AppCtx.Provider
      value={{
        lang,
        t: dicts[lang],
        setLang,
        idea,
        setIdea,
        result,
        setResult,
        suggestions,
        setSuggestions,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}
