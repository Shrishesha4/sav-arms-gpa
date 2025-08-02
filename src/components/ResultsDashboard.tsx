'use client';

import { useMemo } from 'react';
import type { Course } from '@/types';
import { GRADE_POINTS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ResultsDashboardProps {
  courses: Course[];
}

export default function ResultsDashboard({ courses }: ResultsDashboardProps) {

  const { overallCgpa, totalSubjects, totalCredits, totalFailedSubjects, passedSubjects } = useMemo(() => {
    const validCourses = courses.filter(c => c.grade !== 'NA' && c.credits > 0 && (c.name || c.code));
    
    const passedCourses = validCourses.filter(c => c.grade !== 'F');
    const failedCourses = validCourses.filter(c => c.grade === 'F');
    
    let totalScore = 0;
    let totalPassedCredits = 0;

    passedCourses.forEach(course => {
      totalScore += GRADE_POINTS[course.grade] * course.credits;
      totalPassedCredits += course.credits;
    });

    const overallCgpa = totalPassedCredits > 0 ? (totalScore / totalPassedCredits) : 0;
    
    return {
      overallCgpa,
      totalSubjects: validCourses.length,
      passedSubjects: passedCourses.length,
      totalCredits: totalPassedCredits,
      totalFailedSubjects: failedCourses.length,
    };
  }, [courses]);

  const percentage = overallCgpa * 9.5;
  
  const sortedCourses = useMemo(() => {
    return [...courses]
      .filter(c => c.name || c.code)
      .sort((a,b) => a.year - b.year || a.name.localeCompare(b.name));
  }, [courses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results Dashboard</CardTitle>
        <CardDescription>Your real-time academic performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-primary">Overall CGPA</h3>
          <p className="text-5xl font-bold text-primary-foreground">{overallCgpa.toFixed(2)}</p>
          <p className="text-muted-foreground">Equivalent to {percentage.toFixed(2)}%</p>
          <Progress value={(overallCgpa / 10) * 100} className="mt-2 h-3 bg-white/10" />
          <p className="text-xs text-muted-foreground mt-1">
            *Failed subjects excluded from CGPA calculation
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-primary-foreground">{passedSubjects}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-primary-foreground">{totalCredits}</p>
                <p className="text-xs text-muted-foreground">Credits</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-destructive">{totalFailedSubjects}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
