import { Atlas } from "@/components/atlas";
import Link from "next/link";
import { getTerms } from "@/lib/catalog";
export const metadata = { title: "Ship Atlas" };
export default async function AtlasPage({ searchParams }: { searchParams: Promise<{ term?: string | string[] }> }) {
  const [terms, params] = await Promise.all([getTerms(), searchParams]);
  const initial = typeof params.term === "string" ? params.term : undefined;
  return <><div className="hyi-vessel-switcher" aria-label="两艘独立船舶"><span aria-current="page">教学参考船 · 原有学习图谱</span><Link href="/vessels/hai-yin-i">MT Hai Yin I · 独立按图重建 →</Link></div><Atlas key={initial} terms={terms} initial={initial}/></>;
}
