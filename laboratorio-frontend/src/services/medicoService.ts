// src/services/medicoService.ts

import { apiService } from './api';
import type { DashboardMedicoData, Orden } from '../types';

export class MedicoService {
  async getDashboard(idMedico: number): Promise<DashboardMedicoData> {
    return apiService.get<DashboardMedicoData>(`/api/medico/dashboard/${idMedico}`);
  }

  async getOrdenes(idMedico: number): Promise<Orden[]> {
    return apiService.get<Orden[]>(`/api/medico/ordenes/${idMedico}`);
  }

  async login(email: string, password: string) {
    return apiService.post('/api/auth/login', { email, password });
  }
}

export const medicoService = new MedicoService();