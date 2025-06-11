// src/components/ui/OrdenItem.tsx
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ChevronRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import type { Orden } from '../../types';

interface OrdenItemProps {
  orden: Orden;
  onClick?: () => void;
  showDetails?: boolean;
}

export function OrdenItem({ orden, onClick, showDetails = false }: OrdenItemProps) {
  // Calcular estado de la orden
  const getEstadoOrden = () => {
    const completados = orden.analisis_completados ?? 0;
    const total = orden.total_analisis ?? 0;
    
    if (total > 0 && completados === total) {
      return 'completada';
    } else if (completados > 0) {
      return 'en_proceso';
    } else {
      return 'pendiente';
    }
  };

  const estado = getEstadoOrden();

  // Configuración de estilos por estado
  const estadoConfig = {
    pendiente: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <ClockIcon className="h-5 w-5" />,
      label: 'Pendiente'
    },
    en_proceso: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      label: 'En Proceso'
    },
    completada: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <CheckCircleIcon className="h-5 w-5" />,
      label: 'Completada'
    }
  };

  const config = estadoConfig[estado];

  // Formatear fecha
  const fechaFormateada = format(new Date(orden.fecha_ingreso_orden), 'dd/MM/yyyy HH:mm', {
    locale: es
  });

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200
        ${config.bgColor} ${config.borderColor}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        {/* Información Principal */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg font-semibold text-gray-900">
              Orden #{orden.id_orden}
            </span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor} border ${config.borderColor}`}>
              {config.icon}
              {config.label}
            </div>
            {orden.urgente && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50 border border-red-200">
                <ExclamationTriangleIcon className="h-4 w-4" />
                URGENTE
              </div>
            )}
          </div>

          {/* Información del Paciente */}
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">
              {orden.Nombre_paciente} {orden.Apellido_paciente}
            </span>
          </div>

          {/* Detalles adicionales */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Fecha:</span> {fechaFormateada}
            </p>
            <p>
              <span className="font-medium">Ficha:</span> #{orden.nro_ficha_paciente}
            </p>
            {showDetails && orden.medico_nombre && (
              <p>
                <span className="font-medium">Médico:</span> {orden.medico_nombre}
              </p>
            )}
          </div>

          {/* Progreso de análisis */}
          {orden.total_analisis && orden.total_analisis > 0 && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Progreso de análisis
                </span>
                <span className="text-sm text-gray-600">
                  {orden.analisis_completados ?? 0}/{orden.total_analisis}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    estado === 'completada' ? 'bg-green-500' :
                    estado === 'en_proceso' ? 'bg-blue-500' : 'bg-orange-500'
                  }`}
                  style={{
                    width: `${(((orden.analisis_completados ?? 0) / orden.total_analisis) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Análisis solicitados */}
          {showDetails && orden.analisis_solicitados && (
            <div className="mt-3">
              <span className="text-sm font-medium text-gray-700">Análisis:</span>
              <p className="text-sm text-gray-600 mt-1">
                {orden.analisis_solicitados}
              </p>
            </div>
          )}
        </div>

        {/* Flecha para navegación */}
        {onClick && (
          <div className="flex-shrink-0 ml-4">
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Indicador visual para órdenes urgentes */}
      {orden.urgente && (
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-lg"></div>
      )}
    </div>
  );
}