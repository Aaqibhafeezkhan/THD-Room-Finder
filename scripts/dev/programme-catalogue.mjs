// Turns shared/programmes.json (#40) into the SQL that loads focus.programme:
// an upsert of every programme plus deactivating the ones the taxonomy no
// longer lists. Ids are programme page slugs and never change, so a profile
// keeps its batch across refreshes.
//
//   node scripts/dev/programme-catalogue.mjs > block.sql
//
// Paste the block into a new migration after updating the taxonomy;
// shared/programmes.test.js fails until the newest catalogue migration
// matches the file.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Programmes students can pick: offered, or still running for cohorts. */
const LISTED = new Set(['active', 'intake_unverified']);

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (xs) => q(`{${xs.join(',')}}`);

export function catalogueSql(taxonomy) {
  const rows = [...taxonomy.programmes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (p) =>
        `  (${[q(p.id), q(p.code), q(p.nameEn), q(p.nameDe), arr(p.intakeTerms), q(p.level), arr(p.campus), LISTED.has(p.status)].join(', ')})`,
    );
  return [
    `-- programme catalogue: shared/programmes.json as of ${taxonomy.asOf}`,
    'insert into focus.programme (id, code, name_en, name_de, intake_terms, level, campus, active) values',
    rows.join(',\n'),
    'on conflict (id) do update set',
    '  code = excluded.code, name_en = excluded.name_en, name_de = excluded.name_de,',
    '  intake_terms = excluded.intake_terms, level = excluded.level, campus = excluded.campus,',
    '  active = excluded.active;',
    '',
    '-- Programmes the taxonomy no longer lists stay for existing profiles,',
    '-- but are not offered in setup.',
    'update focus.programme set active = false',
    ` where id not in (${taxonomy.programmes.map((p) => q(p.id)).join(', ')});`,
    '-- end programme catalogue',
  ].join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const taxonomy = JSON.parse(readFileSync(new URL('../../shared/programmes.json', import.meta.url), 'utf8'));
  process.stdout.write(`${catalogueSql(taxonomy)}\n`);
}
