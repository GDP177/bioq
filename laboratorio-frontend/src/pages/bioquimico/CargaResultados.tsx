import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { MainLayout } from "../../components/layout/MainLayout"; // Asegúrate que la ruta sea correcta

export default function CargaResultados() {
  const { id_orden } = useParams();
  const navigate = useNavigate();
  
  // Estados para manejar el flujo de datos y UI
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<number | null>(null);

  useEffect(() => {
    if (id_orden) {
      cargarDetalle();
    }
  }, [id_orden]);

  const cargarDetalle = async () => {
    try {
      setError(null);
      // 1. Obtenemos el detalle de la orden
      const response = await axios.get(`http://localhost:5000/api/bioquimico/orden/${id_orden}`);
      
      if (response.data.success) {
        setData(response.data.orden);

        // 2. Si la orden está 'pendiente', intentamos pasarla a 'en_proceso' automáticamente
        if (response.data.orden.estado === 'pendiente') {
            try {
                // Usamos POST si PATCH da problemas de CORS, o PATCH si ya lo arreglaste
                await axios.patch(`http://localhost:5000/api/bioquimico/orden/${id_orden}/procesar`, {
                    matricula_bioquimico: "SISTEMA" // Opcional, según tu backend
                });
            } catch (err) {
                console.warn("No se pudo actualizar el estado a 'en proceso', pero se continúa.");
            }
        }
      }
    } catch (err: any) {
      console.error("Error al cargar:", err);
      setError("No se pudo cargar la orden. Verifique que el servidor esté activo.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    // Actualización optimista del estado local
    const nuevosAnalisis = [...data.analisis];
    nuevosAnalisis[index][field] = value;
    setData({ ...data, analisis: nuevosAnalisis });
  };

  const validarAnalisis = async (analisisId: number, index: number) => {
    const item = data.analisis[index];
    
    // Validación simple
    if (!item.resultado || String(item.resultado).trim() === "") {
        alert("Por favor ingrese un valor de resultado.");
        return;
    }

    try {
      setGuardando(analisisId);
      
      // Enviamos los datos al endpoint que definiste en 'cargarResultado'
      const response = await axios.post(`http://localhost:5000/api/bioquimico/analisis/${analisisId}/resultado`, {
        resultado: item.resultado,
        observaciones: item.observaciones, // Tu backend mapea esto a la columna observaciones
        valores_referencia: item.referencia // Tu backend guarda esto en la columna valores_referencia
      });

      if (response.data.success) {
        // Marcamos como finalizado visualmente
        const nuevosAnalisis = [...data.analisis];
        nuevosAnalisis[index].estado = 'finalizado';
        setData({ ...data, analisis: nuevosAnalisis });

        // Verificamos si toda la orden se completó
        if (nuevosAnalisis.every((a: any) => a.estado === 'finalizado')) {
          setTimeout(() => {
            alert("¡Orden completada exitosamente!");
            navigate("/BioquimicoDashboard"); // Ajusta a la ruta de tu dashboard
          }, 500);
        }
      }
    } catch (err) {
      alert("Error al validar el resultado. Intente nuevamente.");
    } finally {
      setGuardando(null);
    }
  };

  // --- RENDERIZADO CONDICIONAL (Evita pantallas blancas) ---

  if (loading) return (
    <MainLayout>
        <div className="flex justify-center items-center h-screen text-indigo-600 font-bold">
            Cargando protocolo...
        </div>
    </MainLayout>
  );

  if (error) return (
    <MainLayout>
        <div className="p-10 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-700">{error}</h2>
            <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 underline">Volver</button>
        </div>
    </MainLayout>
  );

  if (!data) return null; // Protección extra

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* CABECERA DE LA ORDEN */}
          <div className={`rounded-t-2xl p-6 text-white shadow-lg ${data.urgente ? 'bg-red-600' : 'bg-indigo-900'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black uppercase tracking-tight">
                    {data.urgente ? '🚨 Orden Urgente' : 'Orden de Rutina'}
                    </h1>
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-mono">
                        #{data.nro_orden}
                    </span>
                </div>
                <p className="opacity-90 mt-1 font-medium">
                  {data.paciente.apellido}, {data.paciente.nombre} (DNI: {data.paciente.dni})
                </p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm opacity-75">Edad: {data.paciente.edad} años</p>
                <p className="text-sm opacity-75">Mutual: {data.paciente.mutual || 'Particular'}</p>
              </div>
            </div>
          </div>

          {/* TABLA DE CARGA DE RESULTADOS */}
          <div className="bg-white rounded-b-2xl shadow-xl border-x border-b border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-black tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="p-6 w-1/3">Determinación</th>
                    <th className="p-6 w-1/6">Referencia</th>
                    <th className="p-6 w-1/4">Resultado</th>
                    <th className="p-6 w-1/6">Interpretación</th>
                    <th className="p-6 w-1/12 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.analisis.map((analisis: any, index: number) => (
                    <tr key={analisis.id} className={`transition-colors ${analisis.estado === 'finalizado' ? 'bg-green-50/30' : 'hover:bg-slate-50'}`}>
                      
                      {/* COLUMNA: NOMBRE DE PRÁCTICA */}
                      <td className="p-6">
                        <div className="flex flex-col">
                            {/* Aquí usamos .descripcion que viene de tu controlador */}
                            <span className="font-bold text-slate-800 text-lg leading-tight uppercase">
                                {analisis.descripcion}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded w-fit mt-1 border border-slate-200">
                                CÓD: #{analisis.codigo}
                            </span>
                        </div>
                      </td>

                      {/* COLUMNA: REFERENCIA (EDITABLE) */}
                      <td className="p-6">
                        <input
                          disabled={analisis.estado === 'finalizado'}
                          className="w-full bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none text-sm text-slate-600 font-medium py-1 transition-colors"
                          placeholder="S/Ref"
                          value={analisis.referencia || ""}
                          onChange={(e) => handleInputChange(index, 'referencia', e.target.value)}
                        />
                      </td>

                      {/* COLUMNA: RESULTADO + UNIDAD */}
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                            <input
                            disabled={analisis.estado === 'finalizado'}
                            type="text"
                            placeholder="Ingrese valor..."
                            className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-indigo-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                            value={analisis.resultado || ""}
                            onChange={(e) => handleInputChange(index, 'resultado', e.target.value)}
                            />
                            <span className="text-xs font-bold text-slate-400 uppercase">
                                {analisis.unidad}
                            </span>
                        </div>
                      </td>

                      {/* COLUMNA: OBSERVACIONES / INTERPRETACIÓN */}
                      <td className="p-6">
                        <select
                          disabled={analisis.estado === 'finalizado'}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-indigo-500"
                          value={analisis.observaciones || "Normal"}
                          onChange={(e) => handleInputChange(index, 'observaciones', e.target.value)}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Alto">Alto</option>
                          <option value="Bajo">Bajo</option>
                          <option value="Patológico">Patológico</option>
                          <option value="Revisar">Revisar</option>
                        </select>
                      </td>

                      {/* COLUMNA: BOTÓN DE ACCIÓN */}
                      <td className="p-6 text-center">
                        {analisis.estado === 'finalizado' ? (
                          <div className="flex flex-col items-center">
                            <span className="text-green-500 text-2xl">✓</span>
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Listo</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => validarAnalisis(analisis.id, index)}
                            disabled={guardando === analisis.id}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {guardando === analisis.id ? '...' : 'VALIDAR'}
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PIE DE PÁGINA DE LA TABLA */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-medium">
                <span>* Los valores de referencia pueden ser editados para este protocolo específico.</span>
                <button onClick={() => navigate(-1)} className="hover:text-indigo-600 underline">
                    Cancelar y volver
                </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}