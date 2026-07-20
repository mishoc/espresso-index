import Link from "next/link";

const NAV = [
  { href: "/", label: "Index" },
  { href: "/rankings", label: "Rankings" },
  { href: "/lab", label: "Data Lab" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-card-border bg-porcelain">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4">
        <Link href="/" className="font-display text-lg font-semibold whitespace-nowrap">
          The Espresso Index
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-roast">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="hover:text-espresso hover:underline underline-offset-4"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
