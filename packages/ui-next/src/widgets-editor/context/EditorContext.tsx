import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface EditorContextValue {
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  /** Page being edited — used by tree ops */
  pageId: string;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  pageId,
  children,
}: {
  pageId: string;
  children: ReactNode;
}) {
  const [isEditMode, setEditMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <EditorContext.Provider
      value={{ isEditMode, setEditMode, selectedNodeId, setSelectedNodeId, pageId }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditorContext must be used inside <EditorProvider>");
  return ctx;
}
