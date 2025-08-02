import type { Grade } from '@/types';

export const GRADE_POINTS: Record<Grade, number> = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  F: 0,
  NA: 0,
};

export const GRADES: Grade[] = ['S', 'A', 'B', 'C', 'D', 'F'];
