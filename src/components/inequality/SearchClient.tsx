"use client";

import { useEffect, useState } from "react";

interface Result { url: string; meta: { title?: string }; excerpt: string }
interface Pagefind {
  search: (q: string) => Promise<{ results: { data: () => Promise<Result> }[] }>;
}

/** Pagefind indexes .next/server/app/*.html, so result URLs carry ".html"
 *  and an "index" basename Next does not serve — normalize to routes. */
const cleanUrl = (u: string) => {
  // Index is rooted at .next/server/app/inequality, so prefix the section.
  const path = u.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  return `/inequality${path === "/" ? "" : path}` || "/inequality";
};

/** Pagefind index is built postbuild into /pagefind; in `next dev` it is
 *  absent, so the UI degrades to an honest "index not built" message. */
export default function SearchClient() {
  const [pf, setPf] = useState<Pagefind | null | "missing">(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ q: string; data: Result[] } | null>(null);

  useEffect(() => {
    // Runtime import from /public; webpack/turbopack must not try to resolve it.
    const load = new Function("return import('/pagefind/pagefind.js')") as () => Promise<Pagefind>;
    load().then((m) => setPf(m)).catch(() => setPf("missing"));
  }, []);

  useEffect(() => {
    if (!pf || pf === "missing" || !q.trim()) return;
    let alive = true;
    const t = setTimeout(async () => {
      const r = await pf.search(q);
      const data = await Promise.all(r.results.slice(0, 20).map((x) => x.data()));
      if (alive) setResults({ q, data });
    }, 150);
    return () => { alive = false; clearTimeout(t); };
  }, [q, pf]);
  // Results only count when they belong to the current query — an empty
  // box shows nothing without an effect clearing state.
  const shown = results && results.q === q && q.trim() ? results.data : null;

  return (
    <div>
      <label className="block">
        <span className="sr-only">Search</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search explainers, library, perspectives…"
          autoFocus
          className="min-h-[44px] w-full rounded border border-card-border bg-porcelain px-3 text-base"
        />
      </label>
      {pf === "missing" && (
        <p className="mt-3 text-sm text-modeled-ink">Search index is built at deploy time and isn&apos;t available in this preview.</p>
      )}
      {shown && shown.length === 0 && <p className="mt-4 text-modeled-ink">No results for “{q}”.</p>}
      {shown && shown.length > 0 && (
        <ul className="mt-4 space-y-3">
          {shown.map((r) => (
            <li key={r.url}>
              <a href={cleanUrl(r.url)} className="font-medium text-crema-ink underline underline-offset-2">{r.meta.title ?? r.url}</a>
              <p className="text-sm text-roast" dangerouslySetInnerHTML={{ __html: r.excerpt }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
