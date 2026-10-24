import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { DirectoryData } from "./explore";
import { approvedCover } from './organisation-cover';

export const getDirectory = createServerFn({ method: "GET" }).handler(async (): Promise<DirectoryData> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("The directory is temporarily unavailable.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const organisations: DirectoryData["organisations"] = [];
  const terms: DirectoryData["terms"] = [];
  const links: { organisation_id: string; term_id: string }[] = [];
  // Page each table to avoid silently truncating the directory at the API row limit.
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from("organisations")
      .select("id, slug, name, type, short_description, logo_url, logo_choice, logo_image_source, logo_image_source_url, image_source_url, cover_image_url, cover_image_status, website, city, published_at, prominence, logo_resolved_url, logo_tone, logo_status, logo_shared_from")
      .eq("status", "published").order("name").order("id").range(offset, offset + 999);
    if (error) throw new Error("The organisations could not be loaded. Please try again.");
    organisations.push(...(data ?? []).map((org) => ({ ...org, cover_image_url: approvedCover(org.cover_image_url, org.cover_image_status), termIds: [] })));
    if (!data || data.length < 1000) break;
  }
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from("terms").select("id, kind, name, slug, parent_id, sort_order")
      .order("sort_order").order("name").order("id").range(offset, offset + 999);
    if (error) throw new Error("The directory filters could not be loaded. Please try again.");
    terms.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from("organisation_terms").select("organisation_id, term_id")
      .order("organisation_id").order("term_id").range(offset, offset + 999);
    if (error) throw new Error("The organisation tags could not be loaded. Please try again.");
    links.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const rels: { from_org_id: string; to_org_id: string; relation: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from("organisation_relations").select("from_org_id, to_org_id, relation").order("id").range(offset, offset + 999);
    if (error) break;
    rels.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const published = new Set(organisations.map((o) => o.id));
  const connections = new Map<string, number>();
  for (const r of rels) if (published.has(r.from_org_id) && published.has(r.to_org_id)) for (const id of [r.from_org_id, r.to_org_id]) connections.set(id, (connections.get(id) ?? 0) + 1);
  const tags = new Map<string, string[]>();
  for (const link of links) tags.set(link.organisation_id, [...(tags.get(link.organisation_id) ?? []), link.term_id]);
  const parentFor = (org: DirectoryData['organisations'][number]) => { const id = org.logo_shared_from; const rel = rels.find(r=>r.from_org_id===org.id && r.relation==='part_of' && r.to_org_id===id); return rel ? organisations.find(o=>o.id===rel.to_org_id) : undefined; };
  return { organisations: organisations.map((org) => ({ ...org, parent_name: parentFor(org)?.name ?? null, parent_slug: parentFor(org)?.slug ?? null, termIds: tags.get(org.id) ?? [], connections: connections.get(org.id) ?? 0 })), terms };
});