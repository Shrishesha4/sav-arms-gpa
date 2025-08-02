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
    // Filter out courses with no data
    const validCourses = courses.filter(c => c.grade !== 'NA' && c.credits > 0 && (c.name || c.code));
    
    // Separate passed and failed courses
    const passedCourses = validCourses.filter(c => c.grade !== 'F');
    const failedCourses = validCourses.filter(c => c.grade === 'F');
    
    let totalScore = 0;
    let totalCreditsForCgpa = 0;

    // Only calculate CGPA based on PASSED courses (no history of arrears policy)
    passedCourses.forEach(course => {
      totalScore += GRADE_POINTS[course.grade] * course.credits;
      totalCreditsForCgpa += course.credits;
    });

    const overallCgpa = totalCreditsForCgpa > 0 ? (totalScore / totalCreditsForCgpa) : 0;
    
    // Total credits should also only count passed courses for the dashboard
    const totalCreditsSum = passedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
    
    return {
      overallCgpa,
      totalSubjects: validCourses.length, // Total subjects attempted
      passedSubjects: passedCourses.length, // Subjects passed
      totalCredits: totalCreditsSum, // Only credits from passed courses
      totalFailedSubjects: failedCourses.length,
    };
  }, [courses]);

  // Convert CGPA to percentage using the standard formula (CGPA × 9.5)
  const percentage = overallCgpa * 9.5;
  
  const sortedCourses = useMemo(() => {
    return [...courses]
      .filter(c => c.name || c.code) // Only show courses with data
      .sort((a,b) => a.year - b.year || a.name.localeCompare(b.name));
  }, [courses]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Results Dashboard</CardTitle>
        <CardDescription>Your real-time academic performance (No History of Arrears)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-primary">Overall CGPA</h3>
          <p className="text-5xl font-bold">{overallCgpa.toFixed(2)}</p>
          <p className="text-muted-foreground">Equivalent to {percentage.toFixed(2)}%</p>
          <Progress value={(overallCgpa / 10) * 100} className="mt-2 h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            *Failed subjects excluded from CGPA calculation
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-2xl md:text-3xl">{passedSubjects}</CardTitle>
                    <CardDescription>Passed Subjects</CardDescription>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-2xl md:text-3xl">{totalCredits}</CardTitle>
                    <CardDescription>Credits Earned</CardDescription>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-2xl md:text-3xl text-destructive">{totalFailedSubjects}</CardTitle>
                    <CardDescription>Failed (Excluded)</CardDescription>
                </CardHeader>
            </Card>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-2">All Courses</h3>
            <ScrollArea className="h-[250px] w-full pr-4">
                <div className="space-y-3">
                    {sortedCourses.length > 0 ? sortedCourses.map(course => (
                         <div key={course.id} className="p-3 bg-secondary/50 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-medium text-sm">{course.name || <span className="text-muted-foreground">No Name</span>}</p>
                                <p className="text-xs text-muted-foreground">
                                    {course.code || 'N/A'} &bull; {course.credits} Credits &bull; Year {course.year}
                                    {course.grade === 'F' && <span className="text-destructive"> &bull; Not counted in CGPA</span>}
                                </p>
                            </div>
                            <Badge 
                              variant={course.grade === 'F' ? 'destructive' : 'secondary'}
                              className={course.grade === 'NA' ? 'bg-muted text-muted-foreground' : ''}
                            >
                              {course.grade}
                            </Badge>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Your added courses will appear here.
                        </p>
                    )}
                </div>
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
