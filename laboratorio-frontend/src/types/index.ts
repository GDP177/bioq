// Tipos principales para el sistema de laboratorio

export interface Paciente {
  nro_ficha: number
  nombre_paciente: string
  apellido_paciente: string
  fecha_alta?: string
  fecha_nacimiento: string
  edad?: number
  sexo: 'M' | 'F'
  estado?: string
  mutual: string
  nro_afiliado?: number
  grupo_sanguineo: string
  dni: number
  cp?: number
  direccion?: string
  telefono?: number
}

export interface Medico {
  idMedico: number
  nombre_medico?: string
  apellido_medico?: string
  dni_medico?: number
}

export interface Bioquimico {
  matricula_profesional: number
  nombre_bq?: string
  apellido_bq?: string
}

export interface Analisis {
  codigo_de_modulo?: number
  descripcion_de_modulo?: string
  codigo_de_practica: number
  descripcion_de_practica?: string
  inicio_de_vigencia?: string
  honorarios?: number
  gastos?: number
  tipo?: string
}

export interface Orden {
  id_orden: number
  urgente?: boolean
  id_medico_solicitante?: number
  id_bq_efectua?: number
  fecha_ingreso_orden?: string
  nro_ficha_paciente?: number
  // Relaciones
  paciente?: Paciente
  medico?: Medico
  bioquimico?: Bioquimico
  analisis?: Analisis[]
}

export interface OrdenAnalisis {
  codigo_de_practica: number
  id_orden: number
  fecha_realizacion_analisis?: string
  // Relaciones
  analisis?: Analisis
}

export interface ValorReferencia {
  id_valor_ref: number
  valor_inicial_de_rango?: number
  valor_final_de_rango?: number
  unidad?: string
  tipo_persona?: string
}

export interface ResultadoAnalisis {
  codigo_de_practica: number
  id_valor_ref: number
  valor_hallado: number
  unidad_valor_hallado?: string
  // Relaciones
  analisis?: Analisis
  valor_referencia?: ValorReferencia
}

// Tipos para formularios
export interface PacienteFormData {
  nombre_paciente: string
  apellido_paciente: string
  fecha_nacimiento: string
  sexo: 'M' | 'F'
  mutual: string
  nro_afiliado?: number
  grupo_sanguineo: string
  dni: number
  cp?: number
  direccion?: string
  telefono?: number
}

export interface OrdenFormData {
  urgente: boolean
  id_medico_solicitante: number
  nro_ficha_paciente: number
  analisis_seleccionados: number[]
}

// Tipos para API responses
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Tipos para filtros y búsquedas
export interface FiltrosPacientes {
  nombre?: string
  apellido?: string
  dni?: string
  mutual?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export interface FiltrosOrdenes {
  fecha_desde?: string
  fecha_hasta?: string
  urgente?: boolean
  estado?: string
  paciente?: string
  medico?: string
}

// Tipos para el estado de la aplicación
export interface AppState {
  user: {
    id: number
    nombre: string
    rol: 'admin' | 'bioquimico' | 'tecnico'
  } | null
  isLoading: boolean
  error: string | null
}

// Constantes
export const GRUPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
export const SEXOS = ['M', 'F'] as const
export const ESTADOS_ORDEN = ['pendiente', 'en_proceso', 'completado', 'cancelado'] as const

export type GrupoSanguineo = typeof GRUPOS_SANGUINEOS[number]
export type Sexo = typeof SEXOS[number]
export type EstadoOrden = typeof ESTADOS_ORDEN[number]