import React, { createContext, useContext } from "react";

type WorkspaceContextType = {
  organization: null;
  boards: any[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { user: any; children: React.ReactNode }) {
  return (
    <WorkspaceContext.Provider
      value={{ organization: null, boards: [], loading: false, refresh: async () => {} }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside provider");
  return ctx;
}