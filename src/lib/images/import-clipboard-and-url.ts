/** Client helpers that bring an outside image in as a File for the processing pipeline. */

export class ImportClientError extends Error {}

const URL_ERRORS: Record<string, string> = {
  invalid_url: 'Link này không hợp lệ, kiểm tra lại giúp mình nhé',
  blocked: 'Link này không được phép (chỉ nhận link https công khai)',
  not_image: 'Link này không có ảnh để lấy. Thử lưu ảnh về máy rồi chọn từ máy nhé',
  too_large: 'Ảnh ở link này lớn hơn 10 MB',
  timeout: 'Link phản hồi quá lâu, thử lại sau nhé',
  fetch_failed: 'Không tải được ảnh từ link này. Thử lưu ảnh về máy rồi chọn từ máy nhé',
  unauthorized: 'Bạn cần đăng nhập lại',
};

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

/** Downloads an image through `POST /api/import-url` (SSRF-guarded on the server). */
export async function importImageFromUrl(url: string, signal?: AbortSignal): Promise<File> {
  let res: Response;
  try {
    res = await fetch('/api/import-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
      signal,
    });
  } catch {
    throw new ImportClientError('Không kết nối được, kiểm tra mạng rồi thử lại nhé');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ImportClientError(URL_ERRORS[body?.error ?? ''] ?? URL_ERRORS.fetch_failed);
  }
  const blob = await res.blob();
  return new File([blob], `link-image.${EXT[blob.type] ?? 'img'}`, { type: blob.type });
}

/** Reads an image from the clipboard via the async Clipboard API. Returns null when it holds no image. */
export async function readClipboardImage(): Promise<File | null> {
  if (!navigator.clipboard?.read) {
    throw new ImportClientError('Trình duyệt này chưa cho đọc clipboard. Thử nhấn giữ rồi chọn Dán ở ô bên dưới nhé');
  }
  let items: ClipboardItems;
  try {
    items = await navigator.clipboard.read();
  } catch {
    throw new ImportClientError('Chưa được cấp quyền dán. Bấm cho phép khi trình duyệt hỏi, hoặc dùng "Chọn từ máy" nhé');
  }
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith('image/'));
    if (type) {
      const blob = await item.getType(type);
      return new File([blob], `pasted.${EXT[type] ?? 'png'}`, { type });
    }
  }
  return null;
}

/** Image files from a `paste` event (fallback when the Clipboard API is unavailable). */
export function imagesFromPasteEvent(event: ClipboardEvent): File[] {
  return Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
}
