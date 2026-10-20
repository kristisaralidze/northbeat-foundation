CREATE OR REPLACE FUNCTION public.admin_import_csv_row(_entity text, _values jsonb, _tags jsonb, _organisation_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public SET timezone = 'UTC' AS $$
DECLARE
 title_col text; term_table text; term_fk text; allowed text[]; cols text; projections text; entry_id uuid; tag jsonb; tag_id uuid; tag_kind public.term_kind; parent uuid; existing boolean; identity text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 CASE _entity
 WHEN 'organisations' THEN title_col := 'name'; term_table := 'organisation_terms'; term_fk := 'organisation_id'; allowed := ARRAY['name','type','short_description','website','city','founded_year','source_url','contact_email'];
 WHEN 'events' THEN title_col := 'title'; term_table := 'event_terms'; term_fk := 'event_id'; allowed := ARRAY['title','event_type','summary','starts_at','ends_at','city','venue','format','registration_url','apply_deadline_at','source_url'];
 WHEN 'opportunities' THEN title_col := 'title'; term_table := 'opportunity_terms'; term_fk := 'opportunity_id'; allowed := ARRAY['title','type','summary','deadline_at','amount_min_eur','amount_max_eur','description','apply_url','source_url'];
 ELSE RAISE EXCEPTION 'Invalid entity'; END CASE;
 identity := btrim(_values->>title_col);
 IF identity IS NULL OR identity = '' THEN RAISE EXCEPTION 'Name or title is required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('admin_csv_' || _entity));
 EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE lower(btrim(%I)) = lower($1))', _entity, title_col) INTO existing USING identity;
 IF NOT existing AND _entity = 'organisations' AND coalesce(_values->>'website','') <> '' THEN
 SELECT EXISTS (SELECT 1 FROM public.organisations WHERE lower(regexp_replace(split_part(regexp_replace(coalesce(website,''), '^https?://', '', 'i'), '/', 1), '^www\.', '', 'i')) = lower(regexp_replace(split_part(regexp_replace(_values->>'website', '^https?://', '', 'i'), '/', 1), '^www\.', '', 'i'))) INTO existing;
 END IF;
 IF existing THEN RETURN jsonb_build_object('status','skipped'); END IF;
 _values := (_values - 'status' - 'last_checked' - 'published_at') || jsonb_build_object('status','draft','last_checked',current_date,'created_by',auth.uid(),'slug',coalesce(nullif(_values->>'slug',''),'entry') || '-' || substr(gen_random_uuid()::text,1,8));
 allowed := allowed || ARRAY['status','last_checked','created_by','slug'];
 SELECT string_agg(format('%I',key),','), string_agg(format('r.%I',key),',') INTO cols, projections FROM jsonb_object_keys(_values) AS keys(key) WHERE key = ANY(allowed);
 EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1) r RETURNING id', _entity, cols, projections, _entity) INTO entry_id USING _values;
 FOR tag IN SELECT value FROM jsonb_array_elements(_tags) LOOP
 IF tag->>'kind' NOT IN ('country','field','sub_area','stage','journey_step') THEN RAISE EXCEPTION 'Invalid tag kind'; END IF;
 tag_kind := (tag->>'kind')::public.term_kind;
 SELECT id INTO tag_id FROM public.terms WHERE kind = tag_kind AND lower(btrim(name)) = lower(btrim(tag->>'name')) ORDER BY id LIMIT 1;
 IF tag_id IS NULL AND coalesce((tag->>'create')::boolean,false) THEN
 PERFORM pg_advisory_xact_lock(hashtext('csv_tag_' || tag_kind::text || lower(btrim(tag->>'name'))));
 SELECT id INTO tag_id FROM public.terms WHERE kind = tag_kind AND lower(btrim(name)) = lower(btrim(tag->>'name')) ORDER BY id LIMIT 1;
 IF tag_id IS NULL THEN
 parent := NULL;
 IF tag_kind = 'sub_area' THEN
 parent := (tag->>'parent_id')::uuid;
 IF parent IS NULL OR NOT EXISTS(SELECT 1 FROM public.terms WHERE id=parent AND kind='field') THEN RAISE EXCEPTION 'Choose a parent field'; END IF;
 END IF;
 INSERT INTO public.terms (kind,name,slug,parent_id) VALUES (tag_kind,btrim(tag->>'name'),'csv-' || gen_random_uuid()::text,parent) RETURNING id INTO tag_id;
 END IF;
 END IF;
 IF tag_id IS NULL THEN RAISE EXCEPTION 'Unknown tag'; END IF;
 EXECUTE format('INSERT INTO public.%I (%I,term_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',term_table,term_fk) USING entry_id,tag_id;
 END LOOP;
 IF _organisation_id IS NOT NULL THEN
 IF _entity = 'events' THEN INSERT INTO public.organisation_events (organisation_id,event_id,role) VALUES (_organisation_id,entry_id,'organiser');
 ELSIF _entity = 'opportunities' THEN INSERT INTO public.organisation_opportunities (organisation_id,opportunity_id,role) VALUES (_organisation_id,entry_id,'provider'); END IF;
 END IF;
 RETURN jsonb_build_object('status','added','id',entry_id);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_import_csv_row(text,jsonb,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_import_csv_row(text,jsonb,jsonb,uuid) TO authenticated;