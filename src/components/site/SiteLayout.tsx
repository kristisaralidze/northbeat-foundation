import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { siteInfoQuery } from "@/lib/site.query";
import { LaboratoryWordmark } from "./LaboratoryWordmark";
import { NewsletterSignup } from "./NewsletterSignup";
import { Button } from "@/components/ui/button";
import { PublicScrollFrame } from './PublicScrollFrame';
import { AtmosphericImage } from './AtmosphericImage';
import { SiteSearch } from './SiteSearch';
import { SavedLink } from './SavedLink';
import { SystoleHeart } from './SystoleHeart';

const NAV = [
  { to: "/explore", label: "Explore" },
  { to: "/events", label: "Events" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/learn", label: "Learn" },
  { to: "/podcast", label: "Podcast" },
] as const;

function Header({ isHome, pathname }: { isHome: boolean; pathname: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
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
          <SiteSearch />
          <SavedLink />
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
        <div id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu" className="nb-mobile-menu lg:hidden">
          <div className="nb-container flex h-16 items-center justify-end">
            <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Close menu" onClick={() => setOpen(false)} autoFocus>
              <X className="h-5 w-5" aria-hidden />
            </Button>
          </div>
          <div className="nb-container"><SiteSearch variant="field" /></div>
          <nav aria-label="Main" className="nb-container">
            <ul className="nb-mobile-menu-list">
              {[...NAV, { to: "/newsletter", label: "Newsletter" } as const, { to: "/about", label: "About" } as const].map((n) => (
                <li key={n.to}><Link to={n.to} onClick={() => setOpen(false)} className="nb-mobile-menu-link">{n.label}</Link></li>
              ))}
            </ul>
          </nav>
          <div className="nb-container mt-auto pb-10 pt-6">
            <Button asChild className="nb-header-primary w-full"><Link to="/submit" onClick={() => setOpen(false)}>Add to the hub</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer({ hideSignup }: { hideSignup: boolean }) {
  return (
    <footer className="nb-site-footer mt-auto">
      {!hideSignup && <section className="nb-footer-signup" aria-labelledby="footer-newsletter-heading">
        <AtmosphericImage />
        <div className="nb-footer-signup-content">
          <h2 id="footer-newsletter-heading" className="nb-h2">Hear it here first.</h2>
          <p className="nb-body">New Nordic health innovations, open calls and events. Once a week.</p>
          <NewsletterSignup source="footer" />
        </div>
      </section>}
      <FooterBottom />
    </footer>
  );
}

function FooterBottom() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Read after hydration so server and browser render the same footer.
  const { data: info } = useQuery({ ...siteInfoQuery, enabled: mounted });
  const data = mounted ? info : undefined;
  return (
    <div className="nb-container nb-footer-main nb-small">
      <nav aria-label="Footer"><ul className="nb-footer-links">
        {NAV.map(n => <li key={n.to}><Link to={n.to} className="nb-link">{n.label}</Link></li>)}
        <li><Link to="/newsletter" className="nb-link">Newsletter</Link></li>
        <li><Link to="/about" className="nb-link">About</Link></li>
        <li><Link to="/submit" className="nb-link">Add to the hub</Link></li>
        <li><Link to="/privacy" className="nb-link">Privacy</Link></li>
      </ul></nav>
      <p className="nb-footer-promise">No one pays to be listed or featured.</p>
      <div className="nb-footer-meta text-muted-foreground">
        {data?.contactEmail && <a href={`mailto:${data.contactEmail}`} className="nb-link">{data.contactEmail}</a>}
        {data?.linkedinUrl && <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="nb-link">LinkedIn</a>}
        {data?.instagramUrl && <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="nb-link">Instagram</a>}
      </div>
      <p className="text-muted-foreground">© 2026 Northbeat. The heartbeat of Nordic health innovation.</p>
    </div>
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
      <Header isHome={isHome} pathname={pathname} />
      <main id="main" className="flex-1">{isHome ? children : <PublicScrollFrame key={pathname} pathname={pathname}>{children}</PublicScrollFrame>}</main>
      <SystoleHeart pathname={pathname} />
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
