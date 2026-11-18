'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ImportClientError,
  imagesFromPasteEvent,
  importImageFromUrl,
  readClipboardImage,
} from '@/lib/images/import-clipboard-and-url';
import { ImageProcessError, processImage } from '@/lib/images/process-image';
import { useToast } from '@/components/ui/toast';
import { type FormImage, MAX_IMAGES } from './form-image';

/**
 * Brings images into the form from the file picker, the clipboard or a link. Every image
 * goes through the same client pipeline (decode, resize, WebP) before it is shown.
 */
export function useImageIntake(images: FormImage[], setImages: React.Dispatch<React.SetStateAction<FormImage[]>>) {
  const showToast = useToast();
  const [processing, setProcessing] = useState(0);
  const [busyLink, setBusyLink] = useState(false);
  const countRef = useRef(images.length);
  const pendingRef = useRef(0);
  useEffect(() => {
    countRef.current = images.length;
  }, [images.length]);

  const addFiles = useCallback(
    async (files: File[]) => {
      const room = MAX_IMAGES - countRef.current - pendingRef.current;
      if (files.length === 0) return;
      if (room <= 0) {
        showToast(`Tối đa ${MAX_IMAGES} ảnh cho mỗi dáng nha`, { kind: 'error' });
        return;
      }
      const accepted = files.slice(0, room);
      if (accepted.length < files.length) showToast(`Chỉ lấy ${accepted.length} ảnh đầu, tối đa ${MAX_IMAGES} ảnh nha`);
      pendingRef.current += accepted.length;
      setProcessing((n) => n + accepted.length);
      for (const file of accepted) {
        try {
          const processed = await processImage(file);
          setImages((list) => [...list, { kind: 'new', id: processed.id, processed, previewUrl: processed.previewUrl }]);
        } catch (err) {
          showToast(err instanceof ImageProcessError ? err.message : 'Không đọc được ảnh này', { kind: 'error' });
        } finally {
          pendingRef.current -= 1;
          setProcessing((n) => n - 1);
        }
      }
    },
    [setImages, showToast],
  );

  const pasteFromClipboard = useCallback(async () => {
    try {
      const file = await readClipboardImage();
      if (!file) showToast('Clipboard chưa có ảnh. Hãy "Sao chép ảnh" rồi bấm lại nhé', { kind: 'error' });
      else await addFiles([file]);
    } catch (err) {
      showToast(err instanceof ImportClientError ? err.message : 'Không dán được ảnh', { kind: 'error' });
    }
  }, [addFiles, showToast]);

  const addFromUrl = useCallback(
    async (url: string): Promise<boolean> => {
      setBusyLink(true);
      try {
        await addFiles([await importImageFromUrl(url)]);
        return true;
      } catch (err) {
        showToast(err instanceof ImportClientError ? err.message : 'Không lấy được ảnh từ link', { kind: 'error' });
        return false;
      } finally {
        setBusyLink(false);
      }
    },
    [addFiles, showToast],
  );

  // Ctrl/Cmd+V (or long-press Paste) with an image on the clipboard, anywhere on the page.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = imagesFromPasteEvent(event);
      if (files.length === 0) return;
      event.preventDefault();
      void addFiles(files);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [addFiles]);

  return { processing, busyLink, addFiles, pasteFromClipboard, addFromUrl, full: images.length + processing >= MAX_IMAGES };
}
