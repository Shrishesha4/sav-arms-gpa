'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';

interface ApiKeyManagerProps {
  onApiKeyChange: (key: string | null) => void;
}

export default function ApiKeyManager({ onApiKeyChange }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      onApiKeyChange(storedKey);
    }
  }, [onApiKeyChange]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey);
      onApiKeyChange(apiKey);
      toast({
        title: 'API Key Saved',
        description: 'Your Gemini API key has been securely saved in your browser.',
      });
    } else {
      localStorage.removeItem('gemini_api_key');
      onApiKeyChange(null);
      toast({
        title: 'API Key Removed',
        description: 'Your API key has been removed.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-primary" />
          <span>Gemini API Key</span>
        </CardTitle>
        <CardDescription>Enter your key to enable AI-powered grade extraction.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="api-key">Your API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
          />
        </div>
        <Button onClick={handleSaveKey} className="mt-4 w-full">
          Save Key
        </Button>
      </CardContent>
    </Card>
  );
}
