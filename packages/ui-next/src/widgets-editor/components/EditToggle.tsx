import { Eye, Pencil, Save } from "lucide-react";
import { useEditorContext } from "@/widgets-editor/context/EditorContext";
import { useLayoutStore } from "@/store/useLayoutStore";

export function EditToggle() {
  const { isEditMode, setEditMode, pageId } = useEditorContext();
  const savePage = useLayoutStore((s) => s.savePage);

  const handleSave = async () => {
    await savePage(pageId);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        padding: "0.375rem 0.75rem",
        background: "var(--editor-bar-bg, #1e293b)",
        borderRadius: "0.5rem",
        fontSize: "0.8125rem",
        fontWeight: 500,
      }}
    >
      <button
        type="button"
        onClick={() => setEditMode(!isEditMode)}
        title={isEditMode ? "Switch to preview" : "Switch to edit mode"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.25rem 0.625rem",
          borderRadius: "0.375rem",
          border: "none",
          cursor: "pointer",
          fontSize: "inherit",
          fontWeight: "inherit",
          background: isEditMode ? "#3b82f6" : "transparent",
          color: isEditMode ? "#fff" : "#94a3b8",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {isEditMode ? <Pencil size={14} /> : <Eye size={14} />}
        {isEditMode ? "Editing" : "Preview"}
      </button>

      {isEditMode && (
        <button
          type="button"
          onClick={handleSave}
          title="Save to localStorage"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.25rem 0.625rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
            fontSize: "inherit",
            fontWeight: "inherit",
            background: "transparent",
            color: "#4ade80",
            transition: "background 0.15s",
          }}
        >
          <Save size={14} />
          Save
        </button>
      )}
    </div>
  );
}
