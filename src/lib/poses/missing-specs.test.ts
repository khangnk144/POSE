import { describe, expect, it } from 'vitest';
import type { PoseStatus } from '@/lib/types/pose';
import { isMissingSpecs, specGaps } from './missing-specs';
import { buildPoseConditions, NEEDS_DETAILS_CONDITION } from './pose-query-builder';

const published = (cameraHeight: string | null, stepCount: number) => ({
  status: 'published' as PoseStatus,
  cameraHeight,
  stepCount,
});

describe('isMissingSpecs', () => {
  it('is true when the camera height is missing', () => {
    expect(isMissingSpecs(published(null, 3))).toBe(true);
  });
  it('is true when there are no steps', () => {
    expect(isMissingSpecs(published('waist', 0))).toBe(true);
  });
  it('is true when both are missing', () => {
    expect(isMissingSpecs(published(null, 0))).toBe(true);
  });
  it('is false when camera height and at least one step exist', () => {
    expect(isMissingSpecs(published('waist', 1))).toBe(false);
  });
  it('never flags drafts', () => {
    expect(isMissingSpecs({ status: 'draft', cameraHeight: null, stepCount: 0 })).toBe(false);
  });
  it('ignores everything else (zoom, tags, place...): only the two rules count', () => {
    expect(isMissingSpecs({ status: 'published', cameraHeight: 'eye', stepCount: 2 })).toBe(false);
  });
});

describe('specGaps', () => {
  it('reports which part is missing', () => {
    expect(specGaps({ cameraHeight: null, stepCount: 2 })).toEqual({ camera: true, steps: false });
    expect(specGaps({ cameraHeight: 'eye', stepCount: 0 })).toEqual({ camera: false, steps: true });
    expect(specGaps({ cameraHeight: 'eye', stepCount: 1 })).toEqual({ camera: false, steps: false });
  });
});

/** Evaluates the two clause shapes of the "Cần bổ sung" PostgREST `or` expression against a row. */
function matchesOrExpression(expression: string, row: { camera_height: string | null; model_steps: string[] }) {
  return expression.split(',').some((clause) => {
    if (clause === 'camera_height.is.null') return row.camera_height === null;
    if (clause === 'model_steps.eq.{}') return row.model_steps.length === 0;
    throw new Error(`unexpected clause ${clause}`);
  });
}

describe('"Cần bổ sung" filter query', () => {
  it('forces published status and adds the or-condition', () => {
    const conditions = buildPoseConditions({ needsDetails: true, status: 'draft' });
    expect(conditions).toEqual([{ op: 'eq', column: 'status', value: 'published' }, NEEDS_DETAILS_CONDITION]);
  });
  it('is absent when the filter is off', () => {
    expect(buildPoseConditions({})).not.toContainEqual(NEEDS_DETAILS_CONDITION);
  });
  it('keeps the keyset cursor as a separate or-condition', () => {
    const cursor = { createdAt: '2026-11-18T07:30:00+00:00', id: '0a1b2c3d-1111-4222-8333-444455556666' };
    const conditions = buildPoseConditions({ needsDetails: true }, cursor);
    expect(conditions.filter((c) => c.op === 'or')).toHaveLength(2);
  });
  it('selects exactly the rows isMissingSpecs flags (published)', () => {
    expect(NEEDS_DETAILS_CONDITION.op).toBe('or');
    const expression = NEEDS_DETAILS_CONDITION.op === 'or' ? NEEDS_DETAILS_CONDITION.expression : '';
    for (const camera_height of [null, 'eye', 'waist']) {
      for (const model_steps of [[], ['Nghiêng vai'], ['a', 'b']]) {
        expect(matchesOrExpression(expression, { camera_height, model_steps })).toBe(
          isMissingSpecs(published(camera_height, model_steps.length)),
        );
      }
    }
  });
});
