import Link from "next/link";
export default function NotFound() {
  return <div className="page-heading"><p className="eyebrow">404 · Atlas reference</p><h1>Page not found</h1><p>This term or scene is not in the current edition.</p><Link className="primary" href="/guide">Browse the field guide</Link></div>;
}
