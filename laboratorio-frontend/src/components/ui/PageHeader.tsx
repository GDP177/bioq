// src/components/ui/PageHeader.tsx
import React from "react";
import { Button } from "./button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  onBack,
  actions
}) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="mr-4"
                aria-label="Volver"
              >
                ← Volver
              </Button>
            )}
            <div className="flex items-center">
              {icon && <span className="mr-3">{icon}</span>}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};