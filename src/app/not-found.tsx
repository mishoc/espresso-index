import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="font-display text-[64px] font-semibold tabular">$0.00</p>
      <p className="text-roast">
        The only free espresso on the site. This page doesn&apos;t exist.
      </p>
      <Link href="/" className="text-crema underline underline-offset-4">
        Back to the index
      </Link>
    </main>
  );
}
