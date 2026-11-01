import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ImageWizard from "./components/ImageWizard";
import Settings from "./components/Settings";

function App() {
  const [apiKey, setApiKey] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme management
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <ImageWizard
                apiKey={apiKey}
                setApiKey={setApiKey}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <Settings
                apiKey={apiKey}
                setApiKey={setApiKey}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
              />
            } 
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
