import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Key,
  LogIn,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User as UserType, UserRole } from '../../types';
import { generateDirectAccessUrl } from '../../utils/whatsappEngine';

export const TeamView: React.FC = () => {
  const {
    users,
    jobs,
    currentUser,
    switchUser,
    addUser,
    deleteUser,
    openUserProfile,
    setIsAddEmployeeModalOpen,
    openBulkJobReminders,
    setActiveTab,
  } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const canManage = ['admin', 'manager'].includes(currentUser.role);

  const copyTokenLink = (user: UserType) => {
    const assigned = jobs.filter((j) => j.assignedToId === user.id);
    const sampleJob = assigned[0] || jobs[0];
    const url = generateDirectAccessUrl(user, sampleJob);
    navigator.clipboard.writeText(url);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Team &amp; Field Staff Directory</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage field engineers, roles, WhatsApp numbers, workloads, and individual 1-click token credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddEmployeeModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Grid of Team Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const activeJobsCount = jobs.filter(
            (j) => j.assignedToId === user.id && !['completed', 'cancelled'].includes(j.status)
          ).length;

          const isCurrent = currentUser.id === user.id;

          return (
            <div
              key={user.id}
              className={`p-5 rounded-2xl bg-white border shadow-xs transition-all flex flex-col justify-between ${
                isCurrent ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-stone-200 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-stone-900 text-sm">{user.name}</h3>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500">{user.designation}</div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {user.employeeId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {user.role}
                    </span>

                    {canManage && (
                      <button
                        onClick={() => openUserProfile(user)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 cursor-pointer transition-colors"
                        title="Edit User Profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAdmin && !isCurrent && (
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 cursor-pointer transition-colors"
                        title="Delete Team Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact and Workload Info */}
                <div className="space-y-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-100 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">WhatsApp / Phone:</span>
                    <a
                      href={`https://wa.me/${(user.whatsapp || user.mobile || '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>{user.whatsapp || user.mobile || 'Not Set'}</span>
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Email:</span>
                    <span className="text-stone-700 truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                    <span className="text-stone-500 font-medium">Active Jobs in Pipeline:</span>
                    <span className="font-bold text-stone-900 px-2 py-0.5 rounded bg-white border border-stone-200">
                      {activeJobsCount} Active
                    </span>
                  </div>
                </div>

                {/* 1-Click Token Snippet */}
                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[11px] space-y-1 mb-3">
                  <div className="flex items-center justify-between text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1">
                      <Key className="w-3 h-3 text-emerald-700" />
                      Direct Access Token:
                    </span>
                    <span className="font-mono text-[10px] text-stone-500 truncate max-w-[120px]">
                      {user.secureToken}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyTokenLink(user)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Copy 1-click login link embedded in WhatsApp message"
                  >
                    {copiedId === user.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openUserProfile(user)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="View & Edit Profile"
                  >
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    <span>Profile</span>
                  </button>

                  {canManage && (
                    <button
                      onClick={() => openBulkJobReminders(user.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title={`Send bulk WhatsApp reminders for all ${activeJobsCount} pending/upcoming jobs of ${user.name}`}
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Remind ({activeJobsCount})</span>
                    </button>
                  )}
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => {
                      switchUser(user.id);
                      if (user.role === 'engineer') {
                        setActiveTab('my_jobs');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Remove Team Member?</h3>
                <p className="text-xs text-stone-500">This will revoke system and WhatsApp token access.</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
              Are you sure you want to remove <strong>{userToDelete.name}</strong> ({userToDelete.designation})? Any active tasks assigned to this engineer will remain intact and can be reassigned.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
