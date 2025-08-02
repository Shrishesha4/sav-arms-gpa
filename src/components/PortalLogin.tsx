'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { ScrapedCourse } from '@/app/api/scrape/types';

interface PortalLoginProps {
    onExtraction: (data: ScrapedCourse[]) => void;
}

export default function PortalLogin({ onExtraction }: PortalLoginProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleLogin = async () => {
        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'An unknown error occurred.');
            }
            
            onExtraction(result.courses);
            toast({
                title: 'Login Successful',
                description: `Successfully fetched ${result.courses.length} courses.`,
            });
            
        } catch (e: any) {
            const errorMessage = e.message || 'An unknown error occurred during login.';
            setError(errorMessage);
            toast({
                title: 'Login Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="username" className="text-primary-foreground/80">Username</Label>
                <Input 
                    id="username" 
                    placeholder="Your ARMS username" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password" className="text-primary-foreground/80">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    placeholder="Your ARMS password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Button onClick={handleLogin} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in & Fetching...
                    </>
                ) : (
                    'Login & Fetch Grades'
                )}
            </Button>
        </div>
    );
}
