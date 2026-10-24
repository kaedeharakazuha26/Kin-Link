import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

const inputClass =
  'w-full bg-[#181b2c] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition';

const Settings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/auth/password', { currentPassword, newPassword });
      toast.success(res.data.message || 'Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#090a10] py-8 px-4 sm:px-8">
      <div className="max-w-xl mx-auto bg-[#11131f] rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-2xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
          <KeyRound className="w-4 h-4" />
          <span>Security</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Change Password</h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Changing your password signs you out on all your other devices.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClass}
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
