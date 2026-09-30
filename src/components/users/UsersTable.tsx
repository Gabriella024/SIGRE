
import { 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import type { 
  UserMock, 
  UserRol, 
  UserStatus
} from '../../features/users/types/users';

import {
  ROLE_STYLES, 
  STATUS_STYLES 
} from '../../features/users/types/users';

interface UsersDataTableProps {
  data: UserMock[];
  onEdit?: (user: UserMock) => void;
  onDelete?: (userId: string) => void;
}

// Helper para extraer las iniciales a partir del nombre completo (ej: "Pedro Antonio Salas" -> "PS")
const getInitials = (name: string): string => {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export const UsersDataTable: React.FC<UsersDataTableProps> = ({ data, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(2);
  const totalPages = 6;

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Encabezado */}
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">Icono</th>
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">Correo</th>
              <th className="py-3 px-4">Roles</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Último Acceso</th>
              <th className="py-3 px-4">Fecha de Creación</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>

          {/* Cuerpo */}
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {data.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                {/* 1. Icono (Iniciales calculadas automáticamente) */}
                <td className="py-3 px-4">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-200">
                    {getInitials(user.nombre)}
                  </div>
                </td>

                {/* 2. Nombre */}
                <td className="py-3 px-4 font-medium text-gray-900">{user.nombre}</td>

                {/* 3. Correo */}
                <td className="py-3 px-4 text-gray-500">{user.correo}</td>

                {/* 4. Roles */}
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1.5">
                    {user.rol.map((r) => {
                      const style = ROLE_STYLES[r];
                      return (
                        <span
                          key={r}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {r}
                        </span>
                      );
                    })}
                  </div>
                </td>

                {/* 5. Estado */}
                <td className="py-3 px-4">
                  {(() => {
                    const style = STATUS_STYLES[user.estado];
                    return (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
                      >
                        {style.label}
                      </span>
                    );
                  })()}
                </td>

                {/* 6. Último Acceso */}
                <td className="py-3 px-4 text-gray-500">{user.ultimoAcceso}</td>

                {/* 7. Fecha de Creación */}
                <td className="py-3 px-4 text-gray-500">{user.CreadoEn}</td>

                {/* Acciones */}
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit?.(user)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(user.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación con Números y Flechas */}
      <div className="flex items-center justify-center gap-1 py-4 border-t border-gray-100 bg-white">
        {/* Botón Flecha Izquierda */}
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Números de página */}
        {[1, 2, 3].map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
              currentPage === page
                ? 'border border-purple-300 text-purple-700 bg-purple-50/50 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {page < 10 ? `0${page}` : page}
          </button>
        ))}

        <span className="px-1 text-gray-400 text-xs">...</span>

        {[4, 5, 6].map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
              currentPage === page
                ? 'border border-purple-300 text-purple-700 bg-purple-50/50 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {page < 10 ? `0${page}` : page}
          </button>
        ))}

        {/* Botón Flecha Derecha */}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
