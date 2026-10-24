import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

const CARDS = [
  { audience: 'founder', title: "I'm building a startup", line: 'Funding calls, incubators, investors and events.' },
  { audience: 'researcher', title: "I'm a researcher", line: 'Research grants, universities, innovation services and events.' },
  { audience: 'student', title: "I'm a student or clinician", line: 'The Learn journey, communities and events.' },
] as const;

export function StartCards() {
  return <section className="nb-container nb-start-section" aria-labelledby="start-heading">
    <h2 id="start-heading" className="nb-network-heading">Where do you start?</h2>
    <ul className="nb-start-cards">
      {CARDS.map(c => <li key={c.audience}><Link to="/start/$audience" params={{ audience: c.audience }} className="nb-start-card">
        <h3 className="nb-h3">{c.title}</h3>
        <p className="nb-small">{c.line}</p>
        <ArrowRight className="nb-start-card-arrow h-5 w-5" aria-hidden />
      </Link></li>)}
    </ul>
  </section>;
}
