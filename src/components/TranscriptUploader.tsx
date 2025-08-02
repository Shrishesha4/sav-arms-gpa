'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud, FileImage, Loader2, AlertCircle } from 'lucide-react';
import { extractGradesFromTranscript, ExtractGradesFromTranscriptOutput } from '@/ai/flows/extract-grades-from-transcript';

interface TranscriptUploaderProps {
  onExtraction: (data: ExtractGradesFromTranscriptOutput) => void;
}

export default function TranscriptUploader({ onExtraction }: TranscriptUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    } else {
      setError('Please select a valid image file.');
      setFile(null);
      setPreview(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleExtract = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const base64Image = await fileToBase64(file);
      const result = await extractGradesFromTranscript({ transcriptImage: base64Image });
      if (result && result.length > 0) {
        onExtraction(result);
      } else {
        throw new Error("AI couldn't find any courses. Please check the image or try manual entry.");
      }
    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred during extraction.';
      setError(errorMessage);
      toast({
        title: 'Extraction Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-primary" />
          <span>Upload Transcript (or)</span>
        </CardTitle>
        <CardDescription>
          Drag & drop or select a screenshot of your academic transcript to automatically extract grades with AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
          />
          {preview && file ? (
             <div className="flex flex-col items-center gap-4">
              <Image
                src={preview}
                alt="Transcript preview"
                width={200}
                height={200}
                className="rounded-md object-contain max-h-48 w-auto"
                data-ai-hint="transcript screenshot"
              />
               <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                {file.name}
              </p>
             </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <UploadCloud className="w-12 h-12" />
              <p>Drag & drop an image here, or</p>
              <Button size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                Browse File
              </Button>
            </div>
          )}
        </div>
        
        {error && (
            <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <Button onClick={handleExtract} disabled={!file || isLoading} className="mt-4 w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Extracting Grades...
            </>
          ) : (
            'Extract with AI'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
