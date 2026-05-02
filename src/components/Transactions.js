import API_URL from '../apiConfig';
import { useState, useEffect } from 'react';
import API_URL from '../apiConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import API_URL from '../apiConfig';
import { faSearch, faArrowDown, faArrowUp, faSync, faTrash, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const ITEMS_PER_PAGE = 10;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('${API_URL}/api/transactions');
      const data = await response.json();
      
      const formatted = data.map(t => ({
        id: t.id,
        type: t.type,
        category: t.category,
        description: t.description || t.category,
        amount: t.amount,
        date: t.date ? new Date(t.date).toISOString().split('T')[0] : 'Unknown',
        fullDate: t.date ? new Date(t.date).toLocaleString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }) : 'Unknown',
        icon: t.type === 'income' ? faArrowUp : faArrowDown,
        color: t.type === 'income' ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setTransactions(formatted);
    } catch (err) {
      console.log('API unavailable');
      setError('Cannot connect to API. Start the Python server.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm)
      );
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.type === filter);
    }
    
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setDeleteId(null);
        setExpandedId(null);
      }
    } catch (err) {
      console.log('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
          <p className="text-gray-500 text-sm mt-1">Loading data...</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
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
          <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
          <p className="text-gray-500 text-sm mt-1">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button 
          onClick={fetchTransactions}
          className="p-2 hover:bg-white rounded-xl transition-colors"
          title="Refresh"
        >
          <FontAwesomeIcon icon={faSync} className="text-gray-400" />
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
          {error}
        </div>
      )}

      {transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total Income</p>
            <p className="text-xl font-bold text-green-500">+MK {formatAmount(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-red-500">-MK {formatAmount(totalExpenses)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by category, description, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'income', 'expense'].map(opt => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === opt
                  ? 'bg-blue-500 text-white shadow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">No transactions found</p>
            <p className="text-sm">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Add your first transaction to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {paginatedTransactions.map((txn) => (
                <div key={txn.id}>
                  <div 
                    onClick={() => toggleExpand(txn.id)}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className={`w-10 h-10 ${txn.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <FontAwesomeIcon icon={txn.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate text-sm">{txn.description}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span className="truncate">{txn.category}</span>
                        <span>|</span>
                        <span className="whitespace-nowrap">{txn.date}</span>
                      </div>
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
                    <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Full Description</p>
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                >
                  Next
                </button>
              </div>
            )}
          </>
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