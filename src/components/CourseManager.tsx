'use client';

import type { Course, Grade } from '@/types';
import { GRADES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle } from 'lucide-react';

interface CourseManagerProps {
  courses: Course[];
  onAddCourse: (year: number) => void;
  onUpdateCourse: (course: Course) => void;
  onRemoveCourse: (id: string) => void;
  onAddYear: () => void;
}

export default function CourseManager({
  courses,
  onAddCourse,
  onUpdateCourse,
  onRemoveCourse,
  onAddYear,
}: CourseManagerProps) {
  
  const validCourses = courses.filter(course => 
    course.code.trim() !== '' || 
    course.name.trim() !== '' || 
    course.grade !== 'NA' || 
    course.credits > 0
  );

  const coursesByYear = validCourses.reduce((acc, course) => {
    (acc[course.year] = acc[course.year] || []).push(course);
    return acc;
  }, {} as Record<number, Course[]>);

  // Sort years in descending order (most recent first)
  const years = Object.keys(coursesByYear).map(Number).sort((a, b) => b - a);
  
  const getYearStats = (yearCourses: Course[]) => {
    const validGradeCourses = yearCourses.filter(c => c.grade !== 'NA' && c.credits > 0);
    const passedCourses = validGradeCourses.filter(c => c.grade !== 'F');
    
    let totalScore = 0;
    let totalCredits = 0;
    
    passedCourses.forEach(course => {
      const gradePoints: Record<Exclude<Grade, 'NA'>, number> = {
        'S': 9.5,
        'A': 8.5,
        'B': 7.5,
        'C': 6.5,
        'D': 5.5,
        'F': 0
      };
      
      if (course.grade !== 'NA') {
        const points = gradePoints[course.grade] || 0;
        totalScore += points * course.credits;
        totalCredits += course.credits;
      }
    });
    
    const yearGpa = totalCredits > 0 ? totalScore / totalCredits : 0;
    return {
      gpa: yearGpa,
      totalCourses: yearCourses.length,
      passedCourses: passedCourses.length,
      failedCourses: validGradeCourses.filter(c => c.grade === 'F').length,
      totalCredits
    };
  };

  const addYear = () => {
    const currentYear = new Date().getFullYear();
    const existingYears = years;
    
    // Find next available year
    let newYear = currentYear;
    while (existingYears.includes(newYear)) {
      newYear++;
    }
    
    onAddCourse(newYear);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course & Grade Manager</CardTitle>
        <CardDescription>
          Courses organized by actual academic years (2023, 2024, 2025, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {validCourses.length === 0 ? (
           <div className="text-center text-muted-foreground py-8">
            <p>Your courses will appear here.</p>
            <p className="text-sm">Use one of the methods above to add your subjects.</p>
          </div>
        ) : (
        <Accordion type="multiple" defaultValue={years.map(y => `year-${y}`)} className="w-full">
          {years.map(year => {
            const yearCourses = coursesByYear[year] || [];
            const stats = getYearStats(yearCourses);
            
            return (
              <AccordionItem value={`year-${year}`} key={year}>
                <AccordionTrigger className="text-lg font-bold">
                  <div className="flex justify-between items-center w-full pr-4">
                    <span>Year {year}</span>
                    <div className="flex gap-4 text-sm font-normal text-muted-foreground">
                      <span>{stats.totalCourses} courses</span>
                      <span>GPA: {stats.gpa.toFixed(2)}</span>
                      <span>{stats.totalCredits} credits</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                      <div className="col-span-3 md:col-span-2">Course Code</div>
                      <div className="col-span-5 md:col-span-5">Course Name</div>
                      <div className="col-span-2 md:col-span-2">Credits</div>
                      <div className="col-span-2 md:col-span-2">Grade</div>
                      <div className="col-span-0 md:col-span-1"></div>
                    </div>
                    {yearCourses.map(course => (
                      <div key={course.id} className="grid grid-cols-12 gap-2 items-center">
                        <Input
                          placeholder="CS101"
                          value={course.code}
                          onChange={(e) => onUpdateCourse({ ...course, code: e.target.value })}
                          className="col-span-3 md:col-span-2"
                        />
                        <Input
                          placeholder="Intro to Programming"
                          value={course.name}
                          onChange={(e) => onUpdateCourse({ ...course, name: e.target.value })}
                          className="col-span-5"
                        />
                        <Input
                          type="number"
                          placeholder="3"
                          value={course.credits || ''}
                          onChange={(e) => onUpdateCourse({ ...course, credits: Number(e.target.value) || 0 })}
                          className="col-span-2"
                        />
                        <Select
                          value={course.grade}
                          onValueChange={(grade: Grade) => onUpdateCourse({ ...course, grade })}
                        >
                          <SelectTrigger className="col-span-2">
                            <SelectValue placeholder="Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADES.map(g => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveCourse(course.id)}
                          className="col-span-12 md:col-span-1 md:col-start-12"
                          aria-label="Remove course"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                     <Button variant="outline" size="sm" onClick={() => onAddCourse(year)} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Subject to {year}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        )}
        <Button onClick={addYear} className="mt-6 w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Year
        </Button>
      </CardContent>
    </Card>
  );
}
