// The only API boundary used by the UI. Configured failures never become demo data.
import { z } from "zod";
import type { Idea, RetrievalResponse, Suggestion } from "./types";

const text = z.object({ en: z.string(), ar: z.string() });
const schema = z.object({
  retrieval: z.object({
    idea: z.object({
      title: z.string(),
      description: z.string(),
      language: z.enum(["auto", "ar", "en"]),
    }),
    detectedLanguage: z.enum(["ar", "en"]),
    mode: z.enum(["arabic_semantic", "english_hybrid_rrf"]),
    isDemo: z.literal(false),
    results: z
      .array(
        z.object({
          rank: z.number().int().positive(),
          project: z.object({
            id: z.string().min(1),
            title: text,
            abstract: text,
            department: text.optional(),
            year: z.union([z.string(), z.number()]).optional(),
            keywords: z.string().optional(),
            sourcePage: z.number().int().positive().optional(),
            isFictional: z.literal(false),
          }),
        }),
      )
      .max(5),
    comparisons: z
      .array(
        z.object({
          projectId: z.string(),
          inCommon: text,
          different: text,
          basis: z.enum(["specific", "general"]),
        }),
      )
      .default([]),
  }),
  suggestions: z
    .array(
      z.object({
        id: z.string(),
        kind: z.string(),
        label: text.optional(),
        title: text,
        body: text,
        reason: text,
        citedProjectIds: z.array(z.string()),
        isDemo: z.literal(false),
      }),
    )
    .max(3),
  enhancementUnavailable: z.boolean().default(false),
});

type AnalysisResult = {
  retrieval: RetrievalResponse;
  suggestions: Suggestion[];
  /** The live search succeeded, but Gemini's /enhance stage is not available. */
  enhancementUnavailable?: boolean;
};

function validateAnalysis(raw: unknown): AnalysisResult {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new Error("origin_invalid_response");
  const result = parsed.data;
  const ids = new Set(result.retrieval.results.map((r) => r.project.id));
  if (
    ids.size !== result.retrieval.results.length ||
    result.retrieval.comparisons.some((c) => !ids.has(c.projectId)) ||
    result.suggestions.some((s) => s.citedProjectIds.some((id) => !ids.has(id)))
  ) {
    throw new Error("origin_invalid_references");
  }
  return {
    retrieval: result.retrieval as RetrievalResponse,
    suggestions: result.suggestions as Suggestion[],
    enhancementUnavailable: result.enhancementUnavailable,
  };
}

/** Safe, user-facing error classification. Never exposes model input or credentials. */
export type AnalysisErrorKind = "busy" | "network" | "invalid" | "timeout" | "general";

export function classifyAnalysisError(error: unknown): AnalysisErrorKind {
  if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
    return "timeout";
  }
  if (error instanceof TypeError) return "network";
  if (!(error instanceof Error)) return "general";
  if (/origin_invalid_(response|references)|origin_http_422/.test(error.message)) {
    return "invalid";
  }
  if (/origin_http_429/.test(error.message)) {
    return "busy";
  }
  if (/origin_http_(500|502|503|504)/.test(error.message)) {
    return "network";
  }
  return "general";
}

export async function analyzeIdea(idea: Idea): Promise<AnalysisResult> {
  const configured = import.meta.env["VITE_ORIGIN_API_URL"]?.trim();
  const apiBase = (configured || "http://127.0.0.1:8000").replace(/\/+$/, "");

  const controller = new AbortController();
  // First model initialization can take several minutes on a local CPU.
  const timer = setTimeout(() => controller.abort(), 240_000);
  try {
    const response = await fetch(`${apiBase}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(idea),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`origin_http_${response.status}`);
    return validateAnalysis(await response.json());
  } finally {
    clearTimeout(timer);
  }
}

export * from "./types";
