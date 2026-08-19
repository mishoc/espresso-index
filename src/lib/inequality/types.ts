/** Canonical types — must match content/research-works.json field-for-field
 *  (CLAUDE.md). Do not add fields the seed data does not carry. */

export type WorkType = "paper" | "book";
export type AudienceLevel = "intro" | "intermediate" | "advanced";

/** Never a bare number: value + where it came from + when (CLAUDE.md). */
export interface CitationCount {
  value: number;
  source: string;
  verified_date: string;
}

export interface ResearchWork {
  id: string;
  type: WorkType;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  doi_or_isbn: string | null;
  url: string | null;
  summary_plain: string;
  summary_technical: string;
  key_takeaways: string[];
  citation_count: CitationCount | null;
  is_contested: boolean;
  contested_note: string | null;
  related_perspective_slug: string | null;
  themes: string[];
  audience_level: AudienceLevel;
  related_works: string[];
}

export interface Theme {
  id: string;
  name: string;
  description: string;
}

export interface ResearchWorksFile {
  meta: {
    source_document: string;
    migrated_date: string;
    verification_note: string;
    schema_version: number;
  };
  themes: Theme[];
  works: ResearchWork[];
}
