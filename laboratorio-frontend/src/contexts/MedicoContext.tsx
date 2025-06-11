import React, { createContext, useContext, useState, useEffect } from 'react';

interface MedicoData {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  matricula: string;
}

interface MedicoContextType {
  medico: MedicoData | null;
  loading: boolean;
  setMedico: (medico: MedicoData | null) => void;
  logout: () => void;
}

const MedicoContext = createContext<MedicoContextType | undefined>(undefined);

export const MedicoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medico, setMedico] = useState<MedicoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos del médico desde localStorage al iniciar
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const parsedUsuario = JSON.parse(usuarioGuardado);
        setMedico(parsedUsuario);
      } catch (error) {
        console.error('Error al parsear usuario guardado:', error);
        localStorage.removeItem('usuario');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    setMedico(null);
    localStorage.removeItem('usuario');
  };

  return (
    <MedicoContext.Provider value={{ medico, loading, setMedico, logout }}>
      {children}
    </MedicoContext.Provider>
  );
};

export const useMedico = () => {
  const context = useContext(MedicoContext);
  if (context === undefined) {
    throw new Error('useMedico debe ser usado dentro de un MedicoProvider');
  }
  return context;
};

// ---