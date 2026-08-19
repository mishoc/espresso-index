"use client";

import { useEffect, useRef } from "react";
import type * as PlotType from "@observablehq/plot";

/** Renders an Observable Plot spec into a div, re-rendering on resize.
 *  aria-hidden: the accessible alternative is the data table rendered by
 *  the page next to it (CLAUDE.md: every chart needs a text alternative). */
export default function PlotFigure({ build }: { build: (Plot: typeof PlotType, width: number) => Element }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ro: ResizeObserver | null = null;
    import("@observablehq/plot").then((Plot) => {
      const render = () => el.replaceChildren(build(Plot, el.clientWidth || 720));
      render();
      ro = new ResizeObserver(render);
      ro.observe(el);
    });
    return () => ro?.disconnect();
  }, [build]);
  return <div ref={ref} aria-hidden="true" className="w-full [&_svg]:overflow-visible" />;
}
