import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPiggyBank, faTriangleExclamation, faCheckCircle,
  faPlus, faXmark, faSync
} from '@fortawesome/free-solid-svg-icons';

const CATEGORIES = [
  'Food & Groceries', 'Transport (Minibus/Fuel)', 'Airtime & Data',
  'Utilities (ESCOM/Water)', 'Rent/Housing', 'Education/School Fees',
  'Healthcare/Medicine', 'Family Support'
];

const CATEGORY_COLORS = {
  'Food & Groceries': { bg: 'bg-orange-500', bar: '#f97316', light: 'bg-orange-50 text-orange-600' },
  'Transport (Minibus/Fuel)': { bg: 'bg-amber-500', bar: '#f59e0b', light: 'bg-amber-50 text-amber-600' },
  'Airtime & Data': { bg: 'bg-yellow-500', bar: '#eab308', light: 'bg-yellow-50 text-yellow-600' },
  'Utilities (ESCOM/Water)': { bg: 'bg-red-500', bar: '#ef4444', light: 'bg-red-50 text-red-600' },
  'Rent/Housing': { bg: 'bg-rose-500', bar: '#ec4899', light: 'bg-rose-50 text-rose-600' },
  'Education/School Fees': { bg: 'bg-blue-500', bar: '#3b82f6', light: 'bg-blue-50 text-blue-600' },
  'Healthcare/Medicine': { bg: 'bg-pink-500', bar: '#ec4899', light: 'bg-pink-50 text-pink-600' },
  'Family Support': { bg: 'bg-purple-500', bar: '#8b5cf6', light: 'bg-purple-50 text-purple-600' }
};

const formatAmount = (amount) => {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 1000000) {
    const millions = absAmount / 1000000;
    const formatted = millions % 1 === 0 ? millions + 'M' : millions.toFixed(2) + 'M';
    return sign + formatted;
  }
  if (absAmount >= 1000) {
    const thousands = absAmount / 1000;
    const formatted = thousands % 1 === 0 ? thousands + 'K' : thousands.toFixed(1) + 'K';
    return sign + formatted;
  }
  return sign + absAmount.toLocaleString();
};

export default function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [spending, setSpending] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState('Food & Groceries');
  const [newAmount, setNewAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [txnsRes, budgetsRes] = await Promise.all([
        fetch('http://localhost:5000/api/transactions'),
        fetch('http://localhost:5000/api/budgets')
      ]);

      const transactions = await txnsRes.json();
      const savedBudgets = await budgetsRes.json();

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlySpending = {};
      transactions.forEach(t => {
        const txDate = new Date(t.date);
        if (t.type === 'expense' && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
          monthlySpending[t.category] = (monthlySpending[t.category] || 0) + t.amount;
        }
      });
      setSpending(monthlySpending);

      const budgetList = CATEGORIES.map(cat => ({
        category: cat,
        budgeted: savedBudgets[cat] || 0,
        spent: monthlySpending[cat] || 0,
        color: CATEGORY_COLORS[cat] || { bg: 'bg-gray-500', bar: '#6b7280', light: 'bg-gray-50 text-gray-600' }
      }));
      setBudgets(budgetList);

    } catch (err) {
      console.log('API unavailable');
      setError('Cannot connect to API. Start the Python server.');
      setBudgets(CATEGORIES.map(cat => ({
        category: cat,
        budgeted: 0,
        spent: 0,
        color: CATEGORY_COLORS[cat] || { bg: 'bg-gray-500', bar: '#6b7280', light: 'bg-gray-50 text-gray-600' }
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await fetch('http://localhost:5000/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          amount: parseFloat(newAmount) || 0
        })
      });
    } catch (err) {
      console.log('Budget saved locally');
    }
    
    const updatedBudgets = budgets.map(b => 
      b.category === newCategory 
        ? { ...b, budgeted: parseFloat(newAmount) || 0 }
        : b
    );
    setBudgets(updatedBudgets);
    
    setSaveSuccess(true);
    setTimeout(() => {
      setShowModal(false);
      setSaveSuccess(false);
      setNewAmount('');
    }, 1000);
  };

  const totalBudgeted = budgets.reduce((sum, b) => sum + (b.budgeted || 0), 0);
  const totalSpent = Object.values(spending).reduce((sum, s) => sum + s, 0);
  const remaining = totalBudgeted - totalSpent;
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Budget</h2>
          <p className="text-gray-500 text-sm mt-1">Loading data...</p>
        </div>
        <div className="bg-white rounded-2xl p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Budget</h2>
          <p className="text-gray-500 text-sm mt-1">Track your spending limits</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchBudgetData}
            className="p-2 hover:bg-white rounded-xl transition-colors"
            title="Refresh"
          >
            <FontAwesomeIcon icon={faSync} className="text-gray-400" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all text-sm"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span className="hidden sm:inline">Set Budget</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <FontAwesomeIcon icon={faPiggyBank} className="text-xl" />
          </div>
          <span className="text-lg font-semibold">Monthly Overview</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-indigo-100 text-xs mb-1">Budget</p>
            <p className="text-lg font-bold">MK {formatAmount(totalBudgeted)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-indigo-100 text-xs mb-1">Spent</p>
            <p className="text-lg font-bold">MK {formatAmount(totalSpent)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-indigo-100 text-xs mb-1">Remaining</p>
            <p className={`text-lg font-bold ${remaining < 0 ? 'text-red-300' : ''}`}>
              MK {formatAmount(remaining)}
            </p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-4 mb-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${overallPercentage > 100 ? 'bg-red-400' : 'bg-white'}`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
        <p className="text-indigo-100 text-sm">
          {totalBudgeted === 0 
            ? 'Set budgets to start tracking' 
            : overallPercentage > 100
              ? `${overallPercentage.toFixed(0)}% of budget used - Over budget!`
              : `${overallPercentage.toFixed(0)}% of budget used`}
        </p>
      </div>

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow border border-gray-100">
            <p>No budgets set yet. Click "Set Budget" to get started.</p>
          </div>
        ) : (
          budgets.map((item, index) => {
            const spent = item.spent || 0;
            const budgeted = item.budgeted || 0;
            const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
            const isOverBudget = budgeted > 0 && spent > budgeted;
            const isWarning = budgeted > 0 && percentage >= 80;

            return (
              <div key={index} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${item.color.bg}`} />
                    <span className="font-semibold text-gray-800">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOverBudget ? (
                      <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">Over Budget</span>
                    ) : isWarning ? (
                      <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-1 rounded-full">Warning</span>
                    ) : budgeted > 0 ? (
                      <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">On Track</span>
                    ) : null}
                  </div>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">
                    MK{formatAmount(spent)} spent
                  </span>
                  <span className="text-gray-400">
                    {budgeted > 0 ? `MK${formatAmount(budgeted)} budget` : 'No budget set'}
                  </span>
                </div>

                <div className="bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverBudget ? 'bg-red-500' : isWarning ? 'bg-amber-500' : item.color.bg
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <span className={isOverBudget ? 'text-red-500 font-medium' : 'text-gray-400'}>
                    {budgeted > 0 ? `${percentage.toFixed(0)}% used` : ''}
                  </span>
                  <span className={isOverBudget ? 'text-red-500 font-medium' : 'text-gray-400'}>
                    {budgeted > 0 
                      ? (isOverBudget 
                          ? `MK${formatAmount(spent - budgeted)} over` 
                          : `MK${formatAmount(budgeted - spent)} left`)
                      : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {saveSuccess ? 'Budget Saved' : 'Set Budget'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FontAwesomeIcon icon={faXmark} className="text-gray-400" />
              </button>
            </div>

            {saveSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-2xl" />
                </div>
                <p className="text-gray-800 font-semibold">Budget Updated Successfully</p>
              </div>
            ) : (
              <form onSubmit={handleSetBudget} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget (MK)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Budget'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}