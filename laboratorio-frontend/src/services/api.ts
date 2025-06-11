// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para requests
    this.api.interceptors.request.use(
      (config) => {
        // Agregar token de autenticación si existe
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log de request en desarrollo
        if (import.meta.env.DEV) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para responses
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log de response en desarrollo
        if (import.meta.env.DEV) {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error: AxiosError) => {
        // Manejo centralizado de errores
        console.error('❌ API Error:', error);

        // Si es error 401, redirect a login
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          window.location.href = '/login';
          return Promise.reject(new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
        }

        // Si es error 403, mostrar mensaje de permisos
        if (error.response?.status === 403) {
          return Promise.reject(new Error('No tienes permisos para realizar esta acción.'));
        }

        // Si es error de red
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          return Promise.reject(new Error('Error de conexión. Verifica tu conexión a internet.'));
        }

        // Error del servidor
        if (error.response?.status >= 500) {
          return Promise.reject(new Error('Error del servidor. Intenta nuevamente más tarde.'));
        }

        // Otros errores
        const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  // Métodos HTTP genéricos
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }

  // Métodos específicos para el laboratorio
  async login(credentials: { email: string; password: string }) {
    try {
      const response = await this.post('/api/auth/login', credentials);
      
      // Guardar token y datos de usuario
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      if (response.medico || response.usuario) {
        localStorage.setItem('usuario', JSON.stringify(response.medico || response.usuario));
      }

      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  async logout() {
    try {
      // Opcional: notificar al servidor del logout
      await this.post('/api/auth/logout');
    } catch (error) {
      console.warn('Error al hacer logout en servidor:', error);
    } finally {
      // Limpiar datos locales
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  }

  // Métodos de salud del API
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/api/health');
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('Error en test de conexión:', error);
      return false;
    }
  }

  // Método para obtener configuración actual
  getConfig() {
    return {
      baseURL: this.api.defaults.baseURL,
      timeout: this.api.defaults.timeout,
    };
  }
}

// Instancia global del servicio
export const apiService = new ApiService();

// Export por defecto
export default apiService;