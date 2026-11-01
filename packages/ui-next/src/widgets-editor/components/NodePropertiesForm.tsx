import { useEffect, useId, useState } from "react";
import type { ConfigField, ConfigSchema } from "@/widgets/types";

// ─── Shared primitive helpers ─────────────────────────────────────────────────

const label: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#94a3b8",
  marginBottom: "0.25rem",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "0.3rem 0.5rem",
  fontSize: "0.8125rem",
  borderRadius: "0.25rem",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  outline: "none",
  boxSizing: "border-box",
};

const description: React.CSSProperties = {
  fontSize: "0.6875rem",
  color: "#64748b",
  marginTop: "0.2rem",
};

/** Text input that commits on blur/Enter, not on every keystroke. */
function CommitInput({
  value,
  onChange,
  type = "text",
  min,
  max,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <input
      style={input}
      type={type}
      min={min}
      max={max}
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onChange(local)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

// ─── Field renderers ──────────────────────────────────────────────────────────

function FieldWrapper({
  fieldKey,
  config,
  children,
}: {
  fieldKey: string;
  config: ConfigField;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "0.875rem" }} key={fieldKey}>
      <span style={label}>{config.label}</span>
      {children}
      {config.description && <p style={description}>{config.description}</p>}
    </div>
  );
}

function renderField(
  fieldKey: string,
  config: ConfigField,
  value: unknown,
  onChange: (v: unknown) => void,
): React.ReactNode {
  const id = `field-${fieldKey}`;

  switch (config.type) {
    case "text":
      return (
        <FieldWrapper key={fieldKey} fieldKey={fieldKey} config={config}>
          <CommitInput
            value={String(value ?? config.default ?? "")}
            onChange={onChange}
            placeholder={config.default != null ? String(config.default) : undefined}
          />
        </FieldWrapper>
      );

    case "number":
      return (
        <FieldWrapper key={fieldKey} fieldKey={fieldKey} config={config}>
          <CommitInput
            type="number"
            value={String(value ?? config.default ?? "")}
            onChange={(v) => onChange(Number(v) || (config.default as number) || 0)}
            min={config.min as number | undefined}
            max={config.max as number | undefined}
          />
        </FieldWrapper>
      );

    case "boolean":
      return (
        <FieldWrapper key={fieldKey} fieldKey={fieldKey} config={config}>
          <label
            htmlFor={id}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
          >
            <input
              id={id}
              type="checkbox"
              checked={Boolean(value ?? config.default)}
              onChange={(e) => onChange(e.target.checked)}
              style={{ width: 14, height: 14, accentColor: "#3b82f6" }}
            />
            <span style={{ fontSize: "0.8125rem", color: "#cbd5e1" }}>
              {value ? "Enabled" : "Disabled"}
            </span>
          </label>
        </FieldWrapper>
      );

    case "select": {
      const options = (config.options as Array<{ value: string; label: string }>) ?? [];
      return (
        <FieldWrapper key={fieldKey} fieldKey={fieldKey} config={config}>
          <select
            id={id}
            value={String(value ?? config.default ?? "")}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...input, cursor: "pointer" }}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FieldWrapper>
      );
    }

    case "markdown":
      return (
        <FieldWrapper key={fieldKey} fieldKey={fieldKey} config={config}>
          <textarea
            id={id}
            value={String(value ?? config.default ?? "")}
            rows={4}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.default != null ? String(config.default) : undefined}
            style={{
              ...input,
              fontFamily: "monospace",
              resize: "vertical",
              minHeight: "5rem",
            }}
          />
        </FieldWrapper>
      );

    case "color":
      return (
        <FieldWrapper key={fieldKey} fieldKey={fieldKey} config={config}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="color"
              defaultValue={String(value ?? config.default ?? "#000000")}
              key={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: 32, height: 28, padding: 1, borderRadius: 4, border: "1px solid #334155", background: "transparent", cursor: "pointer" }}
            />
            <CommitInput
              value={String(value ?? config.default ?? "#000000")}
              onChange={onChange}
              placeholder="#000000"
            />
          </div>
        </FieldWrapper>
      );

    default:
      return null;
  }
}

// ─── Group renderer ───────────────────────────────────────────────────────────

function groupFields(schema: ConfigSchema<Record<string, unknown>>) {
  const grouped: Record<string, [string, ConfigField][]> = {};
  for (const [key, cfg] of Object.entries(schema)) {
    if (!cfg) continue;
    const group = (cfg.group as string) ?? "General";
    (grouped[group] ??= []).push([key, cfg as ConfigField]);
  }
  return grouped;
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface NodePropertiesFormProps {
  /** The configSchema from the widget definition. */
  schema: ConfigSchema<Record<string, unknown>>;
  /** Current node.props (the values to display). */
  currentProps: Record<string, unknown>;
  /** Called with a full shallow-merged props object on any field change. */
  onPropsChange: (next: Record<string, unknown>) => void;
}

const sectionHeader: React.CSSProperties = {
  fontSize: "0.625rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#475569",
  borderBottom: "1px solid #1e293b",
  paddingBottom: "0.25rem",
  marginBottom: "0.75rem",
};

export function NodePropertiesForm({
  schema,
  currentProps,
  onPropsChange,
}: NodePropertiesFormProps) {
  // Strip `enabled` from schema-rendered groups — we always render it ourselves.
  const filteredSchema = Object.fromEntries(
    Object.entries(schema).filter(([k]) => k !== "enabled"),
  ) as ConfigSchema<Record<string, unknown>>;

  const grouped = groupFields(filteredSchema);

  const update = (key: string, value: unknown) => {
    onPropsChange({ ...currentProps, [key]: value });
  };

  return (
    <div>
      {/* ── Pinned "General" section (always present) ───────────────────── */}
      <section style={{ marginBottom: "1.25rem" }}>
        <div style={sectionHeader}>General</div>
        {renderField(
          "enabled",
          { type: "boolean", label: "Enabled" },
          currentProps["enabled"] ?? true,
          (v) => update("enabled", v),
        )}
      </section>

      {/* ── Widget-specific schema groups ────────────────────────────────── */}
      {Object.entries(grouped).map(([group, fields]) => (
        <section key={group} style={{ marginBottom: "1.25rem" }}>
          <div style={sectionHeader}>{group}</div>
          {fields.map(([key, cfg]) =>
            renderField(key, cfg, currentProps[key], (v) => update(key, v)),
          )}
        </section>
      ))}
    </div>
  );
}
