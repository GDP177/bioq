import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface OrdenFiltrada {
  id: number;
  nro_orden: string;
  estado: string;
  fecha_ingreso: string;
  urgente: boolean;
  paciente: {
    nombre: string;
    apellido: string;
    dni: number;
    mutual?: string;
  };
  estadisticas?: {
    total_analisis: number;
    analisis_finalizados: number;
    analisis_pendientes: number;
  };
}

export default function OrdenesFiltradas() {
  const { tipo, matricula } = useParams();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState<OrdenFiltrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        let url = `http://localhost:5000/api/bioquimico/ordenes`;
        const params = new URLSearchParams();

        if (matricula) params.append('matricula', matricula);
        if (tipo === 'pendientes') params.append('estado', 'pendiente');
        else if (tipo === 'completadas') params.append('estado', 'finalizado');
        else if (tipo === 'hoy') params.append('fecha', 'hoy');
        else if (tipo === 'todas') params.append('estado', 'todas');

        url += `?${params.toString()}`;

        const res = await axios.get(url);
        setOrdenes(Array.isArray(res.data.ordenes) ? res.data.ordenes : []);
        console.log("✅ Datos recibidos:", res.data);
      } catch (err) {
        console.error("💥 Error al cargar órdenes filtradas:", err);
        setError('No se pudieron cargar las órdenes');
      } finally {
        setLoading(false);
      }
    };

    fetchOrdenes();
  }, [tipo, matricula]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        📋 Órdenes Filtradas - {tipo?.toUpperCase()}
      </h1>

      {loading && <p>⏳ Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {ordenes.length === 0 ? (
          <p className="text-gray-500">No hay órdenes disponibles para este filtro.</p>
        ) : (
          ordenes.map((orden) => (
            <div
              key={orden.id}
              onClick={() => navigate(`/orden/${orden.id}`)}
              className="p-4 bg-white border rounded-lg hover:bg-green-50 cursor-pointer shadow-sm transition-all"
            >
              <div className="flex justify-between items-center mb-1">
                <div>
                  <p className="font-semibold text-gray-900">{orden.nro_orden}</p>
                  <p className="text-sm text-gray-600">
                    {orden.paciente?.nombre} {orden.paciente?.apellido}
                  </p>
                  <p className="text-xs text-gray-500">DNI: {orden.paciente?.dni}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      orden.estado === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : orden.estado.includes('proceso')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    } ring-1 ring-inset`}
                  >
                    {orden.urgente ? '🚨 ' : ''}
                    {orden.estado.toUpperCase()}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(orden.fecha_ingreso).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Total análisis: {orden.estadisticas?.total_analisis ?? '—'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
