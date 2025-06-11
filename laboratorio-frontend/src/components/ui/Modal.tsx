// src/components/ui/Modal.tsx
import React from "react";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'lg'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-11/12 md:w-1/3',
    md: 'w-11/12 md:w-1/2',
    lg: 'w-11/12 md:w-3/4 lg:w-2/3',
    xl: 'w-11/12 md:w-5/6 lg:w-4/5'
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={`relative top-20 mx-auto p-5 border ${sizeClasses[size]} shadow-lg rounded-md bg-white`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};

