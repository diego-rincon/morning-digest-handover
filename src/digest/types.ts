export type JobStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  // null when the log has no owner for the job; views show it as —.
  owner: string | null;
  runs: number;
  retries: number;
  fails: number;
  lastStatus: JobStatus;
  // The most recent error the job logged, even if it later recovered.
  lastError: string | null;
  // Times as written in the log, offset kept.
  firstAt: string;
  lastAt: string;
};

// Log lines per status, whatever job they belong to.
export type StatusCounts = Record<JobStatus, number>;

export type Night = {
  night: string;
  // One row per job, sorted by job.
  rows: DigestRow[];
  counts: StatusCounts;
  // Lines that did not parse; counted, never thrown.
  badLines: number;
};

// null when there is no log for that night.
export type ReadNight = (runsDir: string, night: string) => Night | null;
