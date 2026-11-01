import { demoToolbarPlugin } from "@/widgets/bootstrap/demoToolbarPlugin";
import { coreWidgetsPlugin } from "@/widgets/bootstrap/corePlugin";
import { pluginManager } from "@/widgets/system";

let booted = false;

/** Idempotent — safe to call from a route or app root. */
export async function bootWidgetSystem(): Promise<void> {
  if (booted) return;
  booted = true;
  await pluginManager.register(coreWidgetsPlugin);
  await pluginManager.register(demoToolbarPlugin);
}
