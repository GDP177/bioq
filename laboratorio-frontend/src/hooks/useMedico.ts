// src/hooks/useMedico.ts

import { useQuery } from '@tanstack/react-query';
import { medicoService } from '../services/medicoService';
import type { DashboardMedicoData, Orden } from '../types';

export function useMedicoDashboard(idMedico: number) {
  return useQuery<DashboardMedicoData, Error>({
    queryKey: ['medico-dashboard', idMedico],
    queryFn: () => medicoService.getDashboard(idMedico),
    enabled: !!idMedico && idMedico > 0,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export function useMedicoOrdenes(idMedico: number) {
  return useQuery<Orden[], Error>({
    queryKey: ['medico-ordenes', idMedico],
    queryFn: () => medicoService.getOrdenes(idMedico),
    enabled: !!idMedico && idMedico > 0,
    retry: 3,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
  });
}