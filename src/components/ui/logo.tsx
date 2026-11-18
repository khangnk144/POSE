/** Pose Xinh logo: rounded square with viewfinder corners and a posing figure, plus wordmark. */
export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--primary)" />
        <g stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M8 12V9a1 1 0 0 1 1-1h3M20 8h3a1 1 0 0 1 1 1v3M24 20v3a1 1 0 0 1-1 1h-3M12 24H9a1 1 0 0 1-1-1v-3" />
          <path d="M13.5 15.5c3 1 0 4 2.5 6" />
        </g>
        <circle cx="13" cy="12.5" r="1.8" fill="#fff" />
        <path d="M25 3l.8 1.7L27.5 5.5l-1.7.8L25 8l-.8-1.7-1.7-.8 1.7-.8z" fill="var(--ai-soft)" />
      </svg>
      {withText ? (
        <span className="font-display text-xl font-bold leading-none text-text">
          Pose <span className="text-primary">Xinh</span>
        </span>
      ) : null}
    </span>
  );
}
