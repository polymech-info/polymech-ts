import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, getCurrentLang, supportedLanguages } from '../i18n';

interface HeaderProps {
  showDebugPanel: boolean;
  setShowDebugPanel: (show: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({
  showDebugPanel,
  setShowDebugPanel,
  isDarkMode,
  toggleTheme,
}) => {
  const navigate = useNavigate();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const currentLang = getCurrentLang();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (langCode: string) => {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    url.searchParams.set('lang', langCode);
    window.location.href = url.toString();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="mb-4 sm:mb-8 space-y-3 sm:space-y-4">
      {/* Title on its own row */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold accent-text drop-shadow-sm flex justify-center gap-4">
          <span><T>Image</T></span>
          <span><T>Wizard</T></span>
        </h1>
      </div>
      
      {/* Controls row - single row layout */}
      <div className="flex justify-center sm:justify-end items-center gap-2">
        {/* Button group - single row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="glass-button p-2 sm:p-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              title="Change Language"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.723 1.447a1 1 0 11-1.79-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline text-xs">
                {supportedLanguages.find(l => l.code === currentLang)?.name || 'EN'}
              </span>
            </button>
            
            {/* Language Dropdown */}
            {showLangDropdown && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      handleLanguageChange(lang.code);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      currentLang === lang.code ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Debug Panel Toggle */}
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="glass-button p-2 sm:p-3 rounded-xl hover:shadow-lg transition-all duration-300"
            title="Toggle Debug Panel"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="glass-button p-2 sm:p-3 rounded-xl hover:shadow-lg transition-all duration-300"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>

          {/* Settings Button */}
          <button
            onClick={() => navigate('/settings')}
            className="glass-button p-2 sm:p-3 rounded-xl hover:shadow-lg transition-all duration-300"
            title="Settings"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
      </div>
    </div>
  );
};

export default Header;
