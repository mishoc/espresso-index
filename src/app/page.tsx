import data from "../../data/espresso.json";

export default function Home() {
  const { total, counts } = data;
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="font-display text-[40px] leading-[48px] font-semibold">
        The Espresso Index
      </h1>
      <p className="max-w-xl text-roast">
        What a shot of espresso costs in {total} economies — and what that
        reveals about the economy behind the counter. {counts.surveyed}{" "}
        surveyed · {counts.derived} derived · {counts.modeled} modeled.
      </p>
      <p className="text-modeled text-sm">
        Site under construction — rankings, map, and methodology land this
        week.
      </p>
    </main>
  );
}
