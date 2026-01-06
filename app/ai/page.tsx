import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import AIChatSection from '@/components/ai/AIChatSection';

export default async function AIPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    let username: string | null = null;

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
        username = profile?.username || null;
    }

    return (
        <div>
            <Navbar username={username} />
            <main className="pt-16">
                <AIChatSection />
            </main>
        </div>
    );
}
