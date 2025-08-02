import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export interface ScrapedCourse {
    courseCode: string;
    courseName: string;
    grade: string;
    monthYear: string;
}

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const loginUrl = 'https://arms.sse.saveetha.com/StudentPortal/Login.aspx';
        const myCourseUrl = 'https://arms.sse.saveetha.com/StudentPortal/MyCourse.aspx';

        // Step 1: Fetch the login page to get viewstate and other form data
        const initialRes = await fetch(loginUrl);
        const initialText = await initialRes.text();
        const $initial = cheerio.load(initialText);

        const viewState = $initial('input[name="__VIEWSTATE"]').val();
        const eventValidation = $initial('input[name="__EVENTVALIDATION"]').val();

        // Step 2: Perform the login
        const loginFormData = new URLSearchParams();
        loginFormData.append('__VIEWSTATE', viewState || '');
        loginFormData.append('__EVENTVALIDATION', eventValidation || '');
        loginFormData.append('txtUserName', username);
        loginFormData.append('txtPassword', password);
        loginFormData.append('btnSubmit', 'Sign In');

        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': initialRes.headers.get('set-cookie') || '',
                'Referer': loginUrl
            },
            body: loginFormData.toString(),
            redirect: 'manual' // We need to handle redirects manually to capture cookies
        });

        // Check if login was successful by looking for a redirect to the dashboard
        if (loginRes.status !== 302 || !loginRes.headers.get('location')?.includes('DashBoard')) {
            return NextResponse.json({ error: 'Invalid credentials or login failed' }, { status: 401 });
        }

        const sessionCookie = loginRes.headers.get('set-cookie');

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Failed to establish a session' }, { status: 500 });
        }
        
        // Step 3: Fetch the MyCourse page with the session cookie
        const myCourseRes = await fetch(myCourseUrl, {
            headers: {
                'Cookie': sessionCookie,
                'Referer': loginUrl
            }
        });

        if (!myCourseRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch course page.' }, { status: 500 });
        }

        const myCourseHtml = await myCourseRes.text();

        // Step 4: Parse the HTML and extract course data
        const $ = cheerio.load(myCourseHtml);
        const courses: ScrapedCourse[] = [];

        // This selector targets the main table with course data
        $('table.table.table-striped.table-bordered > tbody > tr').each((_i, row) => {
            const columns = $(row).find('td');
            if (columns.length >= 6) {
                const courseCode = $(columns[1]).text().trim();
                const courseName = $(columns[2]).text().trim();
                let grade = $(columns[3]).text().trim();
                const status = $(columns[4]).text().trim();
                const monthYear = $(columns[5]).text().trim();

                if (status.toUpperCase() === 'FAIL') {
                    grade = 'F';
                } else if (status.toUpperCase() === 'PASS') {
                    // Grade is already S, A, B, etc.
                }

                if(courseCode && courseName){
                    courses.push({
                        courseCode,
                        courseName,
                        grade,
                        monthYear
                    });
                }
            }
        });

        if (courses.length === 0) {
            return NextResponse.json({ error: 'Could not find any courses on the page. The page structure might have changed.' }, { status: 404 });
        }

        return NextResponse.json({ courses });

    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
    }
}
