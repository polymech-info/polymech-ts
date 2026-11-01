import React from 'react';
import { ProviderManagement } from '@/components/filters/ProviderManagement';
import { T } from '@/i18n';

const ProviderSettings: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              <T>Provider Settings</T>
            </h1>
            <p className="text-muted-foreground">
              <T>Configure AI service providers for content generation and filtering</T>
            </p>
          </div>

          {/* Provider Management Component */}
          <ProviderManagement />
        </div>
      </main>
    </div>
  );
};

export default ProviderSettings;
