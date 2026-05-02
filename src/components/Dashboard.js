import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, faArrowTrendUp, faArrowTrendDown,
  faArrowUp, faArrowDown, faEllipsisVertical,
  faChevronDown, faChevronUp, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#f97316', '#f59e0b', '#eab308', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];

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

const formatYAxis = (value) => {
  if (value >= 1000000) return (value / 1000000) + 'M';
  if (value >= 1000) return (value / 1000) + 'K';
  return value;
};

const formatTooltip = (value) => {
  return 'MK ' + value.toLocaleString();
};

export default function Dashboard({ onNavigate }) {
  const [balance, setBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [spendingData, setSpendingData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [balanceRes, summaryRes, txnsRes] = await Promise.all([
        fetch('http://localhost:5000/api/balance'),
        fetch('http://localhost:5000/api/summary'),
        fetch('http://localhost:5000/api/transactions')
      ]);

      const balanceData = await balanceRes.json();
      const summaryData = await summaryRes.json();
      const transactionsData = await txnsRes.json();

      setBalance(balanceData.balance || 0);
      setMonthlyIncome(summaryData.total_income || 0);
      setMonthlyExpenses(summaryData.total_expenses || 0);

      const formattedTxns = transactionsData.slice(0, 10).map(t => ({
        id: t.id,
        type: t.type,
        category: t.category,
        description: t.description || t.category,
        amount: t.amount,
        date: t.date ? new Date(t.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Recent',
        fullDate: t.date ? new Date(t.date).toLocaleString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }) : 'Unknown',
        icon: t.type === 'income' ? faArrowUp : faArrowDown,
        color: t.type === 'income' ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'
      }));
      setTransactions(formattedTxns);

      const byDay = {};
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      transactionsData.forEach(t => {
        if (t.type === 'expense') {
          const day = new Date(t.date).getDay();
          const dayName = days[day === 0 ? 6 : day - 1];
          byDay[dayName] = (byDay[dayName] || 0) + t.amount;
        }
      });
      
      const spendingByDay = days.map(day => ({
        name: day,
        amount: byDay[day] || 0
      }));
      setSpendingData(spendingByDay.some(d => d.amount > 0) ? spendingByDay : [
        { name: 'Mon', amount: 0 }, { name: 'Tue', amount: 0 },
        { name: 'Wed', amount: 0 }, { name: 'Thu', amount: 0 },
        { name: 'Fri', amount: 0 }, { name: 'Sat', amount: 0 },
        { name: 'Sun', amount: 0 }
      ]);

      const byCategory = {};
      transactionsData.forEach(t => {
        if (t.type === 'expense') {
          byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        }
      });
      
      const categoryBreakdown = Object.entries(byCategory).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }));
      setCategoryData(categoryBreakdown);

    } catch (err) {
      console.log('API unavailable, using empty data');
      setError('API not running. Start the Python server to see real data.');
      setBalance(0);
      setMonthlyIncome(0);
      setMonthlyExpenses(0);
      setTransactions([]);
      setSpendingData([
        { name: 'Mon', amount: 0 }, { name: 'Tue', amount: 0 },
        { name: 'Wed', amount: 0 }, { name: 'Thu', amount: 0 },
        { name: 'Fri', amount: 0 }, { name: 'Sat', amount: 0 },
        { name: 'Sun', amount: 0 }
      ]);
      setCategoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setDeleteId(null);
        setExpandedId(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.log('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">Loading your financial overview...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Your financial overview</p>
        </div>
        <button onClick={fetchDashboardData} className="p-2 hover:bg-white rounded-xl transition-colors" title="Refresh data">
          <FontAwesomeIcon icon={faEllipsisVertical} className="text-gray-400" />
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <FontAwesomeIcon icon={faWallet} className="text-xl" />
            </div>
            <span className="text-blue-100 text-sm">Current</span>
          </div>
          <p className="text-3xl font-bold mb-1">MK {formatAmount(balance)}</p>
          <p className="text-blue-100 text-sm">Available Balance</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-green-500 text-xl" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-1">MK {formatAmount(monthlyIncome)}</p>
          <p className="text-gray-500 text-sm">Monthly Income</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowTrendDown} className="text-red-500 text-xl" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-1">MK {formatAmount(monthlyExpenses)}</p>
          <p className="text-gray-500 text-sm">Monthly Expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending Trends</h3>
          {spendingData.every(d => d.amount === 0) ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400">
              <p>No spending data yet. Add some transactions.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={formatYAxis} />
                <Tooltip 
                  formatter={formatTooltip}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Breakdown</h3>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-gray-400">
              <p>No expense data yet.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatTooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-gray-600">{cat.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
          <button 
            onClick={() => onNavigate('transactions')}
            className="text-blue-500 text-sm font-medium hover:text-blue-600"
          >
            View All
          </button>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No transactions yet. Click the Add button to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.slice(0, 4).map((txn) => (
              <div key={txn.id}>
                <div 
                  onClick={() => toggleExpand(txn.id)}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className={`w-10 h-10 ${txn.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <FontAwesomeIcon icon={txn.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{txn.category}</p>
                    <p className="text-xs text-gray-500">{txn.date}</p>
                  </div>
                  <p className={`font-semibold text-sm whitespace-nowrap ${txn.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {txn.type === 'income' ? '+' : '-'}MK{formatAmount(txn.amount)}
                  </p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeleteId(txn.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Delete transaction"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                  </button>
                  <FontAwesomeIcon 
                    icon={expandedId === txn.id ? faChevronUp : faChevronDown} 
                    className="text-gray-400 text-xs flex-shrink-0"
                  />
                </div>
                
                {expandedId === txn.id && (
                  <div className="px-2 pb-3 pt-2 mb-2 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Description</p>
                        <p className="text-gray-800 font-medium">{txn.description}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Exact Amount</p>
                        <p className={`font-semibold ${txn.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {txn.type === 'income' ? '+' : '-'}MK{txn.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Date & Time</p>
                        <p className="text-gray-800">{txn.fullDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Category</p>
                        <p className="text-gray-800">{txn.category}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Transaction</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this transaction? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}