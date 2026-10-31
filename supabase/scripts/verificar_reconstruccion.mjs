// SIGRE · Verifica que las migraciones reconstruyen el esquema en una base PostgreSQL vacía y desechable (PGlite,
// en memoria) y lo compara objeto por objeto con la extracción de STAGING (supabase/diagnostics/esquema_base_extraer.sql).
// No se conecta a ningún proyecto Supabase.
// Uso (fuera del repo o sin guardar la dependencia):
//   npm i --no-save @electric-sql/pglite@0.2.17
//   node supabase/scripts/verificar_reconstruccion.mjs . <csv_exportado_de_STAGING>
// Limitaciones: PGlite es PostgreSQL 16 (STAGING usa 17): el privilegio MAINTAIN se omite solo en esta prueba, y
// auth.users/auth.uid() son un stub mínimo de lo que provee Supabase.
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

const [repo, csvPath] = process.argv.slice(2);
const migDir = path.join(repo, 'supabase', 'migrations');
const db = new PGlite();

// Stub mínimo de lo que provee Supabase (no se versiona: lo crea la plataforma).
await db.exec(`
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz, deleted_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz, raw_user_meta_data jsonb, last_sign_in_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(coalesce(current_setting('request.jwt.claim.sub', true),
                         (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')), '')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role' $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
-- Supabase concede por defecto todo en public a los roles de la API; la línea base lo ajusta tabla por tabla.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
`);

// PG16 (PGlite) no tiene el privilegio MAINTAIN de PG17: solo se omite en esta prueba local.
const sinMaintain = (t) => t.replace(/, MAINTAIN/g, '').replace(/MAINTAIN, /g, '');
const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
for (const f of files) {
  try { await db.exec(sinMaintain(fs.readFileSync(path.join(migDir, f), 'utf8'))); console.log('OK   ', f); }
  catch (e) { console.log('FALLA', f, '→', e.message, e.where ?? ''); process.exit(1); }
}

// Extracción local con la misma consulta usada en STAGING.
const q = fs.readFileSync(path.join(repo, 'supabase', 'diagnostics', 'esquema_base_extraer.sql'), 'utf8');
const local = (await db.query(q)).rows;
const parseCsv = (t) => { const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i+1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || (c === '\r' && t[i+1] === '\n')) { if (c === '\r') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c; }
  if (f || row.length) { row.push(f); rows.push(row); } return rows; };
const [hdr, ...data] = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const stg = data.filter(r => r.length === 4).map(r => Object.fromEntries(hdr.map((h, i) => [h, r[i]])));

const key = (r) => r.objeto + (Number(r.fase) >= 200 ? '#' + r.orden : '');
const mS = new Map(stg.filter(r => r.fase !== '95').map(r => [key(r), sinMaintain(r.ddl)]));
const mL = new Map(local.filter(r => r.fase !== 95).map(r => [key(r), r.ddl]));
let iguales = 0; const difs = [], soloS = [], soloL = [];
const sinCR = (t) => t.split(String.fromCharCode(13)).join('');
let soloFinLinea = 0;
for (const [k, v] of mS) { if (!mL.has(k)) soloS.push(k); else if (mL.get(k) === v) iguales++; else if (sinCR(mL.get(k)) === sinCR(v)) soloFinLinea++; else difs.push(k); }
for (const k of mL.keys()) if (!mS.has(k)) soloL.push(k);
console.log(`\nObjetos STAGING ${mS.size} · local ${mL.size} · idénticos ${iguales} · solo fin de línea ${soloFinLinea} · distintos ${difs.length} · solo STAGING ${soloS.length} · solo local ${soloL.length}`);
const show = (t, a) => a.length && console.log(t, '\n  ' + a.slice(0, 40).join('\n  '));
show('DISTINTOS:', difs); show('SOLO EN STAGING:', soloS); show('SOLO EN LOCAL:', soloL);
console.log((await db.query('select version()')).rows[0].version.slice(0, 18));

// Validación de cuerpos: recrear cada función con check_function_bodies activo.
await db.exec('SET check_function_bodies = on;');
let okF = 0; const malas = [];
for (const r of local.filter(r => r.fase === 50)) {
  try { await db.exec(r.ddl); okF++; } catch (e) { malas.push(r.objeto + ' → ' + e.message); }
}
console.log(`Funciones validadas ${okF}/${okF + malas.length}`); malas.forEach(m => console.log('  ', m));
