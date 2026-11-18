/** "Cách tạo dáng": numbered steps joined by a vertical line. */
export function PoseStepList({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <section aria-labelledby="steps-title">
      <h2 id="steps-title" className="mb-3 font-display text-[17px] font-bold">
        Cách tạo dáng
      </h2>
      <ol className="flex flex-col">
        {steps.map((step, i) => (
          <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
            {i < steps.length - 1 ? <span aria-hidden className="absolute top-7 bottom-0 left-3.5 w-0.5 bg-border" /> : null}
            <span
              aria-hidden
              className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-bold text-on-primary-soft"
            >
              {i + 1}
            </span>
            <p className="pt-0.5 text-text">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
