import React, { createContext, useContext, useState } from 'react';

export type ProposalFormData = {
  clientType: string;
  application: string;
  desiredOutput: string;
  waterSource: string;
  // Add more fields as needed
};

interface ProposalContextType {
  form: ProposalFormData;
  setForm: (data: ProposalFormData) => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const ProposalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [form, setForm] = useState<ProposalFormData>({
    clientType: '',
    application: '',
    desiredOutput: '',
    waterSource: '',
  });
  return (
    <ProposalContext.Provider value={{ form, setForm }}>
      {children}
    </ProposalContext.Provider>
  );
};

export function useProposal() {
  const context = useContext(ProposalContext);
  if (!context) throw new Error('useProposal must be used within a ProposalProvider');
  return context;
}
