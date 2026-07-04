import Link from "next/link";
import { dataset } from "@/lib/data";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-card-border">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-modeled-ink">
        <span>
          The Espresso Index v{dataset.version} · data {dataset.generated}
        </span>
        <span className="flex gap-4">
          <Link href="/methodology" className="hover:text-espresso underline underline-offset-4">
            Methodology
          </Link>
          <a
            href="/espresso-index.csv"
            download
            className="hover:text-espresso underline underline-offset-4"
          >
            Download CSV
          </a>
          <span>Built in Chicago</span>
        </span>
      </div>
    </footer>
  );
}
