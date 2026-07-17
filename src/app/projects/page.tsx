'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';

type Project = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  target_date: string | null;
  archived: boolean;
  created_at: string;
  profiles: { display_name: string } | null;
  task_count?: number;
  done_count?: number;
};

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  async function loadProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*, profiles(display_name)')
      .eq('archived', false)
      .order('created_at', { ascending: false });
    if (!data) return;

    // Get task counts per project
    const withCounts = await Promise.all(
      data.map(async (p) => {
        const { count: task_count } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', p.id);
        const { count: done_count } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', p.id).eq('status', 'done');
        return { ...p, task_count: task_count ?? 0, done_count: done_count ?? 0 };
      })
    );
    setProjects(withCounts);
  }

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  async function handleSave() {
    if (!user || !name.trim()) return;
    setSaving(true);

    if (editId) {
      await supabase.from('projects').update({
        name: name.trim(),
        description: description.trim() || null,
        target_date: targetDate || null,
      }).eq('id', editId);
    } else {
      await supabase.from('projects').insert({
        name: name.trim(),
        description: description.trim() || null,
        target_date: targetDate || null,
        owner_id: user.id,
      });
    }

    setName('');
    setDescription('');
    setTargetDate('');
    setShowCreate(false);
    setEditId(null);
    setSaving(false);
    loadProjects();
  }

  async function handleArchive(id: string) {
    await supabase.from('projects').update({ archived: true }).eq('id', id);
    loadProjects();
  }

  function startEdit(p: Project) {
    setEditId(p.id);
    setName(p.name);
    setDescription(p.description || '');
    setTargetDate(p.target_date || '');
    setShowCreate(true);
  }

  if (loading || !user) return null;

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Projects</h1>
        <button
          onClick={() => { setShowCreate(true); setEditId(null); setName(''); setDescription(''); setTargetDate(''); }}
          className="px-3 py-1.5 rounded text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          New project
        </button>
      </div>

      {/* Create / Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowCreate(false)}>
          <div
            className="w-full max-w-md rounded-lg border p-6"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {editId ? 'Edit project' : 'New project'}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded border text-sm outline-none resize-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Target date (optional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border text-sm outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded text-sm" style={{ color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="px-3 py-1.5 rounded text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="rounded-lg border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No projects yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => {
            const pct = p.task_count! > 0 ? Math.round((p.done_count! / p.task_count!) * 100) : 0;
            const daysLeft = p.target_date ? Math.ceil((new Date(p.target_date).getTime() - Date.now()) / 86400000) : null;
            return (
              <div
                key={p.id}
                className="rounded-lg border p-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                    {p.description && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                    )}
                  </div>
                  {user.id === p.owner_id && (
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button onClick={() => startEdit(p)} className="text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        Edit
                      </button>
                      <button onClick={() => handleArchive(p.id)} className="text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>
                        Archive
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{p.task_count} tasks</span>
                  <span>{pct}% done</span>
                  {daysLeft !== null && (
                    <span style={{ color: daysLeft < 0 ? 'var(--danger)' : daysLeft <= 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                    </span>
                  )}
                  <span className="ml-auto">by {p.profiles?.display_name}</span>
                </div>

                {/* Mini progress bar */}
                <div className="w-full h-1 rounded-full mt-2" style={{ background: 'var(--border)' }}>
                  <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--success)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
