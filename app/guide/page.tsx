import { getTerms } from "@/lib/catalog";
import { Guide } from "@/components/guide";
export const metadata = { title: "Field Guide" };
export default async function GuidePage() {
  return <><div className="page-heading"><p className="eyebrow">02 / Survey library</p><h1>Field guide<span>.</span></h1><p>Find a term in English or Chinese, or browse by inspection area.</p></div><Guide terms={await getTerms()}/></>;
}
