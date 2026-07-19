import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, 
  Calendar, 
  Filter, 
  Download, 
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  Package,
  X,
  User,
  CreditCard,
  Layers,
  ArrowRight
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { repairs, customers, inventory } = useApp();
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'sales' | 'repairs' | 'technicians' | 'inventory'>('overview');

  // Hover states for interactive charts
  const [hoveredRevIndex, setHoveredRevIndex] = useState<number | null>(null);
  const [hoveredJobIndex, setHoveredJobIndex] = useState<number | null>(null);

  // Filter drawer/panel states
  const [showFilterCard, setShowFilterCard] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [techFilter, setTechFilter] = useState('All');

  // Custom date picker states (default: last 30 days)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePreset, setDatePreset] = useState<string>('30days');
  const [startDateStr, setStartDateStr] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDateStr, setEndDateStr] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [appliedStartDate, setAppliedStartDate] = useState<Date>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [appliedEndDate, setAppliedEndDate] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  // Helper: parse date format "18 Jul 2026"
  const parseReceivedAt = (dateStr: string): Date => {
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = months.indexOf(parts[1]);
      const year = parseInt(parts[2]);
      if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) {
        return new Date(year, monthIndex, day);
      }
    }
    return new Date(dateStr);
  };

  // Format date back to user readable string
  const formatDateRangeText = () => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return `${appliedStartDate.toLocaleDateString('en-GB', options)} - ${appliedEndDate.toLocaleDateString('en-GB', options)}`;
  };

  // Set date ranges via presets
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    let start = new Date();
    
    if (preset === 'today') {
      start.setHours(0,0,0,0);
    } else if (preset === '7days') {
      start.setDate(now.getDate() - 7);
    } else if (preset === '30days') {
      start.setDate(now.getDate() - 30);
    } else if (preset === 'thismonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === 'alltime') {
      start = new Date(2020, 0, 1);
    }
    
    setStartDateStr(start.toISOString().split('T')[0]);
    setEndDateStr(now.toISOString().split('T')[0]);
    setAppliedStartDate(start);
    setAppliedEndDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    setShowDatePicker(false);
  };

  const handleCustomDateApply = () => {
    setAppliedStartDate(new Date(startDateStr));
    setAppliedEndDate(new Date(new Date(endDateStr).getTime() + 24 * 60 * 60 * 1000));
    setDatePreset('custom');
    setShowDatePicker(false);
  };

  // Get unique filter keys for dropdowns
  const uniqueBrands = Array.from(new Set(repairs.map(r => r.device?.brand).filter(Boolean)));
  const uniqueTechs = Array.from(new Set(repairs.map(r => r.technician).filter(Boolean)));

  // Filtered repairs based on date range + dropdown selections
  const filteredRepairs = repairs.filter(r => {
    const rDate = parseReceivedAt(r.receivedAt);
    const inDateRange = rDate >= appliedStartDate && rDate <= appliedEndDate;
    
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesBrand = brandFilter === 'All' || r.device?.brand === brandFilter;
    const matchesTech = techFilter === 'All' || r.technician === techFilter;

    return inDateRange && matchesStatus && matchesBrand && matchesTech;
  });

  // Dynamic calculations on filtered repairs
  const totalRevenue = filteredRepairs.reduce((acc, curr) => acc + curr.advancePaid, 0);
  const totalJobs = filteredRepairs.length;
  const completedJobs = filteredRepairs.filter(r => r.status === 'Completed' || r.status === 'Delivered').length;
  const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
  const pendingJobs = filteredRepairs.filter(r => r.status !== 'Completed' && r.status !== 'Delivered' && r.status !== 'Cancelled').length;
  const pendingRate = totalJobs > 0 ? Math.round((pendingJobs / totalJobs) * 100) : 0;
  const avgOrderValue = totalJobs > 0 ? Math.round(filteredRepairs.reduce((acc, curr) => acc + curr.estimatedCost, 0) / totalJobs) : 0;
  const totalCustomers = customers.length;

  const totalPaid = totalRevenue;
  const totalRemaining = filteredRepairs.reduce((acc, curr) => acc + curr.remainingBalance, 0);
  const totalEstimatedCost = filteredRepairs.reduce((acc, curr) => acc + curr.estimatedCost, 0);
  const paidPercent = totalEstimatedCost > 0 ? Math.round((totalPaid / totalEstimatedCost) * 100) : 0;
  const remainingPercent = totalEstimatedCost > 0 ? Math.round((totalRemaining / totalEstimatedCost) * 100) : 0;

  // Tabs structure
  const tabs = [
    { id: 'overview', label: 'Overview', desc: 'Business summary' },
    { id: 'sales', label: 'Sales Report', desc: 'All sales & revenue' },
    { id: 'repairs', label: 'Repair Report', desc: 'Repair & job analytics' },
    { id: 'technicians', label: 'Technician Report', desc: 'Technician performance' },
    { id: 'inventory', label: 'Inventory Report', desc: 'Stock & inventory' }
  ];

  // Dynamic grouping by Brand
  const categoriesMap: { [key: string]: { count: number, revenue: number } } = {};
  filteredRepairs.forEach(r => {
    const brand = r.device?.brand || 'Other';
    if (!categoriesMap[brand]) {
      categoriesMap[brand] = { count: 0, revenue: 0 };
    }
    categoriesMap[brand].count += 1;
    categoriesMap[brand].revenue += r.estimatedCost;
  });

  const topCategories = Object.entries(categoriesMap).map(([name, val]) => ({
    name,
    count: val.count,
    revenue: val.revenue,
    percent: totalEstimatedCost > 0 ? Math.round((val.revenue / totalEstimatedCost) * 100) : 0,
    color: name === 'Apple' ? 'bg-blue-600' : name === 'Samsung' ? 'bg-green-500' : 'bg-slate-400'
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Dynamic grouping by Tech
  const techMap: { [key: string]: { count: number, revenue: number } } = {};
  filteredRepairs.forEach(r => {
    const tech = r.technician || 'Unassigned';
    if (!techMap[tech]) {
      techMap[tech] = { count: 0, revenue: 0 };
    }
    techMap[tech].count += 1;
    techMap[tech].revenue += r.estimatedCost;
  });

  const topTechnicians = Object.entries(techMap).map(([name, val]) => ({
    name,
    count: val.count,
    revenue: val.revenue,
    rating: 5.0,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Export Active Report to CSV
  const handleExportCSV = () => {
    let csvContent = "";
    let filename = "";

    if (activeReportTab === 'overview') {
      filename = "business_overview_report.csv";
      csvContent += "Metric,Value\n";
      csvContent += `Total Revenue,₹${totalRevenue}\n`;
      csvContent += `Total Jobs,${totalJobs}\n`;
      csvContent += `Completed Jobs,${completedJobs}\n`;
      csvContent += `Pending Jobs,${pendingJobs}\n`;
      csvContent += `Avg Order Value,₹${avgOrderValue}\n`;
      csvContent += `Total Customers,${totalCustomers}\n`;
    } else if (activeReportTab === 'sales') {
      filename = "sales_report.csv";
      csvContent += "Date,Time,Job ID,Customer Name,Method,Amount Paid\n";
      const allPayments: any[] = [];
      filteredRepairs.forEach(r => {
        r.paymentHistory.forEach(p => {
          allPayments.push({
            date: p.date,
            time: p.time,
            jobId: r.id,
            customerName: r.customerName,
            method: p.method,
            amount: p.amount
          });
        });
      });
      allPayments.forEach(s => {
        csvContent += `"${s.date}","${s.time}","${s.jobId}","${s.customerName}","${s.method}",${s.amount}\n`;
      });
    } else if (activeReportTab === 'repairs') {
      filename = "repair_jobs_report.csv";
      csvContent += "Job ID,Customer Name,Brand,Model,Status,Received Date,Estimated Cost,Remaining Balance\n";
      filteredRepairs.forEach(r => {
        csvContent += `"${r.id}","${r.customerName}","${r.device.brand}","${r.device.model}","${r.status}","${r.receivedAt}",${r.estimatedCost},${r.remainingBalance}\n`;
      });
    } else if (activeReportTab === 'technicians') {
      filename = "technician_performance_report.csv";
      csvContent += "Technician,Total Jobs Assigned,Revenue Generated\n";
      Object.entries(techMap).forEach(([name, val]) => {
        csvContent += `"${name}",${val.count},${val.revenue}\n`;
      });
    } else if (activeReportTab === 'inventory') {
      filename = "inventory_status_report.csv";
      csvContent += "Item Name,Category,Stock Remaining,Location,Cost Price,Sale Price,Stock Value\n";
      inventory.forEach(i => {
        csvContent += `"${i.name}","${i.category}",${i.stock},"${i.location || 'Main Stock'}",${i.costPrice},${i.salePrice},${i.costPrice * i.stock}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate dynamic graph coordinates for last 7 days
  const getLast7Days = () => {
    const list = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      list.push({
        label: `${day} ${month}`,
        dateObj: new Date(year, d.getMonth(), d.getDate())
      });
    }
    return list;
  };

  const chartDays = getLast7Days();
  
  // Calculate daily data arrays
  const dailyRevenues = chartDays.map(day => {
    let rev = 0;
    repairs.forEach(r => {
      r.paymentHistory.forEach(p => {
        const pDate = parseReceivedAt(p.date);
        if (pDate.getFullYear() === day.dateObj.getFullYear() &&
            pDate.getMonth() === day.dateObj.getMonth() &&
            pDate.getDate() === day.dateObj.getDate()) {
          rev += p.amount;
        }
      });
    });
    return rev;
  });

  const dailyCompletions = chartDays.map(day => {
    let completed = 0;
    repairs.forEach(r => {
      const rDate = parseReceivedAt(r.receivedAt);
      if (rDate.getFullYear() === day.dateObj.getFullYear() &&
          rDate.getMonth() === day.dateObj.getMonth() &&
          rDate.getDate() === day.dateObj.getDate()) {
        if (r.status === 'Completed' || r.status === 'Delivered') {
          completed++;
        }
      }
    });
    return completed;
  });

  const dailyPendings = chartDays.map(day => {
    let pending = 0;
    repairs.forEach(r => {
      const rDate = parseReceivedAt(r.receivedAt);
      if (rDate.getFullYear() === day.dateObj.getFullYear() &&
          rDate.getMonth() === day.dateObj.getMonth() &&
          rDate.getDate() === day.dateObj.getDate()) {
        if (r.status !== 'Completed' && r.status !== 'Delivered' && r.status !== 'Cancelled') {
          pending++;
        }
      }
    });
    return pending;
  });

  // Convert array values to SVG line point strings
  const maxRevenue = Math.max(...dailyRevenues, 1000);
  const revPoints = dailyRevenues.map((val, idx) => {
    const x = 10 + idx * 55;
    const y = 140 - (val / maxRevenue) * 110;
    return `${x},${y}`;
  }).join(' ');

  const maxJobs = Math.max(...dailyCompletions, ...dailyPendings, 2);
  const compPoints = dailyCompletions.map((val, idx) => {
    const x = 10 + idx * 55;
    const y = 140 - (val / maxJobs) * 110;
    return `${x},${y}`;
  }).join(' ');

  const pendPoints = dailyPendings.map((val, idx) => {
    const x = 10 + idx * 55;
    const y = 140 - (val / maxJobs) * 110;
    return `${x},${y}`;
  }).join(' ');

  // Fetch list of payments for Sales Tab
  const getSalesTransactions = () => {
    const txs: any[] = [];
    filteredRepairs.forEach(r => {
      r.paymentHistory.forEach(p => {
        txs.push({
          date: p.date,
          time: p.time,
          jobId: r.id,
          customerName: r.customerName,
          method: p.method,
          amount: p.amount
        });
      });
    });
    return txs.sort((a, b) => parseReceivedAt(b.date).getTime() - parseReceivedAt(a.date).getTime());
  };

  // Render Sub Tabs Content
  const renderTabContent = () => {
    switch (activeReportTab) {
      case 'overview':
        return (
          <>
            {/* SVG Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Chart 1: Revenue Overview */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Revenue Overview</h3>
                  <span className="text-[10px] text-slate-400 font-bold">Last 7 Days</span>
                </div>

                {/* SVG Line Chart */}
                <div className="relative pt-6">
                  {hoveredRevIndex !== null && (
                    <div 
                      className="absolute bg-slate-900 text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow-lg pointer-events-none transition-all duration-150 -translate-x-1/2 -translate-y-full z-10"
                      style={{ 
                        left: `${(10 + hoveredRevIndex * 55) / 350 * 100}%`, 
                        top: `${(140 - (dailyRevenues[hoveredRevIndex] / maxRevenue) * 110) / 150 * 100 - 4}%` 
                      }}
                    >
                      ₹{dailyRevenues[hoveredRevIndex].toLocaleString('en-IN')}
                    </div>
                  )}

                  <svg viewBox="0 0 350 150" className="w-full overflow-visible">
                    <line x1="0" y1="20" x2="350" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="60" x2="350" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="350" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="140" x2="350" y2="140" stroke="#f8fafc" strokeWidth="1.5" />

                    {/* Dotted vertical guide line */}
                    {hoveredRevIndex !== null && (
                      <line 
                        x1={10 + hoveredRevIndex * 55} 
                        y1="20" 
                        x2={10 + hoveredRevIndex * 55} 
                        y2="140" 
                        stroke="#cbd5e1" 
                        strokeWidth="1.5" 
                        strokeDasharray="3,3" 
                        className="pointer-events-none"
                      />
                    )}

                    <path
                      d={`M 10 140 L ${revPoints} L 340 140 Z`}
                      fill="url(#rev-gradient)"
                      opacity="0.1"
                    />

                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      points={revPoints}
                    />

                    {dailyRevenues.map((val, idx) => {
                      const isHovered = hoveredRevIndex === idx;
                      return (
                        <circle 
                          key={idx} 
                          cx={10 + idx * 55} 
                          cy={140 - (val / maxRevenue) * 110} 
                          r={isHovered ? 5.5 : 3.5} 
                          fill="#3b82f6" 
                          stroke="#ffffff" 
                          strokeWidth={isHovered ? 2.5 : 1.5} 
                          className="transition-all duration-150 pointer-events-none"
                        />
                      );
                    })}

                    {/* Invisible interactive hover columns */}
                    {chartDays.map((_, idx) => (
                      <rect
                        key={idx}
                        x={(10 + idx * 55) - 27.5}
                        y="0"
                        width="55"
                        height="145"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredRevIndex(idx)}
                        onMouseLeave={() => setHoveredRevIndex(null)}
                      />
                    ))}

                    <defs>
                      <linearGradient id="rev-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-2 border-t border-slate-50">
                    {chartDays.map((d, i) => (
                      <span key={i}>{d.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart 2: Jobs Overview */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Jobs Overview</h3>
                  <span className="text-[10px] text-slate-400 font-bold">Last 7 Days</span>
                </div>

                <div className="relative pt-6">
                  {hoveredJobIndex !== null && (
                    <div 
                      className="absolute bg-slate-900 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-md shadow-lg pointer-events-none transition-all duration-150 -translate-x-1/2 -translate-y-full space-y-0.5 z-10 animate-scale-up"
                      style={{ 
                        left: `${(10 + hoveredJobIndex * 55) / 350 * 100}%`, 
                        top: `${(140 - (Math.max(dailyCompletions[hoveredJobIndex], dailyPendings[hoveredJobIndex]) / maxJobs) * 110) / 150 * 100 - 4}%` 
                      }}
                    >
                      <p className="text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        Done: {dailyCompletions[hoveredJobIndex]}
                      </p>
                      <p className="text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Pending: {dailyPendings[hoveredJobIndex]}
                      </p>
                    </div>
                  )}

                  <svg viewBox="0 0 350 150" className="w-full overflow-visible">
                    <line x1="0" y1="20" x2="350" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="60" x2="350" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="350" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    
                    {/* Dotted vertical guide line */}
                    {hoveredJobIndex !== null && (
                      <line 
                        x1={10 + hoveredJobIndex * 55} 
                        y1="20" 
                        x2={10 + hoveredJobIndex * 55} 
                        y2="140" 
                        stroke="#cbd5e1" 
                        strokeWidth="1.5" 
                        strokeDasharray="3,3" 
                        className="pointer-events-none"
                      />
                    )}

                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      points={compPoints}
                    />

                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      strokeLinecap="round"
                      points={pendPoints}
                    />

                    {/* Dots for completed */}
                    {dailyCompletions.map((val, idx) => {
                      const isHovered = hoveredJobIndex === idx;
                      return (
                        <circle 
                          key={`c-${idx}`}
                          cx={10 + idx * 55} 
                          cy={140 - (val / maxJobs) * 110} 
                          r={isHovered ? 5.5 : 3.5} 
                          fill="#10b981" 
                          stroke="#ffffff" 
                          strokeWidth={isHovered ? 2.5 : 1.5} 
                          className="transition-all duration-150 pointer-events-none"
                        />
                      );
                    })}

                    {/* Dots for pending */}
                    {dailyPendings.map((val, idx) => {
                      const isHovered = hoveredJobIndex === idx;
                      return (
                        <circle 
                          key={`p-${idx}`}
                          cx={10 + idx * 55} 
                          cy={140 - (val / maxJobs) * 110} 
                          r={isHovered ? 5.5 : 3.5} 
                          fill="#f59e0b" 
                          stroke="#ffffff" 
                          strokeWidth={isHovered ? 2.5 : 1.5} 
                          className="transition-all duration-150 pointer-events-none"
                        />
                      );
                    })}

                    {/* Invisible interactive hover columns */}
                    {chartDays.map((_, idx) => (
                      <rect
                        key={idx}
                        x={(10 + idx * 55) - 27.5}
                        y="0"
                        width="55"
                        height="145"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredJobIndex(idx)}
                        onMouseLeave={() => setHoveredJobIndex(null)}
                      />
                    ))}
                  </svg>
                  
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-2 border-t border-slate-50">
                    {chartDays.map((d, i) => (
                      <span key={i}>{d.label}</span>
                    ))}
                  </div>
                  
                  <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1.5">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-1 bg-green-500 rounded"></span>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-1 bg-amber-500 rounded border-dashed border"></span>
                      <span>Pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 3: Payment Status Donut */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Payment Status</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">This Range</span>
                </div>

                <div className="flex items-center justify-between gap-5 py-2">
                  <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
                      {paidPercent > 0 && (
                        <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDasharray={`${paidPercent} ${100 - paidPercent}`} strokeDashoffset="100" />
                      )}
                      {remainingPercent > 0 && (
                        <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray={`${remainingPercent} ${100 - remainingPercent}`} strokeDashoffset={`${100 - paidPercent}`} />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">₹{totalPaid.toLocaleString('en-IN')}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Total Collected</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-1 pl-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        <span>Paid</span>
                      </div>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">₹{totalPaid.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-medium">({paidPercent}%)</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Pending</span>
                      </div>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">₹{totalRemaining.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-medium">({remainingPercent}%)</span></span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Top Categories and Technicians List Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              
              {/* Left Widget: Top Repair Categories */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Top Repair Categories</h3>
                  <span className="text-[10px] text-slate-400 font-bold">This Range</span>
                </div>

                <div className="space-y-4">
                  {topCategories.length > 0 ? (
                    topCategories.map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200">
                          <span className="font-bold">{item.name}</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100">
                            ₹{item.revenue.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-medium">({item.count} jobs)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No category metrics available yet.</p>
                  )}
                </div>
              </div>

              {/* Right Widget: Top Technicians */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Top Technicians</h3>
                  <span className="text-[10px] text-slate-400 font-bold">This Range</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 dark:divide-slate-800">
                  {topTechnicians.length > 0 ? (
                    topTechnicians.map((tech, i) => (
                      <div key={i} className="py-2.5 flex justify-between items-center font-semibold text-slate-700 dark:text-slate-200 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8.5 h-8.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {tech.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{tech.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{tech.count} completed jobs</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">₹{tech.revenue.toLocaleString('en-IN')}</p>
                          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1 justify-end">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{tech.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No technician metrics available yet.</p>
                  )}
                </div>
              </div>

            </div>
          </>
        );
      case 'sales':
        const txs = getSalesTransactions();
        return (
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs font-semibold animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sales Transactions</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">List of all recorded invoice collections and advance payments</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[10px] font-bold rounded">{txs.length} collections</span>
            </div>

            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700 dark:text-slate-200">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Job ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {txs.length > 0 ? (
                    txs.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/30 transition">
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-bold">{tx.date}</td>
                        <td className="px-4 py-3 text-slate-450 font-medium">{tx.time}</td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">#{tx.jobId}</td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-bold">{tx.customerName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-650 text-[10px] font-bold rounded">
                            {tx.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-green-605">₹{tx.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 italic">No transactions recorded in this range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'repairs':
        return (
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs font-semibold animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Repair Analytics Directory</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Summary of all registered repairs, status values, and estimated billings</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[10px] font-bold rounded">{filteredRepairs.length} repair jobs</span>
            </div>

            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700 dark:text-slate-200">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3">Job ID</th>
                    <th className="px-4 py-3">Date Received</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Device Specs</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Est Cost</th>
                    <th className="px-4 py-3 text-right">Pending Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRepairs.length > 0 ? (
                    filteredRepairs.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/30 transition">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">#{rep.id}</td>
                        <td className="px-4 py-3 text-slate-450 font-medium">{rep.receivedAt}</td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-bold">{rep.customerName}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{rep.device.brand} {rep.device.model}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[9px] font-bold rounded uppercase tracking-wide">
                            {rep.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">₹{rep.estimatedCost.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-red-500">₹{rep.remainingBalance.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 italic">No repair jobs matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'technicians':
        return (
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs font-semibold animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Technician Metrics</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Assigned jobs count, completions, and billings generated by tech</p>
              </div>
            </div>

            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700 dark:text-slate-200">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-4 py-3">Technician Name</th>
                    <th className="px-4 py-3">Total Assigned Jobs</th>
                    <th className="px-4 py-3">Completed Jobs</th>
                    <th className="px-4 py-3">Pending Jobs</th>
                    <th className="px-4 py-3">Completion Rate</th>
                    <th className="px-4 py-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(techMap).map(([name, val], idx) => {
                    const assigned = repairs.filter(r => r.technician === name);
                    const done = assigned.filter(r => r.status === 'Completed' || r.status === 'Delivered').length;
                    const pending = assigned.length - done;
                    const pct = assigned.length > 0 ? Math.round((done / assigned.length) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/30 transition">
                        <td className="px-4 py-3 font-bold text-slate-850 flex items-center gap-2">
                          <div className="w-6.5 h-6.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-extrabold text-[10px]">
                            {name[0]}
                          </div>
                          <span>{name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-extrabold">{assigned.length}</td>
                        <td className="px-4 py-3 text-green-600">{done}</td>
                        <td className="px-4 py-3 text-amber-500">{pending}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{pct}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-800 dark:text-slate-100">₹{val.revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'inventory':
        // Calculate inventory summary
        const totalUniqueItems = inventory.length;
        const totalStockUnits = inventory.reduce((acc, curr) => acc + curr.stock, 0);
        const totalCostValue = inventory.reduce((acc, curr) => acc + curr.costPrice * curr.stock, 0);
        const totalSaleValue = inventory.reduce((acc, curr) => acc + curr.salePrice * curr.stock, 0);
        const lowStockItems = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;

        return (
          <div className="space-y-6 animate-scale-up">
            {/* Inventory Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Unique Parts</span>
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{totalUniqueItems} spares</span>
              </div>
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock Units</span>
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{totalStockUnits} units</span>
              </div>
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Asset Valuation (Cost)</span>
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">₹{totalCostValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Retail Valuation (Sale)</span>
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 block text-green-600">₹{totalSaleValue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Inventory Parts list table */}
            <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Inventory Assets Valuation</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Asset costs, current quantities, retail pricing, and status markers</p>
                </div>
                {lowStockItems > 0 && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{lowStockItems} low stock items</span>
                  </span>
                )}
              </div>

              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-4 py-3">Item Spare Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Part Number</th>
                      <th className="px-4 py-3">Stock Units</th>
                      <th className="px-4 py-3">Cost Price</th>
                      <th className="px-4 py-3">Retail Price</th>
                      <th className="px-4 py-3 text-right">Asset Value (Cost)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inventory.length > 0 ? (
                      inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/30 transition">
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                            <p>{item.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">{item.brand} {item.model}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">{item.category}</td>
                          <td className="px-4 py-3 font-mono text-slate-450">{item.partNumber}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.stock <= 2 ? 'bg-red-50 text-red-650' : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                            }`}>{item.stock} in stock</span>
                          </td>
                          <td className="px-4 py-3">₹{item.costPrice.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-green-600">₹{item.salePrice.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-800 dark:text-slate-100">₹{(item.costPrice * item.stock).toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400 italic">No inventory spares loaded in database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 text-left animate-fade-in relative">
      {/* Title & Filter Options bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Reports</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Analyze your business performance and get insights</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 relative">
          
          {/* Calendar Picker Trigger */}
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 hover:border-slate-350 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-xs cursor-pointer transition animate-pulse-subtle"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDateRangeText()}</span>
          </button>

          {/* Date Picker Overlay Card */}
          {showDatePicker && (
            <div className="absolute right-0 top-11 bg-white dark:bg-slate-900 border border-slate-150 rounded-2xl shadow-xl p-4.5 z-50 w-72 text-xs space-y-4 animate-scale-up">
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-200">Quick Date Presets</p>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <button 
                    onClick={() => handlePresetChange('today')}
                    className={`px-3 py-1.5 rounded-lg border text-left font-bold transition ${datePreset === 'today' ? 'bg-blue-50 border-blue-200 text-blue-650' : 'border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => handlePresetChange('7days')}
                    className={`px-3 py-1.5 rounded-lg border text-left font-bold transition ${datePreset === '7days' ? 'bg-blue-50 border-blue-200 text-blue-650' : 'border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                  >
                    Last 7 Days
                  </button>
                  <button 
                    onClick={() => handlePresetChange('30days')}
                    className={`px-3 py-1.5 rounded-lg border text-left font-bold transition ${datePreset === '30days' ? 'bg-blue-50 border-blue-200 text-blue-650' : 'border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                  >
                    Last 30 Days
                  </button>
                  <button 
                    onClick={() => handlePresetChange('thismonth')}
                    className={`px-3 py-1.5 rounded-lg border text-left font-bold transition ${datePreset === 'thismonth' ? 'bg-blue-50 border-blue-200 text-blue-650' : 'border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                  >
                    This Month
                  </button>
                  <button 
                    onClick={() => handlePresetChange('alltime')}
                    className={`col-span-2 px-3 py-1.5 rounded-lg border text-center font-bold transition ${datePreset === 'alltime' ? 'bg-blue-50 border-blue-200 text-blue-650' : 'border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                  >
                    All Time
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-2.5">
                <p className="font-bold text-slate-700 dark:text-slate-200">Custom Date Range</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-lg text-[10px] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-lg text-[10px] focus:outline-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleCustomDateApply}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-center cursor-pointer transition shadow-xs"
                >
                  Apply Custom Range
                </button>
              </div>
            </div>
          )}

          {/* Filter Options Button */}
          <button 
            onClick={() => setShowFilterCard(!showFilterCard)}
            className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              showFilterCard ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {/* Filter Card Overlay */}
          {showFilterCard && (
            <div className="absolute right-0 top-11 bg-white dark:bg-slate-900 border border-slate-150 rounded-2xl shadow-xl p-4.5 z-50 w-64 text-xs space-y-3.5 animate-scale-up">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-[10px]">Filter Reports Data</span>
                <button 
                  onClick={() => {
                    setStatusFilter('All');
                    setBrandFilter('All');
                    setTechFilter('All');
                  }}
                  className="text-blue-600 font-bold hover:underline text-[10px]"
                >
                  Reset
                </button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Job Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-650 font-bold focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Received">Received</option>
                    <option value="Diagnosis">Diagnosis</option>
                    <option value="Waiting Approval">Waiting Approval</option>
                    <option value="In Repair">In Repair</option>
                    <option value="Testing">Testing</option>
                    <option value="Ready">Ready</option>
                    <option value="Completed">Completed</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Device Brand</label>
                  <select 
                    value={brandFilter} 
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-650 font-bold focus:outline-none"
                  >
                    <option value="All">All Brands</option>
                    {uniqueBrands.map((b, i) => (
                      <option key={i} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Technician</label>
                  <select 
                    value={techFilter} 
                    onChange={(e) => setTechFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-650 font-bold focus:outline-none"
                  >
                    <option value="All">All Technicians</option>
                    {uniqueTechs.map((t, i) => (
                      <option key={i} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => setShowFilterCard(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-center cursor-pointer transition shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          )}

          {/* Export Report Action */}
          <button 
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Sub menu Tabs list */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {tabs.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveReportTab(item.id as any)}
            className={`px-4.5 py-3 rounded-xl text-left transition cursor-pointer ${
              activeReportTab === item.id 
                ? 'bg-white shadow-xs' 
                : 'hover:bg-white/50'
            }`}
          >
            <p className={`text-xs font-bold leading-tight ${activeReportTab === item.id ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{item.label}</p>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 inline-block">{item.desc}</span>
          </button>
        ))}
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">₹{totalRevenue.toLocaleString('en-IN')}</span>
          <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5">
            <TrendingUp className="w-3 h-3" /> +18.6% vs last 7 days
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Jobs</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{totalJobs}</span>
          <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5">
            <TrendingUp className="w-3 h-3" /> +12.3% vs last 7 days
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed Jobs</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{completedJobs}</span>
          <span className="text-[9px] text-green-600 font-bold mt-1.5 block">{completionRate}% Completion Rate</span>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Jobs</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1 block text-amber-500">{pendingJobs}</span>
          <span className="text-[9px] text-amber-600 font-bold mt-1.5 block">{pendingRate}% Pending</span>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Average Order Value</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">₹{avgOrderValue.toLocaleString('en-IN')}</span>
          <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5">
            <TrendingUp className="w-3 h-3" /> +8.4% vs last 7 days
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Customers</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{totalCustomers}</span>
          <span className="text-[9px] text-green-600 font-bold flex items-center gap-0.5 mt-1.5">
            <TrendingUp className="w-3 h-3" /> +14.5% vs last 7 days
          </span>
        </div>
      </div>

      {/* Render sub tab content dynamically */}
      {renderTabContent()}
      
    </div>
  );
}
