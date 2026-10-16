import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

// The media bucket is private, so we store a long-lived signed URL.
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MAX_BYTES = 10 * 1024 * 1024;

async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_BYTES) throw new Error("Image must be under 10 MB.");
  const ext = (file.name.split(".").pop() || "img").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw new Error(up.error.message);
  const signed = await supabase.storage.from("media").createSignedUrl(path, TEN_YEARS);
  if (signed.error || !signed.data) throw new Error(signed.error?.message ?? "Could not create link");
  return signed.data.signedUrl;
}

export function ImageField({ id, folder, value, onChange }: { id: string; folder: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
      toast.success("Image uploaded — remember to save");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void handle(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload image: drop a file or press to choose"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer items-center gap-4 rounded-md border border-dashed p-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${over ? "border-primary bg-accent" : "border-input hover:bg-accent/50"}`}
      >
        {value ? (
          <img src={value} alt="Current image" className="h-16 w-16 rounded-md border border-border object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-md border border-border bg-muted" aria-hidden />
        )}
        <span className="text-muted-foreground">
          {busy ? "Uploading…" : "Drag an image here, or click to choose"}
        </span>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void handle(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <div className="flex gap-2">
        <Input id={id} type="url" placeholder="…or paste an image URL" value={value} onChange={(e) => onChange(e.target.value)} />
        {value && <Button type="button" variant="outline" onClick={() => onChange("")}>Remove</Button>}
      </div>
    </div>
  );
}
