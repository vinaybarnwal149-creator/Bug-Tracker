import React, { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Badge } from '../ui/Badge.jsx';
import { projectsApi } from '../../api/projects.api.js';
import { can } from '../../lib/permissions.js';
import { useAuth } from '../../hooks/useAuth.js';

export const MemberTable = ({
  projectId,
  members = [],
  myRole = 'viewer',
  onUpdated
}) => {
  const { user: currentUser } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('developer');
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canManage = can(myRole, 'manage_members');

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newEmail) return;

    setErrorMsg('');
    setLoadingAdd(true);
    try {
      await projectsApi.addMember(projectId, {
        email: newEmail.trim().toLowerCase(),
        role: newRole
      });
      setNewEmail('');
      onUpdated?.();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add member');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleRoleChange = async (targetUserId, role) => {
    try {
      await projectsApi.updateMemberRole(projectId, targetUserId, role);
      onUpdated?.();
    } catch (err) {
      alert(err.message || 'Failed to update member role');
    }
  };

  const handleRemove = async (targetUserId) => {
    if (!window.confirm('Remove this member from the project? Their assigned tickets will become unassigned.')) {
      return;
    }
    try {
      await projectsApi.removeMember(projectId, targetUserId);
      onUpdated?.();
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Member Form */}
      {canManage && (
        <form onSubmit={handleAddMember} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Add New Member
          </h4>
          {errorMsg && (
            <p className="text-xs text-rose-600 mb-3 bg-rose-50 p-2 rounded border border-rose-200">
              {errorMsg}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="colleague@example.com"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="manager">Manager</option>
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
              </Select>
            </div>
            <Button type="submit" loading={loadingAdd} className="whitespace-nowrap">
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </Button>
          </div>
        </form>
      )}

      {/* Members List Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              {canManage && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => {
              const u = m.user;
              if (!u) return null;
              const isOwner = m.role === 'owner';
              const isSelf = u.id === currentUser?.id || u._id === currentUser?.id;

              return (
                <tr key={u.id || u._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} avatarColor={u.avatarColor} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {u.name} {isSelf && <span className="text-xs text-indigo-600 font-normal">(You)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {canManage && !isOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(u.id || u._id, e.target.value)}
                        className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium capitalize"
                      >
                        <option value="manager">Manager</option>
                        <option value="developer">Developer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <Badge variant={isOwner ? 'primary' : 'default'} className="capitalize">
                        {m.role}
                      </Badge>
                    )}
                  </td>

                  {canManage && (
                    <td className="py-3 px-4 text-right">
                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemove(u.id || u._id)}
                          title="Remove member"
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
