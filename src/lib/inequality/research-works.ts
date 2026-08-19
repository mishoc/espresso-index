import data from "@/../content/inequality/research-works.json";
import type { ResearchWork, ResearchWorksFile, Theme } from "./types";

const file = data as unknown as ResearchWorksFile;

export const WORKS_META = file.meta;

export function getAllWorks(): ResearchWork[] {
  return file.works;
}

export function getWorkById(id: string): ResearchWork | undefined {
  return file.works.find((w) => w.id === id);
}

export function getWorksByTheme(themeId: string): ResearchWork[] {
  return file.works.filter((w) => w.themes.includes(themeId));
}

export function getWorksByPerspective(slug: string): ResearchWork[] {
  return file.works.filter((w) => w.related_perspective_slug === slug);
}

export function getAllThemes(): Theme[] {
  return file.themes;
}

export function getThemeById(id: string): Theme | undefined {
  return file.themes.find((t) => t.id === id);
}

/** Discipline is derived from themes (BUILD_PLAN P2.1), not stored. */
export const POLITICAL_SCIENCE_THEMES = new Set(["political-science", "growth-and-politics"]);
export function disciplineOf(work: ResearchWork): "economics" | "political-science" | "both" {
  const ps = work.themes.some((t) => POLITICAL_SCIENCE_THEMES.has(t));
  const econ = work.themes.some((t) => !POLITICAL_SCIENCE_THEMES.has(t));
  return ps && econ ? "both" : ps ? "political-science" : "economics";
}

export function formatAuthors(authors: string[]): string {
  if (authors.length <= 2) return authors.join(" & ");
  return `${authors[0]} et al.`;
}
