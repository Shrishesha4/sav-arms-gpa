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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Globe, Upload } from 'lucide-react';

let courseIdCounter = 0;
const generateId = () => `course-${Date.now()}-${courseIdCounter++}`;


export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const { toast } = useToast();
  
  const handleAiExtraction = (extractedData: ExtractGradesFromTranscriptOutput) => {
    const newCourses: Course[] = extractedData.map(item => {
      const grade = item.grade.toUpperCase() as Grade;
      const validGrades: Grade[] = ['S', 'A', 'B', 'C', 'D', 'F'];
      
      return {
        id: generateId(),
        code: item.courseCode,
        name: item.courseName,
        credits: item.credits,
        grade: validGrades.includes(grade) ? grade : 'NA',
        year: new Date().getFullYear(),
      };
    });

    setCourses(prevCourses => [...prevCourses, ...newCourses]);
    toast({
      title: 'Extraction Complete',
      description: `${newCourses.length} courses have been extracted and added. Please review and assign them to the correct academic year.`,
    });
  };

  const handlePortalExtraction = (extractedData: ScrapedCourse[]) => {
    const yearGroups: { [key: number]: ScrapedCourse[] } = {};
    
    extractedData.forEach(course => {
      if (course.monthYear && course.monthYear.trim() !== '') {
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
        
        const yearMatch = item.monthYear.match(/\b(20\d{2})\b/);
        const actualYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
        
        return {
          id: generateId(),
          code: item.courseCode,
          name: item.courseName,
          credits: 4,
          grade: validGrades.includes(grade) ? grade : 'NA',
          year: actualYear,
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
    const newYearNumber = existingYears.length > 0 ? Math.max(...existingYears) + 1 : new Date().getFullYear();
    const newCourse: Course = {
      id: generateId(),
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
      id: generateId(),
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
                  <TabsTrigger value="portal">
                    <Globe className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Portal Login</span>
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Upload Screenshot</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="portal" className="space-y-4">
                  <PortalLogin onExtraction={handlePortalExtraction} />
                </TabsContent>
                
                <TabsContent value="upload" className="space-y-4">
                  <TranscriptUploader onExtraction={handleAiExtraction} />
                </TabsContent>
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
