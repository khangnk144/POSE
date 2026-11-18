import { cn } from '@/lib/utils/cn';

/** Line pictograms (32x32, currentColor) for the picture pickers in the pose form. */
const SHAPES = {
  'height-overhead': (
    <><circle cx="22" cy="10" r="2.5"/><path d="M22 12.5V21l-3 8m3-8 3 8M18.5 18.5 22 15l3.5 3.5"/><rect x="4" y="2" width="7" height="5" rx="1.2" transform="rotate(30 7.5 4.5)"/><path d="m12.5 7.5 4.5 2.5" strokeDasharray="1 3"/></>
  ),
  'height-eye': (
    <><circle cx="22" cy="8" r="2.5"/><path d="M22 10.5V20l-3 9m3-9 3 9M18.5 17l3.5-4 3.5 4"/><rect x="5" y="4.5" width="5" height="7" rx="1.2"/><path d="M12.5 8h4.5" strokeDasharray="1 3"/></>
  ),
  'height-chest': (
    <><circle cx="22" cy="8" r="2.5"/><path d="M22 10.5V20l-3 9m3-9 3 9M18.5 17l3.5-4 3.5 4"/><rect x="5" y="10" width="5" height="7" rx="1.2"/><path d="M12.5 13.5h4.5" strokeDasharray="1 3"/></>
  ),
  'height-waist': (
    <><circle cx="22" cy="8" r="2.5"/><path d="M22 10.5V20l-3 9m3-9 3 9M18.5 17l3.5-4 3.5 4"/><rect x="5" y="16.5" width="5" height="7" rx="1.2"/><path d="M12.5 20h5" strokeDasharray="1 3"/></>
  ),
  'height-knee': (
    <><circle cx="22" cy="8" r="2.5"/><path d="M22 10.5V20l-3 9m3-9 3 9M18.5 17l3.5-4 3.5 4"/><rect x="5" y="21" width="5" height="7" rx="1.2"/><path d="M12.5 24.5h4.5" strokeDasharray="1 3"/></>
  ),
  'height-ground': (
    <><circle cx="22" cy="7" r="2.5"/><path d="M22 9.5V19l-3 9m3-9 3 9M18.5 16l3.5-4 3.5 4"/><rect x="4" y="23" width="7" height="5" rx="1.2"/><path d="m13 22.5 4-3.5" strokeDasharray="1 3"/><path d="M2 30.5h28"/></>
  ),
  'tilt-level': (
    <><rect x="7" y="9" width="5" height="14" rx="1.5"/><path d="M16 16h10m-3.5-3.5L26 16l-3.5 3.5"/></>
  ),
  'tilt-up': (
    <><g transform="rotate(-28 13 16)"><rect x="7" y="9" width="5" height="14" rx="1.5"/><path d="M16 16h10m-3.5-3.5L26 16l-3.5 3.5"/></g></>
  ),
  'tilt-down': (
    <><g transform="rotate(28 13 16)"><rect x="7" y="9" width="5" height="14" rx="1.5"/><path d="M16 16h10m-3.5-3.5L26 16l-3.5 3.5"/></g></>
  ),
  'zoom-0.5x': (
    <><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="12.5" r="1.5"/><path d="M16 14.5v4l-2 4.5m2-4.5 2 4.5M9 25.5h14" strokeWidth="1.75"/></>
  ),
  'zoom-1x': (
    <><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="8.5" r="2.2"/><path d="M16 11v7.5l-2.5 7m2.5-7 2.5 7M12.5 16l3.5-3.5 3.5 3.5"/></>
  ),
  'zoom-2x': (
    <><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="11" r="3"/><path d="M9.5 28v-4.5a6.5 6.5 0 0 1 13 0V28"/></>
  ),
  'zoom-3x': (
    <><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="13" r="4.5"/><path d="M6 28a10 10 0 0 1 20 0"/></>
  ),
  'zoom-5x': (
    <><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="16" r="8"/><path d="M13 14v1m6-1v1m-6.5 4q3.5 2.5 7 0"/></>
  ),
  'orient-portrait': (
    <><rect x="9" y="3" width="14" height="26" rx="3"/><circle cx="16" cy="13" r="2.2"/><path d="M12 22.5a4 4 0 0 1 8 0"/></>
  ),
  'orient-landscape': (
    <><rect x="3" y="9" width="26" height="14" rx="3"/><circle cx="16" cy="14" r="1.8"/><path d="M12.5 20a3.5 3.5 0 0 1 7 0"/></>
  ),
  'orient-square': (
    <><rect x="6" y="6" width="20" height="20" rx="3"/><circle cx="16" cy="13.5" r="2.2"/><path d="M12 22a4 4 0 0 1 8 0"/></>
  ),
  'people-solo': (
    <><circle cx="16" cy="10" r="4"/><path d="M8 27a8 8 0 0 1 16 0"/></>
  ),
  'people-duo': (
    <><circle cx="10.5" cy="11" r="3.2"/><circle cx="21.5" cy="11" r="3.2"/><path d="M4 26a6.5 6.5 0 0 1 12-3.4M16 26a6.5 6.5 0 0 1 12 0"/></>
  ),
  'people-group': (
    <><circle cx="16" cy="9" r="3.2"/><path d="M9.5 25a6.5 6.5 0 0 1 13 0"/><circle cx="6" cy="14" r="2.2"/><circle cx="26" cy="14" r="2.2"/><path d="M2 26a4.5 4.5 0 0 1 4-4.4M30 26a4.5 4.5 0 0 0-4-4.4"/></>
  ),
  'posture-stand': (
    <><circle cx="16" cy="5.5" r="2.5"/><path d="M16 8v11l-3 10m3-10 3 10M12 16l4-4.5 4 4.5"/></>
  ),
  'posture-sit': (
    <><circle cx="12" cy="6.5" r="2.5"/><path d="M12 9v10h7.5v9.5M12 12.5l5.5 3.5"/><path d="M6.5 23h9m-4.5 0v6"/></>
  ),
  'posture-lean': (
    <><path d="M6 3v26"/><circle cx="11.5" cy="7" r="2.5"/><path d="M12 9.5l4 9.5 5.5 10M16 19l-1.5 10M12.5 12.5l5.5 2.5"/></>
  ),
  'posture-lie': (
    <><circle cx="6" cy="19" r="2.5"/><path d="M8.5 21.5h11l4-5.5 4 5.5M19.5 21.5h9M3 26h26"/></>
  ),
  'posture-walk': (
    <><circle cx="16" cy="5.5" r="2.5"/><path d="M16 8v10l-5 10.5M16 18l4 5 1 5.5M11 16l5-4.5 4 3 2 3.5"/></>
  ),
  'posture-squat': (
    <><circle cx="16" cy="8" r="2.5"/><path d="M16 10.5v8.5l-6 1.5 1.5 8M16 19l6 1.5-1.5 8M16 13l-5 4.5m5-4.5 5 4.5"/></>
  ),
  'unknown': (
    <><circle cx="16" cy="16" r="12" strokeDasharray="2 4.28"/><path d="M12.5 13a3.5 3.5 0 1 1 5 3.2c-1 .6-1.5 1.3-1.5 2.3M16 22.5v.01"/></>
  ),
} satisfies Record<string, React.ReactNode>;

export type PictogramName = keyof typeof SHAPES;

export function Pictogram({ name, className }: { name: PictogramName; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={32}
      height={32}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      {SHAPES[name]}
    </svg>
  );
}
