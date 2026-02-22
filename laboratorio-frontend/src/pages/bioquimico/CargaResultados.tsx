// src/pages/bioquimico/CargarResultados.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// ==========================================
// ESTILOS GLOBALES PARA IMPRESIÓN (AJUSTADO A4)
// ==========================================
const PrintStyles = () => (
  <style>
    {`
      @media print {
        @page { 
            size: A4; 
            margin: 1cm; 
        }
        
        aside, nav, .sidebar, .print-hide { display: none !important; }
        *[style*="fixed"], [class*="fixed"], [class*="absolute bottom-"] { display: none !important; }
        
        #root, body, main, .App, .ml-64 { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 100% !important; 
            max-width: 100% !important;
            background-color: white !important;
        }
        
        body { 
            background-color: white !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            font-size: 11px;
        }

        .fixed.z-50 { display: none !important; }
        .gap-6 { gap: 0.5rem !important; }
        .mb-8 { margin-bottom: 1rem !important; }
        .p-5, .p-8 { padding: 0.5rem !important; }
        .border { border-width: 1px !important; border-color: #e2e8f0 !important; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
      }
    `}
  </style>
);

// ==========================================
// COMPONENTES UI REUTILIZABLES (ESTILO MÉDICO)
// ==========================================
const Button = ({ onClick, children, className, variant = 'primary', disabled }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center justify-center gap-2 ${className} ${
        variant === 'ghost' ? 'hover:bg-gray-100 text-gray-600 border border-gray-200 bg-white' : 
        variant === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : 
        'bg-indigo-600 text-white hover:bg-indigo-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

const CustomCard = ({ title, children, className }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const variants: any = {
    pendiente: "bg-amber-50 text-amber-700 border-amber-200",
    en_proceso: "bg-blue-50 text-blue-700 border-blue-200",
    finalizado: "bg-green-50 text-green-700 border-green-200",
    urgente: "bg-red-50 text-red-700 border-red-200",
    default: "bg-gray-50 text-gray-700 border-gray-200"
  };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${variants[variant] || variants.default} ${className} print:border-gray-400 print:text-black print:bg-transparent`}>{children}</span>;
};

const Money = ({ amount }: { amount: number }) => (
  <span className="font-mono">
    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)}
  </span>
);

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-slate-500 font-medium text-sm">Cargando resultados...</p>
    </div>
  </div>
);

// Input optimizado
const Input = ({ value, onChange, placeholder, disabled, modoEdicion, onKeyDown }: any) => {
  if (!modoEdicion) {
    return <span className="block truncate text-center font-bold text-slate-900">{value || "-"}</span>;
  }
  return (
    <input
      type="text"
      value={value || ""}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-center font-semibold bg-white text-slate-900 nav-input shadow-inner transition-all print:border-none print:bg-transparent print:p-0 print:m-0 print:text-black print:text-center print:shadow-none print:h-auto print:text-xs"
    />
  );
};

const NotificationToast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'warning', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000); 
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: "bg-green-50 border-green-500 text-green-800",
        error: "bg-red-50 border-red-500 text-red-800",
        warning: "bg-amber-50 border-amber-500 text-amber-800"
    };

    const icons = {
        success: "✅",
        error: "🚫",
        warning: "⚠️"
    };

    return (
        <div className={`fixed top-5 right-5 z-[70] flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl border-l-4 animate-in slide-in-from-right-5 fade-in duration-300 print:hidden ${styles[type]}`}>
            <span className="text-xl">{icons[type]}</span>
            <div>
                <h4 className="font-bold text-xs uppercase tracking-wider opacity-80">{type === 'error' ? 'Error' : type === 'success' ? 'Éxito' : 'Atención'}</h4>
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
    );
};

// ==========================================
// INTERFACES
// ==========================================
interface Analisis {
  id: number | string;
  codigo: number;
  descripcion: string;
  tipo: string;
  estado: string;
  valor_hallado: string | null;
  unidad: string | null;
  valor_referencia: string | null;
  observaciones: string | null;
  interpretacion: string | null;
  tecnico: string | null;
  honorarios: number; 
  es_subanalisis?: boolean;
  sub_analisis?: Analisis[];
}

interface OrdenTrabajo {
  id: number;
  nro_orden: string;
  estado: string;
  fecha: string;
  urgente: number;
  paciente: {
    nombre: string;
    apellido: string;
    dni: number;
    edad: number;
    sexo: string;
    mutual: string;
  };
  medico: string;
  analisis: Analisis[];
}

// ==========================================
// SUBCOMPONENTE DE FILA (ESTILO MÉDICO)
// ==========================================
const FilaAnalisis = ({ item, isChild = false, modoEdicion, guardando, onChange, onGuardar, onEnter }: any) => {
    const isParentWithChildren = !isChild && item.sub_analisis && item.sub_analisis.length > 0;
    const identificadorSeguro = item.id || item.codigo;
    
    const rowClass = isChild 
      ? "bg-slate-50/50 hover:bg-slate-100 text-xs border-b border-slate-100" 
      : "bg-white hover:bg-indigo-50/30 transition-colors border-b border-slate-200 text-sm font-medium";
  
    const paddingLeft = isChild ? "pl-12" : "pl-6";

    return (
      <tr className={`${rowClass} break-inside-avoid print:bg-transparent`}>
        <td className={`py-3 pr-4 ${paddingLeft}`}>
          <div className="flex items-center">
            {isChild && <span className="text-slate-400 mr-2">↳</span>}
            <div>
              <div className={`${isChild ? 'text-slate-700' : 'text-slate-900 font-bold'}`}>
                {item.descripcion}
              </div>
              {!isChild && <div className="text-[9px] text-slate-400 font-mono print:hidden">Cód: {item.codigo}</div>}
            </div>
          </div>
        </td>
        
        <td className="px-4 py-3 text-center">
          <div className="text-xs text-slate-500 font-mono whitespace-pre-wrap leading-tight print:text-black">
            {item.valor_referencia || "-"}
          </div>
        </td>
        
        <td className="px-4 py-3 text-center w-36">
          {isParentWithChildren ? <span className="text-slate-400 print:hidden">--</span> : 
            <Input 
                value={item.valor_hallado} 
                onChange={(e: any) => onChange(identificadorSeguro, 'valor_hallado', e.target.value, isChild)} 
                placeholder="Resultado" 
                modoEdicion={modoEdicion}
                onKeyDown={onEnter} 
            />
          }
        </td>

        <td className="px-4 py-3 text-center w-28">
          {isParentWithChildren ? null : 
            <Input 
                value={item.unidad} 
                onChange={(e: any) => onChange(identificadorSeguro, 'unidad', e.target.value, isChild)} 
                placeholder="Unid." 
                modoEdicion={modoEdicion} 
                onKeyDown={onEnter}
            />
          }
        </td>

        <td className="px-4 py-3 text-center w-56">
          {isParentWithChildren ? null : 
            <Input 
                value={item.observaciones} 
                onChange={(e: any) => onChange(identificadorSeguro, 'observaciones', e.target.value, isChild)} 
                placeholder="Notas..." 
                modoEdicion={modoEdicion} 
                onKeyDown={onEnter}
            />
          }
        </td>

        <td className="px-6 py-3 text-right font-medium text-slate-700 w-32">
           {!isParentWithChildren ? <Money amount={item.honorarios || 0} /> : <span className="text-slate-300">-</span>}
        </td>

        <td className="px-6 py-3 text-right print-hide w-32">
          {!isParentWithChildren && modoEdicion && (
            <button 
                onClick={() => onGuardar(item)}
                disabled={guardando === identificadorSeguro}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${item.estado === 'finalizado' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-white border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'}`}
            >
                {guardando === identificadorSeguro ? '⏳' : (item.estado === 'finalizado' ? '✓ Listo' : 'Guardar')}
            </button>
          )}
        </td>
      </tr>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function CargarResultados() {
  const { id_orden } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState<string | number | null>(null);
  const [modoEdicion, setModoEdicion] = useState(true);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'warning'} | null>(null);
  
  // 🔥 NUEVO ESTADO PARA CONTROLAR EL MODAL
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (id_orden) cargarOrden(parseInt(id_orden));
  }, [id_orden]);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
      setNotification({ show: true, message, type });
  };

  const cargarOrden = async (ordenId: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/ordenes/${ordenId}`);
      
      if (response.data.success) {
        const raw = response.data.orden;
        const analisisListRaw = response.data.analisis || [];

        const analisisList = analisisListRaw.map((a: any) => ({
            ...a,
            valor_referencia: a.valor_referencia || "-",
            honorarios: Number(a.honorarios) || Number(a.HONORARIOS) || 0,
            sub_analisis: a.sub_analisis ? a.sub_analisis.map((sub:any) => ({
                ...sub,
                valor_referencia: sub.valor_referencia || "-",
                honorarios: Number(sub.honorarios) || Number(sub.HONORARIOS) || 0
            })) : []
        }));

        const todosFinalizados = analisisList.length > 0 && analisisList.every((a: any) => a.estado === 'finalizado');
        const estadoReal = todosFinalizados ? 'finalizado' : raw.estado;

        setOrden({
            id: raw.id_orden,
            nro_orden: raw.nro_orden,
            estado: estadoReal,
            fecha: raw.fecha_ingreso_orden || new Date().toISOString(),
            urgente: raw.urgente,
            paciente: {
                nombre: raw.nombre || raw.nombre_paciente, 
                apellido: raw.apellido || raw.apellido_paciente,
                dni: raw.dni || raw.DNI,
                edad: raw.edad,
                sexo: raw.sexo,
                mutual: raw.mutual || 'Particular'
            },
            medico: raw.apellido_medico ? `Dr. ${raw.apellido_medico}` : 'No especificado',
            analisis: analisisList
        });

        if (estadoReal === 'finalizado') setModoEdicion(false);
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error al cargar la orden de trabajo", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (identificador: string | number, campo: keyof Analisis, valor: string, esHijo: boolean) => {
    setOrden(prev => {
      if (!prev) return null;
      const nuevosAnalisis = prev.analisis.map(parent => {
        const parentId = parent.id || parent.codigo;
        if (parentId === identificador && !esHijo) return { ...parent, [campo]: valor };
        if (parent.sub_analisis) {
          const hijosActualizados = parent.sub_analisis.map(child => {
            const childId = child.id || child.codigo;
            if (childId === identificador && esHijo) return { ...child, [campo]: valor };
            return child;
          });
          return { ...parent, sub_analisis: hijosActualizados };
        }
        return parent;
      });
      return { ...prev, analisis: nuevosAnalisis };
    });
  };

  const guardarResultadoIndividual = async (analisis: Analisis) => {
    const identificador = analisis.id || analisis.codigo; 

    if (!analisis.valor_hallado || analisis.valor_hallado.trim() === "") {
        showNotification("El campo 'Resultado' es obligatorio.", 'warning');
        return;
    }

    try {
      setGuardando(identificador);
      await axios.put(`http://localhost:5000/api/ordenes/${id_orden}/analisis/${analisis.codigo}`, {
        valor_hallado: analisis.valor_hallado,
        unidad: analisis.unidad,
        observaciones: analisis.observaciones
      });
      
      handleChange(identificador, 'estado', 'finalizado', analisis.es_subanalisis || false);
      showNotification("Resultado guardado correctamente", 'success'); 

    } catch (error) {
      showNotification("Error al guardar en la base de datos.", 'error');
    } finally {
      setGuardando(null);
    }
  };

  // 🔥 NUEVA LÓGICA: Esta función solo valida y ABRE EL MODAL
  const prepararFinalizacion = () => {
    if (!orden) return;

    let pendientes: string[] = [];
    orden.analisis.forEach(a => {
        if (a.sub_analisis && a.sub_analisis.length > 0) {
            a.sub_analisis.forEach(sub => {
                if (sub.estado !== 'finalizado') pendientes.push(sub.descripcion);
            });
        } else {
            if (a.estado !== 'finalizado') pendientes.push(a.descripcion);
        }
    });

    if (pendientes.length > 0) {
        showNotification(`No se puede finalizar. Faltan resultados en: ${pendientes.length} análisis.`, 'warning');
        return;
    }

    // En lugar de window.confirm, abrimos nuestra ventana personalizada
    setShowConfirmModal(true);
  };

  // 🔥 NUEVA LÓGICA: Esta función hace el llamado a la Base de Datos (Se ejecuta al darle "Sí" en el modal)
  const confirmarFinalizacionEnBD = async () => {
    setShowConfirmModal(false); // Cerramos el modal
    
    try {
        setLoading(true);
        const response = await axios.put(`http://localhost:5000/api/ordenes/${id_orden}/finalizar`);
        
        if (response.data.success) {
            showNotification("¡Orden finalizada con éxito!", 'success');
            setTimeout(() => {
                navigate('/bioquimico/ordenes-entrantes');
            }, 1500);
        }
    } catch (error) {
        showNotification("Hubo un error al finalizar la orden.", 'error');
        setLoading(false);
    }
  };

  const handleEnterKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const inputs = Array.from(document.querySelectorAll('.nav-input'));
        const index = inputs.indexOf(e.target as Element);
        if (index > -1 && index < inputs.length - 1) {
            (inputs[index + 1] as HTMLElement).focus();
        }
    }
  };

  const calcularTotal = () => {
      let sum = 0;
      if (orden && orden.analisis) {
          orden.analisis.forEach(a => {
              sum += (a.honorarios || 0);
              if (a.sub_analisis) {
                  a.sub_analisis.forEach(sub => sum += (sub.honorarios || 0));
              }
          });
      }
      return sum;
  };

  let totalAnalisis = 0;
  let listos = 0;
  orden?.analisis.forEach(a => {
    if (a.sub_analisis && a.sub_analisis.length > 0) {
        a.sub_analisis.forEach(sub => { totalAnalisis++; if(sub.estado === 'finalizado') listos++; });
    } else {
        totalAnalisis++; if(a.estado === 'finalizado') listos++;
    }
  });
  const porcentaje = totalAnalisis === 0 ? 0 : Math.round((listos / totalAnalisis) * 100);

  const formatFecha = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });

  if (loading) return <LoadingSpinner />;
  if (!orden) return <div className="p-10 text-center text-red-500 font-bold">No se encontró la orden.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans relative">
      <PrintStyles /> 
      
      {notification && (
          <NotificationToast 
              message={notification.message} 
              type={notification.type} 
              onClose={() => setNotification(null)} 
          />
      )}

      {/* HEADER VISUAL (OCULTO AL IMPRIMIR) */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/bioquimico/ordenes-entrantes')}>← Volver</Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Orden #{orden.nro_orden}
                {orden.urgente === 1 && <Badge variant="urgente">URGENTE</Badge>}
              </h1>
              <p className="text-xs text-slate-500">Creada el {formatFecha(orden.fecha)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {orden.estado === 'finalizado' ? (
              <>
                <Button variant="ghost" onClick={() => setModoEdicion(!modoEdicion)}>
                  {modoEdicion ? '🔒 Bloquear Edición' : '✏️ Corregir Datos'}
                </Button>
                <Button onClick={() => window.print()}>
                  🖨️ Imprimir PDF
                </Button>
              </>
            ) : (
              <Button variant="success" onClick={prepararFinalizacion}>
                ✅ Finalizar Orden
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL (OCULTO AL IMPRIMIR) */}
      <main className="max-w-7xl mx-auto px-4 py-8 print:hidden">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <CustomCard title="Datos del Paciente" className="lg:col-span-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-bold text-slate-900 uppercase">{orden.paciente.apellido}, {orden.paciente.nombre}</p>
                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                  <span>DNI: <strong>{orden.paciente.dni}</strong></span>
                  <span>Edad: <strong>{orden.paciente.edad}</strong></span>
                  <span>Sexo: <strong>{orden.paciente.sexo}</strong></span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Cobertura</span>
                <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded uppercase">{orden.paciente.mutual}</span>
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Info. Administrativa">
            <div className="space-y-2">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase">Estado Actual</span>
                <span className="text-sm font-bold text-slate-800 uppercase">{orden.estado}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 mt-2">
                <span className="block text-[10px] text-slate-400 uppercase">Solicitante</span>
                <span className="text-sm text-slate-600 truncate block font-bold">{orden.medico}</span>
              </div>
            </div>
          </CustomCard>

          <CustomCard title="Progreso de Carga">
            <div className="flex items-center justify-between h-full px-2">
              <div className="text-center">
                <span className="block text-xl font-bold text-slate-800">{totalAnalisis}</span>
                <span className="text-[10px] text-slate-400 uppercase">Total</span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-center">
                <span className="block text-xl font-bold text-green-600">{listos}</span>
                <span className="text-[10px] text-slate-400 uppercase">Listos</span>
              </div>
              <div className="relative w-12 h-12 flex items-center justify-center rounded-full border-4 border-indigo-50">
                <span className="text-[10px] font-bold text-indigo-600">{porcentaje}%</span>
              </div>
            </div>
          </CustomCard>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-700">Carga de Resultados</h3>
            <span className="text-xs text-slate-500 font-medium italic">
              {modoEdicion ? 'Editando resultados...' : 'Modo Solo Lectura'}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase w-1/3">Determinación</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase w-32">Valor Ref.</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase w-36">Resultado</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase w-28">Unidad</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase w-56">Notas</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase w-32">Honorarios</th>
                  {modoEdicion && <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase print-hide w-32">Acción</th>}
                </tr>
              </thead>
              <tbody className="bg-white">
                {orden.analisis.map((parent, index) => (
                  <React.Fragment key={`group-${parent.codigo}-${index}`}>
                    <FilaAnalisis 
                      item={parent} 
                      modoEdicion={modoEdicion}
                      guardando={guardando}
                      onChange={handleChange}
                      onGuardar={guardarResultadoIndividual}
                      onEnter={handleEnterKey}
                    />
                    {parent.sub_analisis?.map((child, cIndex) => (
                      <FilaAnalisis 
                          key={`child-${child.codigo}-${cIndex}`} 
                          item={child} 
                          isChild={true} 
                          modoEdicion={modoEdicion}
                          guardando={guardando}
                          onChange={handleChange}
                          onGuardar={guardarResultadoIndividual}
                          onEnter={handleEnterKey}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right text-sm font-bold text-slate-600 uppercase">
                    Total Honorarios:
                  </td>
                  <td className="px-6 py-4 text-right text-lg font-black text-green-700">
                    <Money amount={calcularTotal()} />
                  </td>
                  {modoEdicion && <td className="print-hide"></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>

      {/* ================================================================= */}
      {/* FORMATO DE IMPRESIÓN (PDF OCULTO EN PANTALLA, VISIBLE AL IMPRIMIR)*/}
      {/* ================================================================= */}
      <div className="hidden print:block w-full bg-white">
        <div className="text-slate-900 font-serif text-sm w-full relative">
             <header className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                 <div>
                     <h1 className="text-2xl font-bold text-indigo-900 uppercase tracking-widest">Laboratorio Bioquímico UME</h1>
                     <p className="text-xs text-slate-600">Universidad Nacional del Chaco Austral</p>
                     <p className="text-xs text-slate-600">Presidencia Roque Sáenz Peña - Chaco</p>
                 </div>
                 <div className="text-right">
                     <div className="border border-slate-400 px-4 py-1 rounded bg-slate-50 mb-1">
                         <span className="block text-[9px] text-slate-500 uppercase font-bold">Protocolo</span>
                         <span className="text-xl font-mono font-bold">{orden.nro_orden}</span>
                     </div>
                     <p className="text-xs">Fecha: <strong>{formatFecha(orden.fecha)}</strong></p>
                 </div>
             </header>

             <section className="mb-6 border border-slate-300 rounded p-4 bg-slate-50/30">
                 <div className="grid grid-cols-2 gap-y-1 gap-x-8 text-sm">
                     <div className="flex border-b border-slate-200 pb-1">
                         <span className="w-24 font-bold text-slate-600 text-xs uppercase">Paciente:</span>
                         <span className="font-bold uppercase">{orden.paciente.apellido}, {orden.paciente.nombre}</span>
                     </div>
                     <div className="flex border-b border-slate-200 pb-1">
                         <span className="w-24 font-bold text-slate-600 text-xs uppercase">DNI:</span>
                         <span className="font-mono">{orden.paciente.dni}</span>
                     </div>
                     <div className="flex border-b border-slate-200 pb-1">
                         <span className="w-24 font-bold text-slate-600 text-xs uppercase">Edad/Sexo:</span>
                         <span>{orden.paciente.edad} años / {orden.paciente.sexo}</span>
                     </div>
                     <div className="flex border-b border-slate-200 pb-1">
                         <span className="w-24 font-bold text-slate-600 text-xs uppercase">Obra Social:</span>
                         <span className="font-bold uppercase">{orden.paciente.mutual}</span>
                     </div>
                     <div className="flex border-b border-slate-200 pb-1 col-span-2 mt-1">
                         <span className="w-24 font-bold text-slate-600 text-xs uppercase">Solicitante:</span>
                         <span>{orden.medico}</span>
                     </div>
                 </div>
             </section>

             <h3 className="text-center font-bold uppercase border-b-2 border-slate-800 mb-2 pb-1 tracking-wider">Informe de Resultados</h3>
             
             <table className="w-full text-left border-collapse mb-8 text-xs">
                 <thead>
                     <tr className="border-b border-slate-400 uppercase text-slate-600 bg-slate-50">
                         <th className="py-2 pl-2 w-4/12">Determinación</th>
                         <th className="py-2 text-center w-2/12">Resultado</th>
                         <th className="py-2 text-center w-1/12">Unid.</th>
                         <th className="py-2 text-center w-2/12">Ref.</th>
                         <th className="py-2 text-center w-3/12">Obs.</th>
                     </tr>
                 </thead>
                 <tbody className="font-mono">
                     {orden.analisis.map((parent, index) => (
                         <React.Fragment key={`print-group-${index}`}>
                             <tr className="border-b border-slate-100">
                                 <td className="py-2 pl-2 font-medium text-slate-800 uppercase">{parent.descripcion}</td>
                                 <td className="py-2 text-center font-bold text-slate-900">{parent.valor_hallado || "-"}</td>
                                 <td className="py-2 text-center text-slate-500">{parent.unidad}</td>
                                 <td className="py-2 text-center text-slate-600 whitespace-pre-wrap">{parent.valor_referencia}</td>
                                 <td className="py-2 text-center text-slate-500 italic">{parent.observaciones || ""}</td>
                             </tr>
                             {parent.sub_analisis?.map((child, cIndex) => (
                                 <tr key={`print-child-${index}-${cIndex}`} className="border-b border-slate-100 bg-slate-50/50">
                                     <td className="py-2 pl-6 text-slate-700 text-[10px] uppercase">↳ {child.descripcion}</td>
                                     <td className="py-2 text-center font-bold text-slate-900">{child.valor_hallado || "-"}</td>
                                     <td className="py-2 text-center text-slate-500">{child.unidad}</td>
                                     <td className="py-2 text-center text-slate-600">{child.valor_referencia}</td>
                                     <td className="py-2 text-center text-slate-500 italic">{child.observaciones || ""}</td>
                                 </tr>
                             ))}
                         </React.Fragment>
                     ))}
                 </tbody>
             </table>

             <footer className="mt-16 pt-4">
                 <div className="flex justify-end mb-6">
                     <div className="text-center w-64">
                         <div className="h-16 mb-2"></div>
                         <div className="border-t border-slate-800 pt-1">
                             <p className="font-bold text-sm">Firma y Sello Bioquímico</p>
                         </div>
                     </div>
                 </div>
                 <div className="text-[9px] text-slate-400 text-center border-t pt-2">
                     Sistema de Gestión de Laboratorio UME • Documento generado el {new Date().toLocaleDateString('es-AR')}
                 </div>
             </footer>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 🔥 MODAL PERSONALIZADO DE CONFIRMACIÓN (REEMPLAZA A WINDOW.CONFIRM)*/}
      {/* ================================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="bg-green-600 p-6 text-center relative overflow-hidden">
                {/* Elementos decorativos de fondo en la cabecera verde */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white opacity-10 rounded-full blur-lg"></div>
                
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-green-500 relative z-10">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-black text-white relative z-10">¿Finalizar Orden?</h3>
            </div>
            
            <div className="p-6 text-center space-y-4">
              <p className="text-slate-600 font-medium">
                Estás a punto de completar la <strong className="text-slate-900">Orden #{orden.nro_orden}</strong>. 
                <br/><br/>
                La misma se marcará como <strong className="text-green-600 bg-green-50 px-2 py-0.5 rounded">FINALIZADA</strong> y quedará bloqueada en modo solo lectura. ¿Deseas continuar?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all focus:ring-4 focus:ring-slate-100 outline-none"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarFinalizacionEnBD}
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-green-200 outline-none flex justify-center items-center gap-2"
                >
                  Sí, Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}