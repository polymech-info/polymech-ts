import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveToStore } from '../lib/init';
import { T } from '../i18n';

interface SettingsProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  apiKey,
  setApiKey,
  isDarkMode,
  toggleTheme,
}) => {
  const navigate = useNavigate();
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSave = async () => {
    console.log('💾 Saving API key:', localApiKey ? '***configured***' : 'empty');
    setApiKey(localApiKey);
    
    // Save API key to persistent store
    try {
      await saveToStore({ apiKey: localApiKey });
      console.log('✅ API key saved to store successfully');
    } catch (error) {
      console.error('❌ Failed to save API key:', error);
      // Don't navigate if save failed
      return;
    }
    
    // Navigate back to main view
    navigate('/');
  };

  return (
    <main className="h-full w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex flex-col items-center overflow-hidden transition-colors duration-500">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-200/30 to-blue-200/30 dark:from-cyan-500/20 dark:to-blue-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-4xl relative z-10 h-full flex flex-col overflow-hidden p-2 sm:p-6">
        {/* Header */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="glass-button p-2 sm:p-3 rounded-xl hover:shadow-lg transition-all duration-300"
              title="Back to Image Wizard"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold accent-text drop-shadow-sm"><T>Settings</T></h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Settings Form */}
          <div className="glass-card p-4 sm:p-6 glass-shimmer shadow-2xl space-y-4">
          {/* API Key Section */}
          <div className="space-y-3">
            <div>
              <label htmlFor="api-key" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <T>Google AI API Key</T>
              </label>
              <div className="space-y-2">
                <input
                  id="api-key"
                  type="password"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="Enter your Google AI API key"
                  className="w-full glass-input p-3 sm:p-4 rounded-xl"
                />
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${localApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {localApiKey ? <T>API key configured</T> : <T>API key required for image generation</T>}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                <T>Get your API key from</T>{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <T>Google AI Studio</T>
                </a>
              </p>
            </div>
          </div>

          {/* Theme Section */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300"><T>Theme</T></h3>
                <p className="text-xs text-slate-500 dark:text-slate-400"><T>Choose your preferred color scheme</T></p>
              </div>
              <button
                onClick={toggleTheme}
                className="glass-button p-3 rounded-xl hover:shadow-lg transition-all duration-300"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div>
              <button
                onClick={handleSave}
                className="w-full glass-button bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                <T>Save Settings</T>
              </button>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
};

export default Settings;
