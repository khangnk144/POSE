import type { ProcessedImage } from '@/lib/images/process-image';

export const MAX_IMAGES = 5;

/** An image already stored for the pose (edit mode). */
export type ExistingImage = {
  kind: 'existing';
  id: string;
  fullPath: string;
  thumbPath: string;
  width: number | null;
  height: number | null;
  dominantColor: string | null;
  /** Signed URL of the thumb. */
  previewUrl: string;
};

/** An image picked in this session; uploaded only when the form is saved. */
export type NewImage = {
  kind: 'new';
  id: string;
  processed: ProcessedImage;
  previewUrl: string;
};

export type FormImage = ExistingImage | NewImage;
