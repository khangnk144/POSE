import { describe, expect, it } from 'vitest';
import { MAX_IDEAS, MAX_MATCHES, parsePoseFields, parseSuggestOutput } from './parse-ai-output';

/*
 * SYNTHETIC fixtures: hand-written to match the shape of a Claude `tool_use.input` for the
 * fill_pose / suggest_poses tools. They are NOT recorded API responses. Replace them with
 * recorded real responses once an ANTHROPIC_API_KEY exists (see phase-04 report).
 */

const GOOD_POSE = {
  title: 'Ngồi bậc thang ngoái vai',
  description: 'Nắng xiên nhẹ, cảm giác thong thả.',
  peopleCount: 'solo',
  posture: 'sit',
  scenes: ['stairs', 'street'],
  tags: ['ngoái vai', 'nắng xiên'],
  cameraHeight: 'waist',
  cameraTilt: 'up',
  zoom: '2x',
  orientation: 'portrait',
  photographerPosition: 'Đứng thấp, cách khoảng 2m',
  distanceM: 2.46,
  grid: { x: 0.33, y: 0.5, horizon: null },
  modelSteps: ['Ngồi nghiêng 45 độ', 'Ngoái đầu nhìn máy'],
  tips: 'Chụp lúc nắng chiều.',
};

describe('parsePoseFields', () => {
  it('keeps every valid field and rounds distance to 0.1', () => {
    const out = parsePoseFields(GOOD_POSE);
    expect(out).toMatchObject({ ...GOOD_POSE, distanceM: 2.5 });
  });

  it('drops an unknown enum value but keeps the other fields', () => {
    const out = parsePoseFields({ ...GOOD_POSE, posture: 'handstand', zoom: '10x' });
    expect(out.posture).toBeUndefined();
    expect(out.zoom).toBeUndefined();
    expect(out.title).toBe(GOOD_POSE.title);
    expect(out.cameraHeight).toBe('waist');
  });

  it('drops invalid list items individually (unknown scene, empty or non-string tag)', () => {
    const out = parsePoseFields({ scenes: ['cafe', 'moon', 42, 'cafe'], tags: ['ok', '', 7, '  trim  '] });
    expect(out.scenes).toEqual(['cafe']);
    expect(out.tags).toEqual(['ok', 'trim']);
  });

  it('drops out-of-range numbers and malformed grid', () => {
    const out = parsePoseFields({ distanceM: 500, grid: { x: 2, y: 0.5 }, title: 'ok' });
    expect(out).toEqual({ title: 'ok' });
  });

  it('omits empty arrays and ignores unknown or forbidden keys', () => {
    const out = parsePoseFields({ title: 'a', modelSteps: [], status: 'published', placeId: 'x', hack: 1 });
    expect(out).toEqual({ title: 'a' });
  });

  it.each([null, undefined, 'not json', 42, ['x']])('returns {} for non-object input %j', (raw) => {
    expect(parsePoseFields(raw)).toEqual({});
  });
});

const REFS = new Map<number, string>([
  [1, 'aaaaaaaa-0000-4000-8000-000000000001'],
  [2, 'aaaaaaaa-0000-4000-8000-000000000002'],
  [3, 'aaaaaaaa-0000-4000-8000-000000000003'],
]);

const GOOD_SUGGEST = {
  sceneClear: true,
  scene: {
    summary: 'Quán cafe có cầu thang gỗ',
    light: 'Nắng xiên từ cửa sổ bên trái',
    setting: ['cầu thang', 'cửa sổ'],
    tips: ['Đứng thấp, hất lên một chút'],
  },
  matches: [
    { ref: 2, reason: 'Hợp vì có bậc thang', cameraTip: 'Máy ngang hông' },
    { ref: 1, reason: 'Có cửa sổ' },
  ],
  ideas: [GOOD_POSE],
};

describe('parseSuggestOutput', () => {
  it('maps catalog numbers to real pose ids and forces ideas to draft', () => {
    const r = parseSuggestOutput(GOOD_SUGGEST, REFS);
    if (!r.clear) throw new Error('expected clear');
    expect(r.matches).toEqual([
      { poseId: REFS.get(2), reason: 'Hợp vì có bậc thang', cameraTip: 'Máy ngang hông' },
      { poseId: REFS.get(1), reason: 'Có cửa sổ' },
    ]);
    expect(r.ideas[0]).toMatchObject({ title: GOOD_POSE.title, status: 'draft' });
    expect(r.scene.setting).toEqual(['cầu thang', 'cửa sổ']);
  });

  it('drops matches whose pose does not exist, plus duplicates and malformed entries', () => {
    const r = parseSuggestOutput(
      {
        ...GOOD_SUGGEST,
        matches: [
          { ref: 99, reason: 'hallucinated number' },
          { ref: 'abc', reason: 'wrong type' },
          { ref: 3 },
          { ref: 1, reason: 'ok' },
          { ref: 1, reason: 'duplicate' },
        ],
      },
      REFS,
    );
    if (!r.clear) throw new Error('expected clear');
    expect(r.matches.map((m) => m.poseId)).toEqual([REFS.get(1)]);
  });

  it('caps matches at 8 and ideas at 3', () => {
    const big = new Map<number, string>();
    for (let i = 1; i <= 20; i++) big.set(i, `id-${i}`);
    const r = parseSuggestOutput(
      {
        sceneClear: true,
        matches: Array.from({ length: 20 }, (_, i) => ({ ref: i + 1, reason: 'r' })),
        ideas: Array.from({ length: 6 }, (_, i) => ({ title: `Ý ${i}` })),
      },
      big,
    );
    if (!r.clear) throw new Error('expected clear');
    expect(r.matches).toHaveLength(MAX_MATCHES);
    expect(r.ideas).toHaveLength(MAX_IDEAS);
  });

  it('drops ideas without a valid title', () => {
    const r = parseSuggestOutput({ sceneClear: true, ideas: [{ posture: 'sit' }, { title: '' }, { title: 'Ok' }] }, REFS);
    if (!r.clear) throw new Error('expected clear');
    expect(r.ideas.map((i) => i.title)).toEqual(['Ok']);
  });

  it('reports an unclear scene with the model explanation', () => {
    expect(parseSuggestOutput({ sceneClear: false, unclearReason: 'Ảnh quá tối' }, REFS)).toEqual({
      clear: false,
      reason: 'Ảnh quá tối',
    });
  });

  it('survives garbage input with empty results', () => {
    const r = parseSuggestOutput('{"broken json', REFS);
    expect(r).toMatchObject({ clear: true, matches: [], ideas: [], scene: { summary: '' } });
  });
});
