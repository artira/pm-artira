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

type CohortStats = {
  totalTasks: number;
  totalDone: number;
  totalMembers: number;
  totalProjects: number;
  byStatus: { todo: number; in_progress: number; done: number };
  byPriority: { low: number; medium: number; high: number };
};

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ total: 0, done: 0, overdue: 0, inProgress: 0, todo: 0 });
  const [cohort, setCohort] = useState<CohortStats>({ totalTasks: 0, totalDone: 0, totalMembers: 0, totalProjects: 0, byStatus: { todo: 0, in_progress: 0, done: 0 }, byPriority: { low: 0, medium: 0, high: 0 } });

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    // My tasks
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
            todo: data.filter((t) => t.status === 'todo').length,
          });
        }
      });

    // Cohort-wide stats
    async function loadCohort() {
      const { data: allTasks } = await supabase.from('tasks').select('status, priority');
      const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('archived', false);
      const t = allTasks || [];
      setCohort({
        totalTasks: t.length,
        totalDone: t.filter((x) => x.status === 'done').length,
        totalMembers: memberCount ?? 0,
        totalProjects: projectCount ?? 0,
        byStatus: {
          todo: t.filter((x) => x.status === 'todo').length,
          in_progress: t.filter((x) => x.status === 'in_progress').length,
          done: t.filter((x) => x.status === 'done').length,
        },
        byPriority: {
          low: t.filter((x) => x.priority === 'low').length,
          medium: t.filter((x) => x.priority === 'medium').length,
          high: t.filter((x) => x.priority === 'high').length,
        },
      });
    }
    loadCohort();
  }, [user]);

  if (loading || !user) return null;

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const cohortRate = cohort.totalTasks > 0 ? Math.round((cohort.totalDone / cohort.totalTasks) * 100) : 0;

  return (
    <Shell>
      {/* Hero greeting */}
      <div className="rounded-xl p-6 mb-6" style={{ background: 'var(--gradient-1)', color: 'white' }}>
        <h1 className="text-2xl font-bold">Welcome back, {profile?.display_name} 👋</h1>
        <p className="text-sm mt-1 opacity-90">
          {completionRate >= 80 ? "You're crushing it!" : completionRate >= 50 ? 'Solid progress — keep pushing.' : "Let's get some tasks done today."}
        </p>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-3xl font-black">{completionRate}%</p>
            <p className="text-xs opacity-80">Your completion</p>
          </div>
          <div>
            <p className="text-3xl font-black">{profile?.points ?? 0}</p>
            <p className="text-xs opacity-80">Points earned</p>
          </div>
          <div>
            <p className="text-3xl font-black">{stats.total}</p>
            <p className="text-xs opacity-80">Tasks assigned</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <GradientCard label="To Do" value={stats.todo} gradient="var(--gradient-4)" icon="📋" />
        <GradientCard label="In Progress" value={stats.inProgress} gradient="var(--gradient-1)" icon="🔨" />
        <GradientCard label="Completed" value={stats.done} gradient="var(--gradient-2)" icon="✅" />
        <GradientCard label="Overdue" value={stats.overdue} gradient="var(--gradient-3)" icon="⚠️" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Donut: My task status */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>My Tasks</h3>
          <div className="flex items-center gap-6">
            <DonutChart
              segments={[
                { value: stats.todo, color: 'var(--cyan)' },
                { value: stats.inProgress, color: 'var(--accent)' },
                { value: stats.done, color: 'var(--success)' },
              ]}
              centerLabel={`${stats.total}`}
              centerSub="total"
            />
            <div className="space-y-2">
              <Legend color="var(--cyan)" label="To Do" value={stats.todo} />
              <Legend color="var(--accent)" label="In Progress" value={stats.inProgress} />
              <Legend color="var(--success)" label="Done" value={stats.done} />
            </div>
          </div>
        </div>

        {/* Bar: Cohort priority breakdown */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Cohort Task Priority</h3>
          <div className="space-y-3">
            <BarRow label="High" value={cohort.byPriority.high} max={cohort.totalTasks} color="var(--danger)" />
            <BarRow label="Medium" value={cohort.byPriority.medium} max={cohort.totalTasks} color="var(--orange)" />
            <BarRow label="Low" value={cohort.byPriority.low} max={cohort.totalTasks} color="var(--cyan)" />
          </div>
          <div className="flex gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <MiniStat label="Members" value={cohort.totalMembers} />
            <MiniStat label="Projects" value={cohort.totalProjects} />
            <MiniStat label="Tasks" value={cohort.totalTasks} />
            <MiniStat label="Done" value={`${cohortRate}%`} />
          </div>
        </div>
      </div>

      {/* Cohort velocity bar */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cohort Progress</h3>
          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            {cohortRate}% complete
          </span>
        </div>
        <div className="w-full h-4 rounded-full overflow-hidden flex" style={{ background: 'var(--border)' }}>
          <div className="h-4 transition-all duration-700" style={{ width: `${cohort.totalTasks > 0 ? (cohort.byStatus.done / cohort.totalTasks) * 100 : 0}%`, background: 'var(--success)' }} />
          <div className="h-4 transition-all duration-700" style={{ width: `${cohort.totalTasks > 0 ? (cohort.byStatus.in_progress / cohort.totalTasks) * 100 : 0}%`, background: 'var(--accent)' }} />
          <div className="h-4 transition-all duration-700" style={{ width: `${cohort.totalTasks > 0 ? (cohort.byStatus.todo / cohort.totalTasks) * 100 : 0}%`, background: 'var(--cyan)' }} />
        </div>
        <div className="flex gap-4 mt-2">
          <Legend color="var(--success)" label="Done" value={cohort.byStatus.done} />
          <Legend color="var(--accent)" label="In Progress" value={cohort.byStatus.in_progress} />
          <Legend color="var(--cyan)" label="To Do" value={cohort.byStatus.todo} />
        </div>
      </div>

      {/* Recent tasks */}
      <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>My recent tasks</h2>
      {tasks.length === 0 ? (
        <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-4xl mb-3">🚀</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No tasks yet. Head to the <button onClick={() => router.push('/board')} className="underline font-medium" style={{ color: 'var(--accent)' }}>Board</button> to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 10).map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer hover:shadow-md transition-shadow"
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

/* ---- Chart Components ---- */

function DonutChart({ segments, centerLabel, centerSub }: { segments: { value: number; color: string }[]; centerLabel: string; centerSub: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <div className="w-28 h-28 rounded-full border-8 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No data</span>
      </div>
    );
  }
  const size = 112;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = pct * circ;
        const dashOffset = -offset;
        offset += dashLen;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dashLen} ${circ - dashLen}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'all 0.7s ease' }}
          />
        );
      })}
      <text x="50%" y="46%" textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--text-primary)">{centerLabel}</text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="10" fill="var(--text-muted)">{centerSub}</text>
    </svg>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="w-full h-3 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function GradientCard({ label, value, gradient, icon }: { label: string; value: number; gradient: string; icon: string }) {
  return (
    <div className="rounded-xl p-4 text-white relative overflow-hidden" style={{ background: gradient }}>
      <span className="absolute top-2 right-3 text-2xl opacity-40">{icon}</span>
      <p className="text-xs font-medium opacity-90">{label}</p>
      <p className="text-3xl font-black mt-1">{value}</p>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: accent || 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'done' ? 'var(--success)' : status === 'in_progress' ? 'var(--accent)' : 'var(--cyan)';
  return <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    high: { bg: 'var(--danger-light)', color: 'var(--danger)' },
    medium: { bg: 'var(--warning-light)', color: 'var(--orange)' },
    low: { bg: 'var(--accent-light)', color: 'var(--cyan)' },
  };
  const s = styles[priority] || styles.medium;
  return (
    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {priority}
    </span>
  );
}
