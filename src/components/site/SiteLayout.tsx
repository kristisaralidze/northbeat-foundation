import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./PulseLine";
import { NewsletterSignup } from "./NewsletterSignup";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/explore", label: "Explore" },
  { to: "/events", label: "Events" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/learn", label: "Learn" },
  { to: "/podcast", label: "Podcast" },
] as const;

function Header({ isHome }: { isHome: boolean }) {
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
        <Link to="/" aria-label="Northbeat home" className={`shrink-0${isHome ? ' nb-home-header-logo' : ''}`} onClick={() => setOpen(false)}>
          {isHome ? <span className="nb-wordmark">Northbeat</span> : <Wordmark />}
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {NAV.map((n) => (
              <li key={n.to}><Link to={n.to} className="nb-navlink">{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <div className="nb-header-actions hidden lg:flex">
            <Link to="/newsletter" className="nb-header-newsletter">Newsletter</Link>
            <Button asChild className="nb-header-primary"><Link to="/submit">Add to the hub</Link></Button>
          </div>
          <Button
            type="button"
            variant="ghost" size="icon" className="lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col overflow-y-auto bg-background lg:hidden">
          <ul className="nb-container divide-y divide-hairline py-4">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} onClick={() => setOpen(false)} className="nb-menulink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nb-container mt-auto pb-10 pt-6">
            <Button asChild className="nb-header-primary w-full"><Link to="/submit" onClick={() => setOpen(false)}>Add to the hub</Link></Button>
            <Link to="/newsletter" onClick={() => setOpen(false)} className="nb-header-newsletter mt-4 inline-block">Newsletter</Link>
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
          <h2 className="nb-h3 text-ink">We track it so you don't miss it.</h2>
          <p className="nb-small text-muted-foreground">Funding calls, programme intakes and events in Nordic health innovation, in one email.</p>
          <NewsletterSignup source="footer" />
        </div>
        <div className="flex flex-col justify-between gap-8 md:items-end">
          <span className="nb-wordmark text-ink">Northbeat</span>
          <ul className="flex gap-6 nb-small">
            <li><Link to="/about" className="nb-link">About</Link></li>
            <li><Link to="/privacy" className="nb-link">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="nb-container pb-8">
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
      <Header isHome={isHome} />
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
