import Link from "next/link";
import HeroStat from "@/components/HeroStat";
import HomeMapSection from "@/components/HomeMapSection";
import ExtremesStrip from "@/components/ExtremesStrip";
import DataStrip from "@/components/DataStrip";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 px-6 pt-16 pb-10 text-center">
        <HeroStat />
        <Link
          href="/rankings"
          className="inline-flex min-h-[44px] items-center rounded-[6px] bg-crema px-6 font-medium text-espresso hover:brightness-105"
        >
          Explore the rankings →
        </Link>
      </section>
      <HomeMapSection />
      <DataStrip />
      <ExtremesStrip />
    </main>
  );
}
