import Link from "next/link";

export const metadata = { title: "About & methods" };

const PAGES = [
  { href: "/about/editorial-standards", title: "Editorial standards", blurb: "Nonpartisan, source-everything, no policy positions — and what that means in practice." },
  { href: "/about/how-we-verify-citations", title: "How we verify citations", blurb: "The actual process behind every citation count on this site, including what we could not verify." },
  { href: "/about/corrections", title: "Corrections", blurb: "How to report an error and how we log fixes." },
  { href: "/about/contact", title: "Contact", blurb: "Reach the editor." },
];

export default function AboutHub() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">About &amp; methods</h1>
      <ul className="mt-6 space-y-3">
        {PAGES.map((p) => (
          <li key={p.href} className="rounded-md border border-card-border p-4">
            <h2 className="text-lg font-semibold"><Link href={p.href} className="hover:underline underline-offset-4">{p.title}</Link></h2>
            <p className="text-sm text-roast">{p.blurb}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
