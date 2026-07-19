import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MockDatabase, Customer, RepairJob } from '../../services/mockDb';
import { DatabaseService } from '../../services/dbAdapter';
import { 
  Users, 
  UserPlus, 
  Search, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  ChevronRight, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Wrench,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { 
    customers, 
    repairs, 
    refreshData, 
    searchQuery, 
    setSearchQuery, 
    setActiveTab, 
    setSelectedRepairId,
    selectedCustomerId,
    setSelectedCustomerId
  } = useApp();
  const [selectedTab, setSelectedTab] = useState<'all' | 'new' | 'returning'>('all');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  // Filters
  const filteredCustomers = customers.filter(c => {
    // Search filter
    const matchesSearch = searchQuery.trim() === '' || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    // Tab filter
    if (selectedTab === 'new') {
      return matchesSearch && (c.createdAt.includes('2026') || c.createdAt.includes('Jul'));
    }
    if (selectedTab === 'returning') {
      return matchesSearch && c.totalJobs > 1;
    }
    return matchesSearch;
  });

  // Dynamic customer stats
  const totalCustomersCount = customers.length;
  const newThisMonthCount = customers.filter(c => c.createdAt.includes('2026') || c.createdAt.includes('Jul') || c.createdAt.includes('Aug')).length;
  const returningCount = customers.filter(c => c.totalJobs > 1).length;
  const returningPercent = totalCustomersCount > 0 ? Math.round((returningCount / totalCustomersCount) * 100) : 0;
  const totalReceivableAmount = customers.reduce((acc, curr) => acc + curr.pendingAmount, 0);
  const pendingCustomersCount = customers.filter(c => c.pendingAmount > 0).length;

  // Real Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchQuery]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Get selected customer's repairs history
  const customerRepairs = repairs.filter(r => r.customerId === selectedCustomer?.id);

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden -mx-6 -my-6">
      {/* Directory Table Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col text-left">
        
        {/* Top KPI Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-3">{totalCustomersCount}</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 text-slate-400">
              <UserPlus className="w-4 h-4 text-green-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">New This Month</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-3">{newThisMonthCount}</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Returning Customers</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-3">{returningCount}</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1.5 text-slate-400">
              <DollarSign className="w-4 h-4 text-red-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Receivable</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-3">₹{totalReceivableAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Filters Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm">
          {/* Tabs */}
          <div className="flex gap-1.5 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0">
            <button 
              onClick={() => setSelectedTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${selectedTab === 'all' ? 'bg-white text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
            >
              All Customers
            </button>
            <button 
              onClick={() => setSelectedTab('new')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${selectedTab === 'new' ? 'bg-white text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
            >
              New Customers
            </button>
            <button 
              onClick={() => setSelectedTab('returning')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${selectedTab === 'returning' ? 'bg-white text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
            >
              Returning Customers
            </button>
          </div>

          {/* Search bar inside */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-800 transition"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4.5">Customer</th>
                  <th className="px-6 py-4.5">Phone Number</th>
                  <th className="px-6 py-4.5">Total Jobs</th>
                  <th className="px-6 py-4.5">Total Spent</th>
                  <th className="px-6 py-4.5">Pending Amount</th>
                  <th className="px-6 py-4.5">Last Visit</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
                {paginatedCustomers.length > 0 ? (
                  paginatedCustomers.map(c => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <tr 
                        key={c.id}
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/30 cursor-pointer transition ${isSelected ? 'bg-blue-50/20' : ''}`}
                      >
                        <td className="px-6 py-4 flex items-center gap-3.5">
                          <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            c.isVip 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}>
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {c.name}
                              {c.isVip && (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[8px] font-bold rounded">VIP</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{c.city}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">+91 {c.phone}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">{c.totalJobs}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-bold">
                          {c.pendingAmount > 0 ? (
                            <span className="text-red-500">₹{c.pendingAmount.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-green-600">₹0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{c.lastVisit}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-300 transition">
                            •••
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-slate-400">
                      No customer records found matching search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Dynamic Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs text-slate-400 font-semibold">
              Showing {filteredCustomers.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} customers
            </span>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white transition shrink-0 ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pNum = index + 1;
                  const isCurrent = currentPage === pNum;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white transition shrink-0 ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out Customer Profile Sidebar Panel */}
      {selectedCustomer && (
        <div className="w-[420px] border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col text-left">
          {/* Panel Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                selectedCustomer.isVip ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 dark:text-slate-300'
              }`}>
                {getInitials(selectedCustomer.name)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-1.5">
                  {selectedCustomer.name}
                  {selectedCustomer.isVip && (
                    <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[8px] font-bold rounded">VIP Customer</span>
                  )}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1 inline-block">{selectedCustomer.id}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => {
                    setEditName(selectedCustomer.name);
                    setEditPhone(selectedCustomer.phone);
                    setEditEmail(selectedCustomer.email || '');
                    setEditCity(selectedCustomer.city);
                    setIsEditing(true);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    disabled={editSaving}
                    onClick={async () => {
                      if (!editName.trim() || !editPhone.trim()) return;
                      setEditSaving(true);
                      await DatabaseService.updateCustomer(selectedCustomer.id, {
                        name: editName.trim(),
                        phone: editPhone.trim(),
                        email: editEmail.trim(),
                        city: editCity.trim(),
                      });
                      setEditSaving(false);
                      setIsEditing(false);
                      refreshData();
                    }}
                    className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {editSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setIsEditing(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                title="Close Profile"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Contact Details card */}
            <div className="space-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-5">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Name</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Phone</label>
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email</label>
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="email@example.com" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">City</label>
                    <input value={editCity} onChange={e => setEditCity(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-mono">+91 {selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{selectedCustomer.email || 'No email registered'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{selectedCustomer.city}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Customer since: {selectedCustomer.createdAt}</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Jobs</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{selectedCustomer.totalJobs}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Amount</span>
                <span className={`text-sm font-extrabold mt-1 block ${selectedCustomer.pendingAmount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  ₹{selectedCustomer.pendingAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Last Visit</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1 block truncate">{selectedCustomer.lastVisit}</span>
              </div>
            </div>

            {/* Recent Repair History */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Recent Repair History</h4>
                <a href="#" className="text-[10px] text-blue-600 font-bold hover:underline">View All</a>
              </div>
              <div className="space-y-2.5">
                {customerRepairs.length > 0 ? (
                  customerRepairs.map(job => (
                    <div 
                      key={job.id} 
                      className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{job.device.brand} {job.device.model}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Job #{job.id} • {job.receivedAt}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded">Completed</span>
                        <p className="font-extrabold text-slate-700 dark:text-slate-200 mt-1.5">₹{job.estimatedCost}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">No repair history found.</p>
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-3 border-t border-slate-50 pt-5">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Quick Actions</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                <button 
                  onClick={() => {
                    const event = new CustomEvent('open-new-repair', { detail: { customer: selectedCustomer } });
                    window.dispatchEvent(event);
                  }}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-50 rounded-xl flex flex-col items-center gap-1.5 transition cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>New Job</span>
                </button>
                <button 
                  onClick={() => {
                    if (customerRepairs.length > 0) {
                      setSelectedRepairId(customerRepairs[0].id);
                    }
                    setActiveTab('billing');
                  }}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-50 rounded-xl flex flex-col items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-green-600" />
                  <span>Invoice</span>
                </button>
                <button 
                  onClick={() => {
                    if (customerRepairs.length > 0) {
                      setSelectedRepairId(customerRepairs[0].id);
                    }
                    setActiveTab('repairs');
                  }}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-50 rounded-xl flex flex-col items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>History</span>
                </button>
                <button 
                  onClick={() => {
                    if (customerRepairs.length > 0) {
                      setSelectedRepairId(customerRepairs[0].id);
                    }
                    setActiveTab('billing');
                  }}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-50 rounded-xl flex flex-col items-center gap-1.5 transition cursor-pointer"
                >
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  <span>Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
