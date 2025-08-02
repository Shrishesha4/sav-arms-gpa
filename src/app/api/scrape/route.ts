import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { ScrapedCourse } from './types';

async function getLoginTokens(cookie?: string): Promise<{ viewState: string | undefined, eventValidation: string | undefined, cookie: string | undefined }> {
    const loginUrl = 'https://arms.sse.saveetha.com/StudentPortal/Login.aspx';
    const res = await fetch(loginUrl, {
        headers: {
            'Cookie': cookie || ''
        }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const viewState = $('input[name="__VIEWSTATE"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();
    const newCookie = res.headers.get('set-cookie') || cookie;
    return { viewState, eventValidation, cookie: newCookie };
}

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const loginUrl = 'https://arms.sse.saveetha.com/StudentPortal/Login.aspx';
        const dashboardUrl = 'https://arms.sse.saveetha.com/StudentPortal/DashBoard.aspx';
        const myCourseUrl = 'https://arms.sse.saveetha.com/StudentPortal/MyCourse.aspx';

        // Step 1: Initial request to get session cookie and tokens
        const { viewState: initialViewState, eventValidation: initialEventValidation, cookie: initialCookie } = await getLoginTokens();
        
        if (!initialViewState || !initialEventValidation || !initialCookie) {
            return NextResponse.json({ error: 'Failed to retrieve login tokens from the portal.' }, { status: 500 });
        }

        // Step 2: Perform login
        const loginFormData = new URLSearchParams();
        loginFormData.append('__VIEWSTATE', initialViewState);
        loginFormData.append('__EVENTVALIDATION', initialEventValidation);
        loginFormData.append('txtUserName', username);
        loginFormData.append('txtPassword', password);
        loginFormData.append('btnSubmit', 'Sign In');

        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': initialCookie,
                'Referer': loginUrl,
            },
            body: loginFormData.toString(),
            redirect: 'follow' // Follow redirects to get the final cookie
        });

        // The final URL after redirects should be the dashboard
        if (!loginRes.url.includes('DashBoard.aspx')) {
             return NextResponse.json({ error: 'Invalid credentials or login failed. Please double-check your username and password.' }, { status: 401 });
        }
        
        const sessionCookie = loginRes.headers.get('set-cookie') || initialCookie;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Failed to establish a session after login.' }, { status: 500 });
        }
        
        // Step 3: Fetch the MyCourse page
        const myCourseRes = await fetch(myCourseUrl, {
            headers: {
                'Cookie': sessionCookie,
                'Referer': dashboardUrl
            }
        });

        if (!myCourseRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch course page.' }, { status: 500 });
        }

        const myCourseHtml = await myCourseRes.text();

        // Step 4: Parse HTML and extract data
        const $ = cheerio.load(myCourseHtml);
        const courses: ScrapedCourse[] = [];

        $('table.table.table-striped.table-bordered > tbody > tr').each((_i, row) => {
            const columns = $(row).find('td');
            if (columns.length >= 6) {
                const courseCode = $(columns[1]).text().trim();
                const courseName = $(columns[2]).text().trim();
                let grade = $(columns[3]).text().trim().toUpperCase();
                const status = $(columns[4]).text().trim().toUpperCase();
                const monthYear = $(columns[5]).text().trim();

                if (status === 'FAIL') {
                    grade = 'F';
                }

                if (courseCode && courseName && grade && monthYear) {
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
        return NextResponse.json({ error: 'An internal server error occurred during scraping.' }, { status: 500 });
    }
}
