'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';

type LeaderboardEntry = {
  id: string;
  display_name: string;
  points: number;
  tasks_done: number;
  tasks_total: number;
};

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, points')
        .order('points', { ascending: false });
      if (!profiles) return;

      const enriched = await Promise.all(
        profiles.map(async (p) => {
          const { count: tasks_total } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', p.id);
          const { count: tasks_done } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', p.id).eq('status', 'done');
          return { ...p, tasks_total: tasks_total ?? 0, tasks_done: tasks_done ?? 0 };
        })
      );
      setEntries(enriched);
    }
    load();
  }, [user]);

  if (loading || !user) return null;

  const maxPoints = Math.max(...entries.map((e) => e.points), 1);

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Leaderboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Points awarded for completing tasks: Low = 10, Medium = 25, High = 50.
        </p>
      </div>

      <div className="space-y-2">
        {entries.map((entry, i) => {
          const isMe = entry.id === user.id;
          const barWidth = maxPoints > 0 ? (entry.points / maxPoints) * 100 : 0;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 rounded-lg border px-4 py-3"
              style={{
                background: isMe ? 'var(--accent-light)' : 'var(--bg-card)',
                borderColor: isMe ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <span
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  background: i < 3 ? 'var(--accent)' : 'var(--border)',
                  color: i < 3 ? 'white' : 'var(--text-muted)',
                }}
              >
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {entry.display_name}
                    {isMe && <span className="text-xs ml-1" style={{ color: 'var(--accent)' }}>(you)</span>}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: 'var(--border)' }}>
                  <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${barWidth}%`, background: i < 3 ? 'var(--accent)' : 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{entry.points} pts</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {entry.tasks_done}/{entry.tasks_total} tasks
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
