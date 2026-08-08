import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  User, 
  IndianRupee, 
  FileText, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from 'lucide-react';

export default function AdvanceSection({ 
  workers = [], 
  onAddAdvance, 
  onDeleteAdvance 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffNo, setSelectedStaffNo] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState('');

  // Extract all advance records flattened across workers
  const allAdvanceRecords = useMemo(() => {
    const records = [];
    workers.forEach(w => {
      if (w.advances && Array.isArray(w.advances)) {
        w.advances.forEach(adv => {
          records.push({
            ...adv,
            staff_no: w.staff_no,
            staff_name: w.staff_name,
            department: w.department || 'WORKER',
            monthly_salary: w.monthly_salary,
          });
        });
      }
    });
    return records.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  }, [workers]);

  // Aggregate metrics
  const totalAdvancesSum = useMemo(() => {
    return allAdvanceRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  }, [allAdvanceRecords]);

  const workersWithAdvancesCount = useMemo(() => {
    const set = new Set(allAdvanceRecords.map(r => r.staff_no));
    return set.size;
  }, [allAdvanceRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return allAdvanceRecords;
    const term = searchTerm.toLowerCase();
    return allAdvanceRecords.filter(r => 
      String(r.staff_no).toLowerCase().includes(term) ||
      String(r.staff_name).toLowerCase().includes(term) ||
      String(r.note || '').toLowerCase().includes(term) ||
      String(r.date || '').includes(term)
    );
  }, [allAdvanceRecords, searchTerm]);

  const handleSubmitNewAdvance = (e) => {
    e.preventDefault();
    if (!selectedStaffNo || !amount || parseFloat(amount) <= 0) {
      alert('Please select a worker and enter a valid positive advance amount.');
      return;
    }

    onAddAdvance({
      staff_no: selectedStaffNo,
      amount: parseFloat(amount),
      date,
      note,
    });

    setToast(`Advance of ₹${amount} recorded successfully for Staff #${selectedStaffNo}!`);
    setTimeout(() => setToast(''), 4000);

    // Reset form
    setSelectedStaffNo('');
    setAmount('');
    setNote('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-display tracking-tight flex items-center gap-2">
              Advance Pay & Loan Ledger
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Auto-Deducted in Salary
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage pre-payments, employee loans, and automatic monthly salary deductions
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Advance</span>
        </button>
      </div>

      {toast && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Advances Disbursed</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">₹{totalAdvancesSum.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-slate-500 mt-1">Deducted from monthly payroll</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workers with Advances</p>
            <p className="text-2xl font-bold text-white font-mono mt-1">{workersWithAdvancesCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Out of {workers.length} total staff members</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Transactions</p>
            <p className="text-2xl font-bold text-purple-400 font-mono mt-1">{allAdvanceRecords.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Recorded advance entries</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Record Advance Modal / Collapsible Form */}
      {showAddForm && (
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-slate-900/90 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Record New Advance Payment</span>
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitNewAdvance} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Worker</label>
              <select
                value={selectedStaffNo}
                onChange={(e) => setSelectedStaffNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">-- Choose Employee --</option>
                {workers.map(w => (
                  <option key={w.staff_no} value={w.staff_no}>
                    #{w.staff_no} - {w.staff_name} ({w.department || 'WORKER'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Advance Amount (₹)</label>
              <input
                type="number"
                step="100"
                placeholder="e.g. 2000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Note / Purpose</label>
              <input
                type="text"
                placeholder="e.g. Medical emergency advance"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-4 flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Advance Entry</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Table Card */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by worker name, staff no, date or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="text-white font-bold">{filteredRecords.length}</span> of {allAdvanceRecords.length} advance records
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Staff No</th>
                <th className="py-3.5 px-4">Employee Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Date Issued</th>
                <th className="py-3.5 px-4">Amount (₹)</th>
                <th className="py-3.5 px-4">Notes / Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <Wallet className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    No advance payments recorded yet. Click "Record New Advance" to add one.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id || `${record.staff_no}-${record.date}-${record.amount}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                      #{record.staff_no}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {record.staff_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] uppercase tracking-wider font-semibold">
                        {record.department || 'WORKER'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {record.date}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">
                      ₹{(parseFloat(record.amount) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 italic">
                      {record.note || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete advance of ₹${record.amount} for ${record.staff_name}?`)) {
                            onDeleteAdvance(record.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        title="Delete Advance Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
