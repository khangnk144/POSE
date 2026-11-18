import { z } from 'zod';
import { isHttpUrl } from './maps-link';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

export const placeInputSchema = z.object({
  name: z.string().trim().min(1, 'Bạn nhập tên địa điểm nha.').max(120, 'Tên dài quá, tối đa 120 ký tự.'),
  address: optionalText(300),
  mapsUrl: z
    .string()
    .trim()
    .max(2048)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional()
    .refine((v) => v == null || isHttpUrl(v), 'Link Google Maps cần bắt đầu bằng http hoặc https.'),
  note: optionalText(500),
});

export type PlaceInput = z.input<typeof placeInputSchema>;
