// Shared contracts. Mirror these with Pydantic models in the future FastAPI backend.

export type IdeaLanguage = "auto" | "ar" | "en";

export interface Idea {
  title: string;
  description: string;
  language: IdeaLanguage;
}

export interface Project {
  /** Historical project ID in live mode; DEMO codes in demo mode. */
  id: string;
  title: { en: string; ar: string };
  abstract: { en: string; ar: string };
  /** Only present when known in the mock data; never invented in UI. */
  department?: { en: string; ar: string };
  year?: number | string;
  keywords?: string;
  isFictional: boolean;
  sourcePage?: number;
}

export type RetrievalMode = "arabic_semantic" | "english_hybrid_rrf";

export interface RankedProject {
  rank: number;
  project: Project;
}

export interface RetrievalResponse {
  idea: Idea;
  detectedLanguage: "ar" | "en";
  mode: RetrievalMode;
  results: RankedProject[];
  /** Per-project overlap/distinction notes. Future backend fills these from the submitted idea. */
  comparisons?: Comparison[];
  isDemo: boolean;
}

export interface Comparison {
  projectId: string;
  inCommon: { en: string; ar: string };
  different: { en: string; ar: string };
  /** "specific" = authored for a known example idea; "general" = generic preview copy. */
  basis: "specific" | "general";
}

/** Known kinds get built-in labels/icons; any other string is allowed (use `label`). */
export type SuggestionKind =
  "differentiation" | "scope" | "evaluation" | "audience" | (string & {});

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  /** Optional dynamic category label; overrides the built-in label for `kind`. */
  label?: { en: string; ar: string };
  /** Optional lucide icon name hint; unknown values fall back to a default icon. */
  icon?: string;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
  reason: { en: string; ar: string };
  /** May be empty for general advice; UI only shows IDs present in the results. */
  citedProjectIds: string[];
  isDemo: boolean;
}
