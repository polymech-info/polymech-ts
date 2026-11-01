import React from 'react';
import { PromptTemplate } from '../types';
import { Save, Download, Upload } from 'lucide-react';
import { T } from '../i18n';

interface TemplateManagerProps {
  prompts: PromptTemplate[];
  currentPrompt: string;
  onSelectPrompt: (prompt: string) => void;
  onSavePrompt: (name: string, text: string) => void;
  onImportPrompts: () => void;
  onExportPrompts: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  prompts,
  currentPrompt,
  onSelectPrompt,
  onSavePrompt,
  onImportPrompts,
  onExportPrompts,
}) => {
  const handleSaveTemplate = () => {
    if (!currentPrompt.trim()) return;
    
    const name = prompt('Enter template name:');
    if (name && name.trim()) {
      onSavePrompt(name.trim(), currentPrompt);
    }
  };

  return (
    <div className="border border-slate-200/50 dark:border-white/30 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-800/90">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Template Picker */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-white mb-2"><T>Templates</T></h4>
          <div className="flex flex-wrap gap-1">
            {prompts.length === 0 ? (
              <span className="text-xs text-slate-500 dark:text-slate-200"><T>No templates saved yet</T></span>
            ) : (
              prompts.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => onSelectPrompt(template.text)}
                  className="text-xs px-2 py-1 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-700 dark:hover:bg-purple-600 text-purple-700 dark:text-white transition-colors duration-200"
                  title={`Load template: ${template.text.substring(0, 50)}...`}
                >
                  {template.name}
                </button>
              ))
            )}
          </div>
        </div>
        
        {/* Right: Template Management Icons */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-white mb-2"><T>Manage</T></h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={!currentPrompt.trim()}
              className="p-2 rounded bg-green-100 hover:bg-green-200 dark:bg-green-600 dark:hover:bg-green-500 text-green-700 dark:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save current prompt as template"
            >
              <Save size={16} />
            </button>
            <button
              type="button"
              onClick={onImportPrompts}
              className="p-2 rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 text-blue-700 dark:text-white transition-colors duration-200"
              title="Import templates from file"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={onExportPrompts}
              disabled={prompts.length === 0}
              className="p-2 rounded bg-orange-100 hover:bg-orange-200 dark:bg-orange-600 dark:hover:bg-orange-500 text-orange-700 dark:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export templates to file"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
