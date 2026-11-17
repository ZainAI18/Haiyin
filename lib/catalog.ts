import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { z } from "zod";
import { termSchema, type Term } from "./domain";
import rawTerms from "@/data/terms.json";

const catalogSchema = z.array(termSchema).refine(
  terms => new Set(terms.map(t => t.slug)).size === terms.length,
  "Duplicate term slug",
);
const local = catalogSchema.parse(rawTerms);

export const getTerms = cache(async (): Promise<Term[]> => {
  if (process.env.DOCKING_CATALOG_BACKEND !== "supabase") return local;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase catalog is enabled but its URL or publishable key is missing.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const terms: unknown[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await client.from("docking_terms").select("payload").order("slug").range(start, start + 499);
    if (error) throw new Error("Unable to load the configured docking catalog.", { cause: error });
    terms.push(...data.map(row => row.payload));
    if (data.length < 500) break;
  }
  return catalogSchema.parse(terms);
});
