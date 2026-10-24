import { Link } from '@tanstack/react-router';
import { Bookmark } from 'lucide-react';
import { useSavedItems } from '@/lib/saved';

/** Bookmark icon in the navbar with a small count when anything is saved. */
export function SavedLink() {
  const count = useSavedItems().length;
  return <Link to="/saved" className="nb-header-icon" aria-label={count ? `Saved, ${count} ${count === 1 ? 'item' : 'items'}` : 'Saved'} title="Saved">
    <Bookmark className="h-5 w-5" aria-hidden />{count > 0 && <span className="nb-header-count" aria-hidden>{count}</span>}
  </Link>;
}
