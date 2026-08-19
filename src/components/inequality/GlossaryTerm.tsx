/** Lightweight inline definition (the full /learn/glossary page is deferred
 *  in BUILD_PLAN; this keeps terms explainable in place without a tooltip lib). */
export default function GlossaryTerm({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <abbr title={typeof children === "string" ? children : undefined} className="cursor-help underline decoration-dotted underline-offset-2">
      {term}
    </abbr>
  );
}
