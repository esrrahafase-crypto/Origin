import { useState } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Compass,
  FlaskConical,
  Layers,
  Lightbulb,
  Pencil,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useApp } from "@/lib/i18n";
import type { Comparison, RankedProject, Suggestion } from "@/services/types";

export function Results() {
  const { t, lang, result, suggestions } = useApp();
  const [tab, setTab] = useState<"related" | "compare" | "suggest">("related");
  const [highlight, setHighlight] = useState<string | null>(null);
  if (!result) return null;
  const shownIds = new Set(result.results.map((r) => r.project.id));
  const comparisons = (result.comparisons ?? []).filter((c) => shownIds.has(c.projectId));
  const counts = {
    related: result.results.length,
    compare: comparisons.length,
    suggest: suggestions.length,
  };
  const labels = { related: t.ws.tabRelated, compare: t.ws.tabCompare, suggest: t.ws.tabSuggest };
  const icons = { related: Layers, compare: ArrowLeftRight, suggest: Lightbulb };

  function jumpTo(id: string) {
    setTab("related");
    setHighlight(id);
    setTimeout(
      () =>
        document
          .getElementById(`proj-${id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      60,
    );
    setTimeout(() => setHighlight(null), 2200);
  }

  return (
    <div className="animate-rise space-y-6">
      {/* Summary strip */}
      <div className="grid gap-px overflow-hidden rounded-[1.75rem] bg-ink/10 md:grid-cols-[1.3fr_1fr]">
        <div className="bg-paper p-6 md:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {result.isDemo && <DemoBadge>{t.ws.demoBadge}</DemoBadge>}
          </div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t.ws.submitted}</p>
          <h2 dir="auto" className="mt-1 text-xl font-semibold text-ink">
            {result.idea.title}
          </h2>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-cobalt hover:underline"
          >
            <Pencil className="size-3.5" />
            {t.ws.edit}
          </a>
        </div>
        <div className="bg-lilac-soft p-6 md:p-8">
          <p className="text-sm font-semibold text-ink">{t.ws.findTitle}</p>
          <ul className="mt-3 space-y-2">
            {t.ws.findItems.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-cobalt" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        className="flex flex-col gap-1 rounded-3xl border border-border bg-paper p-1 sm:inline-flex sm:flex-row sm:rounded-full"
      >
        {(["related", "compare", "suggest"] as const).map((k) => {
          const TabIcon = icons[k];
          return (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${tab === k ? "bg-navy text-paper" : "text-muted-foreground hover:text-ink"}`}
            >
              <TabIcon className="size-4 shrink-0" />
              <span className="truncate">{labels[k]}</span>
              <span
                className={`rounded-full px-1.5 text-xs ${tab === k ? "bg-paper/20" : "bg-muted"}`}
              >
                {counts[k]}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "related" ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 rounded-xl border-s-2 border-cobalt bg-cobalt-soft px-4 py-3 text-sm text-accent-foreground">
            <Compass className="size-4 shrink-0" />
            {t.ws.contextNote}
          </p>
          {result.results.map((r) => (
            <ProjectCard
              key={r.project.id}
              r={r}
              lang={lang}
              highlighted={highlight === r.project.id}
            />
          ))}
        </div>
      ) : tab === "compare" ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 rounded-xl border-s-2 border-cobalt bg-cobalt-soft px-4 py-3 text-sm text-accent-foreground">
            <ArrowLeftRight className="size-4 shrink-0" />
            {t.ws.compareIntro}
          </p>
          {comparisons.some((c) => c.basis === "general") && (
            <p className="rounded-xl border border-dashed border-border bg-paper px-4 py-3 text-sm text-muted-foreground">
              {t.ws.compareGeneral}
            </p>
          )}
          {comparisons.length === 0 ? (
            <Empty>{t.ws.noComparisons}</Empty>
          ) : (
            comparisons.map((c) => {
              const r = result.results.find((x) => x.project.id === c.projectId)!;
              return <ComparisonCard key={c.projectId} c={c} r={r} onCite={jumpTo} />;
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <Empty>{t.ws.noSuggestions}</Empty>
          ) : (
            <div
              className={`grid gap-3 ${suggestions.length === 1 ? "" : suggestions.length === 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}
            >
              {suggestions.map((s) => (
                <SuggestionCard key={s.id} s={s} shownIds={shownIds} onCite={jumpTo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DemoBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cobalt/30 bg-cobalt-soft px-3 py-1 text-xs font-medium text-accent-foreground">
      <FlaskConical className="size-3.5" />
      {children}
    </span>
  );
}

function ProjectCard({
  r,
  lang,
  highlighted,
}: {
  r: RankedProject;
  lang: "en" | "ar";
  highlighted: boolean;
}) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const p = r.project;
  const meta = [
    p.department?.[lang],
    p.year?.toString(),
    p.sourcePage ? `${t.ws.sourcePage} ${p.sourcePage}` : undefined,
  ].filter(Boolean);
  return (
    <article
      id={`proj-${p.id}`}
      className={`group grid grid-cols-[auto_1fr] gap-5 rounded-2xl border bg-paper p-5 transition md:p-6 ${highlighted ? "border-cobalt ring-4 ring-cobalt/15" : "border-border hover:border-cobalt/30 hover:shadow-soft"}`}
    >
      <div className="flex flex-col items-center">
        <span className="sr-only">{t.ws.rank}</span>
        <span className="flex size-11 items-center justify-center rounded-full border border-ink/15 text-lg font-semibold tabular-nums text-ink transition group-hover:border-navy group-hover:bg-navy group-hover:text-paper">
          {r.rank}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <code
            className="rounded-md bg-muted px-2 py-0.5 font-mono text-muted-foreground"
            dir="ltr"
          >
            {p.id}
          </code>
          {p.isFictional && <span className="text-accent-foreground">{t.ws.fictional}</span>}
          {meta.map((m) => (
            <span
              key={m}
              className="rounded-full border border-border px-2 py-0.5 text-muted-foreground"
            >
              {m}
            </span>
          ))}
        </div>
        <h3 dir="auto" className="mt-2 text-lg font-semibold text-ink">
          {p.title[lang]}
        </h3>
        <p
          dir="auto"
          className={`mt-1.5 text-sm leading-relaxed text-muted-foreground ${open ? "" : "line-clamp-2"}`}
        >
          {p.abstract[lang]}
        </p>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-cobalt"
        >
          {open ? t.ws.showLess : t.ws.showMore}
          <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
    </article>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-paper p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function ComparisonCard({
  c,
  r,
  onCite,
}: {
  c: Comparison;
  r: RankedProject;
  onCite: (id: string) => void;
}) {
  const { t, lang } = useApp();
  // The backend may not have a defensible distinction; never invent one.
  const distinct = c.different[lang].trim();
  return (
    <article className="rounded-2xl border border-border bg-paper p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onCite(r.project.id)}
          dir="ltr"
          aria-label={`${t.ws.viewProject} ${r.project.id}`}
          className="rounded-full border border-cobalt/30 bg-cobalt-soft/50 px-2.5 py-0.5 font-mono text-xs text-cobalt transition hover:bg-cobalt hover:text-primary-foreground"
        >
          {r.project.id}
        </button>
        <h3 className="text-base font-semibold text-ink">{r.project.title[lang]}</h3>
        {r.project.isFictional && (
          <span className="ms-auto text-xs text-accent-foreground">{t.ws.compareSample}</span>
        )}
      </div>
      <div className="mt-4 rounded-xl bg-muted/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.ws.inCommon}
        </p>
        <p dir="auto" className="mt-1.5 text-sm leading-relaxed text-ink">
          {c.inCommon[lang]}
        </p>
      </div>
      {distinct && (
        <div className="mt-3 rounded-xl bg-muted/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.ws.different}
          </p>
          <p dir="auto" className="mt-1.5 text-sm leading-relaxed text-ink">
            {distinct}
          </p>
        </div>
      )}
    </article>
  );
}

const ICONS: Record<string, typeof Target> = {
  differentiation: Target,
  scope: Layers,
  evaluation: FlaskConical,
  audience: Users,
  target: Target,
  layers: Layers,
  flask: FlaskConical,
  users: Users,
  lightbulb: Lightbulb,
};

function SuggestionCard({
  s,
  shownIds,
  onCite,
}: {
  s: Suggestion;
  shownIds: Set<string>;
  onCite: (id: string) => void;
}) {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(false);
  const Icon = (s.icon && ICONS[s.icon.toLowerCase()]) || ICONS[s.kind] || Sparkles;
  const label = s.label?.[lang] || t.ws.kinds[s.kind] || t.ws.kindFallback;
  const cites = (s.citedProjectIds ?? []).filter((id) => shownIds.has(id));
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-paper p-6 transition hover:border-cobalt/40 hover:shadow-lift">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-cobalt-soft text-cobalt">
          <Icon className="size-4" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink">{s.title[lang]}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body[lang]}</p>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm font-medium text-ink"
      >
        {t.ws.why}
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && s.reason && (
        <p className="mt-2 animate-rise text-sm leading-relaxed text-muted-foreground">
          {s.reason[lang]}
        </p>
      )}
      {cites.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <span className="text-xs text-muted-foreground">{t.ws.cites}</span>
          {cites.map((id) => (
            <button
              key={id}
              onClick={() => onCite(id)}
              dir="ltr"
              className="rounded-full border border-cobalt/30 bg-cobalt-soft/50 px-2.5 py-0.5 font-mono text-xs text-cobalt transition hover:bg-cobalt hover:text-primary-foreground"
            >
              {id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
