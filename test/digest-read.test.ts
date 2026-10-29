import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight on runs/2026-10-28.jsonl', () => {
  const night = readNight('runs', '2026-10-28');

  it('reads one row per job, sorted by job', () => {
    expect(night?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('counts the line that does not parse and keeps going', () => {
    expect(night?.badLines).toBe(1);
  });

  it('counts retries and keeps the last error and times', () => {
    const fixtures = night?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(fixtures).toMatchObject({
      owner: 'rook',
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: 'upstream 503',
      firstAt: '2026-10-29T01:30:00+01:00',
      lastAt: '2026-10-29T01:37:00+01:00',
    });
  });

  it('keeps a row whose owner is null', () => {
    expect(night?.rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
  });

  it('marks a failed job', () => {
    expect(night?.rows.find((r) => r.job === 'notes/backup')).toMatchObject({ lastStatus: 'fail', fails: 1 });
  });
});

describe('readNight edges', () => {
  it('returns null for a night with no file', () => {
    expect(readNight('runs', '2001-01-01')).toBeNull();
  });

  it('returns null for a name that is not a date', () => {
    expect(readNight('runs', '../package')).toBeNull();
  });
});
