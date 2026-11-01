import React, { useState, useEffect } from 'react';
import { T } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { WidgetDefinition } from '@/lib/widgetRegistry';
import { WidgetPropertiesForm } from './WidgetPropertiesForm';

interface WidgetSettingsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Record<string, any>) => void;
  widgetDefinition: WidgetDefinition;
  currentProps: Record<string, any>;
  widgetInstanceId?: string;
  onRename?: (newId: string) => void;
  onCancel?: () => void;
}

const WidgetSettingsManagerComponent: React.FC<WidgetSettingsManagerProps> = ({
  isOpen,
  onClose,
  onSave,
  widgetDefinition,
  currentProps,
  widgetInstanceId,
  onRename,
  onCancel
}) => {
  const [settings, setSettings] = useState<Record<string, any>>(currentProps);

  // Reset settings when modal opens
  useEffect(() => {
    if (isOpen) {
      // Merge current props with default props
      const defaultProps = widgetDefinition.metadata.defaultProps || {};
      setSettings({ ...defaultProps, ...currentProps });
    }
  }, [isOpen, currentProps, widgetDefinition.metadata.defaultProps]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleCancel = () => {
    setSettings(currentProps);
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Treat closing via backdrop/ESC as cancel
        handleCancel();
      } else {
        // Should be handled by isOpen prop, but Dialog might invoke this
        // This branch is rarely hit if controlled, but good for safety
      }
    }}>
      <DialogContent
        className="sm:max-w-lg max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>
            <T>{widgetDefinition.metadata.name} Settings</T>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto scrollbar-custom py-2">
          <WidgetPropertiesForm
            widgetDefinition={widgetDefinition}
            currentProps={settings}
            onSettingsChange={setSettings}
            widgetInstanceId={widgetInstanceId}
            onRename={onRename}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <T>Cancel</T>
          </Button>
          <Button onClick={handleSave}>
            <T>Save Settings</T>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Custom comparison function for React.memo
const areWidgetSettingsPropsEqual = (
  prevProps: WidgetSettingsManagerProps,
  nextProps: WidgetSettingsManagerProps
): boolean => {
  // Always re-render if modal open state changes
  if (prevProps.isOpen !== nextProps.isOpen) return false;

  // Always re-render if widget definition changes
  if (prevProps.widgetDefinition.metadata.id !== nextProps.widgetDefinition.metadata.id) return false;

  // If modal is closed, don't re-render for prop changes (optimization)
  if (!prevProps.isOpen && !nextProps.isOpen) return true;

  // If modal is open, compare current props deeply
  if (prevProps.isOpen && nextProps.isOpen) {
    const prevPropsKeys = Object.keys(prevProps.currentProps);
    const nextPropsKeys = Object.keys(nextProps.currentProps);

    if (prevPropsKeys.length !== nextPropsKeys.length) return false;

    for (const key of prevPropsKeys) {
      if (prevProps.currentProps[key] !== nextProps.currentProps[key]) return false;
    }
  }

  return true;
};

// Export memoized component
export const WidgetSettingsManager = React.memo(WidgetSettingsManagerComponent, areWidgetSettingsPropsEqual);
