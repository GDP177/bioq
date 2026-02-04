import { useState, useEffect } from "react";
// ... imports necesarios (axios, interfaces, components UI)

interface OrderFormProps {
  pacienteInicial?: any; // El paciente que viene pre-cargado
  rol: 'medico' | 'admin' | 'bioquimico'; // Para saber qué mostrar
  onSubmit: (datos: any) => void; // Función que el padre decide qué hacer
  onCancel: () => void;
}

export const OrderForm = ({ pacienteInicial, rol, onSubmit, onCancel }: OrderFormProps) => {
  const [paciente, setPaciente] = useState(pacienteInicial || null);
  // ... resto de estados (analisis, observaciones)

  // Si cambia el pacienteInicial (ej: viene de redirección), actualizamos
  useEffect(() => {
    if (pacienteInicial) setPaciente(pacienteInicial);
  }, [pacienteInicial]);

  const handleSubmit = () => {
    // Validaciones internas del formulario
    if (!paciente) return alert("Falta paciente");
    
    // Le pasamos la pelota al componente Padre
    onSubmit({ paciente, analisis: [], observaciones: '' });
  };

  return (
    <div className="bg-white p-6 rounded shadow">
       {/* AQUÍ VA TODO EL HTML QUE ANTES SE REPETÍA 
          (Tarjetas de paciente, buscador, etc)
       */}
       
       {/* Ejemplo de diferencia por ROL */}
       {rol === 'admin' && (
         <div className="alert-admin">
            <label>Seleccionar Médico Solicitante (Solo Admin):</label>
            <select>...</select>
         </div>
       )}

       <button onClick={handleSubmit}>Generar Orden</button>
    </div>
  );
};