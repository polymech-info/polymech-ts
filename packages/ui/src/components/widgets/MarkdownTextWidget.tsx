import React, { useState, useMemo, Suspense } from 'react';
import { T } from '@/i18n';
import {
  FileText,
  Type,
} from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load the editor component
const MarkdownTextWidgetEdit = React.lazy(() => import('./MarkdownTextWidget-Edit'));

interface MarkdownTextWidgetProps {
  isEditMode?: boolean;
  content?: string;
  placeholder?: string;
  templates?: Array<{ name: string; template: string }>;
  // Widget instance management
  widgetInstanceId?: string;
  onPropsChange?: (props: Record<string, any>) => void;
  contextVariables?: Record<string, any>;
  /** Injected by the layout system (FlexContainerEdit) — merged with contextVariables */
  variables?: Record<string, any>;
}

const MarkdownTextWidget: React.FC<MarkdownTextWidgetProps> = ({
  isEditMode = false,
  content: propContent = '',
  placeholder: propPlaceholder = 'Enter your text here...',
  templates: propTemplates = [],
  onPropsChange,
  contextVariables,
  variables,
}) => {
  // Merge: layout-injected `variables` + explicit `contextVariables`
  const effectiveVariables = useMemo(() => {
    if (!variables && !contextVariables) return undefined;
    return { ...(variables || {}), ...(contextVariables || {}) };
  }, [variables, contextVariables]);
  const [isEditing, _setIsEditing] = useState(false);

  // If in layout edit mode and not editing, show preview
  if (isEditMode && !isEditing) {
    return (
      <Card className="border-2 border-dashed" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <CardContent className="p-4">
          {propContent ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span><T>Text Block</T></span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => _setIsEditing(true)}
                >
                  <Type className="h-3 w-3 mr-2" />
                  <T>Edit</T>
                </Button>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert line-clamp-3">
                <MarkdownRenderer content={propContent} variables={effectiveVariables} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <FileText className="h-12 w-12 mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-3">
                <T>No content yet</T>
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => _setIsEditing(true)}
              >
                <Type className="h-3 w-3 mr-2" />
                <T>Add Content</T>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Editing mode (layout edit mode + editing state)
  if (isEditMode && isEditing) {
    return (
      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
        <Suspense fallback={
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-muted rounded mb-2"></div>
                <div className="h-3 w-32 bg-muted rounded"></div>
              </div>
              <p className="mt-4 text-muted-foreground"><T>Loading Editor...</T></p>
            </CardContent>
          </Card>
        }>
          <MarkdownTextWidgetEdit
            content={propContent}
            placeholder={propPlaceholder}
            templates={propTemplates}
            onPropsChange={onPropsChange}
            contextVariables={effectiveVariables}
            onClose={() => _setIsEditing(false)}
          />
        </Suspense>
      </div>
    );
  }

  // View mode (normal page view)
  if (!propContent) {
    return (
      <Card className="">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            <T>No content available</T>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-2 md:p-6">
        <MarkdownRenderer content={propContent} variables={effectiveVariables} />
      </CardContent>
    </Card>
  );
};

export default MarkdownTextWidget;
