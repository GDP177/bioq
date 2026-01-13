import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MainLayout } from '../../components/layout/MainLayout';

interface Analisis {
    codigo_practica: string | number;
    descripcion_practica: string;
    REFERENCIA: string;
    UNIDAD_BIOQUIMICA: string;
    URGENCIA: string;
    cantidad_hijos: number;
}

export default function GestionAnalisis() {
    const [analisis, setAnalisis] = useState<Analisis[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("");
    const [hijosVisibles, setHijosVisibles] = useState<Record<string, any[]>>({});
    const [editando, setEditando] = useState<string | number | null>(null);

    const fetchCatalogo = async () => {
        setLoading(true);
        try {
            // Ajustado a la ruta de tu controlador Admin
            const res = await axios.get('http://localhost:5000/api/analisis/admin/catalogo');
            if (res.data.success) {
                setAnalisis(res.data.data);
            }
        } catch (err) {
            console.error("Error al cargar el catálogo:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogo();
    }, []);

    const toggleHijos = async (codigo: string | number) => {
        const codigoStr = String(codigo);
        if (hijosVisibles[codigoStr]) {
            const copia = { ...hijosVisibles };
            delete copia[codigoStr];
            setHijosVisibles(copia);
            return;
        }

        try {
            const res = await axios.get(`http://localhost:5000/api/analisis/estructura/${codigoStr}`);
            if (res.data.success) {
                setHijosVisibles({ ...hijosVisibles, [codigoStr]: res.data.data });
            }
        } catch (err) {
            console.error("Error al cargar sub-análisis:", err);
        }
    };

    // FUNCIÓN PARA ACTUALIZAR VALOR DE REFERENCIA
    const handleUpdateReferencia = async (codigo: string | number, nuevaRef: string) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/analisis/${codigo}`, {
                REFERENCIA: nuevaRef
            });
            // Actualizar estado local para no recargar todo
            setAnalisis(prev => prev.map(item => 
                item.codigo_practica === codigo ? { ...item, REFERENCIA: nuevaRef } : item
            ));
            setEditando(null);
        } catch (err) {
            alert("Error al actualizar la referencia");
        }
    };

    const analisisFiltrados = analisis.filter(item => {
        const query = filtro.toLowerCase();
        const descripcion = item.descripcion_practica?.toLowerCase() || "";
        const codigo = String(item.codigo_practica || "");
        return descripcion.includes(query) || codigo.includes(query);
    });

    if (loading) return (
        <MainLayout>
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="w-full min-h-screen bg-slate-50/50 p-4 sm:p-8">
                {/* Header Profesional */}
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Catálogo Maestro</h1>
                            <p className="text-slate-500 font-medium text-sm">Configuración técnica de prácticas y rangos de referencia</p>
                        </div>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200">
                            + NUEVA PRÁCTICA
                        </button>
                    </div>

                    {/* Buscador Estilizado */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 mb-6 flex items-center">
                        <div className="p-3 text-slate-400">🔍</div>
                        <input 
                            type="text" 
                            placeholder="Buscar por código o descripción..."
                            className="w-full p-2 outline-none text-slate-700 font-medium"
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                        />
                    </div>

                    {/* Tabla Principal */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-widest">
                                    <th className="px-6 py-5 text-left">Cód.</th>
                                    <th className="px-6 py-5 text-left">Determinación</th>
                                    <th className="px-6 py-5 text-left">Ref. Maestra (Click para editar)</th>
                                    <th className="px-6 py-5 text-left">Unidad</th>
                                    <th className="px-6 py-5 text-center">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {analisisFiltrados.map((item) => (
                                    <React.Fragment key={item.codigo_practica}>
                                        <tr className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-sm">#{item.codigo_practica}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 uppercase text-sm leading-tight">{item.descripcion_practica}</span>
                                                    {item.cantidad_hijos > 0 && (
                                                        <button 
                                                            onClick={() => toggleHijos(item.codigo_practica)}
                                                            className="text-[10px] text-indigo-500 font-bold mt-1 hover:underline text-left uppercase tracking-tighter"
                                                        >
                                                            {hijosVisibles[String(item.codigo_practica)] ? '▼ Ocultar componentes' : `▶ Incluye ${item.cantidad_hijos} determinaciones`}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {editando === item.codigo_practica ? (
                                                    <input 
                                                        autoFocus
                                                        className="w-full p-1 border-2 border-indigo-400 rounded bg-white outline-none text-sm"
                                                        defaultValue={item.REFERENCIA}
                                                        onBlur={(e) => handleUpdateReferencia(item.codigo_practica, e.target.value)}
                                                    />
                                                ) : (
                                                    <div 
                                                        onClick={() => setEditando(item.codigo_practica)}
                                                        className="text-slate-500 italic text-sm cursor-pointer hover:bg-slate-100 p-1 rounded transition-all"
                                                    >
                                                        {item.REFERENCIA || 'Sin referencia'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-bold text-xs uppercase">{item.UNIDAD_BIOQUIMICA || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                                                    item.URGENCIA === 'U' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                    {item.URGENCIA === 'U' ? 'URGENTE' : 'RUTINA'}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Sub-tabla de componentes */}
                                        {hijosVisibles[String(item.codigo_practica)] && (
                                            <tr>
                                                <td colSpan={5} className="bg-slate-50/80 px-8 py-4">
                                                    <div className="bg-white rounded-xl border border-indigo-100 shadow-inner overflow-hidden">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-indigo-50/50 text-indigo-900/50 uppercase font-black text-[9px]">
                                                                <tr>
                                                                    <th className="px-6 py-3 text-left">Cód. Hijo</th>
                                                                    <th className="px-6 py-3 text-left">Componente</th>
                                                                    <th className="px-6 py-3 text-left">Rango Técnico</th>
                                                                    <th className="px-6 py-3 text-left">Unidad</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {hijosVisibles[String(item.codigo_practica)].map((h, idx) => (
                                                                    <tr key={idx} className="hover:bg-indigo-50/30">
                                                                        <td className="px-6 py-3 font-bold text-indigo-400">#{h.codigo_hijo}</td>
                                                                        <td className="px-6 py-3 font-bold text-slate-700 uppercase">{h.descripcion_practica}</td>
                                                                        <td className="px-6 py-3">
                                                                            {editando === `h-${h.codigo_hijo}` ? (
                                                                                <input 
                                                                                    autoFocus
                                                                                    className="w-full p-1 border border-indigo-300 rounded outline-none"
                                                                                    defaultValue={h.REFERENCIA}
                                                                                    onBlur={(e) => handleUpdateReferencia(h.codigo_hijo, e.target.value)}
                                                                                />
                                                                            ) : (
                                                                                <div 
                                                                                    onClick={() => setEditando(`h-${h.codigo_hijo}`)}
                                                                                    className="text-slate-400 italic cursor-pointer hover:text-indigo-500"
                                                                                >
                                                                                    {h.REFERENCIA || 'Definir'}
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-6 py-3 font-bold text-slate-300">{h.UNIDAD_BIOQUIMICA || '-'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}