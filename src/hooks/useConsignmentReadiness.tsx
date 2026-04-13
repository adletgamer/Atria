import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ReadinessLens = 'import' | 'financing';

interface ConsignmentReadinessState {
  activeLens: ReadinessLens;
  setActiveLens: (lens: ReadinessLens) => void;
  // Helpers to check current context
  isImportLens: boolean;
  isFinancingLens: boolean;
}

const ConsignmentReadinessContext = createContext<ConsignmentReadinessState | undefined>(undefined);

export const ConsignmentReadinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeLens, setActiveLens] = useState<ReadinessLens>('import');

  const value = {
    activeLens,
    setActiveLens,
    isImportLens: activeLens === 'import',
    isFinancingLens: activeLens === 'financing',
  };

  return (
    <ConsignmentReadinessContext.Provider value={value}>
      {children}
    </ConsignmentReadinessContext.Provider>
  );
};

export const useConsignmentReadiness = (): ConsignmentReadinessState => {
  const context = useContext(ConsignmentReadinessContext);
  if (context === undefined) {
    throw new Error('useConsignmentReadiness must be used within a ConsignmentReadinessProvider');
  }
  return context;
};
