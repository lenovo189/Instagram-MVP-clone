import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in search params, use it as the redirection URL
    const next = searchParams.get('next') ?? '/home';

    if (code) {
        const supabase = await createClient();
        console.log('Callback V3: Exchanging code for session...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            console.log('Callback: Session exchange successful, redirecting to:', next);
            return NextResponse.redirect(`${origin}${next}`);
        }
        console.error('Callback: Session exchange error:', error.message);
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
