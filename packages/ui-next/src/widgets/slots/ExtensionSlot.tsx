import { Fragment, useSyncExternalStore } from "react";

import { slotRegistry } from "@/widgets/system";
import type { SlotId, SlotProps } from "@/widgets/types";

type ExtensionSlotProps = SlotProps & {
  slotId: SlotId;
};

/**
 * Renders all components injected into a named slot (`PluginAPI.injectSlot`).
 * See `packages/ui/docs/widgets-api.md` §13 (Slot Injection).
 */
export function ExtensionSlot(props: ExtensionSlotProps) {
  const { slotId, ...slotProps } = props;

  const entries = useSyncExternalStore(
    slotRegistry.subscribe,
    () => slotRegistry.get(slotId),
    () => slotRegistry.get(slotId),
  );

  return (
    <>
      {entries.map(({ component: Component, entryId }) => (
        <Fragment key={entryId}>
          <Component {...slotProps} />
        </Fragment>
      ))}
    </>
  );
}
