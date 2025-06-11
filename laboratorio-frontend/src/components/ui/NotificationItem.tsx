// src/components/ui/NotificationItem.tsx
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface NotificationItemProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: string;
  isRead?: boolean;
  onMarkAsRead?: () => void;
  onDismiss?: () => void;
}

export function NotificationItem({ 
  message, 
  type = 'info', 
  timestamp, 
  isRead = false,
  onMarkAsRead,
  onDismiss 
}: NotificationItemProps) {
  
  // Configuración por tipo de notificación
  const typeConfig = {
    info: {
      icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800'
    },
    success: {
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800'
    },
    warning: {
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800'
    },
    error: {
      icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    }
  };

  const config = typeConfig[type];

  return (
    <div className={`
      relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-200
      ${isRead ? 'bg-gray-50 border-gray-200' : `${config.bgColor} ${config.borderColor}`}
      hover:shadow-sm
    `}>
      {/* Icono */}
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isRead ? 'text-gray-600' : config.textColor} ${!isRead ? 'font-medium' : ''}`}>
          {message}
        </p>
        
        {timestamp && (
          <p className="text-xs text-gray-500 mt-1">
            {timestamp}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {/* Indicador de no leído */}
        {!isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}

        {/* Botón marcar como leído */}
        {!isRead && onMarkAsRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            title="Marcar como leído"
          >
            ✓
          </button>
        )}

        {/* Botón descartar */}
        {onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            title="Descartar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Línea indicadora para notificaciones urgentes */}
      {type === 'error' && !isRead && (
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-lg"></div>
      )}
    </div>
  );
}