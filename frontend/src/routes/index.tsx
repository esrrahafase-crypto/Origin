import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { FingerprintArt } from "@/components/origin/Brand";
import { Eyebrow } from "@/components/origin/Layout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Origin — Explore the Past. Shape What's Next." },
      {
        name: "description",
        content:
          "Submit your own graduation project idea, explore related past projects, and find ways to improve it.",
      },
      { property: "og:title", content: "Origin — Explore the Past. Shape What's Next." },
      {
        property: "og:description",
        content:
          "Explore related past graduation projects and find ways to make your idea stronger.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, lang } = useApp();
  return (
    <div>
      {/* ───────── Light editorial hero ───────── */}
      <section className="hero-light relative isolate overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:px-8 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:py-10">
          <div className="relative z-10 animate-rise">
            <Eyebrow>{t.hero.eyebrow}</Eyebrow>
            <h1 className="mt-8 text-[clamp(2.6rem,6.4vw,5.4rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-ink">
              <span className="block">{t.hero.title1}</span>
              <span className="block bg-gradient-to-r from-cobalt to-accent-foreground bg-clip-text pb-2 text-transparent">
                {t.hero.title2}
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              {t.hero.sub}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                to="/workspace"
                className="group inline-flex items-center gap-3 rounded-full bg-navy py-2 pe-2 ps-6 text-sm font-semibold text-paper shadow-lift transition hover:-translate-y-0.5"
              >
                {t.hero.cta}
                <span className="flex size-9 items-center justify-center rounded-full bg-cobalt text-paper">
                  <ArrowRight className="flip-rtl size-4" />
                </span>
              </Link>
              <Link
                to="/about"
                className="text-sm font-medium text-ink underline-offset-8 hover:text-cobalt hover:underline"
              >
                {t.hero.secondary}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[500px]">
            <FingerprintArt tone="light" className="absolute inset-0 size-full" />
            {/* Illustrative preview cards only */}
            <div className="glass absolute start-0 top-[14%] w-56 animate-floaty rounded-2xl border border-border p-4 shadow-lift md:start-[-6%]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cobalt">
                {t.ws.submitted}
              </p>
              <p className="mt-1.5 text-sm font-medium leading-snug text-ink">
                {lang === "ar"
                  ? "مساعد ذكي لتسجيل المقررات"
                  : "Smart course registration assistant"}
              </p>
            </div>
            <div className="glass absolute bottom-[12%] end-0 w-60 animate-floaty rounded-2xl border border-border p-4 shadow-lift [animation-delay:-3s]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cobalt">
                {t.ws.tabRelated}
              </p>
              <ul className="mt-2 space-y-2 text-xs">
                {["P035", "P002", "P067"].map((id, i) => (
                  <li key={id} className="flex items-center gap-2.5">
                    <span className="flex size-5 items-center justify-center rounded-full bg-cobalt-soft text-[10px] font-semibold text-cobalt">
                      {i + 1}
                    </span>
                    <code dir="ltr" className="font-mono text-muted-foreground">
                      {id}
                    </code>
                    <span className="h-px flex-1 bg-border" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Three steps ───────── */}
      <section className="mx-auto max-w-7xl px-5 pt-20 md:px-8 md:pt-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_2fr]">
          <div>
            <Eyebrow n="01">{t.nav.about}</Eyebrow>
            <h2 className="mt-5 max-w-xs text-3xl font-semibold leading-tight tracking-tight text-ink">
              {t.hero.stepsTitle}
            </h2>
          </div>
          <ol className="grid border-t border-ink/15 sm:grid-cols-3">
            {t.hero.steps.map((s, i) => (
              <li
                key={i}
                className="group border-ink/10 pb-8 pt-7 sm:pe-8 max-sm:border-b sm:[&:not(:first-child)]:border-s sm:[&:not(:first-child)]:ps-8"
              >
                <span className="block text-4xl font-light tabular-nums text-cobalt/50 transition group-hover:text-cobalt">
                  0{i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Your idea, refined (the one contrast band) ───────── */}
      <section className="mx-auto mt-20 max-w-7xl px-5 md:mt-28 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-[2rem] bg-ink/10 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative overflow-hidden bg-navy p-9 text-paper md:p-12">
            <p className="max-w-xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              {t.hero.refinedTitle}
            </p>
            <p className="mt-4 max-w-md text-lilac/80">{t.hero.refinedBody}</p>
            <Link
              to="/workspace"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-lilac"
            >
              {t.hero.cta}
              <ArrowUpRight className="size-4 rtl:-scale-x-100" />
            </Link>
            <FingerprintArt className="pointer-events-none absolute -bottom-40 -end-40 size-96 opacity-40" />
          </div>
          <div className="grid gap-px bg-ink/10">
            {[
              [t.hero.bilingualTitle, t.hero.bilingualBody],
              [t.hero.clearTitle, t.hero.clearBody],
            ].map(([h, b]) => (
              <div key={h} className="bg-paper p-8">
                <h3 className="text-lg font-semibold text-ink">{h}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
