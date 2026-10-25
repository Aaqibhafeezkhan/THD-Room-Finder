// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Ajv from 'ajv/dist/2020.js';
import { catalogueSql } from '../scripts/dev/programme-catalogue.mjs';

const read = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const taxonomy = read('./programmes.json');
const schema = read('./programmes.schema.json');
const programmes = taxonomy.programmes;

describe('THD programme taxonomy (#40)', () => {
  it('matches its schema', () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
    expect(validate(taxonomy), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it('fits the focus service catalogue', () => {
    // focus.programme: id ^[a-z0-9-]{3,80}$, code 1–16 characters.
    for (const p of programmes) {
      expect(p.id).toMatch(/^[a-z0-9-]{3,80}$/);
      expect(p.code.length).toBeLessThanOrEqual(16);
      expect(p.intakeTerms.length).toBeGreaterThan(0);
    }
    expect(new Set(programmes.map((p) => p.id)).size).toBe(programmes.length);
  });

  it('takes every verified code from the programme page address', () => {
    for (const p of programmes.filter((x) => x.codeStatus === 'verified')) {
      const slug = p.id.replace(/(-cham)?-(b|m)$/, '');
      expect(p.code, p.id).toBe(slug.toUpperCase());
      expect(p.sources, p.id).toContain(`page-${p.id}`);
    }
  });

  it('cites only sources it lists', () => {
    const listed = new Set(taxonomy.sourceIndex.map((s) => s.id));
    const cited = [...programmes.flatMap((p) => p.sources), ...taxonomy.edgeCases.flatMap((e) => e.sources ?? [])];
    expect(cited.filter((s) => !listed.has(s))).toEqual([]);
  });

  it('is what the newest catalogue migration loads', () => {
    const dir = new URL('../supabase/migrations/', import.meta.url);
    const newest = readdirSync(dir)
      .filter((f) => readFileSync(new URL(f, dir), 'utf8').includes('-- programme catalogue:'))
      .sort()
      .at(-1);
    // After changing programmes.json, add a migration with the output of
    // node scripts/dev/programme-catalogue.mjs.
    expect(readFileSync(new URL(newest, dir), 'utf8').replace(/\r\n/g, '\n')).toContain(catalogueSql(taxonomy));
  });
});
