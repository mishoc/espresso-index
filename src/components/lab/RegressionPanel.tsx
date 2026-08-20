"use client";

import { countryName } from "@/lib/lab-data";
import type { JoinedPoint } from "@/lib/lab-join";
import { slopeInWords, type ScatterAnalysis } from "@/lib/lab-stats";

const fmtP = (p: number) => (p < 0.001 ? "< 0.001" : p.toFixed(3));
const fmt = (v: number, d = 3) =>
  Math.abs(v) >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : v.toFixed(d);

/** OLS results for the current scatter, in the transform space shown on the
 *  axes. Descriptive associations only — the caveat line is part of the UI. */
export default function RegressionPanel({
  analysis,
  xLabel,
  yLabel,
}: {
  analysis: ScatterAnalysis<JoinedPoint>;
  xLabel: string;
  yLabel: string;
}) {
  const { fit, mode, spearman, dropped, residuals } = analysis;
  if (!fit) return null;

  const xTerm = mode.logX ? `log(${xLabel})` : xLabel;
  const yTerm = mode.logY ? `log(${yLabel})` : yLabel;
  const top = [...residuals].sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual)).slice(0, 5);
  const inv = (v: number) => (mode.logY ? Math.exp(v) : v);

  return (
    <section className="mt-4 rounded-card border border-card-border bg-paper p-4 text-sm">
      <h2 className="font-medium">
        OLS: <span className="tabular">{yTerm} ~ {xTerm}</span>
      </h2>
      <div className="mt-2 overflow-x-auto">
        <table className="tabular w-full text-left">
          <thead>
            <tr className="border-b border-card-border text-xs text-modeled-ink uppercase tracking-wide">
              <th className="py-1 pr-4">slope β</th>
              <th className="py-1 pr-4">95% CI</th>
              <th className="py-1 pr-4">SE</th>
              <th className="py-1 pr-4">t</th>
              <th className="py-1 pr-4">p</th>
              <th className="py-1 pr-4">R²</th>
              <th className="py-1 pr-4">Pearson r</th>
              <th className="py-1 pr-4">Spearman ρ</th>
              <th className="py-1">n</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 pr-4">{fmt(fit.slope)}</td>
              <td className="py-1 pr-4">[{fmt(fit.ci95[0])}, {fmt(fit.ci95[1])}]</td>
              <td className="py-1 pr-4">{fmt(fit.seSlope)}</td>
              <td className="py-1 pr-4">{fit.t.toFixed(2)}</td>
              <td className="py-1 pr-4">{fmtP(fit.p)}</td>
              <td className="py-1 pr-4">{fit.r2.toFixed(3)}</td>
              <td className="py-1 pr-4">{fit.r.toFixed(3)}</td>
              <td className="py-1 pr-4">{Number.isFinite(spearman) ? spearman.toFixed(3) : "—"}</td>
              <td className="py-1">{fit.n}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-roast">{slopeInWords(fit, mode, xLabel, yLabel)}</p>
      {dropped > 0 && (
        <p className="mt-1 text-xs text-modeled-ink">
          {dropped} point{dropped === 1 ? "" : "s"} with non-positive values excluded by the log transform.
        </p>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer font-medium">
          Largest residuals — countries farthest from the fitted line
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="tabular w-full text-left">
            <thead>
              <tr className="border-b border-card-border text-xs text-modeled-ink uppercase tracking-wide">
                <th className="py-1 pr-4">Country</th>
                <th className="py-1 pr-4">Actual {yLabel}</th>
                <th className="py-1 pr-4">Fitted</th>
                <th className="py-1">Residual{mode.logY ? " (log units)" : ""}</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <tr key={r.orig.iso3} className="border-b border-card-border/60">
                  <td className="py-1 pr-4">{countryName(r.orig.iso3)}</td>
                  <td className="py-1 pr-4">{fmt(r.orig.y, 2)}</td>
                  <td className="py-1 pr-4">{fmt(inv(r.fitted), 2)}</td>
                  <td className="py-1">{r.residual >= 0 ? "+" : "−"}{Math.abs(r.residual).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="mt-3 text-xs text-modeled-ink">
        Descriptive association in a cross-country snapshot — not a causal
        estimate. Statistics are computed in the transformed space shown on
        the axes; changing the log toggles changes the model.
      </p>
    </section>
  );
}
