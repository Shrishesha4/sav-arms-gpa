'use client';

import { useMemo } from 'react';
import type { Course } from '@/types';
import { GRADE_POINTS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ResultsDashboardProps {
  courses: Course[];
}

interface YearStats {
  year: number;
  gpa: number;
  totalCredits: number;
  passedCredits: number;
  failedSubjects: number;
}

export default function ResultsDashboard({ courses }: ResultsDashboardProps) {

  const { overallCgpa, yearWiseStats, totalSubjects, totalCredits, totalFailedSubjects } = useMemo(() => {
    const passedCourses = courses.filter(c => c.grade !== 'F' && c.grade !== 'NA' && c.credits > 0);
    
    let totalScore = 0;
    let totalPassedCredits = 0;

    passedCourses.forEach(course => {
      totalScore += GRADE_POINTS[course.grade] * course.credits;
      totalPassedCredits += course.credits;
    });

    const overallCgpa = totalPassedCredits > 0 ? (totalScore / totalPassedCredits) : 0;
    
    const coursesByYear = courses.reduce((acc, course) => {
        (acc[course.year] = acc[course.year] || []).push(course);
        return acc;
    }, {} as Record<number, Course[]>);

    const yearWiseStats: YearStats[] = Object.entries(coursesByYear).map(([yearStr, yearCourses]) => {
        const year = Number(yearStr);
        const passedYearCourses = yearCourses.filter(c => c.grade !== 'F' && c.grade !== 'NA' && c.credits > 0);

        let yearScore = 0;
        let yearPassedCredits = 0;
        let yearTotalCredits = 0;

        yearCourses.forEach(c => yearTotalCredits += c.credits);
        
        passedYearCourses.forEach(c => {
            yearScore += GRADE_POINTS[c.grade] * c.credits;
            yearPassedCredits += c.credits;
        });

        return {
            year,
            gpa: yearPassedCredits > 0 ? (yearScore / yearPassedCredits) : 0,
            totalCredits: yearTotalCredits,
            passedCredits: yearPassedCredits,
            failedSubjects: yearCourses.filter(c => c.grade === 'F').length
        };
    }).sort((a,b) => a.year - b.year);


    return {
      overallCgpa,
      yearWiseStats,
      totalSubjects: courses.length,
      totalCredits: courses.reduce((sum, c) => sum + c.credits, 0),
      totalFailedSubjects: courses.filter(c => c.grade === 'F').length,
    };
  }, [courses]);

  const percentage = overallCgpa * 9.5;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Results Dashboard</CardTitle>
        <CardDescription>Your real-time academic performance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-primary">Overall CGPA</h3>
          <p className="text-5xl font-bold">{overallCgpa.toFixed(2)}</p>
          <p className="text-muted-foreground">Equivalent to {percentage.toFixed(2)}%</p>
          <Progress value={overallCgpa * 10} className="mt-2 h-3" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">{totalSubjects}</CardTitle>
                    <CardDescription>Subjects</CardDescription>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">{totalCredits}</CardTitle>
                    <CardDescription>Credits</CardDescription>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl text-destructive">{totalFailedSubjects}</CardTitle>
                    <CardDescription>Failed</CardDescription>
                </CardHeader>
            </Card>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-2">Year-wise GPA</h3>
            <div className="space-y-3">
                {yearWiseStats.length > 0 ? yearWiseStats.map(stat => (
                     <div key={stat.year} className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Year {stat.year} GPA</span>
                            <span className="font-bold text-lg text-primary">{stat.gpa.toFixed(2)}</span>
                        </div>
                        <Progress value={stat.gpa * 10} className="mt-1 h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            {stat.passedCredits}/{stat.totalCredits} credits passed
                        </p>
                    </div>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Add courses to see year-wise analysis.
                    </p>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
