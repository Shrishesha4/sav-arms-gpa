
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { ScrapedCourse } from './types';

interface LoginTokens {
    viewState: string;
    eventValidation: string;
    viewStateGenerator?: string;
    previousPage?: string;
    cookie: string;
}

// Add delay function to simulate human behavior
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLoginTokens(existingCookie?: string): Promise<LoginTokens> {
    const loginUrl = 'https://arms.sse.saveetha.com/Login.aspx';
    
    try {
        console.log('Fetching login page for tokens...');
        
        // Add small delay to simulate human behavior
        await delay(1000 + Math.random() * 1000);
        
        const res = await fetch(loginUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'DNT': '1',
                'Host': 'arms.sse.saveetha.com',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                ...(existingCookie && { 'Cookie': existingCookie }),
            },
            signal: AbortSignal.timeout(30000)
        });

        if (!res.ok) {
            console.error(`Login page fetch failed: ${res.status} ${res.statusText}`);
            throw new Error(`Failed to load login page: HTTP ${res.status}`);
        }

        const html = await res.text();
        console.log(`Received HTML of length: ${html.length}`);
        
        const $ = cheerio.load(html);
        
        // Extract all ASP.NET form tokens
        let viewState = $('input[name="__VIEWSTATE"]').val() as string;
        let eventValidation = $('input[name="__EVENTVALIDATION"]').val() as string;
        let viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val() as string;
        let previousPage = $('input[name="__PREVIOUSPAGE"]').val() as string;

        // Fallback selectors if primary ones fail
        if (!viewState) {
            viewState = $('input[id="__VIEWSTATE"]').val() as string;
        }
        if (!eventValidation) {
            eventValidation = $('input[id="__EVENTVALIDATION"]').val() as string;
        }
        
        // Debug: Check actual field names in the form
        console.log('Form fields found:', {
            usernameField: $('input[name*="UserName"], input[name*="username"]').attr('name'),
            passwordField: $('input[name*="Password"], input[name*="password"]').attr('name'),
            submitButton: $('input[type="submit"], button[type="submit"]').attr('name'),
            allInputNames: $('input').map((i, el) => $(el).attr('name')).get()
        });
        
        if (!viewState || !eventValidation) {
            console.error('Critical tokens missing:', { 
                viewState: !!viewState, 
                eventValidation: !!eventValidation,
                htmlSnippet: html.substring(0, 1000)
            });
            throw new Error('Required login tokens not found on page');
        }

        // Extract and combine cookies properly
        const setCookieHeader = res.headers.get('set-cookie');
        let finalCookie = existingCookie || '';
        
        if (setCookieHeader) {
            const cookies = setCookieHeader.split(',').map(c => {
                const [nameValue] = c.split(';');
                return nameValue.trim();
            }).filter(c => c.length > 0 && c.includes('='));
            
            if (existingCookie) {
                const existingCookies = existingCookie.split(';').map(c => c.trim());
                const allCookies = [...existingCookies, ...cookies];
                finalCookie = allCookies.join('; ');
            } else {
                finalCookie = cookies.join('; ');
            }
        }

        console.log('Successfully extracted login tokens');
        
        return {
            viewState,
            eventValidation,
            viewStateGenerator,
            previousPage,
            cookie: finalCookie
        };

    } catch (error) {
        console.error('Error getting login tokens:', error);
        throw new Error(`Failed to get login tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function performLogin(tokens: LoginTokens, username: string, password: string): Promise<string> {
    const loginUrl = 'https://arms.sse.saveetha.com/Login.aspx';
    
    try {
        console.log('Preparing login request...');
        
        // Add human-like delay before login
        await delay(2000 + Math.random() * 2000);
        
        // Prepare form data based on the JavaScript validation structure
        const formData = new URLSearchParams();
        
        // Required ASP.NET fields
        formData.append('__VIEWSTATE', tokens.viewState);
        formData.append('__EVENTVALIDATION', tokens.eventValidation);
        
        if (tokens.viewStateGenerator) {
            formData.append('__VIEWSTATEGENERATOR', tokens.viewStateGenerator);
        }
        if (tokens.previousPage) {
            formData.append('__PREVIOUSPAGE', tokens.previousPage);
        }
        
        // Standard ASP.NET postback fields
        formData.append('__EVENTTARGET', '');
        formData.append('__EVENTARGUMENT', '');
        formData.append('__LASTFOCUS', '');
        
        // Login credentials - try multiple field name variations
        // Based on the JS, it expects 'username' and 'password' fields
        formData.append('username', username.trim());
        formData.append('password', password);
        
        // Also try with txt prefix (common in ASP.NET)
        formData.append('txtUserName', username.trim());
        formData.append('txtPassword', password);
        
        // Submit button - try multiple variations
        formData.append('btnSubmit', 'Sign In');
        formData.append('ctl00$ContentPlaceHolder1$btnSubmit', 'Sign In');
        
        // Remember checkbox (optional based on JS)
        formData.append('remember', 'false');

        console.log('Form data being sent:', Array.from(formData.entries()).map(([key, value]) => 
            key.includes('password') ? [key, '***hidden***'] : [key, value]
        ));

        const loginResponse = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
                'Cache-Control': 'max-age=0',
                'Connection': 'keep-alive',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': tokens.cookie,
                'DNT': '1',
                'Host': 'arms.sse.saveetha.com',
                'Origin': 'https://arms.sse.saveetha.com',
                'Referer': loginUrl,
                'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            },
            body: formData.toString(),
            redirect: 'manual',
            signal: AbortSignal.timeout(30000)
        });

        console.log(`Login response: ${loginResponse.status} ${loginResponse.statusText}`);
        console.log('Response headers:', Object.fromEntries(loginResponse.headers.entries()));
        
        // Handle different response scenarios
        if (loginResponse.status === 302) {
            // Successful redirect
            const location = loginResponse.headers.get('location');
            console.log('Redirected to:', location);
            
            if (location && (location.includes('Login.aspx') || location.includes('login'))) {
                // Redirected back to login = failed authentication
                throw new Error('Invalid username or password');
            }
            
            // Extract session cookies
            const sessionCookieHeader = loginResponse.headers.get('set-cookie');
            let sessionCookie = tokens.cookie;
            
            if (sessionCookieHeader) {
                const newCookies = sessionCookieHeader.split(',').map(c => {
                    const [nameValue] = c.split(';');
                    return nameValue.trim();
                }).filter(c => c.length > 0 && c.includes('='));
                
                const existingCookies = tokens.cookie.split(';').map(c => c.trim());
                sessionCookie = [...existingCookies, ...newCookies].join('; ');
            }
            
            console.log('Login successful, session cookie updated');
            return sessionCookie;
            
        } else if (loginResponse.status === 200) {
            // Page reloaded - check for errors
            const responseHtml = await loginResponse.text();
            console.log('Login response HTML snippet:', responseHtml.substring(0, 1000));
            
            // Check for error indicators based on the jQuery validation
            if (responseHtml.includes('Username is required') || 
                responseHtml.includes('Password is required') ||
                responseHtml.includes('help-block') ||
                responseHtml.includes('has-error') ||
                responseHtml.includes('alert-danger') ||
                responseHtml.toLowerCase().includes('invalid') ||
                responseHtml.toLowerCase().includes('incorrect') ||
                responseHtml.toLowerCase().includes('failed')) {
                throw new Error('Invalid username or password');
            }
            
            // Check if still on login page
            if (responseHtml.includes('login-form') || responseHtml.includes('txtUserName')) {
                throw new Error('Login failed - remained on login page');
            }
            
            // If we're here, login might have succeeded without redirect
            console.log('Login appears successful (status 200, no error indicators)');
            return tokens.cookie;
            
        } else if (loginResponse.status === 500) {
            // Server error - try to get more info
            try {
                const errorHtml = await loginResponse.text();
                console.error('Server error HTML:', errorHtml.substring(0, 2000));
                
                if (errorHtml.toLowerCase().includes('validation')) {
                    throw new Error('Form validation failed on server side');
                } else if (errorHtml.toLowerCase().includes('session')) {
                    throw new Error('Session state error');
                } else if (errorHtml.toLowerCase().includes('viewstate')) {
                    throw new Error('ViewState validation failed');
                } else {
                    throw new Error('Portal server error during login');
                }
            } catch (e) {
                throw new Error('Portal server error during login');
            }
            
        } else if (loginResponse.status === 403) {
            throw new Error('Access forbidden. Your IP might be temporarily blocked.');
            
        } else if (loginResponse.status === 429) {
            throw new Error('Too many requests. Please wait a few minutes and try again.');
            
        } else {
            throw new Error(`Unexpected login response: ${loginResponse.status} ${loginResponse.statusText}`);
        }

    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function fetchCourseData(sessionCookie: string): Promise<ScrapedCourse[]> {
    const myCourseUrl = 'https://arms.sse.saveetha.com/StudentPortal/MyCourse.aspx';
    
    try {
        console.log('Fetching course data...');
        
        // Add delay before course data fetch
        await delay(1500 + Math.random() * 1000);
        
        const courseResponse = await fetch(myCourseUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
                'Cache-Control': 'max-age=0',
                'Connection': 'keep-alive',
                'Cookie': sessionCookie,
                'DNT': '1',
                'Host': 'arms.sse.saveetha.com',
                'Referer': 'https://arms.sse.saveetha.com/StudentPortal/Landing.aspx',
                'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(30000)
        });

        if (!courseResponse.ok) {
            throw new Error(`Failed to fetch course data: ${courseResponse.status}`);
        }

        const html = await courseResponse.text();
        const $ = cheerio.load(html);

        const courses: ScrapedCourse[] = [];
        
        // Find the correct table - look for one with a header containing 'Course Code'
        let table = $('table.table-bordered').first(); // A good starting point
        
        if (table.length === 0) {
            // Fallback: find any table with the expected headers
            table = $('table').filter((i, el) => {
                const ths = $(el).find('th');
                const headerText = ths.text().toLowerCase();
                return headerText.includes('course code') && headerText.includes('course name');
            }).first();
        }

        if (table.length === 0) {
            console.warn("Could not find the courses table on the page.");
            return []; // No table found, return empty array
        }

        table.find('tbody tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 6) {
                const courseCode = $(cells[1]).text().trim();
                const courseName = $(cells[2]).text().trim();
                let grade = $(cells[3]).text().trim().toUpperCase();
                const status = $(cells[4]).text().trim().toUpperCase();
                const monthYear = $(cells[5]).text().trim();

                // Normalize grade
                if (status === 'FAIL') {
                    grade = 'F';
                } else if (['S', 'A', 'B', 'C', 'D'].includes(grade)) {
                    // Grade is already valid
                } else {
                    grade = 'NA'; // Or some other default for unknown/in-progress
                }

                courses.push({
                    courseCode,
                    courseName,
                    grade,
                    monthYear,
                });
            }
        });
        
        console.log(`Successfully scraped ${courses.length} courses`);
        return courses;

    } catch (error) {
        console.error('Error fetching/parsing course data:', error);
        throw new Error('Failed to retrieve or parse course data from the portal.');
    }
}

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }
        
        // 1. Get initial tokens and cookie
        const initialTokens = await getLoginTokens();
        
        // 2. Perform login
        const sessionCookie = await performLogin(initialTokens, username, password);
        
        // 3. Fetch course data with the session
        const courses = await fetchCourseData(sessionCookie);

        return NextResponse.json({ courses });

    } catch (error) {
        console.error('Scraping process failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
