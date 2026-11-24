import { createContext, useContext, useState, ReactNode } from 'react';
import { School } from '../../../lib/schoolService';

interface SchoolContextType {
  isSchoolAdminActive: boolean;
  setIsSchoolAdminActive: (val: boolean) => void;
  schoolInfo: School | null;
  setSchoolInfo: (val: School | null) => void;
  isSchoolAccount: boolean;
  setIsSchoolAccount: (val: boolean) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [isSchoolAdminActive, setIsSchoolAdminActive] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<School | null>(null);
  const [isSchoolAccount, setIsSchoolAccount] = useState(false);

  return (
    <SchoolContext.Provider value={{ isSchoolAdminActive, setIsSchoolAdminActive, schoolInfo, setSchoolInfo, isSchoolAccount, setIsSchoolAccount }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
