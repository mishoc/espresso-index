export const metadata = { title: "Corrections" };

export default function Page() {
  return (
    <article className="prose-site mx-auto w-full max-w-[720px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">Corrections</h1>
      <p className="mt-3 text-lg text-roast">If something here is wrong, we want to know and we will say so publicly.</p>
      <h2>Report an error</h2>
      <p>Email <a href="mailto:mishoceko@gmail.com?subject=Inequality%20Explained%20correction">the editor</a> with the page URL and what you believe is wrong. Citation-count disputes are easiest to resolve if you include the database and date you checked.</p>
      <h2>How corrections are handled</h2>
      <p>Factual errors are fixed in place. Because all content lives in a public git repository, every change to a research entry, explainer, or dataset snapshot is recorded with a timestamp — the full history is the corrections log.</p>
      <h2>Log</h2>
      <p className="text-modeled-ink">No corrections yet.</p>
    </article>
  );
}
