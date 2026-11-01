import { useEffect, useState } from "react";

import { bootWidgetSystem } from "@/widgets/bootstrap/boot";
import { ExtensionSlot } from "@/widgets/slots/ExtensionSlot";
import { widgetRegistry } from "@/widgets/system";
import { TextBlockWidget } from "@/widgets/widgets/sample/TextBlockWidget";
import type { TextBlockWidgetProps } from "@/widgets/widgets/sample/TextBlockWidget";

const demoProps: TextBlockWidgetProps = {
  widgetInstanceId: "demo-instance",
  widgetDefId: "text-block",
  isEditMode: false,
  title: "Registered widget preview",
  body: "Props match BaseWidgetProps + text-block fields (see packages/ui/docs/widgets-api.md).",
  async onPropsChange() {},
};

export function WidgetSystemDemoPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void bootWidgetSystem().then(() => setReady(true));
  }, []);

  const defs = ready ? widgetRegistry.getAll() : [];

  return (
    <section className="nested">
      <h1>Widget system scaffold</h1>
      <p className="muted">
        Implements registry, <code>PluginManager</code>, <code>PluginAPI</code>, hooks, and{" "}
        <code>ExtensionSlot</code> per <code>packages/ui/docs/widgets-api.md</code> §1–2, §13.
      </p>

      <div className="widget-demo-toolbar">
        <span className="muted">Slot preview (edit chrome)</span>
        <div className="widget-demo-toolbar-inner">
          <ExtensionSlot
            slotId="editor:toolbar:end"
            pageId="widget-system-demo"
            isEditMode
          />
        </div>
      </div>

      <article className="panel">
        <h2>Registry ({ready ? defs.length : "…"})</h2>
        {ready ? (
          <ul>
            {defs.map((d) => (
              <li key={d.metadata.id}>
                <code>{d.metadata.id}</code> — {d.metadata.name}
              </li>
            ))}
          </ul>
        ) : (
          <p>Bootstrapping plugins…</p>
        )}
      </article>

      <TextBlockWidget {...demoProps} />
    </section>
  );
}
