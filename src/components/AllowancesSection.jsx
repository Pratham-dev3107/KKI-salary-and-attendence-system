import React, { useState, useMemo } from 'react';
import { 
  Home, 
  Search, 
  Edit3, 
  IndianRupee, 
  Utensils, 
  PlusCircle, 
  CheckCircle2, 
  X, 
  Building2, 
  DollarSign, 
  Gift, 
  Users,
  Save,
  RefreshCw
} from 'lucide-react';

export default function AllowancesSection({ 
  workers = [], 
  onUpdateCompensation 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWorker, setEditingWorker] = useState(null);
  
  // Modal Edit Form State
  const [monthlySalary, setMonthlySalary] = useState('');
  const [housingAllowance, setHousingAllowance] = useState('');
  const [foodAllowance, setFoodAllowance] = useState('');
  const [otherAllowance, setOtherAllowance] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  // Aggregate metrics
  const totalBaseSalarySum = useMemo(() => {
    return workers.reduce((sum, w) => sum + (parseFloat(w.monthly_salary) || 0), 0);
  }, [workers]);

  const totalHousingAllowanceSum = useMemo(() => {
    return workers.reduce((sum, w) => sum + (parseFloat(w.housing_allowance) || 0), 0);
  }, [workers]);

  const totalFoodAllowanceSum = useMemo(() => {
    return workers.reduce((sum, w) => sum + (parseFloat(w.food_allowance) || 0), 0);
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    if (!searchTerm.trim()) return workers;
    const term = searchTerm.toLowerCase();
    return workers.filter(w => 
      String(w.staff_no).toLowerCase().includes(term) ||
      String(w.staff_name).toLowerCase().includes(term) ||
      String(w.department || '').toLowerCase().includes(term)
    );
  }, [workers, searchTerm]);

  const handleOpenEdit = (worker) => {
    setEditingWorker(worker);
    setMonthlySalary(String(worker.monthly_salary || 15000));
    setHousingAllowance(String(worker.housing_allowance || 0));
    setFoodAllowance(String(worker.food_allowance || 0));
    setOtherAllowance(String(worker.other_allowance || 0));
  };

  const handleSaveCompensation = async (e) => {
    e.preventDefault();
    if (!editingWorker) return;

    setLoading(true);
    try {
      await onUpdateCompensation(editingWorker.staff_no, {
        monthly_salary: parseFloat(monthlySalary) || 0,
        housing_allowance: parseFloat(housingAllowance) || 0,
        food_allowance: parseFloat(foodAllowance) || 0,
        other_allowance: parseFloat(otherAllowance) || 0,
      });

      setToast(`Compensation updated for #${editingWorker.staff_no} - ${editingWorker.staff_name}!`);
      setTimeout(() => setToast(''), 4000);
      setEditingWorker(null);
    } catch (err) {
      alert('Error updating compensation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-display tracking-tight flex items-center gap-2">
              Workers Salary & Allowances Ledger
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Housing & Food Allowances
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage monthly base salaries, housing/room rent allowances ("rehne ka allowance"), and food allowances
            </p>
          </div>
        </div>
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Monthly Base Salaries</p>
            <p className="text-2xl font-bold text-white font-mono mt-1">₹{totalBaseSalarySum.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-slate-500 mt-1">Sum of base salaries across {workers.length} workers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Housing / Room Allowances</p>
            <p className="text-2xl font-bold text-indigo-400 font-mono mt-1">₹{totalHousingAllowanceSum.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-slate-500 mt-1">Total "rehne ka allowance" per month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Food & Canteen Allowances</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">₹{totalFoodAllowanceSum.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-slate-500 mt-1">Total food allowance per month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search worker by name, staff no, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="text-white font-bold">{filteredWorkers.length}</span> workers
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Staff No</th>
                <th className="py-3.5 px-4">Employee Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Base Salary (₹)</th>
                <th className="py-3.5 px-4 text-indigo-400">Housing Allowance ("Rehne Ka")</th>
                <th className="py-3.5 px-4 text-emerald-400">Food Allowance (₹)</th>
                <th className="py-3.5 px-4">Other Allowance (₹)</th>
                <th className="py-3.5 px-4 font-bold text-white">Total Compensation (₹)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    No worker records found. Upload an attendance sheet or import workers.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(w => {
                  const base = parseFloat(w.monthly_salary) || 15000;
                  const housing = parseFloat(w.housing_allowance) || 0;
                  const food = parseFloat(w.food_allowance) || 0;
                  const other = parseFloat(w.other_allowance) || 0;
                  const totalComp = base + housing + food + other;

                  return (
                    <tr key={w.staff_no} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        #{w.staff_no}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {w.staff_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] uppercase font-semibold">
                          {w.department || 'WORKER'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        ₹{base.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-300">
                        {housing > 0 ? `₹${housing.toLocaleString('en-IN')}` : <span className="text-slate-600">₹0</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-300">
                        {food > 0 ? `₹${food.toLocaleString('en-IN')}` : <span className="text-slate-600">₹0</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {other > 0 ? `₹${other.toLocaleString('en-IN')}` : <span className="text-slate-600">₹0</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                        ₹{totalComp.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(w)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Salary & Allowances</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT WORKER BASE SALARY & ALLOWANCES */}
      {editingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-modal w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-700/80 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  #{editingWorker.staff_no}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Salary & Allowances</h3>
                  <p className="text-xs text-slate-400">{editingWorker.staff_name} ({editingWorker.department || 'WORKER'})</p>
                </div>
              </div>

              <button onClick={() => setEditingWorker(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompensation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Base Salary (₹)</label>
                <input
                  type="number"
                  step="500"
                  placeholder="e.g. 15000"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Housing / Room Rent Allowance ("Rehne Ka Allowance") (₹)</label>
                <input
                  type="number"
                  step="100"
                  placeholder="e.g. 2000"
                  value={housingAllowance}
                  onChange={(e) => setHousingAllowance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Monthly room rent / housing allowance given to employee.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Food / Canteen Allowance (₹)</label>
                <input
                  type="number"
                  step="100"
                  placeholder="e.g. 1000"
                  value={foodAllowance}
                  onChange={(e) => setFoodAllowance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Other Special Allowance (₹)</label>
                <input
                  type="number"
                  step="100"
                  placeholder="e.g. 500"
                  value={otherAllowance}
                  onChange={(e) => setOtherAllowance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-1"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Compensation</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
