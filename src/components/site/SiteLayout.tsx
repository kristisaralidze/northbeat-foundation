import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { PulseLine, Wordmark } from "./PulseLine";
import { NewsletterSignup } from "./NewsletterSignup";

const NAV = [
  { to: "/explore", label: "Explore" },
  { to: "/events", label: "Events" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/learn", label: "Learn" },
  { to: "/podcast", label: "Podcast" },
] as const;

function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background">
      <div className="nb-container flex h-16 items-center justify-between gap-6">
        <Link to="/" aria-label="Northbeat home" className="shrink-0" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((n) => (
              <li key={n.to}><Link to={n.to} className="nb-navlink">{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/newsletter" className="nb-navlink nb-small hidden sm:inline">Subscribe</Link>
          <Link to="/submit" className="nb-btn nb-btn-secondary nb-btn-sm">Submit</Link>
          <button
            type="button"
            className="nb-btn nb-btn-quiet nb-btn-sm md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-background md:hidden">
          <ul className="nb-container divide-y divide-hairline py-4">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} onClick={() => setOpen(false)} className="nb-menulink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nb-container pb-10">
            <PulseLine className="mb-6" />
            <Link to="/submit" onClick={() => setOpen(false)} className="nb-btn nb-btn-primary nb-btn-block">Submit an entry</Link>
            <Link to="/newsletter" onClick={() => setOpen(false)} className="nb-link nb-small mt-4 inline-block">Subscribe to the newsletter</Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-hairline bg-frost-wash">
      <div className="nb-container grid gap-10 py-14 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-16">
        <div className="max-w-md space-y-4">
          <p className="nb-eyebrow">The newsletter</p>
          <h2 className="nb-h3 text-ink">We track it so you don't miss it.</h2>
          <p className="nb-small text-muted-foreground">Funding calls, programme intakes and events in Nordic health innovation, in one email.</p>
          <NewsletterSignup source="footer" />
        </div>
        <div className="flex flex-col justify-between gap-8 md:items-end">
          <Wordmark />
          <ul className="flex gap-6 nb-small">
            <li><Link to="/about" className="nb-link">About</Link></li>
            <li><Link to="/privacy" className="nb-link">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="nb-container pb-8">
        <PulseLine className="mb-4" />
        <p className="nb-small text-muted-foreground">© {new Date().getFullYear()} Northbeat. The heartbeat of Nordic health innovation.</p>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const isHome = useLocation({ select: location => location.pathname === '/' });
  return (
    <div className={`theme-site flex min-h-screen flex-col${isHome ? ' nb-home-shell' : ''}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 nb-btn nb-btn-primary nb-btn-sm">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/** Temporary stand-in until each page gets its real content. */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="nb-container nb-section">
      <h1 className="nb-h1 text-ink">{title}</h1>
    </div>
  );
}
