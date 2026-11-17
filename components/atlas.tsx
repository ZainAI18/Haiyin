"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Anchor, ArrowDownRight, ArrowRight, BookOpen, Box, ChevronRight, Compass, Droplets, Ruler, Search, Waves } from "lucide-react";
import { focusTermByObject, kindLabels, mappingLabels, searchTerms, topicLabels, topics, type ObjectId, type Term, type Topic } from "@/lib/domain";
import { Viewer } from "@/components/viewer";
import { TermFacts } from "./term-facts";

const favorites = ["rudder-plate", "propeller", "stockless-anchor"];
const featuredIcons = [Compass, Box, Anchor];
export function Atlas({ terms, initial }: { terms: Term[]; initial?: string }) {
  const index = useMemo(() => new Map(terms.map(t => [t.slug, t])), [terms]);
  const [selected, setSelected] = useState(initial ?? "");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic>();
  const [modeledOnly, setModeledOnly] = useState(false);
  const [reset, setReset] = useState(0);
  const viewerHeading = useRef<HTMLHeadingElement>(null);
  const active = index.get(selected);
  const map = active?.mapping;
  const matches = useMemo(() => {
    const results = searchTerms(terms, query, topic);
    return modeledOnly ? results.filter(term => term.mapping.status === "schematic") : results;
  }, [terms, query, topic, modeledOnly]);
  const select = (slug: string) => { setSelected(slug); setReset(n => n + 1); };
  const selectFromIndex = (slug: string) => {
    select(slug);
    if (window.matchMedia("(max-width: 700px)").matches) {
      viewerHeading.current?.focus({ preventScroll: true });
      viewerHeading.current?.scrollIntoView({ block: "start" });
    }
  };
  const chooseObject = (id: ObjectId) => select(focusTermByObject[id]);
  return <>
    <section className="page-heading atlas-heading">
      <div><p className="eyebrow"><span className="status-dot"/> INTERACTIVE ATLAS / 01</p>
      <h1>Explore the ship<span>.</span></h1><p>Inspect a vessel from bow to stern, one component at a time.</p></div>
      <div className="heading-note"><span>DOCKING SURVEY</span><b>船舶进坞检验</b><small>FIELD STUDY EDITION</small></div>
    </section>
    <div className="atlas-layout">
      <section className="card station">
        <div className="station-title"><Box size={17}/><h2 id="vessel-explorer" ref={viewerHeading} tabIndex={-1}>Vessel explorer</h2><span>01 / SHIP</span></div>
        <Viewer target={map && "object" in map ? map.object : undefined} overlay={map && "overlay" in map ? map.overlay : undefined}
          reset={reset} onPick={chooseObject} onOverview={() => setSelected("")}/>
        <div className="quick-targets"><span>QUICK FOCUS</span>{favorites.map((slug,i) => {
          const t = index.get(slug); const Icon = featuredIcons[i];
          return t && <button key={slug} aria-pressed={selected === slug} onClick={() => select(slug)}><Icon size={15}/> {["Rudder","Propeller","Anchor"][i]}</button>;
        })}</div>
        {active && map && "object" in map && <div className="inline-note" role="status">
          <strong>{active.en} <span lang="zh-Hans">{active.zh}</span></strong>
          <span className="chip">{mappingLabels[map.status]}</span>
          <p lang="zh-Hans">{active.explanationZh}</p>
        </div>}
        <a className="mobile-view-link" href="#term-index">Back to term index ↓</a>
      </section>
      <aside className="card index-panel" aria-label="Term index">
        <div className="index-heading"><div><p className="eyebrow">ENGLISH / 中文</p><h2 id="term-index" tabIndex={-1}>Term index</h2></div><span className="counter">{terms.length}</span></div>
        <div className="index-tools">
          <label className="search"><Search size={17}/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search / 搜索术语" aria-label="Search term index"/></label>
          <label className="select-field"><span>Inspection area</span><select value={topic ?? ""} onChange={e => setTopic((e.target.value || undefined) as Topic | undefined)}><option value="">All areas</option>{topics.map(t => <option key={t} value={t}>{topicLabels[t].join(" / ")}</option>)}</select></label>
          <div className="index-result-controls">
            <p className="result-count" role="status">{matches.length} {matches.length === 1 ? "TERM" : "TERMS"}</p>
            <label><input type="checkbox" checked={modeledOnly} onChange={e => setModeledOnly(e.target.checked)}/> Modeled parts only</label>
          </div>
        </div>
        <ul className="term-list">
          {matches.map(t => {
            const { mapping } = t;
            const name = <span>{t.en}<small lang="zh-Hans">{t.zh}</small></span>;
            if (mapping.status === "scene") {
              return <li key={t.slug}><Link className="term-row" href={`/scenes/${mapping.scene}`}>{name}<span className="term-action">Open scene <ArrowDownRight size={15}/></span></Link></li>;
            }
            if (mapping.status === "text" || mapping.status === "context") {
              const action = mapping.status === "context" ? "Area + notes" : "Read";
              return <li key={t.slug}><Link className="term-row" href={`/term/${t.slug}`}>{name}<span className="term-action">{action} <BookOpen size={15}/></span></Link></li>;
            }
            const action = mapping.status === "demo" ? "Show defect" : "Focus part";
            return <li key={t.slug}><button type="button" className="term-row" aria-pressed={selected === t.slug} onClick={() => selectFromIndex(t.slug)}>
              {name}<span className="term-action">{action} <ChevronRight size={15}/></span>
            </button></li>;
          })}
        </ul>
        {!matches.length && <p className="empty">No matching terms.</p>}
      </aside>
    </div>
    <div className="lower-layout">
      <section className="card detail selection" aria-label="Selected term" aria-live="polite">
        <p className="eyebrow"><Ruler size={15}/> INSPECTION NOTE</p>
        {active ? <><h2>{active.en} <small lang="zh-Hans">{active.zh}</small></h2>
          <div className="flex flex-wrap gap-2"><span className="chip">{kindLabels[active.kind]}</span><span className="chip">{mappingLabels[active.mapping.status]}</span></div>
          <TermFacts term={active}/>
          <Link className="text-link" href={"/term/" + active.slug}>Read the term entry <ArrowRight size={16}/></Link>
        </> : <><h2>Start with a component</h2><p>Choose Rudder, Propeller, or Anchor above. You can also select a highlighted area on the ship or find a term in the index.</p></>}
      </section>
      <Link href="/scenes/dry-dock" className="card dock-link"><div className="flex items-center justify-between"><span className="icon-square"><Waves size={21}/></span><ArrowRight size={20}/></div><p className="eyebrow"><Droplets size={14}/> PROCESS SCENES</p><h2>How does a ship dock?</h2><p>Follow the vessel from entry to inspection in three interactive demonstrations.</p></Link>
    </div>
  </>;
}
