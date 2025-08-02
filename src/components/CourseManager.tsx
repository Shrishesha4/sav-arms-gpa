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
  
  const coursesByYear = courses.reduce((acc, course) => {
    (acc[course.year] = acc[course.year] || []).push(course);
    return acc;
  }, {} as Record<number, Course[]>);

  const years = Object.keys(coursesByYear).map(Number).sort((a, b) => a - b);
  if (years.length === 0) {
      years.push(1);
      coursesByYear[1] = [];
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course & Grade Manager</CardTitle>
        <CardDescription>
          Add, edit, or remove your courses and grades below. Group them by academic year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={years.map(y => `year-${y}`)} className="w-full">
          {years.map(year => (
            <AccordionItem value={`year-${year}`} key={year}>
              <AccordionTrigger className="text-lg font-bold">Academic Year {year}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                    <div className="col-span-3 md:col-span-2">Course Code</div>
                    <div className="col-span-5 md:col-span-5">Course Name</div>
                    <div className="col-span-2 md:col-span-2">Credits</div>
                    <div className="col-span-2 md:col-span-2">Grade</div>
                    <div className="col-span-0 md:col-span-1"></div>
                  </div>
                  {coursesByYear[year]?.map(course => (
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
                        value={course.credits}
                        onChange={(e) => onUpdateCourse({ ...course, credits: Number(e.target.value) })}
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
                      Add Subject to Year {year}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Button onClick={onAddYear} className="mt-6 w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Academic Year
        </Button>
      </CardContent>
    </Card>
  );
}
