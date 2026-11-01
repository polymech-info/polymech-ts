import type { WidgetPlugin } from "@/widgets/types";

/**
 * Second plugin: depends on core, injects `editor:toolbar:end` (widgets-api §13 slots).
 */
export const demoToolbarPlugin: WidgetPlugin = {
  id: "polymech:demo-toolbar",
  name: "Demo toolbar slot",
  version: "0.0.0",
  priority: 10,
  requires: ["polymech:core-widgets"],
  setup(api) {
    api.injectSlot("editor:toolbar:end", function DemoToolbarEnd(props) {
      return (
        <span
          className="widget-slot-pill"
          title="Injected via PluginAPI.injectSlot"
        >
          editor:toolbar:end · {props.pageId}
        </span>
      );
    });
  },
};
