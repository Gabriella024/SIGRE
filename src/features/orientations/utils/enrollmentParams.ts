import type { InscribirEmprendedorInput } from "../types/orientations";

// La RPC distingue la vía por p_emprendedor_id: sin él inscribe al propio emprendedor (origen 'web');
// con él es una inscripción manual, autorizada solo a Administrador u Orientador de la jornada.
export function inscripcionRpcParams(input: InscribirEmprendedorInput) {
  return input.modo === "manual"
    ? { p_orientacion_id: input.orientacionId, p_emprendedor_id: input.emprendedorId }
    : { p_orientacion_id: input.orientacionId };
}
