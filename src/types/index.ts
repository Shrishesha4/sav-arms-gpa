export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | 'NA';

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  grade: Grade;
  year: number;
}
