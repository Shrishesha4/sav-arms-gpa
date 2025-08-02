import type { Grade } from '@/types';

export const GRADE_POINTS: Record<Grade, number> = {
  S: 9.5,
  A: 8.5,
  B: 7.5,
  C: 6.5,
  D: 5.5,
  F: 0,
  NA: 0,
};

export const GRADES: Grade[] = ['S', 'A', 'B', 'C', 'D', 'F'];
