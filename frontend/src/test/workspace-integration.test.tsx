import { useEffect, type ComponentType } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "@/lib/i18n";
import { Route } from "@/routes/workspace";

const Workspace = Route.options.component as ComponentType;
function Harness({ lang }: { lang: "ar" | "en" }) {
  const { setLang, setIdea } = useApp();
  useEffect(() => {
    setLang(lang);
    setIdea({
      title: lang === "ar" ? "نظام ري ذكي" : "Smart watering system",
      description: "A system that monitors soil moisture and waters plants automatically.",
      language: lang,
    });
  }, [lang, setLang, setIdea]);
  return <Workspace />;
}
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it.each(["en", "ar"] as const)(
  "renders the %s workflow, dynamic suggestions and citation navigation",
  async (lang) => {
    vi.stubEnv("VITE_ORIGIN_API_URL", "https://api.example");
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const text = { en: "Contract fixture", ar: "نص تجريبي" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            retrieval: {
              idea: {
                title: "Submitted title",
                description: "Submitted description",
                language: lang,
              },
              detectedLanguage: lang,
              mode: lang === "ar" ? "arabic_semantic" : "english_hybrid_rrf",
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
                  },
                },
              ],
              comparisons: [
                { projectId: "P001", inCommon: text, different: text, basis: "specific" },
              ],
            },
            suggestions: [
              {
                id: "s1",
                kind: "custom",
                label: { en: "Dynamic category", ar: "فئة ديناميكية" },
                title: text,
                body: text,
                reason: text,
                citedProjectIds: ["P001"],
                isDemo: false,
              },
            ],
          }),
        ),
      ),
    );
    render(
      <AppProvider>
        <Harness lang={lang} />
      </AppProvider>,
    );
    await waitFor(() => expect(document.documentElement.dir).toBe(lang === "ar" ? "rtl" : "ltr"));
    fireEvent.submit(
      screen
        .getByRole("button", {
          name: lang === "en" ? "Explore related projects" : "استكشف المشاريع المشابهة",
        })
        .closest("form")!,
    );
    await screen.findByText("P001");
    expect(screen.queryByText("Sample results for preview only")).not.toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    fireEvent.click(tabs[1]!);
    expect(screen.getAllByText(text[lang]).length).toBeGreaterThan(0);
    fireEvent.click(tabs[2]!);
    expect(
      screen.getByText(lang === "en" ? "Dynamic category" : "فئة ديناميكية"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "P001" }));
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  },
);

it("shows an API failure without stale or demo results", async () => {
  vi.stubEnv("VITE_ORIGIN_API_URL", "https://api.example");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 503 })));
  render(
    <AppProvider>
      <Harness lang="en" />
    </AppProvider>,
  );
  fireEvent.submit(
    screen.getByRole("button", { name: "Explore related projects" }).closest("form")!,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not connect to the analysis service",
  );
  expect(screen.queryByText("P001")).not.toBeInTheDocument();
});

it("retains genuine previous results if a second search fails", async () => {
  vi.stubEnv("VITE_ORIGIN_API_URL", "https://api.example");
  const localized = { en: "Historical project", ar: "مشروع سابق" };
  const reply = {
    retrieval: {
      idea: {
        title: "Smart watering system",
        description: "A system that monitors soil moisture and waters plants automatically.",
        language: "en",
      },
      detectedLanguage: "en",
      mode: "english_hybrid_rrf",
      isDemo: false,
      results: [
        {
          rank: 1,
          project: {
            id: "P009",
            title: localized,
            abstract: localized,
            isFictional: false,
            sourcePage: 10,
          },
        },
      ],
      comparisons: [],
    },
    suggestions: [],
  };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(Response.json(reply))
      .mockResolvedValueOnce(new Response("Service busy", { status: 503 })),
  );
  render(
    <AppProvider>
      <Harness lang="en" />
    </AppProvider>,
  );
  const form = screen.getByRole("button", { name: "Explore related projects" }).closest("form")!;
  fireEvent.submit(form);
  await screen.findByText("P009");
  fireEvent.submit(form);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not connect to the analysis service",
  );
  expect(screen.getByText("P009")).toBeInTheDocument();
  expect(
    screen.getByText("The new search failed. Previous successful results are shown below."),
  ).toBeInTheDocument();
});
