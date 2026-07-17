'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string;
  assignee_id: string | null;
  projects: { name: string } | null;
};

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ total: 0, done: 0, overdue: 0, inProgress: 0 });

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('tasks')
      .select('*, projects(name)')
      .eq('assignee_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setTasks(data);
          const now = new Date().toISOString().slice(0, 10);
          setStats({
            total: data.length,
            done: data.filter((t) => t.status === 'done').length,
            overdue: data.filter((t) => t.due_date && t.due_date < now && t.status !== 'done').length,
            inProgress: data.filter((t) => t.status === 'in_progress').length,
          });
        }
      });
  }, [user]);

  if (loading || !user) return null;

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {profile?.display_name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Here&apos;s where things stand.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="My tasks" value={stats.total} />
        <StatCard label="Completed" value={stats.done} accent="var(--success)" />
        <StatCard label="In progress" value={stats.inProgress} accent="var(--accent)" />
        <StatCard label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? 'var(--danger)' : undefined} />
      </div>

      {/* Progress bar */}
      <div className="rounded-lg border p-4 mb-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Completion rate</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{completionRate}%</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: 'var(--border)' }}>
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Recent tasks */}
      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>My recent tasks</h2>
      {tasks.length === 0 ? (
        <div className="rounded-lg border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No tasks assigned to you yet. Head to <button onClick={() => router.push('/board')} className="underline" style={{ color: 'var(--accent)' }}>Board</button> to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 10).map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:opacity-80"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              onClick={() => router.push('/board')}
            >
              <StatusDot status={t.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.projects?.name}</p>
              </div>
              <PriorityBadge priority={t.priority} />
              {t.due_date && (
                <span className="text-xs" style={{ color: t.due_date < new Date().toISOString().slice(0, 10) && t.status !== 'done' ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {t.due_date}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: accent || 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'done' ? 'var(--success)' : status === 'in_progress' ? 'var(--accent)' : 'var(--text-muted)';
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />;
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    high: { bg: 'var(--danger-light)', color: 'var(--danger)' },
    medium: { bg: 'var(--warning-light)', color: 'var(--warning)' },
    low: { bg: 'var(--accent-light)', color: 'var(--accent)' },
  };
  const s = styles[priority] || styles.medium;
  return (
    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>
      {priority}
    </span>
  );
}
