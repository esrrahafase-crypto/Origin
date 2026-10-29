import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/i18n";
import { Wordmark } from "./Brand";

export function Header() {
  const { t, lang, setLang } = useApp();
  const links = [
    { to: "/", label: t.nav.home },
    { to: "/workspace", label: t.nav.workspace },
    { to: "/about", label: t.nav.about },
  ] as const;
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
        <Link
          to="/"
          aria-label="Origin — home"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-cobalt"
        >
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              className="relative py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-ink data-[status=active]:text-ink after:absolute after:inset-x-0 after:-bottom-[21px] after:h-0.5 after:scale-x-0 after:bg-cobalt after:transition data-[status=active]:after:scale-x-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          aria-label={t.toggleLabel}
          className="flex items-center rounded-full border border-border bg-paper p-0.5 text-xs font-semibold"
        >
          <span
            className={`rounded-full px-3 py-1.5 transition ${lang === "en" ? "bg-navy text-paper" : "text-muted-foreground"}`}
          >
            EN
          </span>
          <span
            className={`rounded-full px-3 py-1.5 transition ${lang === "ar" ? "bg-navy text-paper" : "text-muted-foreground"}`}
            style={{ fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}
          >
            عربي
          </span>
        </button>
      </div>
      <nav
        aria-label="Main mobile"
        className="flex justify-center gap-1 border-t border-border/60 px-3 py-1.5 md:hidden"
      >
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeOptions={{ exact: true }}
            className="rounded-full px-3.5 py-1 text-xs font-medium text-muted-foreground data-[status=active]:bg-navy data-[status=active]:text-paper"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-28 border-t border-border bg-paper">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-[1fr_auto] md:items-end md:px-8">
        <div className="space-y-3">
          <Wordmark className="h-9" />
          <p className="max-w-sm text-sm text-muted-foreground">{t.footer.tag}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <Link to="/workspace" className="hover:text-ink">
            {t.nav.workspace}
          </Link>
          <Link to="/about" className="hover:text-ink">
            {t.nav.about}
          </Link>
          <span className="rounded-full border border-border px-3 py-1 text-xs">
            {t.footer.proto}
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Small editorial label: index number + rule + text. */
export function Eyebrow({
  children,
  n,
  light,
}: {
  children: React.ReactNode;
  n?: string;
  light?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] ${light ? "text-lilac" : "text-cobalt"}`}
    >
      {n && <span className="tabular-nums">{n}</span>}
      <span className={`h-px w-8 ${light ? "bg-lilac/50" : "bg-cobalt/40"}`} />
      {children}
    </span>
  );
}
