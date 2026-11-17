import { Atlas } from "@/components/atlas";
import { getTerms } from "@/lib/catalog";
export const metadata = { title: "Ship Atlas" };
export default async function AtlasPage({ searchParams }: { searchParams: Promise<{ term?: string | string[] }> }) {
  const [terms, params] = await Promise.all([getTerms(), searchParams]);
  return <Atlas terms={terms} initial={typeof params.term === "string" ? params.term : undefined}/>;
}
