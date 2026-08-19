import Link from "next/link";

/* The Inequality section — a serious wing of the Espresso Index. Shares the
   site header/footer and design tokens; adds its own sub-nav. Editorial
   rules for this section live in content/inequality/CLAUDE.md. */
const SUBNAV = [
  { href: "/inequality", label: "Overview" },
  { href: "/inequality/learn", label: "Learn" },
  { href: "/inequality/data", label: "Data" },
  { href: "/inequality/library", label: "Library" },
  { href: "/inequality/perspectives", label: "Perspectives" },
  { href: "/inequality/resources", label: "Resources" },
  { href: "/inequality/about", label: "About & methods" },
  { href: "/inequality/search", label: "Search" },
];

export default function InequalityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1" data-pagefind-body>
      <div className="border-b border-card-border bg-paper">
        <nav
          aria-label="Inequality section"
          className="no-scrollbar mx-auto flex w-full max-w-[1200px] gap-x-5 overflow-x-auto px-6 py-2.5 text-sm text-roast"
        >
          <span className="font-display shrink-0 font-semibold text-espresso">Inequality Explained</span>
          {SUBNAV.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 hover:text-espresso hover:underline underline-offset-4">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
