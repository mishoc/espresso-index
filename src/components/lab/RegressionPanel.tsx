"use client";

import { countryName } from "@/lib/lab-data";
import type { JoinedPoint } from "@/lib/lab-join";
import { slopeInWords, type MultiFit, type ScatterAnalysis } from "@/lib/lab-stats";

const fmtP = (p: number) => (p < 0.001 ? "< 0.001" : p.toFixed(3));
const fmt = (v: number, d = 3) =>
  Math.abs(v) >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : v.toFixed(d);

/** OLS results for the current scatter, in the transform space shown on the
 *  axes. Descriptive associations only — the caveat line is part of the UI. */
export default function RegressionPanel({
  analysis,
  xLabel,
  yLabel,
  multi,
  groupFits,
  onExportJoined,
}: {
  analysis: ScatterAnalysis<JoinedPoint>;
  xLabel: string;
  yLabel: string;
  multi?: { fit: MultiFit; n: number } | null;
  groupFits?: { region: string; analysis: ScatterAnalysis<JoinedPoint> }[] | null;
  onExportJoined?: () => void;
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

      {groupFits && groupFits.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium">Per-region fits (regions with n ≥ 8)</h3>
          <div className="mt-1 overflow-x-auto">
            <table className="tabular w-full text-left">
              <thead>
                <tr className="border-b border-card-border text-xs text-modeled-ink uppercase tracking-wide">
                  <th className="py-1 pr-4">Region</th>
                  <th className="py-1 pr-4">slope β</th>
                  <th className="py-1 pr-4">95% CI</th>
                  <th className="py-1 pr-4">R²</th>
                  <th className="py-1">n</th>
                </tr>
              </thead>
              <tbody>
                {groupFits.map(({ region, analysis: a }) => (
                  <tr key={region} className="border-b border-card-border/60">
                    <td className="py-1 pr-4">{region}</td>
                    <td className="py-1 pr-4">{fmt(a.fit!.slope)}</td>
                    <td className="py-1 pr-4">[{fmt(a.fit!.ci95[0])}, {fmt(a.fit!.ci95[1])}]</td>
                    <td className="py-1 pr-4">{a.fit!.r2.toFixed(3)}</td>
                    <td className="py-1">{a.fit!.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-xs text-modeled-ink">
            Overlapping confidence intervals mean the slopes are not
            distinguishable at this sample size.
          </p>
        </div>
      )}

      {multi && (
        <div className="mt-4">
          <h3 className="font-medium">
            Multivariable OLS ({yLabel} ~ {multi.fit.coefs.slice(1).map((c) => c.name).join(" + ")})
          </h3>
          <div className="mt-1 overflow-x-auto">
            <table className="tabular w-full text-left">
              <thead>
                <tr className="border-b border-card-border text-xs text-modeled-ink uppercase tracking-wide">
                  <th className="py-1 pr-4">Term</th>
                  <th className="py-1 pr-4">β</th>
                  <th className="py-1 pr-4">95% CI</th>
                  <th className="py-1 pr-4">SE</th>
                  <th className="py-1 pr-4">t</th>
                  <th className="py-1">p</th>
                </tr>
              </thead>
              <tbody>
                {multi.fit.coefs.map((c) => (
                  <tr key={c.name} className="border-b border-card-border/60">
                    <td className="py-1 pr-4">{c.name}</td>
                    <td className="py-1 pr-4">{fmt(c.beta)}</td>
                    <td className="py-1 pr-4">[{fmt(c.ci95[0])}, {fmt(c.ci95[1])}]</td>
                    <td className="py-1 pr-4">{fmt(c.se)}</td>
                    <td className="py-1 pr-4">{c.t.toFixed(2)}</td>
                    <td className="py-1">{fmtP(c.p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-xs text-modeled-ink">
            R² {multi.fit.r2.toFixed(3)} · adjusted R² {multi.fit.adjR2.toFixed(3)} · n ={" "}
            {multi.fit.n} complete cases (countries with data for every
            variable). The chart above still shows the two-variable relation;
            this table is the joint model.
            {onExportJoined && (
              <>
                {" "}
                <button onClick={onExportJoined} className="underline underline-offset-2 hover:text-espresso">
                  Download the joined dataset (CSV)
                </button>
              </>
            )}
          </p>
        </div>
      )}

      <p className="mt-3 text-xs text-modeled-ink">
        Descriptive association in a cross-country snapshot — not a causal
        estimate. Statistics are computed in the transformed space shown on
        the axes; changing the log toggles changes the model.
      </p>
    </section>
  );
}
