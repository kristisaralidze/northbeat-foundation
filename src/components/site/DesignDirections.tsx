import { Link } from "@tanstack/react-router";
import histology from "@/assets/directions-histology.jpg";
import { EMPTY_SEARCH } from "@/lib/explore";
import { OrganisationLogo } from './OrganisationLogo';

const INTRO = "Every founder, investor, programme and deadline in Nordic health, in one place. We track it so you don't miss it.";
const DEADLINES = [
  { title: "Health_Spin_ pitching", day: "28", month: "Oct", year: "2026", date: "2026-10-28", slug: "health-spin-2026", kind: "opportunity" },
  { title: "Women TechEU", day: "14", month: "Jan", year: "2027", date: "2027-01-14", slug: "women-techeu-2026-to-2028", kind: "opportunity" },
  { title: "Slush", day: "18", month: "Nov", year: "2026", date: "2026-11-18", slug: "slush-2026", kind: "event" },
] as const;
const ORGANISATIONS = [
  { name: "CurifyLabs", slug: "curifylabs", description: "Automated compounding systems that let pharmacies make patient-specific medicines safely and consistently." },
  { name: "Eir Accelerator", slug: "eir-accelerator", description: "Free six-month accelerator for women's health startups, run by Business Turku as part of Women's Health Hub Finland." },
] as const;

function DeadlineRows() {
  return <div className="direction-deadlines">{DEADLINES.map((item) => (
    <article className="direction-deadline" key={item.slug}>
      <time className="direction-date" dateTime={item.date}>
        <span className="direction-day">{item.day}</span>
        <span className="direction-month">{item.month}{item.year === "2027" && <span className="direction-year"> 2027</span>}</span>
      </time>
      <h3>{item.kind === "event"
        ? <Link to="/event/$slug" params={{ slug: item.slug }}>{item.title}</Link>
        : <Link to="/opportunity/$slug" params={{ slug: item.slug }}>{item.title}</Link>}</h3>
    </article>
  ))}</div>;
}

function OrganisationRows() {
  return <div className="direction-organisations">{ORGANISATIONS.map((org) => (
    <article className="direction-organisation" key={org.slug}>
      <OrganisationLogo name={org.name} slug={org.slug} />
      <h3><Link to="/org/$slug" params={{ slug: org.slug }}>{org.name}</Link></h3>
      <p>{org.description}</p>
    </article>
  ))}</div>;
}

function Exhibit({ shape }: { shape: "slide" | "ring" | "stack" }) {
  return <div className={`direction-exhibit exhibit-${shape}`} role="img" aria-label={`${shape === "slide" ? "Glass specimen" : shape === "ring" ? "Circular specimen" : "Layered specimen"} object placeholder`}>
    <svg viewBox="0 0 320 220" fill="none" aria-hidden="true">
      {shape === "slide" ? <>
        <path d="M55 112 172 52l105 44-117 63Z" /><path d="m55 112 0 12 105 47 117-63V96M160 159v12" />
        <path className="exhibit-inner" d="m91 114 80-42 68 28-80 43Z" />
      </> : shape === "ring" ? <>
        <ellipse cx="160" cy="110" rx="76" ry="54" transform="rotate(-25 160 110)" />
        <ellipse cx="160" cy="110" rx="53" ry="37" transform="rotate(-25 160 110)" />
        <path d="M91 144v12c21 30 78 32 123 8 30-17 42-40 32-62v-12" />
      </> : <>
        <path d="m70 90 104-48 83 39-104 50ZM70 90v12l83 41 104-50V81M153 131v12" />
        <path d="m70 117 83 41 104-50M70 117v12l83 41 104-50v-12M153 158v12" />
        <path d="m70 144 83 41 104-50M70 144v12l83 41 104-50v-12M153 185v12" />
      </>}
    </svg>
  </div>;
}

export function DesignDirections() {
  return <main className="directions-page" id="main">
    <h1 className="sr-only">Northbeat design directions</h1>
    <section className="direction direction-stained" aria-labelledby="stained-title">
      <div className="direction-inner">
        <h2 className="direction-label" id="stained-title">Stained slide</h2>
        <div className="stained-hero">
          <p className="direction-wordmark">NORTHBEAT</p>
          <div className="stained-field"><img src={histology} alt="Generated pink and violet stained tissue micrograph" width={1024} height={1024} /></div>
          <div className="direction-intro"><p>{INTRO}</p><Link to="/explore" search={EMPTY_SEARCH} className="direction-action">Explore the hub</Link></div>
        </div>
        <div className="stained-content">
          <div className="direction-deadline-block"><h2 className="direction-heading">Upcoming deadlines</h2><DeadlineRows /></div>
          <div className="direction-organisation-block"><h2 className="direction-heading">In the hub</h2><OrganisationRows /></div>
        </div>
      </div>
    </section>
    <section className="direction direction-chart" aria-labelledby="chart-title">
      <div className="direction-inner">
        <h2 className="direction-label" id="chart-title">Nordic field chart</h2>
        <div className="chart-hero">
          <p className="direction-wordmark">NORTHBEAT</p>
          <div className="direction-intro"><p>{INTRO}</p><Link to="/explore" search={EMPTY_SEARCH} className="direction-action">Explore the hub</Link></div>
          <div className="chart-field" aria-hidden="true"><span className="chart-axis axis-horizontal" /><span className="chart-axis axis-vertical" /><span className="chart-orbit" /><span className="chart-signal" /></div>
        </div>
        <div className="chart-content">
          <div className="direction-deadline-block"><h2 className="direction-heading">Upcoming deadlines</h2><DeadlineRows /></div>
          <div className="direction-organisation-block"><h2 className="direction-heading">In the hub</h2><OrganisationRows /></div>
        </div>
      </div>
    </section>
    <section className="direction direction-archive" aria-labelledby="archive-title">
      <div className="direction-inner">
        <h2 className="direction-label" id="archive-title">Specimen archive</h2>
        <div className="archive-hero">
          <Exhibit shape="slide" />
          <p className="direction-wordmark">NORTHBEAT</p>
          <div className="direction-intro"><p>{INTRO}</p><Link to="/explore" search={EMPTY_SEARCH} className="direction-action">Explore the hub</Link></div>
        </div>
        <div className="archive-content">
          <div className="direction-deadline-block"><Exhibit shape="ring" /><h2 className="direction-heading">Upcoming deadlines</h2><DeadlineRows /></div>
          <div className="direction-organisation-block"><Exhibit shape="stack" /><h2 className="direction-heading">In the hub</h2><OrganisationRows /></div>
        </div>
      </div>
    </section>
  </main>;
}