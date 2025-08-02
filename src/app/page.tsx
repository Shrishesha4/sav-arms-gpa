'use client';

import { useState } from 'react';
import type { Course, Grade } from '@/types';
import { extractGradesFromTranscript, type ExtractGradesFromTranscriptOutput } from '@/ai/flows/extract-grades-from-transcript';
import Header from '@/components/Header';
import TranscriptUploader from '@/components/TranscriptUploader';
import CourseManager from '@/components/CourseManager';
import ResultsDashboard from '@/components/ResultsDashboard';
import PortalLogin from '@/components/PortalLogin';
import { useToast } from '@/hooks/use-toast';
import type { ScrapedCourse } from './api/scrape/types';

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const { toast } = useToast();
  
  const handleAiExtraction = (extractedData: ExtractGradesFromTranscriptOutput) => {
    const newCourses: Course[] = extractedData.map(item => {
      // Normalize grade to match the expected type
      const grade = item.grade.toUpperCase() as Grade;
      const validGrades: Grade[] = ['S', 'A', 'B', 'C', 'D', 'F'];
      
      return {
        id: crypto.randomUUID(),
        code: item.courseCode,
        name: item.courseName,
        credits: item.credits,
        grade: validGrades.includes(grade) ? grade : 'NA',
        year: 1, // Default to year 1, user can change it
      };
    });

    setCourses(prevCourses => [...prevCourses, ...newCourses]);
    toast({
      title: 'Extraction Complete',
      description: `${newCourses.length} courses have been extracted and added. Please review and assign them to the correct academic year.`,
    });
  };

  const handlePortalExtraction = (extractedData: ScrapedCourse[]) => {
    const yearMap: { [key: string]: number } = {};
    let yearCounter = 1;

    const newCourses: Course[] = extractedData.map(item => {
      const grade = item.grade.toUpperCase() as Grade;
      const validGrades: Grade[] = ['S', 'A', 'B', 'C', 'D', 'F'];

      if (!yearMap[item.monthYear]) {
        yearMap[item.monthYear] = yearCounter++;
      }
      
      return {
        id: crypto.randomUUID(),
        code: item.courseCode,
        name: item.courseName,
        credits: 4, // Defaulting credits, as it's not in the scraped data.
        grade: validGrades.includes(grade) ? grade : 'NA',
        year: yearMap[item.monthYear],
      };
    });

    setCourses(newCourses);
    toast({
      title: 'Portal Fetch Complete',
      description: `${newCourses.length} courses have been fetched and added. Please review the credits and details.`,
    });
  };


  const addYear = () => {
    const existingYears = [...new Set(courses.map(c => c.year))];
    const newYearNumber = existingYears.length > 0 ? Math.max(...existingYears) + 1 : 1;
    const newCourse: Course = {
      id: crypto.randomUUID(),
      code: '',
      name: '',
      credits: 0,
      grade: 'NA',
      year: newYearNumber,
    };
    setCourses([...courses, newCourse]);
  };
  
  const addCourse = (year: number) => {
    const newCourse: Course = {
      id: crypto.randomUUID(),
      code: '',
      name: '',
      credits: 0,
      grade: 'NA',
      year: year,
    };
    setCourses([...courses, newCourse]);
  };

  const updateCourse = (updatedCourse: Course) => {
    setCourses(courses.map(course => (course.id === updatedCourse.id ? updatedCourse : course)));
  };

  const removeCourse = (courseId: string) => {
    setCourses(courses.filter(course => course.id !== courseId));
  };


  return (
    <main className="container mx-auto p-4 md:p-8">
      <Header />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <PortalLogin onExtraction={handlePortalExtraction} />
          <TranscriptUploader onExtraction={handleAiExtraction} />
          <CourseManager 
            courses={courses}
            onAddCourse={addCourse}
            onUpdateCourse={updateCourse}
            onRemoveCourse={removeCourse}
            onAddYear={addYear}
          />
        </div>

        <div className="lg:col-span-1 sticky top-8">
          <ResultsDashboard courses={courses} />
        </div>
      </div>
    </main>
  );
}
