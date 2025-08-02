
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { ScrapedCourse } from './types';

// This function is designed to be called twice: once to get initial cookies,
// and a second time with the cookie to get the specific login page tokens.
async function getLoginTokens(cookie?: string): Promise<{ viewState: string | undefined, eventValidation: string | undefined, cookie: string | undefined }> {
    const loginUrl = 'https://arms.sse.saveetha.com/Login.aspx';
    const res = await fetch(loginUrl, {
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Host': 'arms.sse.saveetha.com',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Cookie': cookie || '',
        }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const viewState = $('input[name="__VIEWSTATE"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();
    // Persist the cookie across calls
    const newCookie = res.headers.get('set-cookie')?.split(';')[0] || cookie;
    return { viewState, eventValidation, cookie: newCookie };
}

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const loginUrl = 'https://arms.sse.saveetha.com/Login.aspx';
        const dashboardUrl = 'https://arms.sse.saveetha.com/StudentPortal/Landing.aspx';
        const myCourseUrl = 'https://arms.sse.saveetha.com/StudentPortal/MyCourse.aspx';

        // Step 1: Initial request to get the session cookie.
        const { cookie: initialCookie } = await getLoginTokens();
        if (!initialCookie) {
             return NextResponse.json({ error: 'Failed to establish an initial session with the portal.' }, { status: 500 });
        }
        
        // Step 2: Second request using the session cookie to get the valid ViewState and EventValidation tokens.
        const { viewState, eventValidation } = await getLoginTokens(initialCookie);

        if (!viewState || !eventValidation) {
            return NextResponse.json({ error: 'Failed to retrieve login tokens from the portal.' }, { status: 500 });
        }

        // Step 3: Perform login with all required fields
        const loginFormData = new URLSearchParams();
        loginFormData.append('__VIEWSTATE', viewState);
        loginFormData.append('__EVENTVALIDATION', eventValidation);
        loginFormData.append('txtUserName', username);
        loginFormData.append('txtPassword', password);
        loginFormData.append('btnSubmit', 'Sign In');

        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': initialCookie,
                'Referer': loginUrl,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            },
            body: loginFormData.toString(),
            redirect: 'manual' // We need to handle the redirect manually to capture cookies.
        });

        // A successful login to an ASP.NET page redirects (302). If we get a 200, it means login failed and the page reloaded.
        if (loginRes.status !== 302) {
             return NextResponse.json({ error: 'Invalid credentials or login failed. Please double-check your username and password.' }, { status: 401 });
        }
        
        // Capture the new authentication cookie set after a successful login.
        const sessionCookie = loginRes.headers.get('set-cookie')?.split(';')[0] || initialCookie;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Failed to establish a session after login.' }, { status: 500 });
        }
        
        // Step 4: Fetch the MyCourse page using the authenticated session cookie.
        const myCourseRes = await fetch(myCourseUrl, {
            headers: {
                'Cookie': sessionCookie,
                'Referer': dashboardUrl, // Important: The server might check the referer.
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            }
        });

        if (!myCourseRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch course page after login.' }, { status: 500 });
        }

        const myCourseHtml = await myCourseRes.text();

        // Step 5: Parse the HTML and extract the course data.
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

                // If the status is FAIL, the grade is always F, regardless of what's in the grade column.
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
            return NextResponse.json({ error: 'Could not find any courses. The portal page structure may have changed, or you may have no courses listed.' }, { status: 404 });
        }

        return NextResponse.json({ courses });

    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json({ error: 'An internal server error occurred during the scraping process.' }, { status: 500 });
    }
}
