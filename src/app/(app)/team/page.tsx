'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import { friendlyError } from '@/lib/utils';
import { roleLabel } from '@/lib/permissions';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type TeamUser = User & { protected?: boolean };

const ROLES: User['role'][] = ['admin', 'editor', 'viewer'];

export default function TeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    authApi.users()
      .then((res) => setUsers(res.data.data.users ?? []))
      .catch((err) => toast.error(friendlyError(err, 'We could not load the team.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (user: TeamUser, role: User['role']) => {
    if (user.protected || user.role === role) return;
    setSavingId(user.uid);
    try {
      await authApi.updateRole(user.uid, role);
      setUsers((prev) => prev.map((item) => (item.uid === user.uid ? { ...item, role } : item)));
      toast.success(`${user.display_name || user.email} is now ${roleLabel(role)}.`);
    } catch (err) {
      toast.error(friendlyError(err, 'We could not update that role.'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div>
        <div className="page-header">Team</div>
        <div className="page-subtitle">Decide who can edit contracts and who can only view them.</div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center text-ink-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-5 py-12 text-sm text-ink-500">No accounts yet. People appear here after they sign up.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Person</th>
                <th className="table-header">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-t border-ink-100">
                  <td className="table-cell">
                    <div className="font-medium text-ink-900">{user.display_name || 'Unnamed'}</div>
                    <div className="text-xs text-ink-500">{user.email}</div>
                  </td>
                  <td className="table-cell">
                    {user.protected ? (
                      <span className="text-sm text-ink-700">Admin</span>
                    ) : (
                      <select
                        className="input py-1.5 text-sm w-36"
                        value={user.role || 'viewer'}
                        disabled={savingId === user.uid}
                        aria-label={`Role for ${user.email}`}
                        onChange={(e) => changeRole(user, e.target.value as User['role'])}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{roleLabel(role)}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-sm text-ink-500 space-y-1">
        <div><span className="text-ink-800">Admin</span> can view, create, edit, and delete, and can assign roles.</div>
        <div><span className="text-ink-800">Editor</span> can add contracts and change their stage, but cannot delete.</div>
        <div><span className="text-ink-800">Viewer</span> can only look at contracts.</div>
      </div>
    </div>
  );
}
