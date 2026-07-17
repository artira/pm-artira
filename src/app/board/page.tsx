'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string;
  assignee_id: string | null;
  creator_id: string;
  created_at: string;
  projects: { name: string } | null;
  assignee: { display_name: string } | null;
};

type Profile = { id: string; display_name: string; email: string };
type Project = { id: string; name: string };

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--text-muted)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--accent)' },
  { key: 'done', label: 'Done', color: 'var(--success)' },
];

export default function BoardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Filters
  const [filterProject, setFilterProject] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  const loadTasks = useCallback(async () => {
    let query = supabase
      .from('tasks')
      .select('*, projects(name), assignee:profiles!tasks_assignee_id_fkey(display_name)')
      .order('created_at', { ascending: false });

    if (filterProject) query = query.eq('project_id', filterProject);
    if (filterAssignee) query = query.eq('assignee_id', filterAssignee);
    if (filterStatus) query = query.eq('status', filterStatus);

    const { data } = await query;
    if (data) setTasks(data);
  }, [filterProject, filterAssignee, filterStatus]);

  useEffect(() => {
    if (!user) return;
    loadTasks();
    supabase.from('projects').select('id, name').eq('archived', false).then(({ data }) => { if (data) setProjects(data); });
    supabase.from('profiles').select('id, display_name, email').then(({ data }) => { if (data) setMembers(data); });
  }, [user, loadTasks]);

  async function moveTask(taskId: string, newStatus: string) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    loadTasks();
  }

  if (loading || !user) return null;

  const filteredTasks = tasks;

  return (
    <Shell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Board</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="text-xs px-2 py-1 rounded border outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <option value="">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-xs px-2 py-1 rounded border outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <option value="">All members</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
          </select>
          <button
            onClick={() => { setShowCreate(true); setEditTask(null); }}
            className="px-3 py-1 rounded text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            New task
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="rounded-lg border p-3 min-h-[200px]"
              style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const taskId = e.dataTransfer.getData('taskId');
                if (taskId) moveTask(taskId, col.key);
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  {col.label}
                </span>
                <span className="text-xs ml-auto px-1.5 py-0.5 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={() => { setEditTask(t); setShowCreate(true); }}
                    onMove={moveTask}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit task modal */}
      {showCreate && (
        <TaskModal
          task={editTask}
          projects={projects}
          members={members}
          userId={user.id}
          onClose={() => { setShowCreate(false); setEditTask(null); }}
          onSaved={loadTasks}
        />
      )}
    </Shell>
  );
}

function TaskCard({ task, onEdit, onMove }: { task: Task; onEdit: () => void; onMove: (id: string, status: string) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = task.due_date && task.due_date < today && task.status !== 'done';
  const priorityColors: Record<string, string> = {
    high: 'var(--danger)',
    medium: 'var(--warning)',
    low: 'var(--accent)',
  };

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
      onClick={onEdit}
      className="rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-shadow"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
        <span className="uppercase font-semibold px-1.5 py-0.5 rounded" style={{ color: priorityColors[task.priority], background: task.priority === 'high' ? 'var(--danger-light)' : task.priority === 'medium' ? 'var(--warning-light)' : 'var(--accent-light)' }}>
          {task.priority}
        </span>
        {task.projects?.name && (
          <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
            {task.projects.name}
          </span>
        )}
        {task.assignee?.display_name && (
          <span style={{ color: 'var(--text-muted)' }}>→ {task.assignee.display_name}</span>
        )}
        {task.due_date && (
          <span style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
            {overdue ? '⚠ ' : ''}{task.due_date}
          </span>
        )}
      </div>

      {/* Quick status buttons */}
      <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
        {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
          <button
            key={c.key}
            onClick={() => onMove(task.id, c.key)}
            className="text-[10px] px-1.5 py-0.5 rounded border hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: c.color }}
          >
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskModal({
  task,
  projects,
  members,
  userId,
  onClose,
  onSaved,
}: {
  task: Task | null;
  projects: Project[];
  members: Profile[];
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [projectId, setProjectId] = useState(task?.project_id || projects[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<{ id: string; body: string; created_at: string; profiles: { display_name: string } }[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (task) {
      supabase
        .from('comments')
        .select('*, profiles(display_name)')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => { if (data) setComments(data); });
    }
  }, [task]);

  async function handleSave() {
    if (!title.trim() || !projectId) return;
    setSaving(true);

    if (task) {
      await supabase.from('tasks').update({
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId,
        assignee_id: assigneeId || null,
        priority,
        due_date: dueDate || null,
        status,
      }).eq('id', task.id);
    } else {
      await supabase.from('tasks').insert({
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId,
        assignee_id: assigneeId || null,
        creator_id: userId,
        priority,
        due_date: dueDate || null,
        status,
      });

      // Notify assignee
      if (assigneeId && assigneeId !== userId) {
        const me = members.find((m) => m.id === userId);
        await supabase.from('notifications').insert({
          user_id: assigneeId,
          message: `${me?.display_name || 'Someone'} assigned you: "${title.trim()}"`,
          link: '/board',
        });
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!task || !confirm('Delete this task?')) return;
    await supabase.from('tasks').delete().eq('id', task.id);
    onSaved();
    onClose();
  }

  async function addComment() {
    if (!task || !newComment.trim()) return;
    await supabase.from('comments').insert({
      task_id: task.id,
      author_id: userId,
      body: newComment.trim(),
    });
    setNewComment('');
    const { data } = await supabase.from('comments').select('*, profiles(display_name)').eq('task_id', task.id).order('created_at', { ascending: true });
    if (data) setComments(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 px-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg border p-6 mb-10"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {task ? 'Edit task' : 'New task'}
        </h2>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3 py-2 rounded border text-sm outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <option value="">Select project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Assign to</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full px-3 py-2 rounded border text-sm outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 rounded border text-sm outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <option value="low">Low (10 pts)</option>
                <option value="medium">Medium (25 pts)</option>
                <option value="high">High (50 pts)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 rounded border text-sm outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          {task && (
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded border text-sm outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}
        </div>

        {/* Comments */}
        {task && (
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Comments</h3>
            {comments.length > 0 && (
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="text-xs rounded p-2" style={{ background: 'var(--bg)' }}>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.profiles?.display_name}</span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                    <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{c.body}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
                className="flex-1 px-3 py-1.5 rounded border text-xs outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <button onClick={addComment} className="px-2 py-1 rounded text-xs font-medium text-white" style={{ background: 'var(--accent)' }}>
                Send
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-5">
          <div>
            {task && task.creator_id === userId && (
              <button onClick={handleDelete} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>
                Delete task
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded text-sm" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !projectId}
              className="px-3 py-1.5 rounded text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {saving ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
