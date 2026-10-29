import type { DigestRow, Night } from '../digest/types.js';

const dash = '—';

// Retries of 3 or more and any fail get marked; same rule for every reader of the digest.
function flag(row: DigestRow): string | null {
  if (row.fails > 0 || row.lastStatus === 'fail') return 'fail';
  if (row.retries >= 3) return `${row.retries} retries`;
  return null;
}

export function Digest({ night }: { night: Night }) {
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
              <th>mark</th>
            </tr>
          </thead>
          <tbody>
            {night.rows.map((row) => {
              const mark = flag(row);
              return (
                <tr>
                  <td>{row.job}</td>
                  <td>{row.owner ?? dash}</td>
                  <td>{row.runs}</td>
                  <td>{row.retries}</td>
                  <td>{row.lastStatus}</td>
                  <td>{row.lastError ?? dash}</td>
                  <td>{row.firstAt}</td>
                  <td>{row.lastAt}</td>
                  <td>{mark ? <span class="warn">{mark}</span> : dash}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {night.badLines > 0 ? (
        <p class="mute">{night.badLines} line{night.badLines === 1 ? '' : 's'} could not be read</p>
      ) : null}
      <p><a href="/">back to status</a></p>
    </>
  );
}
