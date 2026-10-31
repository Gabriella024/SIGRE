# SIGRE · Verificación final de perfiles DEMO (solo lectura)

**Para qué:** confirmar la navegación y las restricciones de cada perfil antes de la presentación.

**Cómo:**
- Quien presenta inicia sesión en `http://localhost:5173/login` y escribe su contraseña. No se piden, no se guardan
  y no se leen contraseñas ni el almacenamiento del navegador.
- La identidad se confirma con el menú de usuario (esquina superior derecha).
- No se pulsa ningún botón que cambie datos.
- Al terminar cada perfil: menú de usuario → «Cerrar sesión».

| Perfil | Cuenta | Debe ver | No debe poder |
|---|---|---|---|
| Evaluador | `demo.evaluador1@example.com` | Menú con solo «Evaluación». Tarjeta «DEMO-Ruta Carlos · DEMO-Carlos Pruebas», «Cerrado», «Completado 85/100». No ve las notas de otros evaluadores. | Abrir `/pitch` y `/proyectos` («Acceso restringido»). Calificar de nuevo (el pitch está cerrado). |
| Orientador | `demo.orientador@example.com` | Orientaciones: solo «DEMO-Jornada Orientador». Métricas: 1 inscrito, 1 asistente. Emprendedores: solo los que tiene asignados (Carlos). | Ver la «DEMO-Jornada de orientación» (de otro orientador) o gestionar usuarios, configuración y control de accesos. |
| Emprendedor | `demo.emprendedor2@example.com` (Carlos) | Su ficha, su proyecto «DEMO-Ruta Carlos», su jornada con la inscripción y la asistencia, y sus retos. | Ver datos de otros emprendedores (Laura, E513) o entrar a Usuarios, Evaluadores, Evaluación y Configuración. |

**Resultado esperado:** las tres filas se cumplen y no hay errores en la consola. Ante cualquier desviación, se
anota la ruta y el texto visible, sin repetir el intento.

**Antecedentes:**
- Evaluador: comprobado el 2026-10-30 (solo «Evaluación» visible, 42501 al calificar algo ajeno, «Acceso restringido»
  en Pitch y Proyectos).
- Orientador y Emprendedor: comprobados en los lotes de Orientaciones del 2026-10-29.
