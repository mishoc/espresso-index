import { notFound } from "next/navigation";
import LibraryTable from "@/components/inequality/LibraryTable";
import { getAllThemes, getThemeById, getWorksByTheme } from "@/lib/inequality/research-works";

export function generateStaticParams() {
  return getAllThemes().map((t) => ({ theme: t.id }));
}

export default async function ThemePage({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  const t = getThemeById(theme);
  if (!t) notFound();
  const works = getWorksByTheme(theme);
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-modeled-ink">Theme</p>
      <h1 className="mt-1 font-display text-[32px] font-semibold">{t.name}</h1>
      <p className="mt-2 max-w-2xl text-roast">{t.description}</p>
      <div className="mt-6">
        <LibraryTable works={works} themes={getAllThemes()} lockedTheme={theme} />
      </div>
    </div>
  );
}
