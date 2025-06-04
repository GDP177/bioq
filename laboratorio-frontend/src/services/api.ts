// src/services/api.ts
import axios from 'axios';
import { ApiResponse, Paciente, Medico, Analisis, Examen, RealizarExamen, Resultado } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/laboratorio/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Servicios para Pacientes
export const pacienteService = {
  buscar: async (valor: string): Promise<Paciente[]> => {
    const response = await api.get(`/pacientes/buscar?q=${encodeURIComponent(valor)}`);
    return response.data;
  },

  obtener: async (id: number): Promise<Paciente> => {
    const response = await api.get(`/pacientes/${id}`);
    return response.data;
  },

  crear: async (paciente: Omit<Paciente, 'paciente_id'>): Promise<ApiResponse<number>> => {
    const response = await api.post('/pacientes', paciente);
    return response.data;
  },

  actualizar: async (id: number, paciente: Partial<Paciente>): Promise<ApiResponse<boolean>> => {
    const response = await api.put(`/pacientes/${id}`, paciente);
    return response.data;
  },
};

// Servicios para Médicos
export const medicoService = {
  listarSelect: async (): Promise<Array<{value: number, label: string}>> => {
    const response = await api.get('/medicos/select');
    return response.data;
  },

  listar: async (): Promise<Medico[]> => {
    const response = await api.get('/medicos');
    return response.data;
  },
};

// Servicios para Análisis
export const analisisService = {
  listarSelect: async (): Promise<Array<{value: number, label: string}>> => {
    const response = await api.get('/analisis/select');
    return response.data;
  },

  listar: async (): Promise<Analisis[]> => {
    const response = await api.get('/analisis');
    return response.data;
  },
};

// Servicios para Exámenes
export const examenService = {
  listarPorAnalisis: async (analisisId: number): Promise<Array<{value: number, label: string}>> => {
    const response = await api.get(`/examenes/por-analisis/${analisisId}`);
    return response.data;
  },

  listar: async (): Promise<Examen[]> => {
    const response = await api.get('/examenes');
    return response.data;
  },
};

// Servicios para Realizar Examen
export const realizarExamenService = {
  registrar: async (data: {
    paciente_id: number;
    medico_id: number;
    examenes: Array<{examen_id: number, analisis_id: number}>;
  }): Promise<ApiResponse<number>> => {
    const response = await api.post('/realizar-examen', data);
    return response.data;
  },

  listar: async (): Promise<RealizarExamen[]> => {
    const response = await api.get('/realizar-examen');
    return response.data;
  },

  obtenerDetalle: async (id: number) => {
    const response = await api.get(`/realizar-examen/${id}/detalle`);
    return response.data;
  },
};

// Servicios para Resultados
export const resultadoService = {
  listarPendientes: async () => {
    const response = await api.get('/resultados/pendientes');
    return response.data;
  },

  registrar: async (data: {
    realizar_examen_id: number;
    detalles: Array<{
      detalle_id: number;
      archivo: File;
    }>;
  }): Promise<ApiResponse<number>> => {
    const formData = new FormData();
    formData.append('realizar_examen_id', data.realizar_examen_id.toString());
    
    data.detalles.forEach((detalle, index) => {
      formData.append(`detalles[${index}][detalle_id]`, detalle.detalle_id.toString());
      formData.append(`detalles[${index}][archivo]`, detalle.archivo);
    });

    const response = await api.post('/resultados', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listar: async (): Promise<Resultado[]> => {
    const response = await api.get('/resultados');
    return response.data;
  },

  generarReporte: (id: number): string => {
    return `${API_BASE_URL}/resultados/${id}/reporte`;
  },
};

export default api;