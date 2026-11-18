import { describe, expect, it } from 'vitest';
import { poseDraftSchema } from '@/lib/schemas/pose-draft-schema';
import { EMPTY_VALUES, type FieldKey, type FormValues, toDraftInput } from './form-values';
import { initialLockedFields, mergeAiDraft } from './merge-ai-draft';

const none = new Set<FieldKey>();

describe('mergeAiDraft', () => {
  it('fills every empty field the AI returned', () => {
    const { values, filled } = mergeAiDraft(
      EMPTY_VALUES,
      {
        title: 'Ngồi sofa nhìn cửa sổ',
        posture: 'sit',
        zoom: '2x',
        cameraHeight: 'chest',
        scenes: ['sofa', 'window'],
        modelSteps: ['Ngồi lệch người', 'Nhìn ra cửa sổ'],
        distanceM: 2,
        grid: { x: 0.33, y: 0.5, horizon: null },
      },
      none,
    );
    expect(values.title).toBe('Ngồi sofa nhìn cửa sổ');
    expect(values.posture).toBe('sit');
    expect(values.scenes).toEqual(['sofa', 'window']);
    expect(values.modelSteps).toHaveLength(2);
    expect(values.grid).toEqual({ x: 0.33, y: 0.5, horizon: null });
    expect(filled.sort()).toEqual(
      ['cameraHeight', 'distanceM', 'grid', 'modelSteps', 'posture', 'scenes', 'title', 'zoom'].sort(),
    );
  });

  it('never overwrites a field the user touched', () => {
    const typed: FormValues = { ...EMPTY_VALUES, title: 'Tên của tôi', tags: ['mine'] };
    const locked = new Set<FieldKey>(['title', 'tags', 'zoom']);
    const { values, filled } = mergeAiDraft(
      { ...typed, zoom: '1x' },
      { title: 'AI title', tags: ['ai'], zoom: '5x', posture: 'stand' },
      locked,
    );
    expect(values.title).toBe('Tên của tôi');
    expect(values.tags).toEqual(['mine']);
    expect(values.zoom).toBe('1x');
    expect(values.posture).toBe('stand');
    expect(filled).toEqual(['posture']);
  });

  it('treats a field the user cleared as still touched', () => {
    const { values, filled } = mergeAiDraft(EMPTY_VALUES, { description: 'AI mô tả' }, new Set<FieldKey>(['description']));
    expect(values.description).toBe('');
    expect(filled).toEqual([]);
  });

  it('locks fields that came with a saved pose (edit mode)', () => {
    const saved: FormValues = { ...EMPTY_VALUES, title: 'Có sẵn', scenes: ['cafe'], zoom: '2x' };
    const locked = initialLockedFields(saved);
    expect([...locked].sort()).toEqual(['scenes', 'title', 'zoom']);
    const { values } = mergeAiDraft(saved, { title: 'x', scenes: ['beach'], zoom: '5x', tips: 'Nhớ cười' }, locked);
    expect(values.title).toBe('Có sẵn');
    expect(values.scenes).toEqual(['cafe']);
    expect(values.zoom).toBe('2x');
    expect(values.tips).toBe('Nhớ cười');
  });

  it('ignores fields AI may not set (status, place, source)', () => {
    const { values, filled } = mergeAiDraft(
      EMPTY_VALUES,
      { status: 'draft', placeId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301', sourceUrl: 'https://x.test', sourceCredit: 'x' },
      none,
    );
    expect(values).toEqual(EMPTY_VALUES);
    expect(filled).toEqual([]);
  });

  it('drops scenes outside the fixed vocabulary, blank strings and empty lists', () => {
    const { values, filled } = mergeAiDraft(
      EMPTY_VALUES,
      { scenes: ['spaceship', 'cafe', 'cafe'], tags: [], description: '   ', tips: ' mẹo ' },
      none,
    );
    expect(values.scenes).toEqual(['cafe']);
    expect(values.tags).toEqual([]);
    expect(values.description).toBe('');
    expect(values.tips).toBe('mẹo');
    expect(filled.sort()).toEqual(['scenes', 'tips']);
  });

  it('does not mutate the input values', () => {
    const before = structuredClone(EMPTY_VALUES);
    mergeAiDraft(EMPTY_VALUES, { title: 'x' }, none);
    expect(EMPTY_VALUES).toEqual(before);
  });
});

describe('toDraftInput + poseDraftSchema', () => {
  it('drops empty optional strings so the schema accepts the form', () => {
    const parsed = poseDraftSchema.safeParse(toDraftInput({ ...EMPTY_VALUES, title: 'Dáng 1' }));
    expect(parsed.success).toBe(true);
  });

  it('reports a missing title', () => {
    const parsed = poseDraftSchema.safeParse(toDraftInput(EMPTY_VALUES));
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].path[0]).toBe('title');
  });
});
