// Instantánea de solo lectura de rol_pantalla_permisos en STAGING (2026-10-31), tomada antes de cualquier guardado.
// Cada celda: letra de nivel (n=SA, s=SL, l=LE, a=AT; mayúscula = habilitado) + estado (a=activo, i=inactivo).
import type { RolePermissionEntry, ScreenActionEntry } from "../../src/features/access-control/types/types.ts";

export const ROLE_IDS = { coordinador: 1, evaluador: 2, administrador: 3, emprendedor: 4, orientador: 5 } as const;

export const SCREEN_ACTION_IDS: Record<string, string> = {
  "configuracion/crear": "d6bc9bd8-cfcf-4bf7-9e9d-fb3fcd8081f3",
  "configuracion/editar": "a121d4f7-da8e-49a2-8ee1-7dc05d6ad978",
  "configuracion/eliminar": "46881646-9810-412c-abbc-83f2c2f80686",
  "configuracion/exportar": "5202af44-cf6c-43ef-b663-49eea9b45390",
  "configuracion/ver": "036d2bab-efba-4242-b381-e69db5978e13",
  "control_accesos/crear": "46df2af7-c291-48ca-8a39-045d8e36ee82",
  "control_accesos/editar": "dbf45a6b-5f97-4115-89a4-103ffee88fc2",
  "control_accesos/eliminar": "ecd82dd9-7e95-4245-9ee0-57df7959cf84",
  "control_accesos/exportar": "a41a4396-423e-40e5-9e8d-2edbe4667bf1",
  "control_accesos/ver": "98b55c30-0483-4e0c-9339-4a075da3810c",
  "emprendedores/crear": "4bcef309-d9a4-4547-89b3-b70db743d5dd",
  "emprendedores/editar": "84b78e17-9229-47ab-963f-c240e024c062",
  "emprendedores/eliminar": "7f2d9edd-fa45-451b-8789-79b42b8582d9",
  "emprendedores/exportar": "73f3abef-88fc-4878-acb6-8c69c30a8e22",
  "emprendedores/ver": "fc542a56-c09d-4ac9-b25e-1b80c64b8085",
  "evaluaciones/crear": "9ee4a0ed-62a7-4937-b78b-3fb553f74ed7",
  "evaluaciones/editar": "ad1c6825-50b6-4677-8528-3074818a9295",
  "evaluaciones/eliminar": "41457d2d-6b96-47fe-a060-12d786889073",
  "evaluaciones/exportar": "e373d33d-dd45-4f96-913b-c791d5df24d8",
  "evaluaciones/ver": "414e7e0e-550b-4909-886c-8307c6eae3ea",
  "evaluadores/crear": "14a84b4d-f1c8-4dda-8140-73c7a38669e0",
  "evaluadores/editar": "ce366379-ebfb-44ca-85c2-c94b42321a4e",
  "evaluadores/eliminar": "cef8b8b7-d5e0-4b12-9c60-8f7a5f504ed8",
  "evaluadores/exportar": "d8ede5f9-0c87-4e1c-a51a-ecaee6d55e29",
  "evaluadores/ver": "ed75e784-fc1c-4775-ab19-f714d31db3b5",
  "informes/crear": "84c46649-e21b-421e-9bfd-1f36cdbfbf3c",
  "informes/editar": "31ab0e30-29d9-49a2-8428-0fdd20c6d295",
  "informes/eliminar": "7d3ad8db-15b3-48ad-92dd-8552500dde4b",
  "informes/exportar": "bad0ddf6-ef83-4f19-b9bb-5e3e8aff7b5a",
  "informes/ver": "04f86d29-39a8-4d85-b93c-ab044a7b1bb4",
  "orientacion_masiva/crear": "4b8cb1da-265e-4561-8168-a0287a3f1c09",
  "orientacion_masiva/editar": "27fe40d9-325b-4dd7-82f2-d9cd98067b46",
  "orientacion_masiva/eliminar": "5efaef00-8a6a-4904-85bf-ef275c39e20d",
  "orientacion_masiva/exportar": "5d94913b-27e1-4ebb-a7ec-46899a905fdf",
  "orientacion_masiva/ver": "83b3f564-6dc1-4ac0-8dfb-fed41f076722",
  "orientaciones/crear": "127a31ac-7f21-464f-97a6-5590d948ae45",
  "orientaciones/editar": "8de02b37-f2fd-4724-8820-e7bb3e695168",
  "orientaciones/eliminar": "16471c94-6b9d-41f3-b205-228ea3160069",
  "orientaciones/exportar": "94cfe908-2675-468a-b904-2d5c07fb3b61",
  "orientaciones/ver": "ed2c0f78-0739-420e-a5b9-f106a7803168",
  "panel/crear": "aeaf2b51-1018-44ef-8efb-387fc4bf95b1",
  "panel/editar": "436480fc-f35d-423b-9399-72b892207821",
  "panel/eliminar": "4745d213-aaba-4618-8e87-48f5dcd99243",
  "panel/exportar": "4527666c-0e3a-451e-aa38-3daa1519e534",
  "panel/ver": "a52ea416-4309-4837-a70b-f605c6e69a83",
  "pitch/crear": "32f47e2f-962e-4a46-a248-8ee9d9b38561",
  "pitch/editar": "75edf39b-a947-45ce-a4ba-83b93dd5359a",
  "pitch/eliminar": "b733a1ca-6dca-4d73-9fa4-0db47f5ad826",
  "pitch/exportar": "fafad2cb-e93f-49d1-9af3-6acd7e955bc4",
  "pitch/ver": "f35917fa-cace-468b-9872-73e4e4ff860b",
  "proyectos/crear": "f6c57413-edb7-4271-9936-fef6479715af",
  "proyectos/editar": "caee4f93-5488-43f4-aaf9-e95761f6c224",
  "proyectos/eliminar": "7a4b99d7-c94d-4406-bbc7-2ace113914b8",
  "proyectos/exportar": "5e4e5627-b712-489c-9074-38b9e4d30ba8",
  "proyectos/ver": "911c250a-1b13-4b45-a328-688fd659ffd4",
  "retos/crear": "b4f85f51-6b02-4bd4-aa0e-7443af951cfe",
  "retos/editar": "8a05f5ce-b2cb-4379-b79b-a9150cf2ca23",
  "retos/eliminar": "cfd19f62-ce2d-443a-8392-69a73f311a65",
  "retos/exportar": "0009a8c0-af32-45d1-98e2-71b81ee9cac1",
  "retos/ver": "bf5de0da-599e-4687-9ce0-c1afdbb7a1c1",
  "usuarios/crear": "8a162e2a-b496-439d-83fb-49764e111146",
  "usuarios/editar": "0d9eb98f-6cd7-4953-8e74-016fd9fbea0d",
  "usuarios/eliminar": "835f42c2-02bf-44e2-9328-1fd95294eb98",
  "usuarios/exportar": "3074efc3-72a9-47c7-aefc-19ed4b635456",
  "usuarios/ver": "59fc3e50-b96f-4763-8dbe-beed9c0d4248"
};

const KEYS = Object.keys(SCREEN_ACTION_IDS).sort();

const SNAPSHOT: Record<number, string> = {
  1: "nananananasasasasaSasasasasaSasasasasaSaLaLalaLaLalalalaLaLasasasasaSasasasasaSasasasasaSasasasasaSasasasasaSasasasasaSananananana",
  2: "nanananananananananasasasasasiLaLaliliLanananananasasasasasinananananasasasasasasasasasasilililalilisasasasasisasasasasinanananana",
  3: "AaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
  4: "nanananananananananalaLalalaLasasasasaSanananananananananananananananasasasasaSasasasasaSasasasasaSaLaLalalaLasasasasaSananananana",
  5: "nanananananananananalaLalaLaLasasasasaSanananananalalalaLaLaLaLalalaLalaLalaLaLasasasasaSasasasasaSaLaLalaLaLaLaLalaLaLananananana",
};

const LEVELS: Record<string, string> = { n: "SA", s: "SL", l: "LE", a: "AT" };

export function id(key: string): string {
  const value = SCREEN_ACTION_IDS[key];
  if (!value) throw new Error(`Pantalla/acción desconocida: ${key}`);
  return value;
}

export function snapshotPermissions(): RolePermissionEntry[] {
  return Object.entries(SNAPSHOT).flatMap(([roleId, cells]) =>
    KEYS.map((key, index) => {
      const level = cells[index * 2];
      return {
        id: `${roleId}:${key}`,
        roleId: Number(roleId),
        screenActionId: id(key),
        enabled: level === level.toUpperCase(),
        level: LEVELS[level.toLowerCase()],
        status: cells[index * 2 + 1] === "a" ? "activo" : "inactivo",
      };
    })
  );
}

export function screenActionEntries(): ScreenActionEntry[] {
  return KEYS.map((key, index) => {
    const [screen, action] = key.split("/");
    return {
      id: id(key),
      moduleCode: screen,
      moduleName: screen,
      screenId: screen,
      screenCode: `${screen}_principal`,
      screenName: screen,
      screenOrder: index,
      actionCode: action,
      actionName: action,
    };
  });
}
