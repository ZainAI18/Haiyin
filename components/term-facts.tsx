import { BookOpen, Info } from "lucide-react";
import type { Term } from "@/lib/domain";

export function TermFacts({term}: {term: Term}) {
  return <>
    {term.historical && <p className="warning"><Info size={17}/> <span><strong>Historical material · 1996</strong><br/>For study only. Do not use as current acceptance criteria.</span></p>}
    <p className="explanation" lang="zh-Hans">{term.explanationZh}</p>
    {term.mapping.status === "context" && <p className="fine">The view shows the associated area. This item has no separately modeled geometry.</p>}
    {term.mapping.status === "demo" && <p className="fine">The overlay illustrates how this defect might appear. Its location, shape and size are examples.</p>}
    <div className="source"><BookOpen size={15}/><div><strong>Docking Survey Study Notes</strong><br/>{term.sources.map(s => s.edition + " p. " + s.page).join(" · ")}
      {term.manual && <><br/>1996 manual: {term.manual}</>}</div></div>
    <p className="fine">Terminology confidence: {term.confidence}{term.aliases.length > 0 && <> · Also indexed as {term.aliases.join(", ")}</>}</p>
  </>;
}
