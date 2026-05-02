import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, faChartPie, faPiggyBank, 
  faBars, faXmark, faPlus 
} from '@fortawesome/free-solid-svg-icons';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Budget from './components/Budget';
import AddTransaction from './components/AddTransaction';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleTransactionAdded = useCallback(() => {
    setShowAddModal(false);
    triggerRefresh();
  }, [triggerRefresh]);

  const navItems = [
    { id: 'dashboard', icon: faChartPie, label: 'Dashboard' },
    { id: 'transactions', icon: faWallet, label: 'Transactions' },
    { id: 'budget', icon: faPiggyBank, label: 'Budget' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white shadow-xl z-50">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faWallet} className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">KwachaKeeper</h1>
              <p className="text-xs text-gray-500">Financial Tracker</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-lg" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Transaction</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faWallet} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">KwachaKeeper</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} className="text-gray-600 text-xl" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-2xl">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-8">
        {activeTab === 'dashboard' && <Dashboard key={`dashboard-${refreshKey}`} onNavigate={setActiveTab} />}
        {activeTab === 'transactions' && <Transactions key={`transactions-${refreshKey}`} />}
        {activeTab === 'budget' && <Budget key={`budget-${refreshKey}`} />}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg ${
                activeTab === item.id ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-lg" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg -mt-6"
          >
            <FontAwesomeIcon icon={faPlus} className="text-lg" />
            <span className="text-xs">Add</span>
          </button>
        </div>
      </nav>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransaction 
          onClose={() => setShowAddModal(false)} 
          onSuccess={handleTransactionAdded}
        />
      )}
    </div>
  );
}

export default App;