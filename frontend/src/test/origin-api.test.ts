import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeIdea } from "@/services/originApi";

const idea = {
  title: "Study planner",
  description: "A system to help students schedule their university revision.",
  language: "en" as const,
};
const text = { en: "Fixture text", ar: "نص تجريبي" };
// Contract fixture only: no live retrieval or Gemini claims.
const response = () => ({
  retrieval: {
    idea,
    detectedLanguage: "en",
    mode: "english_hybrid_rrf",
    isDemo: false,
    results: [
      {
        rank: 1,
        project: {
          id: "P001",
          title: text,
          abstract: text,
          isFictional: false,
          sourcePage: 5,
          year: "2024 – 2025",
        },
      },
    ],
    comparisons: [{ projectId: "P001", inCommon: text, different: text, basis: "specific" }],
  },
  suggestions: [
    {
      id: "s1",
      kind: "custom",
      label: text,
      title: text,
      body: text,
      reason: text,
      citedProjectIds: ["P001"],
      isDemo: false,
    },
  ],
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Origin API boundary", () => {
  it("uses the local API by default instead of mock data", async () => {
    vi.stubEnv("VITE_ORIGIN_API_URL", "");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(response())));
    vi.stubGlobal("fetch", fetcher);
    const result = await analyzeIdea(idea);
    expect(result.retrieval.isDemo).toBe(false);
    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/analyze",
      expect.objectContaining({ method: "POST" }),
    );
  });
  it.each(["ar", "en"] as const)("posts %s ideas to the combined endpoint", async (language) => {
    vi.stubEnv("VITE_ORIGIN_API_URL", "https://api.example///");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(response())));
    vi.stubGlobal("fetch", fetcher);
    const submitted = {
      ...idea,
      language,
      ...(language === "ar"
        ? {
            title: "مخطط دراسي",
            description: "تطبيق يساعد الطلاب على تنظيم المذاكرة خلال الاختبارات الجامعية.",
          }
        : {}),
    };
    const result = await analyzeIdea(submitted);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example/api/analyze",
      expect.objectContaining({ method: "POST", body: JSON.stringify(submitted) }),
    );
    expect(result.suggestions[0]?.isDemo).toBe(false);
    expect(result.retrieval.results[0]?.project.id).toBe("P001");
  });
  it.each([422, 429, 502, 503])("surfaces HTTP %s without a demo fallback", async (status) => {
    vi.stubEnv("VITE_ORIGIN_API_URL", "https://api.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));
    await expect(analyzeIdea(idea)).rejects.toThrow(`origin_http_${status}`);
  });
  it("surfaces network failures", async () => {
    vi.stubEnv("VITE_ORIGIN_API_URL", "https://api.example");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    await expect(analyzeIdea(idea)).rejects.toThrow("network");
  });
  it("rejects missing project fields", async () => {
    vi.stubEnv("VITE_ORIGIN_API_URL", "https://api.example");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ retrieval: { results: [{}] }, suggestions: [] })),
        ),
    );
    await expect(analyzeIdea(idea)).rejects.toThrow("origin_invalid_response");
  });
  it("rejects citations outside the retrieved set", async () => {
    vi.stubEnv("VITE_ORIGIN_API_URL", "https://api.example");
    const bad = response();
    bad.suggestions[0]!.citedProjectIds = ["P999"];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(bad))));
    await expect(analyzeIdea(idea)).rejects.toThrow("origin_invalid_references");
  });
  it("accepts empty comparisons and suggestions", async () => {
    vi.stubEnv("VITE_ORIGIN_API_URL", "https://api.example");
    const empty = response();
    empty.retrieval.comparisons = [];
    empty.suggestions = [];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(empty))));
    expect((await analyzeIdea(idea)).suggestions).toEqual([]);
  });
  it("preserves the backend enhancement warning", async () => {
    vi.stubEnv("VITE_ORIGIN_API_URL", "http://127.0.0.1:8000");
    const unavailable = { ...response(), enhancementUnavailable: true };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(unavailable))));
    expect((await analyzeIdea(idea)).enhancementUnavailable).toBe(true);
  });
});
