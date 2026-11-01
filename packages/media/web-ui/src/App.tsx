import { useState, useEffect } from 'react';
import SchemaForm from './components/SchemaForm';

interface AppConfig {
  schema?: any;
  uiSchema?: any;
  formData?: any;
  title?: string;
  cliOptions?: any;
}

function App() {
  const [config, setConfig] = useState<AppConfig>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('App useEffect - checking Electron APIs...');
    console.log('window.electronAPI:', window.electronAPI);
    console.log('window.ipc:', window.ipc);
    
    // Check if we're running in Electron
    if (window.ipc) {
      // Listen for configuration from main process
      const handleConfig = (configData: AppConfig) => {
        console.log('Received config:', configData);
        setConfig(configData);
        setIsReady(true);
      };

      window.ipc.on('app-config', handleConfig);
      
      // Request initial config
      window.ipc.send('request-config');

      return () => {
        window.ipc.clear('app-config');
      };
    } else {
      // Running in browser - use default config for development
      setIsReady(true);
    }
  }, []);

  const handleFormSubmit = (data: any) => {
    console.log('App received form data:', data);
  };

  const handleFormCancel = () => {
    console.log('Form cancelled');
    if (window.ipc) {
      window.ipc.send('cancel');
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SchemaForm
        schema={config.schema}
        uiSchema={config.uiSchema}
        formData={config.formData}
        title={config.title}
        cliOptions={config.cliOptions}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    </div>
  );
}

export default App;
