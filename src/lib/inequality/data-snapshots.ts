import metadata from "@/../public/data/inequality/metadata.json";
import wid from "@/../public/data/inequality/wid-us-top-shares.json";
import swiid from "@/../public/data/inequality/swiid-gini.json";
import type { DatasetMeta } from "./dataset-metadata";

export const DATASET_META = metadata as Record<string, DatasetMeta>;

export interface SharePoint { year: number; share: number }
export const WID_US = wid as { variable: string; unit: string; series: Record<"top1" | "top10" | "middle40" | "bottom50", SharePoint[]> };

export interface GiniPoint { year: number; gini_disp: number; se: number; gini_mkt: number | null }
export const SWIID = swiid as { unit: string; countries: string[]; data: Record<string, GiniPoint[]> };
