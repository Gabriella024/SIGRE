-- A5-11: invitaciones que requieren atención administrativa (solo lectura).
-- Incluye las marcadas como requiere_revision y las pendientes bloqueadas
-- (ejecución interrumpida o fallo al actualizar el seguimiento).

SELECT
    i.id,
    i.correo_electronico,
    i.numero_documento,
    i.estado,
    i.codigo_error,
    i.id_usuario_auth,
    au.id AS id_auth_por_correo,
    u.id AS id_perfil_sigre,
    i.created_at,
    i.updated_at
FROM public.sigre_invitaciones i
LEFT JOIN auth.users au
    ON lower(au.email) = i.correo_electronico
LEFT JOIN public.usuarios u
    ON u.id = coalesce(i.id_usuario_auth, au.id)
WHERE i.estado = 'requiere_revision'
   OR (i.estado = 'pendiente' AND i.updated_at < now() - interval '10 minutes')
ORDER BY i.created_at;
