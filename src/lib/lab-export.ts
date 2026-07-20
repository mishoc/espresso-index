/** PNG + CSV export (SPEC-DATALAB §4.1). PNG serializes the live SVG onto
 *  a 2× canvas with the site background and bakes the attribution footer
 *  into the image — a shared chart must carry its source line. */

export async function svgToPng(
  svg: SVGSVGElement,
  filename: string,
  attributionText: string,
): Promise<void> {
  const rect = svg.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG rasterization failed"));
      img.src = url;
    });
    const FOOTER = 28;
    const canvas = document.createElement("canvas");
    canvas.width = w * 2;
    canvas.height = (h + FOOTER) * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.fillStyle = "#faf6f0";
    ctx.fillRect(0, 0, w, h + FOOTER);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.fillStyle = "#6b675c";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(`${attributionText} · espressoindex.org/lab`, 8, h + 17);
    const png = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!png) throw new Error("PNG encoding failed");
    triggerDownload(URL.createObjectURL(png), filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadCsv(
  filename: string,
  header: string[],
  rows: (string | number)[][],
): void {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const body = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  triggerDownload(url, filename);
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
