import type { Metadata } from "next";
import Link from "next/link";
import { Anchor, Compass, LibraryBig, Waves } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Docking Atlas AI", template: "%s · Docking Atlas AI" },
  description: "A bilingual visual field guide to ship docking surveys. Explore components, defects and docking processes.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <a className="skip" href="#main-content">Skip to content</a>
    <header className="site-header"><div className="topbar">
      <Link className="brand" href="/atlas"><span className="brand-mark"><Anchor size={21}/></span><span>Docking Atlas <b>AI</b><small>MARITIME FIELD GUIDE</small></span></Link>
      <nav aria-label="Main navigation" className="top-nav">
        <Link href="/atlas"><Compass size={16}/> <span>Ship atlas</span></Link>
        <Link href="/scenes/dry-dock"><Waves size={16}/> <span>Docking scenes</span></Link>
        <Link href="/guide"><LibraryBig size={16}/> <span>Field guide</span></Link>
        <Link href="/vessels/hai-yin-i"><Anchor size={16}/> <span>Hai Yin I</span></Link>
      </nav>
      <span className="edition"><span/> EN / 中文</span>
    </div></header>
    <main id="main-content" className="site-main">{children}</main>
    <footer className="site-footer"><span>DOCKING ATLAS AI <span className="footer-divider">/</span> VISUAL STUDY REFERENCE</span><span>Study notes and simplified models · Verify current class requirements separately</span></footer>
  </body></html>;
}
