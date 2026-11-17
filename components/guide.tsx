"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { kindLabels, searchTerms, topicLabels, topics, type Term, type Topic } from "@/lib/domain";
export function Guide({ terms }: { terms: Term[] }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic>();
  const matches = useMemo(() => searchTerms(terms, query, topic).sort((a,b) => a.en.localeCompare(b.en)), [terms, query, topic]);
  return <section>
    <label className="search guide-search"><Search size={17}/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search terms / 搜索术语" aria-label="Search terms"/></label>
    <div className="filters" aria-label="Filter by inspection area">
      <button aria-pressed={!topic} onClick={() => setTopic(undefined)}>All areas</button>
      {topics.map(t => <button key={t} aria-pressed={topic === t} onClick={() => setTopic(t)}>{topicLabels[t][0]} <small lang="zh-Hans">{topicLabels[t][1]}</small></button>)}
    </div>
    <p className="result-count" role="status">{matches.length} {matches.length === 1 ? "entry" : "entries"}</p>
    <div className="guide-grid">{matches.map(t => <Link className="card guide-entry" key={t.slug} href={"/term/" + t.slug}>
      <span className="eyebrow">{t.historical ? "Historical · " : ""}{kindLabels[t.kind]}</span><ArrowUpRight size={16}/><h2>{t.en}</h2><span lang="zh-Hans">{t.zh}</span></Link>)}</div>
    {!matches.length && <p className="empty">No matching terms. Try a different spelling or area.</p>}
  </section>;
}
