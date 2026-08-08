import React from 'react';
import { History, UserCheck, Clock, ShieldCheck } from 'lucide-react';

export default function AuditLogsModal({ auditLogs = [] }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-display">System Audit Trail & Edit Logs</h2>
            <p className="text-xs text-slate-400">Complete immutable record of all manual attendance corrections</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Staff No.</th>
                <th className="px-4 py-3.5">Target Date</th>
                <th className="px-4 py-3.5">Original Value</th>
                <th className="px-4 py-3.5">New Value</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5">Edited By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500 font-sans">
                    No manual corrections recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-300">#{log.staff_no}</td>
                    <td className="px-4 py-3 text-slate-200">{log.date}</td>
                    <td className="px-4 py-3 text-rose-400 text-[11px] max-w-xs truncate">{log.old_value || '—'}</td>
                    <td className="px-4 py-3 text-emerald-400 text-[11px] max-w-xs truncate">{log.new_value || '—'}</td>
                    <td className="px-4 py-3 text-slate-300 font-sans text-xs">{log.reason || 'Manual Correction'}</td>
                    <td className="px-4 py-3 text-slate-400 font-sans text-xs">{log.edited_by || 'Admin'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
