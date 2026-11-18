/** One on/off row of the filter sheet (min 44px tall), with an optional second line of explanation. */
export function FilterSwitch({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-surface-2 px-3.5 py-2 text-left"
    >
      <span className="flex flex-col">
        <span className="text-[15px] font-semibold">{title}</span>
        {description ? <span className="text-xs text-text-2">{description}</span> : null}
      </span>
      <span
        aria-hidden
        className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${checked ? 'bg-primary' : 'bg-border-strong'}`}
      >
        <span className={`size-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}
