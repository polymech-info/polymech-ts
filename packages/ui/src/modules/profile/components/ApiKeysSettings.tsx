import React from "react";
import { Save } from "lucide-react";
import { T, translate } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";

interface ApiKeysSettingsProps {
  secrets: Record<string, string>;
  handleSecretChange: (key: string, value: string) => void;
  handleSecretFocus: (key: string) => void;
  onSubmit: () => void;
  updating: boolean;
}

export const ApiKeysSettings: React.FC<ApiKeysSettingsProps> = ({
  secrets,
  handleSecretChange,
  handleSecretFocus,
  onSubmit,
  updating
}) => {
  const fields = [
    { id: 'google_api_key', label: 'Google API Key', hint: 'For Google services' },
    { id: 'openai_api_key', label: 'OpenAI API Key', hint: 'For AI image generation' },
    { id: 'replicate_api_key', label: 'Replicate API Key', hint: 'For Replicate AI models' },
    { id: 'bria_api_key', label: 'Bria API Key', hint: 'For Bria AI services' },
    { id: 'huggingface_api_key', label: 'HuggingFace API Key', hint: 'For HuggingFace models' },
    { id: 'aimlapi_api_key', label: 'AIMLAPI API Key', hint: 'For AIMLAPI services' },
    { id: 'openrouter_api_key', label: 'OpenRouter API Key', hint: 'For OpenRouter AI models' },
    { id: 'serpapi_api_key', label: 'SerpAPI Key', hint: 'For search engine results' },
    { id: 'scrapeless_api_key', label: 'Scrapeless API Key', hint: 'For web scraping and crawling' },
  ];

  return (
    <CardContent className="space-y-4">
      {fields.map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}><T>{field.label}</T></Label>
          <Input
            id={field.id}
            type="password"
            value={secrets[field.id] || ''}
            onChange={(e) => handleSecretChange(field.id, e.target.value)}
            onFocus={() => handleSecretFocus(field.id)}
            placeholder={translate(`Enter your ${field.label}`)}
          />
          <p className="text-sm text-muted-foreground">
            <T>{field.hint}</T> <T>(stored securely)</T>
          </p>
        </div>
      ))}

      <Button
        onClick={onSubmit}
        disabled={updating}
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        <T>{updating ? 'Saving...' : 'Save API Keys'}</T>
      </Button>
    </CardContent>
  );
};
