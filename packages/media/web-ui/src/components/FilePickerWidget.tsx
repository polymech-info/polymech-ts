import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { FolderOpen, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilePickerWidgetProps {
  id: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  schema: any;
  uiSchema: any;
  multiple?: boolean;
  directory?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}

const FilePickerWidget: React.FC<FilePickerWidgetProps> = ({
  id,
  value,
  onChange,
  placeholder,
  uiSchema,
  multiple = false,
  directory = false,
  disabled = false,
  readonly = false,
}) => {
  const [inputValue, setInputValue] = React.useState(
    Array.isArray(value) ? value.join(', ') : value || ''
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (multiple) {
      const files = newValue.split(',').map(f => f.trim()).filter(f => f.length > 0);
      onChange(files);
    } else {
      onChange(newValue);
    }
  };

  const handleFilePicker = async () => {
    console.log('File picker button clicked');
    console.log('window.electronAPI available:', !!window.electronAPI);
    
    if (!window.electronAPI) {
      console.warn('Electron API not available - running in browser mode');
      // Fallback for Electron without prompt
      alert('File picker not available. Please type the file path directly in the input field.');
      return;
    }

    try {
      const options: any = {
        properties: []
      };

      if (directory) {
        options.properties.push('openDirectory');
      } else {
        options.properties.push('openFile');
      }

      if (multiple) {
        options.properties.push('multiSelections');
      }

      // Add file filters based on context
      if (!directory && id.includes('src')) {
        options.filters = [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg'] },
          { name: 'All Files', extensions: ['*'] }
        ];
      }

      console.log('Calling showFileDialog with options:', options);
      const result = await window.electronAPI.showFileDialog(options);
      console.log('File dialog result:', result);
      
      if (result && result.length > 0) {
        if (multiple) {
          setInputValue(result.join(', '));
          onChange(result);
        } else {
          setInputValue(result[0]);
          onChange(result[0]);
        }
      }
    } catch (error) {
      console.error('File picker error:', error);
    }
  };

  const handleSaveAs = async () => {
    if (!window.electronAPI) {
      console.warn('Electron API not available - running in browser mode');
      return;
    }

    try {
      const options = {
        title: 'Save As',
        defaultPath: inputValue || 'output',
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      };

      const result = await window.electronAPI.showSaveDialog(options);
      
      if (result) {
        setInputValue(result);
        onChange(result);
      }
    } catch (error) {
      console.error('Save dialog error:', error);
    }
  };

  const clearValue = () => {
    setInputValue('');
    onChange(multiple ? [] : '');
  };

  const isDestination = id.includes('dst') || id.includes('destination');
  const Icon = directory ? FolderOpen : File;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            className={cn(
              "pr-8",
              inputValue && "pr-16"
            )}
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearValue}
              title="Clear"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {isDestination ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveAs}
            disabled={disabled}
            title="Save As..."
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Save As...
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleFilePicker}
            disabled={disabled}
            title={directory ? "Select Folder" : "Select Files"}
          >
            <Icon className="h-4 w-4 mr-2" />
            Browse...
          </Button>
        )}
      </div>
      
      {uiSchema?.['ui:help'] && (
        <p className="text-sm text-muted-foreground">
          {uiSchema['ui:help']}
        </p>
      )}
      
      {Array.isArray(value) && value.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {value.length} file(s) selected
        </div>
      )}
    </div>
  );
};

export default FilePickerWidget;
