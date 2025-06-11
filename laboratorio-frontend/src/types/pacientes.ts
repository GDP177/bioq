// src/types/pacientes.ts

export interface Paciente {
  nro_ficha: number;
  dni: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: 'M' | 'F' | 'X';
  telefono?: string;
  direccion?: string;
  email?: string;
  mutual?: string;
  nro_afiliado?: string;
  grupo_sanguineo?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  observaciones?: string;
  fecha_registro: string;
  activo: boolean;
}

export interface NuevoPacienteData {
  dni: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  mutual?: string;
  mutual_personalizada?: string;
  nro_afiliado?: string;
  grupo_sanguineo?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  observaciones?: string;
}

export interface ErroresValidacion {
  dni?: string;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  telefono?: string;
  email?: string;
  mutual_personalizada?: string;
}

export interface BusquedaPaciente {
  termino: string;
  tipo: 'dni' | 'nombre' | 'apellido' | 'todos';
  activos_solo: boolean;
}

export interface PacienteResponse {
  success: boolean;
  paciente?: Paciente;
  pacientes?: Paciente[];
  total?: number;
  message?: string;
  nro_ficha?: number;
}

// Tipos para análisis y órdenes
export interface Orden {
  id: number;
  nro_orden: string;
  paciente_nro_ficha: number;
  paciente_nombre: string;
  paciente_apellido: string;
  fecha_ingreso: string;
  fecha_procesamiento?: string;
  fecha_finalizacion?: string;
  fecha_toma_muestra?: string;
  estado: 'pendiente' | 'procesando' | 'finalizada' | 'cancelada';
  urgente: boolean;
  observaciones?: string;
  instrucciones_paciente?: string;
  requiere_ayuno: boolean;
  costo_total?: number;
  medico_solicitante: {
    nombre: string;
    apellido: string;
    especialidad: string;
    matricula: string;
  };
  bioquimico_responsable?: {
    nombre: string;
    apellido: string;
  };
}

export interface Analisis {
  id: number;
  codigo: number;
  descripcion: string;
  tipo: string;
  estado: 'pendiente' | 'procesando' | 'finalizado' | 'cancelado';
  fecha_realizacion?: string;
  valor_hallado?: string;
  unidad_hallada?: string;
  valor_referencia?: string;
  interpretacion?: string;
  observaciones?: string;
  tecnico_responsable?: string;
  orden_id: number;
}

export interface NuevaOrdenData {
  nro_ficha_paciente: number;
  analisis_solicitados: number[];
  urgente: boolean;
  requiere_ayuno: boolean;
  observaciones?: string;
  instrucciones_paciente?: string;
}

// Tipos para obra social
export interface ObraSocial {
  id: number;
  nombre: string;
  codigo?: string;
  activa: boolean;
}

export interface SugerenciaObraSocial {
  nombre: string;
  coincidencias: number;
}

// Tipos para estados y filtros
export type EstadoAnalisis = 'todos' | 'pendiente' | 'procesando' | 'finalizado' | 'cancelado';
export type EstadoOrden = 'todas' | 'pendiente' | 'procesando' | 'finalizada' | 'cancelada';

export interface FiltrosAnalisis {
  estado: EstadoAnalisis;
  tipo: string;
  buscar: string;
  fecha_desde: string;
  fecha_hasta: string;
}

export interface FiltrosOrdenes {
  estado: EstadoOrden;
  urgente?: boolean;
  buscar: string;
  fecha_desde: string;
  fecha_hasta: string;
}

// Tipos para estadísticas
export interface EstadisticasLaboratorio {
  total_pacientes: number;
  total_ordenes: number;
  ordenes_pendientes: number;
  ordenes_en_proceso: number;
  ordenes_finalizadas: number;
  total_analisis: number;
  analisis_pendientes: number;
  analisis_finalizados: number;
  porcentaje_completado: number;
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    current_page: number;
    total_pages: number;
    per_page: number;
    total_items: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Tipos para componentes UI
export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  type: 'info' | 'warning' | 'error' | 'success';
}

// Constantes
export const GRUPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const SEXOS = ["M", "F", "X"] as const;
export const OBRAS_SOCIALES_COMUNES = [
  "OSDE",
  "Swiss Medical", 
  "Galeno",
  "Medicus",
  "IOMA",
  "PAMI",
  "OSECAC",
  "OSPLAD",
  "Accord Salud",
  "Sancor Salud",
  "Particular",
  "Otra"
] as const;