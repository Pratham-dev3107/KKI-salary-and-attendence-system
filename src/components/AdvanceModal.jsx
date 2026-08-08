import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, X, CheckCircle } from 'lucide-react';

export default function AdvanceModal({ staffNo, advances = [], onAddAdvance, onDeleteAdvance, onClose }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive advance amount.');
      return;
    }

    onAddAdvance({
      staff_no: staffNo,
      date,
      amount: parseFloat(amount),
      note,
    });

    setAmount('');
    setNote('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-modal w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-700/60 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Worker Advance Payment Ledger</h3>
              <p className="text-xs text-slate-400">Staff No: <strong className="text-purple-300 font-mono">#{staffNo}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Form */}
        <form onSubmit={handleSubmit} className="space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Record New Advance</span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 2000"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Optional Note / Reason</label>
            <input
              type="text"
              placeholder="e.g. Festival advance / Medical emergency"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}

          <button
            type="submit"
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center justify-center space-x-1.5 transition-all mt-2"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Add Advance to Ledger</span>
          </button>
        </form>

        {/* Existing Advances List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Advance History (Current Month)</h4>
          
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {advances.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No advances recorded for this worker.</p>
            ) : (
              advances.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded-lg p-2.5 text-xs">
                  <div>
                    <p className="font-mono font-bold text-purple-300">₹{(a.amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-400">{a.date} {a.note ? `• ${a.note}` : ''}</p>
                  </div>
                  <button
                    onClick={() => onDeleteAdvance(a.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                    title="Delete advance entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
