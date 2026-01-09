import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MainLayout } from '../../components/layout/MainLayout';

export default function DetalleOrden() {
    const { id_orden } = useParams();
    const navigate = useNavigate();
    const [orden, setOrden] = useState<any>(null);
    const [analisis, setAnalisis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Estado para el modal de carga de resultados
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [resultadoData, setResultadoData] = useState({
        valor_hallado: '',
        unidad_hallada: '',
        interpretacion: ''
    });

    const fetchDetalle = async () => {
        try {
            // El endpoint debe devolver datos de 'ordenes' y 'orden_analisis'
            const res = await axios.get(`http://localhost:5000/api/ordenes/${id_orden}`);
            if (res.data.success) {
                setOrden(res.data.orden);
                setAnalisis(res.data.analisis);
            }
        } catch (err) {
            console.error("Error al obtener detalle:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id_orden) fetchDetalle();
    }, [id_orden]);

    const handleOpenResultModal = (item: any) => {
        setSelectedItem(item);
        setResultadoData({
            valor_hallado: item.valor_hallado || '',
            unidad_hallada: item.unidad_hallada || '',
            interpretacion: item.interpretacion || ''
        });
        setShowResultModal(true);
    };

    const handleSaveResult = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Actualiza el registro específico en 'orden_analisis'
            await axios.put(`http://localhost:5000/api/ordenes/analisis/${selectedItem.id_orden_analisis}`, {
                ...resultadoData,
                estado: 'completado'
            });
            setShowResultModal(false);
            fetchDetalle(); // Recargar datos para ver reflejado el cambio
        } catch (err) {
            alert("Error al guardar el resultado");
        }
    };

    if (loading) return (
        <MainLayout>
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900"></div>
            </div>
        </MainLayout>
    );

    if (!orden) return (
        <MainLayout>
            <div className="p-8 text-center text-gray-500">Orden no encontrada</div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="p-8 max-w-6xl mx-auto space-y-6">
                {/* Cabecera Principal - Datos de tabla 'ordenes' */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
                    <div className="bg-indigo-950 p-10 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em]">Protocolo de Laboratorio</span>
                                <h2 className="text-5xl font-black uppercase tracking-tighter mt-2">Orden #{orden.nro_orden}</h2>
                                <div className="flex gap-6 mt-4">
                                    <p className="opacity-70 text-xs font-bold uppercase tracking-widest border-r border-white/20 pr-6">Ficha Paciente: {orden.nro_ficha_paciente}</p>
                                    <p className="opacity-70 text-xs font-bold uppercase tracking-widest">Ingreso: {new Date(orden.fecha_ingreso_orden).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <span className={`px-8 py-3 rounded-2xl font-black text-xs shadow-lg ${orden.urgente ? 'bg-red-500 animate-pulse' : 'bg-blue-600'}`}>
                                    {orden.urgente ? '⚠️ PRIORIDAD: URGENTE' : '🩺 PRIORIDAD: RUTINA'}
                                </span>
                                <span className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    Estado Global: {orden.estado}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Listado Técnico - Datos de tabla 'orden_analisis' */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">Prácticas Solicitadas</h3>
                            
                            <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-sm">
                                <table className="w-full text-left bg-white">
                                    <thead className="text-[10px] uppercase text-gray-400 font-black bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-5">Determinación</th>
                                            <th className="px-6 py-5">Valor Hallado</th>
                                            <th className="px-6 py-5">Estado</th>
                                            <th className="px-6 py-5 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {analisis.map((item) => (
                                            <tr key={item.id_orden_analisis} className="hover:bg-indigo-50/30 transition-all">
                                                <td className="px-6 py-5">
                                                    <p className="font-black text-indigo-950 text-sm uppercase">{item.codigo_practica}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Código Técnico</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {item.valor_hallado ? (
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="font-black text-indigo-600 text-lg">{item.valor_hallado}</span>
                                                            <span className="text-[10px] font-bold text-gray-400">{item.unidad_hallada}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 italic text-xs">Pendiente...</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                                                        item.estado === 'completado' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                                                    }`}>
                                                        {item.estado}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button 
                                                        onClick={() => handleOpenResultModal(item)}
                                                        className="bg-indigo-50 text-indigo-600 p-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        📝
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Sidebar con detalles adicionales */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Notas Médicas</h4>
                                    <p className="text-sm text-gray-600 italic">
                                        "{orden.observaciones || 'Sin observaciones adicionales'}"
                                    </p>
                                </div>
                                <button 
                                    onClick={() => window.print()}
                                    className="w-full py-4 bg-white border-2 border-indigo-950 text-indigo-950 rounded-2xl font-black uppercase text-xs hover:bg-indigo-950 hover:text-white transition-all"
                                >
                                    🖨️ Imprimir Protocolo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE RESULTADOS */}
            {showResultModal && (
                <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <form onSubmit={handleSaveResult} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 space-y-6">
                        <h3 className="text-3xl font-black text-indigo-950 uppercase">Cargar Resultado</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none"
                                placeholder="Valor"
                                required
                                value={resultadoData.valor_hallado}
                                onChange={e => setResultadoData({...resultadoData, valor_hallado: e.target.value})}
                            />
                            <input 
                                className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none"
                                placeholder="Unidad"
                                value={resultadoData.unidad_hallada}
                                onChange={e => setResultadoData({...resultadoData, unidad_hallada: e.target.value})}
                            />
                        </div>
                        <textarea 
                            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none h-32 resize-none"
                            placeholder="Interpretación técnica..."
                            value={resultadoData.interpretacion}
                            onChange={e => setResultadoData({...resultadoData, interpretacion: e.target.value})}
                        />
                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setShowResultModal(false)} className="flex-1 p-5 font-black uppercase text-xs text-gray-400">Cancelar</button>
                            <button type="submit" className="flex-1 p-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">Guardar</button>
                        </div>
                    </form>
                </div>
            )}
        </MainLayout>
    );
}