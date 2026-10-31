"""Genera la línea base de SIGRE a partir del CSV de supabase/diagnostics/esquema_base_extraer.sql.

Uso: python -I supabase/scripts/esquema_base_generar.py <csv_exportado>

Produce:
  supabase/migrations/20261001000000_esquema_base.sql      estructura previa a las migraciones del repositorio
  supabase/migrations/20261001000100_catalogos_base.sql    roles, módulos, acciones, pantallas y matriz de permisos

La línea base excluye todo objeto que crea una migración posterior (tablas, columnas, funciones, políticas,
triggers, índices y restricciones), para no duplicarlo. Excepciones documentadas en EXCEPCIONES.
"""

import csv
import io
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
MIGRACIONES = RAIZ / "supabase" / "migrations"
BASE = "20261001000000_esquema_base.sql"
CATALOGOS = "20261001000100_catalogos_base.sql"

# Funciones que una migración reemplaza pero que un objeto de la línea base necesita al crearse.
EXCEPCIONES = {
    "sigre_puede_ver_orientacion_fila": "la usa la política base sigre_orientaciones_select_autorizado; "
                                        "20261029190000 la reemplaza por la misma versión",
}
# 20261028120000 cambia ERRCODE '40001' por 'PT409' en estas funciones: la línea base guarda la versión previa.
PREVIAS_PT409 = {"sigre_admin_editar_proyecto", "sigre_admin_eliminar_proyecto"}
TABLAS_CATALOGO = ["roles", "app_modulos", "app_acciones", "app_pantallas", "pantalla_acciones", "rol_pantalla_permisos"]
SECUENCIAS_IDENTIDAD = ["roles"]


def objetos_de_migraciones():
    texto = "\n".join(p.read_text(encoding="utf-8") for p in sorted(MIGRACIONES.glob("*.sql"))
                      if p.name not in (BASE, CATALOGOS))
    funciones = set(re.findall(r"CREATE (?:OR REPLACE )?FUNCTION public\.(\w+)\s*\(", texto))
    tablas = set(re.findall(r"CREATE TABLE (?:IF NOT EXISTS )?public\.(\w+)", texto))
    politicas = set(re.findall(r"CREATE POLICY (\w+)\s+ON public\.(\w+)", texto))
    triggers = set(re.findall(r"CREATE (?:CONSTRAINT )?TRIGGER (\w+)", texto))
    indices = set(re.findall(r"CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?(\w+)", texto))
    restricciones = set(re.findall(r"ADD CONSTRAINT (\w+)", texto))
    columnas = set()
    for tabla, cuerpo in re.findall(r"ALTER TABLE (?:IF EXISTS )?public\.(\w+)\s+(ADD COLUMN[^;]+);", texto):
        for col in re.findall(r"ADD COLUMN (?:IF NOT EXISTS )?(\w+)", cuerpo):
            columnas.add((tabla, col))
    return funciones - set(EXCEPCIONES), tablas, politicas, triggers, indices, restricciones, columnas


def quitar_columnas(ddl, tabla, columnas):
    lineas = ddl.split("\n")
    cuerpo = [l for l in lineas[1:-1]
              if (tabla, re.match(r'\s*"?(\w+)"?', l).group(1)) not in columnas]
    cuerpo = [l.rstrip(",") for l in cuerpo]
    return "\n".join([lineas[0], ",\n".join(cuerpo), lineas[-1]])


def main(ruta_csv):
    csv.field_size_limit(10 ** 8)
    filas = list(csv.DictReader(io.open(ruta_csv, encoding="utf-8", newline="")))
    funciones, tablas, politicas, triggers, indices, restricciones, columnas = objetos_de_migraciones()

    def tabla_de(objeto):
        return objeto.split(":", 2)[-1].split(".")[0]

    def funcion_de(objeto):
        return objeto.split(":")[-1].split("(")[0]

    base, catalogos, excluidos = [], [], []
    for f in filas:
        fase, objeto, ddl = int(f["fase"]), f["objeto"], f["ddl"]
        tipo = objeto.split(":")[0]
        if fase == 95:
            excluidos.append((objeto, "event trigger gestionado por Supabase («Enable automatic RLS»)"))
            continue
        if fase >= 200:
            tabla = objeto.split(":")[1]
            if tabla in TABLAS_CATALOGO:
                catalogos.append((TABLAS_CATALOGO.index(tabla), f["orden"], ddl[:-1] + " ON CONFLICT DO NOTHING;"))
            continue
        motivo = None
        if tipo in ("function", "grant") and (tipo == "function" or objeto.startswith("grant:function:")):
            if funcion_de(objeto) in funciones:
                motivo = "función creada por una migración"
        elif tipo in ("table", "rls", "trigger", "policy", "constraint") or objeto.startswith(("grant:table:", "grant:column:")):
            if tabla_de(objeto) in tablas:
                motivo = "tabla creada por una migración"
        if motivo is None:
            nombre = objeto.split(".")[-1] if "." in objeto else objeto.split(":")[-1]
            if tipo == "policy" and (nombre, tabla_de(objeto)) in politicas:
                motivo = "política creada por una migración"
            elif tipo == "trigger" and nombre in triggers:
                motivo = "trigger creado por una migración"
            elif tipo == "index" and nombre in indices:
                motivo = "índice creado por una migración"
            elif tipo == "constraint" and nombre in restricciones:
                motivo = "restricción creada por una migración"
        if motivo:
            excluidos.append((objeto, motivo))
            continue
        if tipo == "table":
            ddl = quitar_columnas(ddl, tabla_de(objeto), columnas)
        if tipo == "function" and funcion_de(objeto) in PREVIAS_PT409:
            ddl = ddl.replace("'PT409'", "'40001'")
        base.append((fase, f["orden"], objeto, ddl))

    base.sort(key=lambda x: (x[0], x[1]))
    secciones = {20: "Tablas", 30: "Claves primarias, únicas y CHECK", 35: "Claves foráneas", 40: "Índices",
                 50: "Funciones", 60: "Row Level Security", 70: "Políticas", 80: "Triggers",
                 90: "Permisos de tablas", 91: "Permisos por columna", 92: "Permisos de funciones"}
    out = [f"""-- SIGRE · Línea base del esquema public (estructura previa a las migraciones del repositorio).
-- Generada con supabase/scripts/esquema_base_generar.py desde la extracción de SOLO LECTURA de STAGING
-- (supabase/diagnostics/esquema_base_extraer.sql, 2026-10-30). Sin datos de personas, contraseñas ni auditorías.
-- STAGING ya contiene este esquema: NO ejecutar allí (registrar con `supabase migration repair --status applied`).
-- Requiere un proyecto Supabase (o equivalente): roles anon, authenticated y service_role; auth.users y auth.uid().
-- No incluye objetos que crean las migraciones posteriores. Excepciones:
{chr(10).join(f'--   {k}: {v}' for k, v in EXCEPCIONES.items())}
--   sigre_admin_editar_proyecto / sigre_admin_eliminar_proyecto: versión previa (40001), la corrige 20261028120000.
-- Objetos de la extracción: {len(filas)}; incluidos aquí: {len(base)}; catálogos: {len(catalogos)}; excluidos: {len(excluidos)}.

SET check_function_bodies = false;
"""]
    fase_actual = None
    for fase, _, objeto, ddl in base:
        if fase != fase_actual:
            out.append(f"\n-- {fase} · {secciones[fase]} {'-' * (100 - len(secciones[fase]))}\n")
            fase_actual = fase
        out.append(ddl.rstrip() + "\n")
    out.append("\nRESET check_function_bodies;\n")
    io.open(MIGRACIONES / BASE, "w", encoding="utf-8", newline="").write("".join(out))

    catalogos.sort(key=lambda x: (x[0], x[1]))
    cat = ["""-- SIGRE · Catálogos base: roles, módulos, acciones, pantallas y matriz de permisos por rol.
-- Extraídos en SOLO LECTURA de STAGING (2026-10-30). Idempotente (ON CONFLICT DO NOTHING). Sin datos personales.
-- Municipios, regionales y centros SENA no se incluyen: deben cargarse desde la fuente institucional.
"""]
    tabla_actual = None
    for orden_tabla, _, ddl in catalogos:
        if orden_tabla != tabla_actual:
            cat.append(f"\n-- {TABLAS_CATALOGO[orden_tabla]}\n")
            tabla_actual = orden_tabla
        cat.append(ddl + "\n")
    for t in SECUENCIAS_IDENTIDAD:
        cat.append(f"\nSELECT setval(pg_get_serial_sequence('public.{t}', 'id'), (SELECT max(id) FROM public.{t}));\n")
    io.open(MIGRACIONES / CATALOGOS, "w", encoding="utf-8", newline="").write("".join(cat))

    print(f"base: {len(base)} · catálogos: {len(catalogos)} · excluidos: {len(excluidos)}")
    for objeto, motivo in excluidos:
        print(f"  excluido {objeto} ({motivo})")


if __name__ == "__main__":
    main(sys.argv[1])
