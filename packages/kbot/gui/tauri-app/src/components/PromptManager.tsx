import React, { useState } from 'react';
import { PromptTemplate } from '../types';

interface PromptManagerProps {
  prompts: PromptTemplate[];
  onSelectPrompt: (promptText: string) => void;
  onSavePrompt: (name: string, text: string) => void;
  onImportPrompts: () => void;
  onExportPrompts: () => void;
  currentPrompt: string;
}

const PromptManager: React.FC<PromptManagerProps> = ({
  prompts,
  onSelectPrompt,
  onSavePrompt,
  onImportPrompts,
  onExportPrompts,
  currentPrompt,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');

  const handleSaveClick = () => {
    if (currentPrompt.trim()) {
      setShowSaveModal(true);
    }
  };

  const handleSaveConfirm = () => {
    if (newPromptName.trim() && currentPrompt.trim()) {
      onSavePrompt(newPromptName, currentPrompt);
      setNewPromptName('');
      setShowSaveModal(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Templates:</span>
        {prompts.map((prompt) => (
          <button
            key={prompt.name}
            type="button"
            onClick={() => onSelectPrompt(prompt.text)}
            className="glass-button text-xs px-3 py-1 rounded-full"
            title={prompt.text}
          >
            {prompt.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button type="button" onClick={handleSaveClick} className="glass-button text-sm px-4 py-2 rounded-lg" disabled={!currentPrompt.trim()}>
          Save Current Prompt
        </button>
        <button type="button" onClick={onImportPrompts} className="glass-button text-sm px-4 py-2 rounded-lg">
          Import
        </button>
        <button type="button" onClick={onExportPrompts} className="glass-button text-sm px-4 py-2 rounded-lg">
          Export
        </button>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">Save Prompt Template</h3>
            <input
              type="text"
              value={newPromptName}
              onChange={(e) => setNewPromptName(e.target.value)}
              placeholder="Enter template name"
              className="w-full glass-input p-2 rounded-md mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveModal(false)} className="glass-button px-4 py-2 rounded-lg">
                Cancel
              </button>
              <button onClick={handleSaveConfirm} className="glass-button px-4 py-2 rounded-lg border-blue-500">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptManager;
