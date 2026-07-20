import type { Metadata } from "next";
import { Suspense } from "react";
import LabShell from "@/components/lab/LabShell";

export const metadata: Metadata = {
  title: "Data Lab — The Espresso Index",
  description:
    "Chart espresso prices against GDP, inflation, Big Macs, coffee prices, and minimum wages — and share the result as a link.",
};

export default function LabPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
      <h1 className="font-display mb-2 text-[32px] font-semibold">Data Lab</h1>
      <p className="mb-6 max-w-2xl text-roast">
        Pick a dataset, pick countries, tweak, share. Every chart carries its
        own source line.
      </p>
      <Suspense>
        <LabShell />
      </Suspense>
    </main>
  );
}
