import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { ScrapedCourse } from './types';

interface LoginTokens {
    viewState: string;
    eventValidation: string;
    viewStateGenerator: string;
    cookie: string;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createTimeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

async function getLoginTokens(): Promise<LoginTokens> {
    const loginUrl = 'https://arms.sse.saveetha.com/Login.aspx';
    
    const res = await fetch(loginUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: createTimeoutSignal(15000)
    });

    if (!res.ok) {
        throw new Error(`Failed to load login page: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    
    const viewState = $('input[name="__VIEWSTATE"]').val() as string;
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val() as string;
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val() as string;
    
    if (!viewState || !eventValidation || !viewStateGenerator) {
        throw new Error('Required tokens not found');
    }

    const setCookieHeader = res.headers.get('set-cookie');
    const cookie = setCookieHeader ? setCookieHeader.split(',').map(c => c.split(';')[0]).join('; ') : '';

    return { viewState, eventValidation, viewStateGenerator, cookie };
}

async function performLogin(tokens: LoginTokens, username: string, password: string): Promise<string> {
    const loginUrl = 'https://arms.sse.saveetha.com/Login.aspx';
    
    await delay(1000);
    
    const formData = new URLSearchParams();
    formData.append('__VIEWSTATE', tokens.viewState);
    formData.append('__VIEWSTATEGENERATOR', tokens.viewStateGenerator);
    formData.append('__EVENTVALIDATION', tokens.eventValidation);
    formData.append('txtusername', username);
    formData.append('txtpassword', password);
    formData.append('btnlogin', 'Login');

    const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': tokens.cookie,
            'Referer': loginUrl,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
        body: formData.toString(),
        redirect: 'manual',
        signal: createTimeoutSignal(15000)
    });

    if (response.status === 302) {
        const location = response.headers.get('location');
        if (location?.includes('Login.aspx')) {
            throw new Error('Invalid credentials');
        }
        
        const newCookies = response.headers.get('set-cookie');
        return newCookies ? [tokens.cookie, ...newCookies.split(',').map(c => c.split(';')[0])].join('; ') : tokens.cookie;
    } else if (response.status === 200) {
        const html = await response.text();
        if (html.includes('txtusername')) {
            throw new Error('Invalid credentials');
        }
        return tokens.cookie;
    } else {
        throw new Error(`Login failed: ${response.status}`);
    }
}

async function fetchCompletedCoursesOnly(sessionCookie: string): Promise<ScrapedCourse[]> {
    // Only fetch completed courses from the results API
    const completedCoursesUrl = 'https://arms.sse.saveetha.com/Handler/Student.ashx?Page=CourseEnroll&Mode=GetResult&Id=0';
    
    const courses: ScrapedCourse[] = [];
    
    try {
        console.log('Fetching ONLY completed/released courses...');
        
        const completedResponse = await fetch(completedCoursesUrl, {
            headers: {
                'Cookie': sessionCookie,
                'Referer': 'https://arms.sse.saveetha.com/StudentPortal/MyCourse.aspx',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
            },
            signal: createTimeoutSignal(15000)
        });

        if (completedResponse.ok) {
            const completedText = await completedResponse.text();
            console.log('Completed courses response:', completedText.substring(0, 500));
            
            try {
                const completedData = JSON.parse(completedText);
                
                if (completedData.Table && Array.isArray(completedData.Table)) {
                    completedData.Table.forEach((course: any) => {
                        // Only include courses with final results (PASS/FAIL)
                        if (course.FinalResult && (course.FinalResult === 'PASS' || course.FinalResult === 'FAIL')) {
                            courses.push({
                                courseCode: course.CourseCode || '',
                                courseName: course.CourseName || '',
                                grade: course.FinalResult === 'FAIL' ? 'F' : (course.FinalGrade || 'A'),
                                monthYear: course.MonthYearValue || '',
                                status: course.FinalResult
                            });
                        }
                    });
                } else {
                    console.log('No Table found in completed courses response');
                }
            } catch (parseError) {
                console.error('Failed to parse completed courses JSON:', parseError);
                throw new Error('Failed to parse course data from portal');
            }
        } else {
            throw new Error(`Failed to fetch completed courses: ${completedResponse.status}`);
        }

        console.log(`Total completed courses found: ${courses.length}`);
        return courses;

    } catch (error) {
        console.error('Error fetching completed course data:', error);
        throw error;
    }
}

async function fetchCourseDataFallback(sessionCookie: string): Promise<ScrapedCourse[]> {
    // Fallback: try to get course data from the MyCourse.aspx page HTML
    const myCourseUrl = 'https://arms.sse.saveetha.com/StudentPortal/MyCourse.aspx';
    
    try {
        console.log('Fetching course page HTML as fallback...');
        
        const response = await fetch(myCourseUrl, {
            headers: {
                'Cookie': sessionCookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: createTimeoutSignal(15000)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch course page: ${response.status}`);
        }

        const html = await response.text();
        
        if (html.includes('txtusername')) {
            throw new Error('Session expired');
        }

        // Try to find course data in HTML tables
        const $ = cheerio.load(html);
        const courses: ScrapedCourse[] = [];

        $('table tbody tr, .table tbody tr').each((_, row) => {
            const cols = $(row).find('td');
            if (cols.length >= 6) {
                const courseCode = $(cols[1]).text().trim();
                const courseName = $(cols[2]).text().trim();
                const grade = $(cols[3]).text().trim();
                const status = $(cols[4]).text().trim();
                const monthYear = $(cols[5]).text().trim();

                if (courseCode && courseName && grade && status !== 'IN_PROGRESS') {
                    courses.push({
                        courseCode,
                        courseName,
                        grade: status.includes('FAIL') ? 'F' : grade,
                        monthYear,
                        status
                    });
                }
            }
        });

        return courses;

    } catch (error) {
        console.error('Error in fallback course data fetch:', error);
        return [];
    }
}

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
        }

        console.log(`Starting login for: ${username}`);

        // Step 1: Get tokens and login
        const tokens = await getLoginTokens();
        const sessionCookie = await performLogin(tokens, username, password);
        
        console.log('Login successful, fetching completed course data only...');

        // Step 2: Fetch ONLY completed courses (not in-progress)
        let courses = await fetchCompletedCoursesOnly(sessionCookie);
        
        // Step 3: If no courses found, try fallback method
        if (courses.length === 0) {
            console.log('No courses from API, trying fallback method...');
            courses = await fetchCourseDataFallback(sessionCookie);
        }

        return NextResponse.json({ 
            success: true,
            courses,
            message: `Successfully extracted ${courses.length} completed courses`,
            debug: {
                loginSuccessful: true,
                coursesFound: courses.length,
                onlyCompletedCourses: true
            }
        });

    } catch (error) {
        console.error('Error:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('Invalid')) {
                return NextResponse.json({ 
                    error: 'Invalid username or password' 
                }, { status: 401 });
            }
        }
        
        return NextResponse.json({ 
            error: 'Login failed. Please try again.',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Health check endpoint
export async function GET() {
    try {
        const loginUrl = 'https://arms.sse.saveetha.com/Login.aspx';
        const response = await fetch(loginUrl, {
            method: 'HEAD',
            signal: createTimeoutSignal(5000)
        });
        
        return NextResponse.json({
            status: 'healthy',
            portalAccessible: response.ok,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            portalAccessible: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
}
