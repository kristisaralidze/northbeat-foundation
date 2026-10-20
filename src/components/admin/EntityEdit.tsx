import { officialVideo } from '@/lib/video';
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DEFAULT_TAG_KINDS, ENTITIES, STATUS, humanize, type EntityKey, type FieldDef, type LinkDef } from "@/lib/admin/entities";
import { deleteEntry, getEntry, listIncomingRelations, listOptions, listTerms, saveEntry, type LinkRow, type Term } from "@/lib/admin/db";
import { selectClass } from "./EntityList";
import { ImageField } from "./ImageField";
import { useServerFn } from '@tanstack/react-start';
import { fetchOrganisationCover } from '@/lib/organisation-cover.functions';
import { shouldDiscoverCover } from '@/lib/organisation-cover';
import { ownDomain, isMediaUpload } from '@/lib/brand';
import { BrandSearch } from '@/components/BrandSearch';

type Values = Record<string, unknown>;

const toLocalInput = (iso: unknown) => {
  if (!iso) return "";
  const d = new Date(String(iso));
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

function normalise(fields: FieldDef[], v: Values): Values {
  const out: Values = {
    slug: v["slug"] || null,
    status: v["status"] || "draft",
    source_url: v["source_url"] || null,
    last_checked: v["last_checked"] || null,
    published_at: v["published_at"] || null,
  };
  for (const f of fields) {
    const raw = v[f.name];
    if (f.kind === "boolean") out[f.name] = Boolean(raw);
    else if (f.kind === "sources") out[f.name] = Array.isArray(raw) ? raw : [];
    else if (f.kind === "multi") out[f.name] = Array.isArray(raw) ? raw : [];
    else if (f.kind === "number") out[f.name] = raw === "" || raw == null ? null : Number(raw);
    else if (f.kind === "datetime") out[f.name] = raw ? new Date(String(raw)).toISOString() : null;
    else out[f.name] = raw === "" || raw == null ? null : raw;
  }
  return out;
}

export function EntityEdit({ entity, id }: { entity: EntityKey; id: string }) {
  const cfg = ENTITIES[entity];
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchCover = useServerFn(fetchOrganisationCover);
  const [coverEdited, setCoverEdited] = useState(false);
  const bundle = useQuery({ queryKey: [entity, "entry", id], queryFn: () => getEntry(cfg, id) });
  const terms = useQuery({ queryKey: ["terms"], queryFn: listTerms });

  const [values, setValues] = useState<Values>({ status: "draft" });
  const [termIds, setTermIds] = useState<string[]>([]);
  const [links, setLinks] = useState<Record<string, LinkRow[]>>({});

  useEffect(() => {
    if (!bundle.data) return;
    const r: Values = bundle.data.row ?? {};
    const v: Values = { ...r, ...(['organisations', 'events'].includes(entity) ? { cover_image_url: r['cover_image_pending_url'] ?? r['cover_image_url'] } : {}) };
    for (const f of cfg.fields) if (f.kind === "datetime") v[f.name] = toLocalInput(r[f.name as keyof typeof r]);
    if (!bundle.data.row) v["status"] = "draft";
    setValues(v);
    setCoverEdited(false);
    setTermIds(bundle.data.termIds);
    setLinks(bundle.data.links);
  }, [bundle.data, cfg.fields, entity]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = normalise(cfg.fields, values);
      if (['organisations', 'events'].includes(entity)) {
        if (payload['video_url'] && !officialVideo(payload['video_url'] as string, payload['video_source_url'] as string)) throw new Error('Use a YouTube or Vimeo video and the official channel URL on the same platform, like youtube.com/@name or vimeo.com/name.');
        if (!payload['video_url']) payload['video_source_url'] = null;
        if (!coverEdited) delete payload['cover_image_url'];
        else {
          const image = payload['cover_image_url'] as string | null;
          const website = (entity === 'organisations' ? values['website'] : values['registration_url'] ?? values['source_url']) as string | null;
          if (image && !isMediaUpload(image) && !ownDomain(image, website)) throw new Error('Upload a file or use an image from the official website.');
          payload['cover_image_pending_url'] = image; payload['cover_image_status'] = image ? 'pending' : 'rejected'; payload['cover_image_url'] = null; payload['cover_image_flag'] = null; payload['image_source'] = isMediaUpload(image) ? 'admin_upload' : 'website'; payload['image_source_url'] = isMediaUpload(image) ? image : website; payload['cover_page_title'] = isMediaUpload(image) ? 'Uploaded by admin' : 'Official website image';
        }
        const logo = payload['logo_url'] as string | null;
        if (logo && logo !== bundle.data?.row?.['logo_url']) {
          const website = (entity === 'organisations' ? values['website'] : values['registration_url'] ?? values['source_url']) as string | null;
          if (!isMediaUpload(logo) && !ownDomain(logo,website)) throw new Error('Upload a logo file or use the official website domain.');
          payload['logo_image_source'] = isMediaUpload(logo) ? 'admin_upload' : 'website'; payload['logo_image_source_url'] = logo;
        }
      }
      const newId = await saveEntry(cfg, id, payload, termIds, links);
      if (entity === 'organisations' && shouldDiscoverCover(bundle.data?.row?.['website'], values['website'], values['cover_image_url'], coverEdited)) {
        try { await fetchCover({ data: { id: newId, website: String(values['website']) } }); } catch { toast.error('Saved, but the website cover could not be fetched.'); }
      }
      return newId;
    },
    onSuccess: (newId) => {
      qc.invalidateQueries({ queryKey: [entity] });
      cfg.links.forEach((l) => qc.invalidateQueries({ queryKey: [l.other] }));
      toast.success("Saved");
      if (id === "new") navigate({ to: `/admin/${entity}/$id` as never, params: { id: newId } as never, replace: true });
    },
    onError: (e: Error) => toast.error(e.message.includes("duplicate key") ? "That slug is already used." : e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteEntry(cfg, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [entity] });
      toast.success("Deleted");
      navigate({ to: `/admin/${entity}` as never });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (name: string, v: unknown) => { if (name === 'cover_image_url') setCoverEdited(true); setValues((prev) => ({ ...prev, [name]: v })); };

  if (bundle.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (bundle.error) return <p role="alert" className="text-destructive">{(bundle.error as Error).message}</p>;
  if (id !== "new" && !bundle.data?.row) return <p>Not found.</p>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to={`/admin/${entity}` as never} className="text-sm text-muted-foreground hover:underline">← {cfg.plural}</Link>
          <h1 className="text-xl font-semibold text-foreground">
            {id === "new" ? `New ${cfg.singular.toLowerCase()}` : String(values[cfg.titleField] ?? cfg.singular)}
          </h1>
        </div>
        <div className="flex gap-2">
          {id !== "new" && (
            <Button type="button" variant="outline" onClick={() => confirm("Delete this entry permanently?") && remove.mutate()}>
              Delete
            </Button>
          )}
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select id="status" className={`${selectClass} w-full`} value={String(values["status"] ?? "draft")} onChange={(e) => set("status", e.target.value)}>
            {STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" placeholder="Generated from name if empty" value={String(values["slug"] ?? "")} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="source_url">Source URL</Label>
          <Input id="source_url" type="url" value={String(values["source_url"] ?? "")} onChange={(e) => set("source_url", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="last_checked">Last checked</Label>
          <div className="flex gap-2">
            <Input id="last_checked" type="date" value={String(values["last_checked"] ?? "")} onChange={(e) => set("last_checked", e.target.value)} />
            <Button type="button" variant="outline" onClick={() => set("last_checked", new Date().toISOString().slice(0, 10))}>Today</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {cfg.fields.map((f) => entity === 'organisations' && id === 'new' && f.name === 'name' ? <div key={f.name} className="space-y-1"><Label htmlFor="name">Name *</Label><BrandSearch id="name" value={String(values['name'] ?? '')} onChange={name=>set('name',name)} onSelect={(name,website)=>setValues(prev=>({...prev,name,website}))} /></div> : <FieldInput key={f.name} field={f} terms={terms.data ?? []} value={values[f.name]} onChange={(v) => set(f.name, v)} />)}
      </section>
      {['organisations', 'events'].includes(entity) && <p className="text-sm text-muted-foreground">Cover review: {String(bundle.data?.row?.['cover_image_status'] ?? 'pending')}. <Link to="/admin/cover-images" className="underline">Cover images</Link>{bundle.data?.row?.['cover_image_flag'] ? `: ${String(bundle.data.row['cover_image_flag'])}` : ''}</p>}

      <TagPicker kinds={cfg.tagKinds ?? DEFAULT_TAG_KINDS} terms={terms.data ?? []} selected={termIds} onChange={setTermIds} />

      {cfg.links.map((l) => (
        <LinkPicker key={l.table} def={l} rows={links[l.table] ?? []} onChange={(rows) => setLinks((p) => ({ ...p, [l.table]: rows }))} />
      ))}

      {entity === "organisations" && id !== "new" && <IncomingRelations orgId={id} />}

      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}

function IncomingRelations({ orgId }: { orgId: string }) {
  const incoming = useQuery({ queryKey: ["organisations", "incoming-relations", orgId], queryFn: () => listIncomingRelations(orgId) });
  if (!incoming.data?.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-foreground">Incoming relationships</h2>
      <p className="text-sm text-muted-foreground">Other organisations pointing at this one. Edit them on that organisation's page.</p>
      <ul className="divide-y divide-border rounded-md border border-border">
        {incoming.data.map((rel) => (
          <li key={rel.id} className="flex flex-wrap items-baseline gap-x-2 px-3 py-2 text-sm">
            <span className="font-medium text-foreground">{rel.fromName}</span>
            <span className="text-muted-foreground">— {humanize(rel.relation)} this organisation</span>
            {rel.note ? <span className="text-muted-foreground">({rel.note})</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FieldInput({ field: f, terms, value, onChange }: { field: FieldDef; terms: Term[]; value: unknown; onChange: (v: unknown) => void }) {
  const wide = f.kind === "textarea" || f.kind === "multi" || f.kind === "sources";
  const wrap = wide ? "space-y-1 sm:col-span-2" : "space-y-1";
  const label = `${f.label}${f.required ? " *" : ""}`;

  if (f.kind === "term")
    return (
      <div className={wrap}>
        <Label htmlFor={f.name}>{label}</Label>
        <select id={f.name} className={`${selectClass} w-full`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">None</option>
          {terms.filter((t) => t.kind === f.termKind).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
    );
  if (f.kind === "sources") return <SourcesField field={f} value={value} onChange={onChange} />;

  if (f.kind === "boolean")
    return (
      <div className="flex items-center gap-2 pt-6">
        <Checkbox id={f.name} checked={Boolean(value)} onCheckedChange={(c) => onChange(c === true)} />
        <Label htmlFor={f.name}>{f.label}</Label>
      </div>
    );
  if (f.kind === "multi") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className={wrap}>
        <legend className="text-sm font-medium">{f.label}</legend>
        <div className="flex flex-wrap gap-4 pt-1">
          {f.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <Checkbox checked={arr.includes(o)} onCheckedChange={(c) => onChange(c ? [...arr, o] : arr.filter((x) => x !== o))} />
              {humanize(o)}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (f.kind === "image")
    return (
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor={f.name}>{f.label}</Label>
        <ImageField id={f.name} folder={f.name.replace(/_url$/, "")} value={value == null ? "" : String(value)} onChange={onChange} />
      </div>
    );
  if (f.kind === "select")
    return (
      <div className={wrap}>
        <Label htmlFor={f.name}>{label}</Label>
        <select id={f.name} required={f.required} className={`${selectClass} w-full`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">—</option>
          {f.options?.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
        </select>
      </div>
    );
  if (f.kind === "textarea")
    return (
      <div className={wrap}>
        <Label htmlFor={f.name}>{label}</Label>
        <Textarea id={f.name} rows={f.name === "transcript" ? 10 : 4} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  const type = f.kind === "datetime" ? "datetime-local" : f.kind;
  return (
    <div className={wrap}>
      <Label htmlFor={f.name}>{label}</Label>
      <Input id={f.name} type={type} required={f.required} value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

type Source = { title: string; url: string };
const sourcesToText = (v: unknown) => (Array.isArray(v) ? (v as Source[]).map((s) => `${s.title} | ${s.url}`).join("\n") : "");
export function parseSources(text: string): Source[] {
  return text.split("\n").map((line) => {
    const i = line.lastIndexOf("|");
    return i < 0 ? null : { title: line.slice(0, i).trim(), url: line.slice(i + 1).trim() };
  }).filter((s): s is Source => !!s && !!s.title && /^https?:\/\//.test(s.url));
}

function SourcesField({ field: f, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => sourcesToText(value));
  useEffect(() => { setText((t) => (JSON.stringify(parseSources(t)) === JSON.stringify(value ?? []) ? t : sourcesToText(value))); }, [value]);
  const skipped = text.split("\n").filter((l) => l.trim()).length - parseSources(text).length;
  return (
    <div className="space-y-1 sm:col-span-2">
      <Label htmlFor={f.name}>{f.label}</Label>
      <Textarea id={f.name} rows={4} placeholder="Title | https://link" value={text} onChange={(e) => { setText(e.target.value); onChange(parseSources(e.target.value)); }} />
      <p className="text-sm text-muted-foreground">{f.help}{skipped > 0 ? `. ${skipped} line(s) need a title and a link starting with http.` : ""}</p>
    </div>
  );
}

const KIND_LABELS: Record<string, string> = {
  field: "Fields", sub_area: "Sub-areas", country: "Countries", stage: "Stages", area: "Areas", journey_step: "Journey steps",
};

function TagPicker({ kinds, terms, selected, onChange }: { kinds: readonly string[]; terms: Term[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const KINDS = kinds.map((kind) => ({ kind, label: KIND_LABELS[kind] ?? kind }));
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Tags</h2>
      {terms.length === 0 && (
        <p className="text-sm text-muted-foreground">No tags yet. Add them under <Link to="/admin/tags" className="underline">Tags</Link>.</p>
      )}
      {KINDS.map(({ kind, label }) => {
        const list = terms.filter((t) => t.kind === kind);
        if (!list.length) return null;
        return (
          <div key={kind} className="space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <div className="flex flex-wrap gap-2">
              {list.map((t) => {
                const on = selected.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(t.id)}
                    className={`rounded-md border px-2 py-1 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:bg-accent"}`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function LinkPicker({ def, rows, onChange }: { def: LinkDef; rows: LinkRow[]; onChange: (rows: LinkRow[]) => void }) {
  const opts = useQuery({ queryKey: [def.other, "options"], queryFn: () => listOptions(def.other) });
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map((opts.data ?? []).map((o) => [o.id, o.label])), [opts.data]);
  const matches = q.trim()
    ? (opts.data ?? []).filter((o) => o.label?.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : [];

  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{def.roleOptions ? def.label : `Linked ${def.label.toLowerCase()}`}</h2>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">None linked.</p>}
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={`${r.otherId}-${i}`} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm">{byId.get(r.otherId) ?? "…"}</span>
            {def.noRole ? null : def.roleOptions ? (
              <select
                aria-label="Relation"
                className={`${selectClass} w-56`}
                value={r.role}
                onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
              >
                {def.roleOptions.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
              </select>
            ) : (
              <Input
                aria-label="Role"
                placeholder="Role (e.g. founder, speaker)"
                className="w-56"
                value={r.role}
                onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
              />
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(rows.filter((_, j) => j !== i))}>Remove</Button>
          </li>
        ))}
      </ul>
      <div className="relative max-w-md">
        <Input aria-label={`Add ${def.label.toLowerCase()}`} placeholder={`Search ${def.label.toLowerCase()} to link…`} value={q} onChange={(e) => setQ(e.target.value)} />
        {matches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground">
            {matches.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onChange([...rows, { otherId: o.id, role: def.roleOptions?.[0] ?? "" }]);
                    setQ("");
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {q.trim() && matches.length === 0 && opts.data && <p className="mt-1 text-sm text-muted-foreground">No matches.</p>}
      </div>
    </section>
  );
}
