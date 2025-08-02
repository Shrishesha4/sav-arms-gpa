import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const loginUrl = 'https://arms.sse.saveetha.com/Login.aspx';
        
        const response = await fetch(loginUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(10000)
        });

        const html = await response.text();
        
        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            accessible: response.ok,
            htmlLength: html.length,
            hasLoginForm: html.includes('txtUserName'),
            hasViewState: html.includes('__VIEWSTATE'),
            hasEventValidation: html.includes('__EVENTVALIDATION'),
            cookies: response.headers.get('set-cookie'),
            timestamp: new Date().toISOString(),
            headers: Object.fromEntries(response.headers.entries())
        });
        
    } catch (error) {
        return NextResponse.json({
            error: 'Cannot reach portal',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
}
