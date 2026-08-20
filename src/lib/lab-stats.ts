/** Statistics for the Data Lab scatter (Tier 1).
 *
 *  Everything here is computed in the TRANSFORM SPACE the user selected
 *  (log-X / log-Y / log-log / linear) — the number shown always describes
 *  the chart being looked at. Descriptive associations only: no causal
 *  claims, and the UI must say so.
 */

export interface XY {
  x: number;
  y: number;
}

export interface TransformMode {
  logX: boolean;
  logY: boolean;
}

/** Apply the transform, dropping points that can't be logged (≤ 0). */
export function transformPoints<T extends XY>(
  points: T[],
  mode: TransformMode,
): { t: XY; orig: T }[] {
  const out: { t: XY; orig: T }[] = [];
  for (const p of points) {
    if (mode.logX && p.x <= 0) continue;
    if (mode.logY && p.y <= 0) continue;
    out.push({
      t: { x: mode.logX ? Math.log(p.x) : p.x, y: mode.logY ? Math.log(p.y) : p.y },
      orig: p,
    });
  }
  return out;
}

export interface OlsFit {
  n: number;
  slope: number;
  intercept: number;
  seSlope: number;
  seIntercept: number;
  t: number;
  /** two-tailed p for H0: slope = 0 */
  p: number;
  r: number;
  r2: number;
  /** 95% CI for the slope */
  ci95: [number, number];
  df: number;
}

export function olsDetailed(points: XY[]): OlsFit | null {
  const n = points.length;
  if (n < 3) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of points) {
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
    sxy += (p.x - mx) * (p.y - my);
  }
  if (sxx === 0 || syy === 0) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const df = n - 2;
  let sse = 0;
  for (const p of points) sse += (p.y - (intercept + slope * p.x)) ** 2;
  const s2 = sse / df;
  const seSlope = Math.sqrt(s2 / sxx);
  const seIntercept = Math.sqrt(s2 * (1 / n + (mx * mx) / sxx));
  const t = seSlope === 0 ? Infinity : slope / seSlope;
  const p = twoTailedT(Math.abs(t), df);
  const r = sxy / Math.sqrt(sxx * syy);
  const r2 = 1 - sse / syy;
  const tCrit = tQuantile975(df);
  return {
    n, slope, intercept, seSlope, seIntercept, t, p, r, r2, df,
    ci95: [slope - tCrit * seSlope, slope + tCrit * seSlope],
  };
}

/** Spearman rank correlation with average ranks for ties. */
export function spearmanRho(points: XY[]): number {
  const n = points.length;
  if (n < 3) return NaN;
  const rank = (vals: number[]) => {
    const idx = vals.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
    const ranks = new Array<number>(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j + 1 < n && idx[j + 1][0] === idx[i][0]) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) ranks[idx[k][1]] = avg;
      i = j + 1;
    }
    return ranks;
  };
  const rx = rank(points.map((p) => p.x));
  const ry = rank(points.map((p) => p.y));
  const mx = (n + 1) / 2;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (rx[i] - mx) * (ry[i] - mx);
    sxx += (rx[i] - mx) ** 2;
    syy += (ry[i] - mx) ** 2;
  }
  if (sxx === 0 || syy === 0) return NaN;
  return sxy / Math.sqrt(sxx * syy);
}

export interface Residual<T> {
  orig: T;
  /** in transform space */
  residual: number;
  fitted: number;
}

export function residuals<T extends XY>(
  transformed: { t: XY; orig: T }[],
  fit: { slope: number; intercept: number },
): Residual<T>[] {
  return transformed.map(({ t, orig }) => {
    const fitted = fit.intercept + fit.slope * t.x;
    return { orig, fitted, residual: t.y - fitted };
  });
}

export function topResiduals<T extends XY>(res: Residual<T>[], k: number): Residual<T>[] {
  return [...res].sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual)).slice(0, k);
}

/** Plain-language reading of the slope, honest about the transform. */
export function slopeInWords(fit: OlsFit, mode: TransformMode, xLabel: string, yLabel: string): string {
  const b = fit.slope;
  if (mode.logX && mode.logY) {
    const pct = ((Math.pow(1.1, b) - 1) * 100).toFixed(1);
    return `A 10% higher ${xLabel} is associated with a ~${pct}% ${b >= 0 ? "higher" : "lower"} ${yLabel} (elasticity ${b.toFixed(2)}).`;
  }
  if (mode.logX) {
    const delta = b * Math.log(1.1);
    return `A 10% higher ${xLabel} is associated with ${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(3)} in ${yLabel}.`;
  }
  if (mode.logY) {
    const pct = ((Math.exp(b) - 1) * 100).toFixed(1);
    return `One unit higher ${xLabel} is associated with a ~${pct}% ${b >= 0 ? "higher" : "lower"} ${yLabel}.`;
  }
  return `One unit higher ${xLabel} is associated with ${b >= 0 ? "+" : "−"}${Math.abs(b).toFixed(3)} in ${yLabel}.`;
}

/* ---------- t distribution, via the regularized incomplete beta ---------- */

function logGamma(x: number): number {
  // Lanczos approximation
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let a = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += g[j] / ++a;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function incBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Two-tailed p-value for |t| with df degrees of freedom. */
export function twoTailedT(tAbs: number, df: number): number {
  if (!Number.isFinite(tAbs)) return 0;
  return incBeta(df / 2, 0.5, df / (df + tAbs * tAbs));
}

/** 97.5th percentile of t(df), by bisection on the CDF (plenty for UI). */
export function tQuantile975(df: number): number {
  let lo = 0, hi = 100;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (twoTailedT(mid, df) > 0.05) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ---------- one-call analysis for the Lab scatter ---------- */

export interface ScatterAnalysis<T extends XY> {
  mode: TransformMode;
  /** points used in the fit (non-loggable points dropped) */
  used: { t: XY; orig: T }[];
  dropped: number;
  fit: OlsFit | null;
  spearman: number;
  residuals: Residual<T>[];
}

export function analyzeScatter<T extends XY>(points: T[], mode: TransformMode): ScatterAnalysis<T> {
  const used = transformPoints(points, mode);
  const fit = olsDetailed(used.map((d) => d.t));
  return {
    mode,
    used,
    dropped: points.length - used.length,
    fit,
    spearman: spearmanRho(points),
    residuals: fit ? residuals(used, fit) : [],
  };
}

/* ---------- multivariable OLS (Tier 2) ---------- */

export interface MultiCoef {
  name: string;
  beta: number;
  se: number;
  t: number;
  p: number;
  ci95: [number, number];
}

export interface MultiFit {
  n: number;
  k: number; // predictors incl. intercept
  df: number;
  coefs: MultiCoef[]; // [intercept, ...predictors]
  r2: number;
  adjR2: number;
  fitted: number[];
  residuals: number[];
}

/** Gauss–Jordan inverse for the small symmetric XᵀX (k ≤ 6 here). */
function invert(m: number[][]): number[][] | null {
  const k = m.length;
  const a = m.map((row, i) => [...row, ...Array.from({ length: k }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < k; col++) {
    let piv = col;
    for (let r = col + 1; r < k; r++) if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) piv = r;
    if (Math.abs(a[piv][col]) < 1e-12) return null; // singular / collinear
    [a[col], a[piv]] = [a[piv], a[col]];
    const d = a[col][col];
    for (let j = 0; j < 2 * k; j++) a[col][j] /= d;
    for (let r = 0; r < k; r++) {
      if (r === col) continue;
      const f = a[r][col];
      for (let j = 0; j < 2 * k; j++) a[r][j] -= f * a[col][j];
    }
  }
  return a.map((row) => row.slice(k));
}

/** OLS of y on [1, x1, …, xm]. `names` labels the predictors (not the
 *  intercept). Returns null if n ≤ k or the design is collinear. */
export function olsMulti(rows: number[][], y: number[], names: string[]): MultiFit | null {
  const n = y.length;
  const k = (rows[0]?.length ?? 0) + 1;
  if (n <= k || rows.some((r) => r.length !== k - 1)) return null;
  const X = rows.map((r) => [1, ...r]);
  // XᵀX and Xᵀy
  const xtx = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0)),
  );
  const xty = Array.from({ length: k }, (_, i) => X.reduce((s, row, r) => s + row[i] * y[r], 0));
  const inv = invert(xtx);
  if (!inv) return null;
  const beta = inv.map((row) => row.reduce((s, v, j) => s + v * xty[j], 0));
  const fitted = X.map((row) => row.reduce((s, v, j) => s + v * beta[j], 0));
  const residuals = y.map((v, i) => v - fitted[i]);
  const sse = residuals.reduce((s, e) => s + e * e, 0);
  const my = y.reduce((s, v) => s + v, 0) / n;
  const sst = y.reduce((s, v) => s + (v - my) ** 2, 0);
  if (sst === 0) return null;
  const df = n - k;
  const s2 = sse / df;
  const tCrit = tQuantile975(df);
  const coefs: MultiCoef[] = beta.map((b, i) => {
    const se = Math.sqrt(Math.max(0, s2 * inv[i][i]));
    const t = se === 0 ? Infinity : b / se;
    return {
      name: i === 0 ? "(intercept)" : names[i - 1],
      beta: b,
      se,
      t,
      p: twoTailedT(Math.abs(t), df),
      ci95: [b - tCrit * se, b + tCrit * se],
    };
  });
  return { n, k, df, coefs, r2: 1 - sse / sst, adjR2: 1 - ((1 - (1 - sse / sst)) * (n - 1)) / df, fitted, residuals };
}
