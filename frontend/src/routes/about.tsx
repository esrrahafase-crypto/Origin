import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useApp } from "@/lib/i18n";
import { Eyebrow } from "@/components/origin/Layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How Origin works — from idea to a stronger plan" },
      {
        name: "description",
        content:
          "Submit your own idea, explore related past graduation projects, and find ways to improve it — in Arabic or English.",
      },
      { property: "og:title", content: "How Origin works" },
      {
        property: "og:description",
        content: "Explore related projects and find ways to improve your graduation project idea.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  const { t } = useApp();
  return (
    <div>
      <section className="hero-light relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-20 md:px-8 md:pt-28">
          <Eyebrow>{t.about.eyebrow}</Eyebrow>
          <h1 className="mt-6 max-w-3xl text-[clamp(2.4rem,5vw,4.2rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
            {t.about.heading}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t.about.sub}</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <ol className="relative mt-20 border-s border-ink/15 ps-8 md:ps-14">
          {t.about.steps.map((s, i) => (
            <li key={i} className="relative grid gap-4 pb-14 md:grid-cols-[10rem_1fr]">
              <span className="absolute -start-[calc(2rem+5px)] top-2 size-2.5 rounded-full bg-cobalt ring-4 ring-cobalt-soft md:-start-[calc(3.5rem+5px)]" />
              <span className="text-5xl font-light tabular-nums text-cobalt/50">0{i + 1}</span>
              <div className="max-w-2xl">
                <h3 className="text-2xl font-semibold tracking-tight text-ink">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="rounded-[1.75rem] border border-border bg-lilac-soft p-8 md:p-10">
          <h3 className="flex items-center gap-2.5 text-lg font-semibold text-ink">
            <Lightbulb className="size-5 text-cobalt" />
            {t.about.tipsTitle}
          </h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {t.about.tips.map((tip) => (
              <li
                key={tip}
                className="rounded-2xl bg-paper p-4 text-sm leading-relaxed text-muted-foreground shadow-soft"
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>
        <Link
          to="/workspace"
          className="group mt-12 inline-flex items-center gap-3 rounded-full bg-navy py-2 pe-2 ps-6 text-sm font-semibold text-paper"
        >
          {t.about.cta}
          <span className="flex size-9 items-center justify-center rounded-full bg-cobalt">
            <ArrowRight className="flip-rtl size-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
