import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getTerms } from "@/lib/catalog";
import { kindLabels, mappingLabels, topicLabels } from "@/lib/domain";
import { Viewer } from "@/components/viewer";
import { TermFacts } from "@/components/term-facts";
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() { return (await getTerms()).map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const term = (await getTerms()).find(t => t.slug === slug);
  return term ? { title: term.en, description: term.explanationZh } : {};
}
export default async function TermPage({ params }: Props) {
  const { slug } = await params;
  const terms = await getTerms();
  const term = terms.find(t => t.slug === slug);
  if (!term) notFound();
  const map = term.mapping;
  const related = terms.filter(t => t.topic === term.topic && t.slug !== slug).slice(0, 5);
  return <>
    <div className="page-heading"><p className="eyebrow"><Link href="/guide">Field guide</Link> / {topicLabels[term.topic][0]}</p>
      <h1>{term.en}</h1><p lang="zh-Hans">{term.zh}</p><div className="flex flex-wrap gap-2"><span className="chip">{kindLabels[term.kind]}</span><span className="chip">{mappingLabels[map.status]}</span></div></div>
    <div className={"term-layout" + ("object" in map ? "" : " text-only")}>
      {"object" in map && <Viewer key={term.slug} target={map.object} overlay={"overlay" in map ? map.overlay : undefined}/>}
      <article className="card detail"><TermFacts term={term}/>
        {map.status === "scene" && <Link className="primary" href={"/scenes/" + map.scene}>Open process scene <ArrowRight size={17}/></Link>}
        {"object" in map && <Link className="text-link" href={"/atlas?term=" + term.slug}>Open in ship atlas <ArrowRight size={15}/></Link>}
      </article>
    </div>
    {related.length > 0 && <section className="related"><h2>Related terms</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{related.map(t => <Link className="card related-link" key={t.slug} href={"/term/" + t.slug}>{t.en}<small lang="zh-Hans">{t.zh}</small></Link>)}</div></section>}
  </>;
}
