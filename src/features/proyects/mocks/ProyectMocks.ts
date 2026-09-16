import type { Proyecto } from "../types/proyect";

export const ProyectMock: Proyecto[] = [
  {
    id: '1',
    nombre: 'EcoEmbalajes Atlántico',
    emprendedor: 'María Fernanda López',
    etapa: 'Retos',
    centro: 'Nodo Sena Operaciones Comerciales',
    fechaRegistro: '2026-02-14',
    estado: 'Activo',
  },
  {
    id: '2',
    nombre: 'AgroTech Caribe',
    emprendedor: 'Carlos Andrés Pérez',
    etapa: 'Orientación',
    centro: 'Centro de Comercio y Servicios',
    fechaRegistro: '2026-03-02',
    estado: 'Activo',
  },
  {
    id: '3',
    nombre: 'ModaViva Barranquilla',
    emprendedor: 'Laura Camila Ríos',
    etapa: 'Pitch',
    centro: 'Nodo Sena Operaciones Comerciales',
    fechaRegistro: '2026-01-20',
    estado: 'Finalizado',
  },
  {
    id: '4',
    nombre: 'TurismoRuta360',
    emprendedor: 'Jorge Iván Martínez',
    etapa: 'Registro',
    centro: 'Centro Náutico Pesquero',
    fechaRegistro: '2026-04-05',
    estado: 'Inactivo',
  },
]