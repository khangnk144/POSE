
/** "vừa xong", "5 phút trước", "3 ngày trước"... for the pose byline. */
export function relativeTimeVi(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} giờ trước`;
  if (minutes < 60 * 24 * 30) return `${Math.floor(minutes / (60 * 24))} ngày trước`;
  if (minutes < 60 * 24 * 365) return `${Math.floor(minutes / (60 * 24 * 30))} tháng trước`;
  return `${Math.floor(minutes / (60 * 24 * 365))} năm trước`;
}
