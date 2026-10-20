import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { LaboratoryWordmark } from "./LaboratoryWordmark";
import { NewsletterSignup } from "./NewsletterSignup";
import { Button } from "@/components/ui/button";
import { PublicScrollFrame } from './PublicScrollFrame';
import { LivingFabric } from './LivingFabric';

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
    <header className="nb-site-header sticky top-0 border-b border-hairline bg-background">
      <div className="nb-container flex h-16 items-center justify-between gap-6">
        <Link to="/" aria-label="Northbeat home" className={`shrink-0 nb-site-logo${isHome ? ' nb-home-header-logo' : ''}`} onClick={() => setOpen(false)}>
          <LaboratoryWordmark compact />
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
            variant="ghost" size="icon" className="min-h-11 min-w-11 lg:hidden"
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
        <nav id="mobile-nav" aria-label="Main" className="fixed inset-x-0 bottom-0 top-16 flex flex-col overflow-y-auto bg-background lg:hidden">
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

function Footer({ hideSignup }: { hideSignup: boolean }) {
  return (
    <footer className="nb-site-footer mt-auto">
      {!hideSignup && <section className="nb-footer-signup" aria-labelledby="footer-newsletter-heading">
        <LivingFabric />
        <div className="nb-footer-signup-content">
          <h2 id="footer-newsletter-heading" className="nb-h2">We track it so you don't miss it.</h2>
          <p className="nb-body">Funding calls, programme intakes and events in Nordic health innovation, in one email.</p>
          <NewsletterSignup source="footer" />
        </div>
      </section>}
      <div className="nb-container nb-footer-bottom nb-small text-muted-foreground">
        <p>© 2026 Northbeat. The heartbeat of Nordic health innovation.</p>
        <nav aria-label="Footer"><ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {NAV.filter(n => n.to !== '/podcast').map(n => <li key={n.to}><Link to={n.to} className="nb-link">{n.label}</Link></li>)}
          <li><Link to="/about" className="nb-link">About</Link></li>
          <li><Link to="/privacy" className="nb-link">Privacy</Link></li>
        </ul></nav>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: location => location.pathname });
  const isHome = pathname === '/';
  return (
    <div className={`theme-site flex min-h-screen flex-col${isHome ? ' nb-home-shell' : ' nb-public-shell'}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 nb-btn nb-btn-primary nb-btn-sm">
        Skip to content
      </a>
      <Header isHome={isHome} />
      <main id="main" className="flex-1">{isHome ? children : <PublicScrollFrame key={pathname} pathname={pathname}>{children}</PublicScrollFrame>}</main>
      <Footer hideSignup={pathname === '/newsletter' || pathname === '/newsletter/'} />
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
