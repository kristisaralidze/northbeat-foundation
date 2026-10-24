import { Bookmark } from 'lucide-react';
import { useSaved, type SavedKind } from '@/lib/saved';

/** Icon-only save toggle used on every card. Stored in this browser only. */
export function SaveButton({ kind, slug, title }: { kind: SavedKind; slug: string; title: string }) {
  const { saved, toggle } = useSaved(kind, slug, title);
  return <button type="button" className="nb-save-icon" aria-pressed={saved} aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`} title={saved ? 'Saved' : 'Save'} onClick={toggle}>
    <Bookmark className="h-5 w-5" aria-hidden fill={saved ? 'currentColor' : 'none'} />
  </button>;
}
