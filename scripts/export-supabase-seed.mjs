import { readFile } from "node:fs/promises";
const terms = JSON.parse(await readFile(new URL("../data/terms.json", import.meta.url), "utf8"));
const literal = text => "'" + text.replaceAll("'", "''") + "'";
process.stdout.write("begin;\n");
for (const t of terms) process.stdout.write(
  "insert into public.docking_terms (slug, payload) values (" + literal(t.slug) + ", " +
  literal(JSON.stringify(t)) + "::jsonb) on conflict (slug) do update set payload = excluded.payload;\n",
);
process.stdout.write("commit;\n");
