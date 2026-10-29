import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2, Telescope } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Eyebrow } from "@/components/origin/Layout";
import { EXAMPLE_IDEAS } from "@/services/exampleIdeas";
import {
  analyzeIdea,
  classifyAnalysisError,
  type IdeaLanguage,
  type AnalysisErrorKind,
} from "@/services/originApi";
import { OriginMark } from "@/components/origin/Brand";
import { Results } from "@/components/origin/Results";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Explore — Test your idea against past work | Origin" },
      {
        name: "description",
        content:
          "Describe your graduation project idea in Arabic or English, explore related past projects and find ways to improve it.",
      },
      { property: "og:title", content: "Explore your idea with Origin" },
      {
        property: "og:description",
        content: "Submit your own idea, explore related projects and find ways to improve.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  const { t, idea, setIdea, result, setResult, setSuggestions } = useApp();
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<AnalysisErrorKind | null>(null);
  const [enhancementUnavailable, setEnhancementUnavailable] = useState(false);

  const titleErr = idea.title.trim().length < 4;
  const descErr = idea.description.trim().length < 30;

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (titleErr || descErr) return;
    setLoading(true);
    setErrorKind(null);
    setEnhancementUnavailable(false);
    // Retain prior verified results until a new search succeeds.
    try {
      const r = await analyzeIdea(idea);
      setResult(r.retrieval);
      setSuggestions(r.suggestions);
      setEnhancementUnavailable(Boolean(r.enhancementUnavailable));
      requestAnimationFrame(() =>
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (err) {
      const category = classifyAnalysisError(err);
      console.warn("Origin search unsuccessful:", category);
      setErrorKind(category);
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-2xl border bg-paper px-4 py-3 text-ink placeholder:text-muted-foreground/70 outline-none transition focus:border-cobalt focus:ring-4 focus:ring-cobalt/10";

  return (
    <div className="relative">
      <div
        className="hero-light pointer-events-none absolute inset-x-0 top-0 h-[26rem]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-16 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="animate-rise space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>{t.ws.eyebrow}</Eyebrow>
          <h1 className="text-5xl font-semibold tracking-[-0.035em] text-ink">{t.ws.heading}</h1>
          <p className="text-muted-foreground">{t.ws.sub}</p>
          <div className="pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-cobalt">
              {t.ws.examples}
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_IDEAS.map((ex) => (
                <button
                  key={ex.title}
                  type="button"
                  dir={ex.language === "ar" ? "rtl" : "ltr"}
                  onClick={() => {
                    setIdea({ ...ex, language: "auto" });
                    setTouched(false);
                  }}
                  className="rounded-full border border-border bg-paper px-3.5 py-1.5 text-start text-sm text-ink shadow-soft transition hover:border-cobalt/50 hover:text-cobalt"
                >
                  {ex.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form
          onSubmit={analyze}
          noValidate
          className="animate-rise rounded-[1.75rem] border border-border bg-paper p-6 shadow-lift md:p-9"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              {t.ws.title} <span className="text-cobalt">*</span>
            </span>
            <input
              dir="auto"
              value={idea.title}
              onChange={(e) => setIdea({ ...idea, title: e.target.value })}
              placeholder={t.ws.titlePh}
              aria-invalid={touched && titleErr}
              maxLength={160}
              className={`${field} ${touched && titleErr ? "border-destructive" : "border-input"}`}
            />
            {touched && titleErr && (
              <span className="mt-1.5 block text-xs text-destructive">{t.ws.errTitle}</span>
            )}
          </label>
          <label className="mt-5 block">
            <span className="mb-1.5 flex justify-between text-sm font-medium text-ink">
              <span>
                {t.ws.desc} <span className="text-cobalt">*</span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {idea.description.length} / 2000 {t.ws.chars}
              </span>
            </span>
            <textarea
              dir="auto"
              value={idea.description}
              onChange={(e) => setIdea({ ...idea, description: e.target.value })}
              placeholder={t.ws.descPh}
              rows={7}
              maxLength={2000}
              aria-invalid={touched && descErr}
              className={`${field} resize-y leading-relaxed ${touched && descErr ? "border-destructive" : "border-input"}`}
            />
            {touched && descErr && (
              <span className="mt-1.5 block text-xs text-destructive">{t.ws.errDesc}</span>
            )}
          </label>
          <div className="mt-5">
            <span className="mb-1.5 block text-sm font-medium text-ink">{t.ws.lang}</span>
            <div
              role="radiogroup"
              className="inline-flex rounded-full border border-border bg-muted p-1"
            >
              {(["auto", "ar", "en"] as IdeaLanguage[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={idea.language === l}
                  onClick={() => setIdea({ ...idea, language: l })}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${idea.language === l ? "bg-paper text-ink shadow-soft" : "text-muted-foreground hover:text-ink"}`}
                >
                  {l === "auto" ? t.ws.langAuto : l === "ar" ? t.ws.langAr : t.ws.langEn}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{t.ws.langHint}</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => {
                setIdea({ title: "", description: "", language: "auto" });
                setResult(null);
                setTouched(false);
                setEnhancementUnavailable(false);
                setErrorKind(null);
                setSuggestions([]);
              }}
              className="text-sm text-muted-foreground hover:text-ink"
            >
              {t.ws.clear}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-medium text-paper shadow-lift transition hover:-translate-y-0.5 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Telescope className="size-4" />
              )}
              {loading ? t.ws.analyzing : t.ws.analyze}
              {!loading && <ArrowRight className="flip-rtl size-4" />}
            </button>
          </div>
          {errorKind && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {errorKind === "busy"
                ? t.ws.errorBusy
                : errorKind === "network"
                  ? t.ws.errorNetwork
                  : errorKind === "invalid"
                    ? t.ws.errorInvalid
                    : errorKind === "timeout"
                      ? t.ws.errorTimeout
                      : t.ws.error}
            </p>
          )}
        </form>
      </div>

      <section id="results" className="relative mx-auto mt-20 max-w-7xl scroll-mt-24 px-5 md:px-8">
        {errorKind && result && !loading && (
          <p
            role="status"
            className="mb-5 rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground"
          >
            {t.ws.previousResults}
          </p>
        )}
        {enhancementUnavailable && !loading && result && (
          <p
            role="status"
            className="mb-5 rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground"
          >
            {t.ws.enhancementUnavailable}
          </p>
        )}
        {loading ? <LoadingState /> : result ? <Results /> : <EmptyState />}
      </section>
    </div>
  );
}

function EmptyState() {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center rounded-[1.75rem] border border-dashed border-ink/15 bg-paper px-6 py-16 text-center">
      <OriginMark className="mb-5 size-14 opacity-80" />
      <h2 className="text-lg font-semibold text-ink">{t.ws.emptyTitle}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.ws.emptyBody}</p>
    </div>
  );
}

function LoadingState() {
  const { t } = useApp();
  return (
    <div aria-live="polite" className="space-y-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t.ws.analyzing}
      </p>
      <div className="skeleton h-24 rounded-3xl" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="skeleton h-32 rounded-3xl"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
