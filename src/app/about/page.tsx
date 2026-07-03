import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — The Espresso Index",
  description: "Why this exists.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-[680px] flex-1 px-6 py-10">
      <h1 className="font-display mb-6 text-[32px] font-semibold">About</h1>
      <div className="flex flex-col gap-4 text-espresso/90">
        <p>
          I wanted the Big Mac Index, but for the drink I actually buy every
          day. Full story lands this week.
        </p>
        <p>
          <a
            href="mailto:mishoceko@gmail.com?subject=Espresso%20Index%20price%20correction"
            className="text-crema underline underline-offset-4"
          >
            Suggest a price correction
          </a>
        </p>
      </div>
    </main>
  );
}
