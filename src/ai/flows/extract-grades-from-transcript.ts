// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview An AI agent for extracting grades from an academic transcript screenshot.
 *
 * - extractGradesFromTranscript - A function that handles the grade extraction process.
 * - ExtractGradesFromTranscriptInput - The input type for the extractGradesFromTranscript function.
 * - ExtractGradesFromTranscriptOutput - The return type for the extractGradesFromTranscript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractGradesFromTranscriptInputSchema = z.object({
  transcriptImage: z
    .string()
    .describe(
      "A screenshot of the academic transcript, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractGradesFromTranscriptInput = z.infer<
  typeof ExtractGradesFromTranscriptInputSchema
>;

const ExtractGradesFromTranscriptOutputSchema = z.array(z.object({
  courseCode: z.string().describe('The code of the course.'),
  courseName: z.string().describe('The name of the course.'),
  grade: z.string().describe('The grade received in the course.'),
  credits: z.number().describe('The number of credits for the course.'),
}));

export type ExtractGradesFromTranscriptOutput = z.infer<
  typeof ExtractGradesFromTranscriptOutputSchema
>;

export async function extractGradesFromTranscript(
  input: ExtractGradesFromTranscriptInput
): Promise<ExtractGradesFromTranscriptOutput> {
  return extractGradesFromTranscriptFlow(input);
}

const extractGradesFromTranscriptPrompt = ai.definePrompt({
  name: 'extractGradesFromTranscriptPrompt',
  input: {schema: ExtractGradesFromTranscriptInputSchema},
  output: {schema: ExtractGradesFromTranscriptOutputSchema},
  prompt: `You are an AI assistant specialized in extracting data from academic transcripts.

  Analyze the provided transcript image and extract the following information for each course:

  - Course Code
  - Course Name
  - Grade
  - Credits

  Return the extracted data as a JSON array of objects, where each object represents a course and contains the fields: courseCode, courseName, grade, credits.

  Here is the transcript image: {{media url=transcriptImage}}
  `,
});

const extractGradesFromTranscriptFlow = ai.defineFlow(
  {
    name: 'extractGradesFromTranscriptFlow',
    inputSchema: ExtractGradesFromTranscriptInputSchema,
    outputSchema: ExtractGradesFromTranscriptOutputSchema,
  },
  async input => {
    const {output} = await extractGradesFromTranscriptPrompt(input);
    return output!;
  }
);
