"use client";

export default function GlobalError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <main className="foundation-main">
      <p className="eyebrow">Safe failure</p>
      <h1>LifeThread could not load this view.</h1>
      <p className="lede">No goal or evidence content was written to the error log.</p>
      <button type="button" onClick={reset}>Try again</button>
    </main>
  );
}
