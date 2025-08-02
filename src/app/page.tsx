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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Globe, Upload } from 'lucide-react';

let courseIdCounter = 0;

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const { toast } = useToast();
  
  const handleAiExtraction = (extractedData: ExtractGradesFromTranscriptOutput) => {
    const newCourses: Course[] = extractedData.map(item => {
      const grade = item.grade.toUpperCase() as Grade;
      const validGrades: Grade[] = ['S', 'A', 'B', 'C', 'D', 'F'];
      
      return {
        id: `course-${courseIdCounter++}`,
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
    // Extract actual years from monthYear strings and group courses
    const yearGroups: { [key: number]: ScrapedCourse[] } = {};
    
    extractedData.forEach(course => {
      if (course.monthYear && course.monthYear.trim() !== '') {
        // Extract year from monthYear string (e.g., "June 2023", "2023-2024", etc.)
        const yearMatch = course.monthYear.match(/\b(20\d{2})\b/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          if (!yearGroups[year]) {
            yearGroups[year] = [];
          }
          yearGroups[year].push(course);
        }
      }
    });
  
    // Get sorted years
    const sortedYears = Object.keys(yearGroups).map(Number).sort((a, b) => a - b);
  
    const newCourses: Course[] = extractedData
      .filter(item => {
        return item.courseCode && 
               item.courseName && 
               item.grade && 
               item.monthYear &&
               item.status !== 'IN_PROGRESS' && 
               item.grade !== 'IP';
      })
      .map(item => {
        const grade = item.grade.toUpperCase() as Grade;
        const validGrades: Grade[] = ['S', 'A', 'B', 'C', 'D', 'F'];
        
        // Extract year from monthYear
        const yearMatch = item.monthYear.match(/\b(20\d{2})\b/);
        const actualYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
        
        return {
          id: `course-${courseIdCounter++}`,
          code: item.courseCode,
          name: item.courseName,
          credits: 4,
          grade: validGrades.includes(grade) ? grade : 'NA',
          year: actualYear, // Use actual year (2023, 2024, etc.)
        };
      });
  
    setCourses(newCourses);
    toast({
      title: 'Portal Fetch Complete',
      description: `${newCourses.length} completed courses organized by actual years (${sortedYears.join(', ')}).`,
    });
  };
  
  const addYear = () => {
    const existingYears = [...new Set(courses.map(c => c.year))];
    const newYearNumber = existingYears.length > 0 ? Math.max(...existingYears) + 1 : 1;
    const newCourse: Course = {
      id: `course-${courseIdCounter++}`,
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
      id: `course-${courseIdCounter++}`,
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
    <main className="container mx-auto p-4 md:p-8 dark">
      <Header />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Add Your Courses</CardTitle>
              <CardDescription>
                Import your academic data using one of the methods below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="portal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="portal" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Portal Login
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Screenshot
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <TabsContent value="portal" className="space-y-4">
                    <PortalLogin onExtraction={handlePortalExtraction} />
                  </TabsContent>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <TranscriptUploader onExtraction={handleAiExtraction} />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
          <ResultsDashboard courses={courses} />
        </div>
        
        <div className="lg:col-span-2">
          <CourseManager 
            courses={courses}
            onAddCourse={addCourse}
            onUpdateCourse={updateCourse}
            onRemoveCourse={removeCourse}
            onAddYear={addYear}
          />
        </div>
      </div>
    </main>
  );
}
