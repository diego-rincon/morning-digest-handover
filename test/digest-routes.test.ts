import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));

const log = [
  { at: '2026-10-28T23:00:00+01:00', job: 'b/job', status: 'ok', owner: 'rook' },
  { at: '2026-10-28T23:10:00+01:00', job: 'a/job', status: 'fail', owner: null, error: 'boom' },
]
  .map((l) => JSON.stringify(l))
  .join('\n');

beforeAll(() => {
  mkdirSync(runsDir, { recursive: true });
  writeFileSync(join(runsDir, '2026-10-01.jsonl'), `${log}\n`);
  writeFileSync(join(runsDir, '2026-10-02.jsonl'), '');
  writeFileSync(join(runsDir, '2026-10-03.jsonl'), `${log}\nthis is not json\n`);
});

afterAll(() => rmSync(runsDir, { recursive: true, force: true }));

const app = () =>
  createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });

describe('GET /digest/:night', () => {
  it('renders the rows sorted by job, with fail marked and a missing owner as a dash', async () => {
    const res = await app().request('/digest/2026-10-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('a/job')).toBeGreaterThan(-1);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('<span class="warn">fail</span>');
    expect(html).toContain('<td>—</td>');
  });

  it('answers 404 for a night with no file', async () => {
    expect((await app().request('/digest/2001-01-01')).status).toBe(404);
  });

  it('says nothing ran for an empty night', async () => {
    const res = await app().request('/digest/2026-10-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('still renders a night with a bad line and says so', async () => {
    const res = await app().request('/digest/2026-10-03');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('a/job');
    expect(html).toContain('1 line could not be read');
  });
});

describe('GET /api/digest/:night', () => {
  it('returns the same jobs in the same order as the page', async () => {
    const json = (await (await app().request('/api/digest/2026-10-01')).json()) as { rows: { job: string }[] };
    const html = await (await app().request('/digest/2026-10-01')).text();
    const jobs = json.rows.map((r) => r.job);
    expect(jobs).toEqual(['a/job', 'b/job']);
    const at = jobs.map((j) => html.indexOf(`<td>${j}</td>`));
    expect(at).toEqual([...at].sort((x, y) => x - y));
    expect(at.every((i) => i > -1)).toBe(true);
  });

  it('answers 404 for a night with no file', async () => {
    expect((await app().request('/api/digest/2001-01-01')).status).toBe(404);
  });

  it('returns no rows for an empty night and counts the bad line', async () => {
    const empty = (await (await app().request('/api/digest/2026-10-02')).json()) as { rows: unknown[] };
    const bad = (await (await app().request('/api/digest/2026-10-03')).json()) as { rows: unknown[]; badLines: number };
    expect(empty.rows).toEqual([]);
    expect(bad.rows).toHaveLength(2);
    expect(bad.badLines).toBe(1);
  });
});
