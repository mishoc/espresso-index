import Link from "next/link";
import LibraryTable from "@/components/inequality/LibraryTable";
import { getAllThemes, getAllWorks, WORKS_META } from "@/lib/inequality/research-works";

export const metadata = { title: "Research Library" };

export default function LibraryPage() {
  const works = getAllWorks();
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">Research Library</h1>
      <p className="mt-2 max-w-2xl text-roast">
        {works.length} foundational papers and books on income inequality, each
        with a plain and a technical summary. Citation counts are shown only
        where we verified them ourselves — see{" "}
        <Link href="/inequality/about/how-we-verify-citations" className="text-crema-ink underline underline-offset-2">how we verify</Link>.
        Bibliography last verified {WORKS_META.migrated_date}.{" "}
        <a href="/inequality/library/bibliography.bib" className="text-crema-ink underline underline-offset-2">Download BibTeX</a>
        {" · "}
        <a href="/inequality/library/bibliography.ris" className="text-crema-ink underline underline-offset-2">RIS</a>
      </p>
      <div className="mt-6">
        <LibraryTable works={works} themes={getAllThemes()} />
      </div>
    </div>
  );
}
