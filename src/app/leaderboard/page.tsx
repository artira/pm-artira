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

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_GRADIENTS = [
  'var(--gradient-gold)',
  'var(--gradient-silver)',
  'var(--gradient-bronze)',
];

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

      const { data: allTasks } = await supabase
        .from('tasks')
        .select('assignee_id, status');

      const tasksByUser = (allTasks || []).reduce<Record<string, { total: number; done: number }>>((acc, t) => {
        if (!t.assignee_id) return acc;
        if (!acc[t.assignee_id]) acc[t.assignee_id] = { total: 0, done: 0 };
        acc[t.assignee_id].total++;
        if (t.status === 'done') acc[t.assignee_id].done++;
        return acc;
      }, {});

      const enriched = profiles.map((p) => ({
        ...p,
        tasks_total: tasksByUser[p.id]?.total ?? 0,
        tasks_done: tasksByUser[p.id]?.done ?? 0,
      }));
      setEntries(enriched);
    }
    load();
  }, [user]);

  if (loading || !user) return null;

  const maxPoints = Math.max(...entries.map((e) => e.points), 1);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <Shell>
      {/* Header */}
      <div className="rounded-xl p-6 mb-6 text-center" style={{ background: 'var(--gradient-1)', color: 'white' }}>
        <p className="text-4xl mb-1">🏆</p>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm opacity-90 mt-1">Complete tasks to earn points: Low = 10 · Medium = 25 · High = 50</p>
      </div>

      {/* Podium: top 3 */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 mb-8">
          {/* 2nd place */}
          {top3[1] && (
            <PodiumCard entry={top3[1]} rank={2} height="h-28" isMe={top3[1].id === user.id} />
          )}
          {/* 1st place */}
          {top3[0] && (
            <PodiumCard entry={top3[0]} rank={1} height="h-36" isMe={top3[0].id === user.id} />
          )}
          {/* 3rd place */}
          {top3[2] && (
            <PodiumCard entry={top3[2]} rank={3} height="h-24" isMe={top3[2].id === user.id} />
          )}
        </div>
      )}

      {/* Remaining members */}
      <div className="space-y-2">
        {rest.map((entry, i) => {
          const rank = i + 4;
          const isMe = entry.id === user.id;
          const barWidth = maxPoints > 0 ? (entry.points / maxPoints) * 100 : 0;
          const completionPct = entry.tasks_total > 0 ? Math.round((entry.tasks_done / entry.tasks_total) * 100) : 0;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-4 rounded-xl border px-4 py-3 transition-shadow hover:shadow-md"
              style={{
                background: isMe ? 'var(--accent-light)' : 'var(--bg-card)',
                borderColor: isMe ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <span
                className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {rank}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {entry.display_name}
                    {isMe && <span className="text-xs ml-1" style={{ color: 'var(--accent)' }}>(you)</span>}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full mt-1.5" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${barWidth}%`, background: 'var(--accent)' }}
                  />
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{entry.points} pts</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {entry.tasks_done}/{entry.tasks_total} done · {completionPct}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

function PodiumCard({ entry, rank, height, isMe }: { entry: LeaderboardEntry; rank: number; height: string; isMe: boolean }) {
  const completionPct = entry.tasks_total > 0 ? Math.round((entry.tasks_done / entry.tasks_total) * 100) : 0;
  return (
    <div className="flex flex-col items-center w-28 sm:w-36">
      {/* Avatar circle */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-xl mb-2 shadow-lg"
        style={{ background: RANK_GRADIENTS[rank - 1] }}
      >
        {MEDALS[rank - 1]}
      </div>
      <p className="text-sm font-bold text-center truncate w-full" style={{ color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}>
        {entry.display_name}
        {isMe && <span className="text-xs block" style={{ color: 'var(--accent)' }}>(you)</span>}
      </p>
      {/* Podium block */}
      <div
        className={`w-full ${height} rounded-t-xl mt-2 flex flex-col items-center justify-center`}
        style={{ background: RANK_GRADIENTS[rank - 1] }}
      >
        <p className="text-2xl font-black text-white">{entry.points}</p>
        <p className="text-[10px] text-white/80">points</p>
        <p className="text-[10px] text-white/70 mt-1">{entry.tasks_done}/{entry.tasks_total} · {completionPct}%</p>
      </div>
    </div>
  );
}
