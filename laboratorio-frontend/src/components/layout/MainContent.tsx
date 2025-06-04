// src/components/layout/MainContent.tsx
import type { ReactNode } from 'react';
import { PageContainer } from '../custom-ui/PageContainer'; // Ajusta la ruta si es necesario

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    // PageContainer ya aplica el min-h-screen, bg-gray-100 y p-6
    <PageContainer>
      {children}
    </PageContainer>
  );
}