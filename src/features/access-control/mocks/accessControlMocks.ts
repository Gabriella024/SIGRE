import type {
  AccessRole,
  AccessUser,
  PermissionModule,
} from "../types/types";

export const MOCK_USERS: AccessUser[] = [
  {
    id: "user-1",
    name: "María González",
    email: "maria.gonzalez@sena.edu.co",
    role: "Administrador",
    status: "active",
  },
  {
    id: "user-2",
    name: "Carlos Rodríguez",
    email: "carlos.rodriguez@sena.edu.co",
    role: "Orientador",
    status: "active",
  },
  {
    id: "user-3",
    name: "Laura Martínez",
    email: "laura.martinez@sena.edu.co",
    role: "Evaluador",
    status: "active",
  },
  {
    id: "user-4",
    name: "Andrés Pérez",
    email: "andres.perez@sena.edu.co",
    role: "Emprendedor",
    status: "inactive",
  },
  {
    id: "user-5",
    name: "Sofía Torres",
    email: "sofia.torres@sena.edu.co",
    role: "Orientador",
    status: "active",
  },
];

export const MOCK_ROLES: AccessRole[] = [
  {
    id: "role-1",
    name: "Administrador",
    description: "Acceso completo a la administración del sistema.",
    usersCount: 3,
    active: true,
  },
  {
    id: "role-2",
    name: "Orientador",
    description: "Gestiona orientaciones y acompaña a los emprendedores.",
    usersCount: 8,
    active: true,
  },
  {
    id: "role-3",
    name: "Evaluador",
    description: "Consulta proyectos y realiza evaluaciones.",
    usersCount: 5,
    active: true,
  },
  {
    id: "role-4",
    name: "Emprendedor",
    description: "Gestiona sus proyectos e iniciativas.",
    usersCount: 42,
    active: true,
  },
];

export const MOCK_PERMISSIONS: PermissionModule[] = [
  {
    id: "usuarios",
    name: "Usuarios",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    id: "proyectos",
    name: "Proyectos",
    view: true,
    create: true,
    edit: true,
    delete: false,
  },
  {
    id: "orientaciones",
    name: "Orientaciones",
    view: true,
    create: true,
    edit: true,
    delete: false,
  },
  {
    id: "retos",
    name: "Retos",
    view: true,
    create: true,
    edit: true,
    delete: true,
  },
  {
    id: "pitch",
    name: "Pitch",
    view: true,
    create: true,
    edit: true,
    delete: false,
  },
  {
    id: "evaluacion",
    name: "Evaluación",
    view: true,
    create: true,
    edit: true,
    delete: false,
  },
];