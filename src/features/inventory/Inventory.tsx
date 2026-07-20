import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DatabaseService } from '../../services/dbAdapter';
import { InventoryItem, InventoryMovement } from '../../services/mockDb';
import { 
  Package, 
  Search, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  Minus,
  Sparkles,
  PieChart,
  X,
  RefreshCw
} from 'lucide-react';

export const Inventory: React.FC = () => {
  const { inventory, refreshData, searchQuery, setSearchQuery, session } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [showSidebar, setShowSidebar] = useState(true);

  // View mode
  const [activeView, setActiveView] = useState<'list' | 'movements' | 'suppliers'>('list');

  // Movements state
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterItem, setFilterItem] = useState('');
  const [filterUser, setFilterUser] = useState('');

  // Suppliers state
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Move Modal State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedItemForMove, setSelectedItemForMove] = useState<InventoryItem | null>(null);
  const [moveQty, setMoveQty] = useState<number>(1);
  const [moveToLocation, setMoveToLocation] = useState<string>('Damaged Parts (DPB)');
  const [moveReason, setMoveReason] = useState<string>('Defective part identified');
  const [moveNotes, setMoveNotes] = useState<string>('');
  const [moveSaving, setMoveSaving] = useState(false);

  // Item Add/Edit Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemFormName, setItemFormName] = useState('');
  const [itemFormBrand, setItemFormBrand] = useState('');
  const [itemFormModel, setItemFormModel] = useState('');
  const [itemFormPartNumber, setItemFormPartNumber] = useState('');
  const [itemFormCategory, setItemFormCategory] = useState<'Mobile Parts' | 'Accessories' | 'Consumables' | 'Tools & Equipment'>('Mobile Parts');
  const [itemFormCostPrice, setItemFormCostPrice] = useState<number>(0);
  const [itemFormSalePrice, setItemFormSalePrice] = useState<number>(0);
  const [itemFormStock, setItemFormStock] = useState<number>(0);
  const [itemFormLocation, setItemFormLocation] = useState<'Main Stock' | 'Damaged Parts (DPB)' | 'Recovery Parts (RPB)' | 'Return to Vendor (RTW)'>('Main Stock');
  const [itemFormSupplierId, setItemFormSupplierId] = useState('');
  const [itemSaving, setItemSaving] = useState(false);

  // Supplier Add Modal State
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supplierFormName, setSupplierFormName] = useState('');
  const [supplierFormContactPerson, setSupplierFormContactPerson] = useState('');
  const [supplierFormPhone, setSupplierFormPhone] = useState('');
  const [supplierFormEmail, setSupplierFormEmail] = useState('');
  const [supplierFormCity, setSupplierFormCity] = useState('');
  const [supplierSaving, setSupplierSaving] = useState(false);

  // Stock In / Out Toggle state
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');

  // Low Stock filter state
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Dynamic Inventory KPI calculations
  const totalStockItems = inventory.length;
  
  const inStockCount = inventory.filter(i => i.status === 'In Stock').length;
  const inStockValue = inventory.filter(i => i.status === 'In Stock').reduce((acc, curr) => acc + (curr.stock * curr.salePrice), 0);

  const lowStockCount = inventory.filter(i => i.status === 'Low Stock').length;
  const lowStockValue = inventory.filter(i => i.status === 'Low Stock').reduce((acc, curr) => acc + (curr.stock * curr.salePrice), 0);

  const outOfStockCount = inventory.filter(i => i.status === 'Out of Stock').length;
  const outOfStockValue = inventory.filter(i => i.status === 'Out of Stock').reduce((acc, curr) => acc + (curr.stock * curr.salePrice), 0);

  const reservedCount = inventory.reduce((acc, curr) => acc + curr.reserved, 0);
  const reservedValue = inventory.reduce((acc, curr) => acc + (curr.reserved * curr.salePrice), 0);

  // Stock Locations metrics
  const mainStockItems = inventory.filter(i => (i.location || 'Main Stock') === 'Main Stock');
  const mainStockQty = mainStockItems.reduce((acc, curr) => acc + curr.stock, 0);
  const mainStockValue = mainStockItems.reduce((acc, curr) => acc + (curr.stock * curr.salePrice), 0);

  const dpbItems = inventory.filter(i => i.location === 'Damaged Parts (DPB)');
  const dpbQty = dpbItems.reduce((acc, curr) => acc + curr.stock, 0);
  const dpbValue = dpbItems.reduce((acc, curr) => acc + (curr.stock * curr.salePrice), 0);

  const rpbItems = inventory.filter(i => i.location === 'Recovery Parts (RPB)');
  const rpbQty = rpbItems.reduce((acc, curr) => acc + curr.stock, 0);
  const rpbValue = rpbItems.reduce((acc, curr) => acc + (curr.stock * curr.salePrice), 0);

  const rtwItems = inventory.filter(i => i.location === 'Return to Vendor (RTW)');
  const rtwQty = rtwItems.reduce((acc, curr) => acc + curr.stock, 0);
  const rtwValue = rtwItems.reduce((acc, curr) => acc + (curr.stock * curr.salePrice), 0);
  
  // Dynamic Category Summary & Donut calculations
  const totalValuation = inventory.reduce((acc, item) => acc + (item.stock * item.salePrice), 0);
  const catMobileVal = inventory.filter(i => i.category === 'Mobile Parts').reduce((acc, item) => acc + (item.stock * item.salePrice), 0);
  const catAccessoryVal = inventory.filter(i => i.category === 'Accessories').reduce((acc, item) => acc + (item.stock * item.salePrice), 0);
  const catConsumableVal = inventory.filter(i => i.category === 'Consumables').reduce((acc, item) => acc + (item.stock * item.salePrice), 0);
  const catToolsVal = inventory.filter(i => i.category === 'Tools & Equipment').reduce((acc, item) => acc + (item.stock * item.salePrice), 0);

  const mobilePartsPct = totalValuation > 0 ? Math.round((catMobileVal / totalValuation) * 100) : 0;
  const accessoriesPct = totalValuation > 0 ? Math.round((catAccessoryVal / totalValuation) * 100) : 0;
  const consumablesPct = totalValuation > 0 ? Math.round((catConsumableVal / totalValuation) * 100) : 0;
  const toolsPct = totalValuation > 0 ? Math.round((catToolsVal / totalValuation) * 100) : 0;

  const formatValueShort = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
    return `₹${num}`;
  };
  
  // Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<string>('');
  const [adjustQty, setAdjustQty] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<string>('Purchase restock');

  const categories = ['All', 'Mobile Parts', 'Accessories', 'Consumables', 'Tools & Equipment'];

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = !showLowStockOnly || item.status === 'Low Stock' || item.status === 'Out of Stock';
    const itemLoc = item.location || 'Main Stock';
    const matchesLocation = selectedLocation === 'All' || itemLoc === selectedLocation;
    return matchesCategory && matchesSearch && matchesLowStock && matchesLocation;
  });

  const filteredMovements = movements.filter(mov => {
    const matchesDate = !filterDate || mov.createdAt.toLowerCase().includes(filterDate.toLowerCase());
    const matchesLocation = filterLocation === 'All' || mov.fromLocation.includes(filterLocation) || mov.toLocation.includes(filterLocation);
    const matchesItem = !filterItem || mov.itemName.toLowerCase().includes(filterItem.toLowerCase());
    const matchesUser = !filterUser || mov.performedBy.toLowerCase().includes(filterUser.toLowerCase());
    return matchesDate && matchesLocation && matchesItem && matchesUser;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when switching tabs/views/filters
  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, selectedCategory, searchQuery, showLowStockOnly, selectedLocation]);

  const totalItems = activeView === 'list' 
    ? filteredInventory.length 
    : activeView === 'movements' 
      ? filteredMovements.length 
      : suppliers.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const paginatedInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + itemsPerPage);
  const paginatedSuppliers = suppliers.slice(startIndex, startIndex + itemsPerPage);

  const fetchMovements = async () => {
    setLoadingMovements(true);
    const movs = await DatabaseService.getInventoryMovements();
    setMovements(movs);
    setLoadingMovements(false);
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    const sups = await DatabaseService.getSuppliers();
    setSuppliers(sups);
    setLoadingSuppliers(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, [inventory]);

  useEffect(() => {
    if (activeView === 'movements') {
      fetchMovements();
    } else if (activeView === 'suppliers') {
      fetchSuppliers();
    }
  }, [activeView, inventory]);

  // Listener to open stock adjustment from elsewhere
  useEffect(() => {
    const handleOpen = () => {
      if (inventory.length > 0) {
        setSelectedItemForAdjust(inventory[0].id);
      }
      setAdjustQty(5);
      setAdjustReason('Purchase restock');
      setAdjustType('in');
      setShowAdjustModal(true);
    };

    window.addEventListener('open-stock-adjustment', handleOpen);
    return () => window.removeEventListener('open-stock-adjustment', handleOpen);
  }, [inventory]);

  // Listener to open add item modal from elsewhere
  useEffect(() => {
    const handleOpenItem = () => {
      setItemFormName('');
      setItemFormBrand('');
      setItemFormModel('');
      setItemFormPartNumber('');
      setItemFormCategory('Mobile Parts');
      setItemFormCostPrice(0);
      setItemFormSalePrice(0);
      setItemFormStock(0);
      setItemFormLocation('Main Stock');
      setItemFormSupplierId('');
      setEditingItemId(null);
      setShowItemModal(true);
    };

    window.addEventListener('open-add-item', handleOpenItem);
    return () => window.removeEventListener('open-add-item', handleOpenItem);
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;

    const finalQty = adjustType === 'in' ? adjustQty : -adjustQty;
    const finalReason = adjustType === 'in' ? `Stock In: ${adjustReason}` : `Stock Out: ${adjustReason}`;
    await DatabaseService.adjustStock(selectedItemForAdjust, finalQty, finalReason);
    refreshData();
    setShowAdjustModal(false);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormName.trim() || !itemFormPartNumber.trim()) return;

    setItemSaving(true);
    const payload = {
      name: itemFormName.trim(),
      brand: itemFormBrand.trim(),
      model: itemFormModel.trim(),
      partNumber: itemFormPartNumber.trim(),
      category: itemFormCategory,
      costPrice: Number(itemFormCostPrice) || 0,
      salePrice: Number(itemFormSalePrice) || 0,
      stock: Number(itemFormStock) || 0,
      location: itemFormLocation,
      supplierId: itemFormSupplierId || undefined
    };

    if (editingItemId) {
      await DatabaseService.editInventoryItem(editingItemId, payload);
    } else {
      await DatabaseService.addInventoryItem(payload);
    }
    setItemSaving(false);
    setShowItemModal(false);
    setEditingItemId(null);
    refreshData();
  };

  const handleItemDelete = async (itemId: string, name: string) => {
    if (confirm(`Are you sure you want to delete inventory item "${name}"?`)) {
      await DatabaseService.deleteInventoryItem(itemId);
      refreshData();
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormName.trim()) return;

    setSupplierSaving(true);
    await DatabaseService.addSupplier({
      name: supplierFormName.trim(),
      contactPerson: supplierFormContactPerson.trim(),
      phone: supplierFormPhone.trim(),
      email: supplierFormEmail.trim(),
      city: supplierFormCity.trim()
    });
    setSupplierSaving(false);
    setShowAddSupplierModal(false);
    
    // Reset form
    setSupplierFormName('');
    setSupplierFormContactPerson('');
    setSupplierFormPhone('');
    setSupplierFormEmail('');
    setSupplierFormCity('');
    
    refreshData();
    fetchSuppliers();
  };

  const handleSupplierDelete = async (supplierId: string, name: string) => {
    if (confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      await DatabaseService.deleteSupplier(supplierId);
      refreshData();
      fetchSuppliers();
    }
  };

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForMove || moveQty <= 0 || moveQty > selectedItemForMove.available) return;

    setMoveSaving(true);
    const operatorName = session?.user?.email?.split('@')[0] || 'Operator';
    const success = await DatabaseService.moveInventory(
      selectedItemForMove.id,
      moveQty,
      selectedItemForMove.location || 'Main Stock',
      moveToLocation,
      moveReason,
      moveNotes,
      operatorName
    );
    setMoveSaving(false);

    if (success) {
      refreshData();
      setShowMoveModal(false);
      setSelectedItemForMove(null);
      alert('Inventory moved successfully!');
    } else {
      alert('Failed to move inventory. Verify stock level.');
    }
  };



  const getLocationBadge = (loc: string) => {
    switch (loc) {
      case 'Main Stock':
        return <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">Main Stock</span>;
      case 'Damaged Parts (DPB)':
      case 'DPB':
        return <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">DPB</span>;
      case 'Recovery Parts (RPB)':
      case 'RPB':
        return <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[10px] font-bold rounded-full">RPB</span>;
      case 'Return to Vendor (RTW)':
      case 'RTW':
        return <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full">RTW</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full">{loc}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Stock': return <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">In Stock</span>;
      case 'Low Stock': return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">Low Stock</span>;
      case 'Out of Stock': return <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">Out of Stock</span>;
      default: return <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full">{status}</span>;
    }
  };

  const getAvailableColor = (available: number) => {
    if (available === 0) return 'text-red-500 font-bold';
    if (available <= 5) return 'text-amber-500 font-bold';
    return 'text-green-600 font-bold';
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden -mx-6 -my-6">
      
      {/* Table & Inventory list Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col text-left">
        
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Items</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{totalStockItems}</span>
            <span className="text-[10px] text-slate-400 font-medium">All Categories</span>
          </div>
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Stock</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{inStockCount}</span>
            <span className="text-[10px] text-green-600 font-bold mt-0.5 block">₹{inStockValue.toLocaleString('en-IN')} Value</span>
          </div>
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block text-amber-500">{lowStockCount}</span>
            <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">₹{lowStockValue.toLocaleString('en-IN')} Value</span>
          </div>
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Out of Stock</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block text-red-500">{outOfStockCount}</span>
            <span className="text-[10px] text-red-500 font-bold mt-0.5 block">₹{outOfStockValue.toLocaleString('en-IN')} Value</span>
          </div>
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reserved</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block text-indigo-600">{reservedCount}</span>
            <span className="text-[10px] text-indigo-600 font-bold mt-0.5 block">₹{reservedValue.toLocaleString('en-IN')} Value</span>
          </div>
        </div>

        {/* Stock Locations Summary */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock Locations Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Stock */}
            <div 
              onClick={() => setSelectedLocation(selectedLocation === 'Main Stock' ? 'All' : 'Main Stock')}
              className={`bg-white border p-4.5 rounded-2xl shadow-sm text-left hover:border-blue-350 hover:shadow-md cursor-pointer transition-all ${
                selectedLocation === 'Main Stock' ? 'border-blue-500 ring-2 ring-blue-50/50 scale-[1.01]' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Main Stock</span>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total Items:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{mainStockItems.length === 0 ? '--' : mainStockItems.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total Qty:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{mainStockItems.length === 0 ? '--' : mainStockQty}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-1.5 mt-1.5">
                  <span className="text-slate-400 font-medium">Value:</span>
                  <span className="font-extrabold text-green-600">{mainStockItems.length === 0 ? 'No data available' : `₹${mainStockValue.toLocaleString('en-IN')}`}</span>
                </div>
              </div>
            </div>

            {/* Damaged Parts (DPB) */}
            <div 
              onClick={() => setSelectedLocation(selectedLocation === 'Damaged Parts (DPB)' ? 'All' : 'Damaged Parts (DPB)')}
              className={`bg-white border p-4.5 rounded-2xl shadow-sm text-left hover:border-blue-350 hover:shadow-md cursor-pointer transition-all ${
                selectedLocation === 'Damaged Parts (DPB)' ? 'border-blue-500 ring-2 ring-blue-50/50 scale-[1.01]' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Damaged Parts (DPB)</span>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total Items:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{dpbItems.length === 0 ? '--' : dpbItems.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total Qty:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{dpbItems.length === 0 ? '--' : dpbQty}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-1.5 mt-1.5">
                  <span className="text-slate-400 font-medium">Value:</span>
                  <span className="font-extrabold text-red-500">{dpbItems.length === 0 ? 'No data available' : `₹${dpbValue.toLocaleString('en-IN')}`}</span>
                </div>
              </div>
            </div>

            {/* Recovery Parts (RPB) */}
            <div 
              onClick={() => setSelectedLocation(selectedLocation === 'Recovery Parts (RPB)' ? 'All' : 'Recovery Parts (RPB)')}
              className={`bg-white border p-4.5 rounded-2xl shadow-sm text-left hover:border-blue-350 hover:shadow-md cursor-pointer transition-all ${
                selectedLocation === 'Recovery Parts (RPB)' ? 'border-blue-500 ring-2 ring-blue-50/50 scale-[1.01]' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recovery Parts (RPB)</span>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total Items:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{rpbItems.length === 0 ? '--' : rpbItems.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total Qty:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{rpbItems.length === 0 ? '--' : rpbQty}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-1.5 mt-1.5">
                  <span className="text-slate-400 font-medium">Value:</span>
                  <span className="font-extrabold text-blue-600">{rpbItems.length === 0 ? 'No data available' : `₹${rpbValue.toLocaleString('en-IN')}`}</span>
                </div>
              </div>
            </div>

            {/* Return to Vendor (RTW) */}
            <div 
              onClick={() => setSelectedLocation(selectedLocation === 'Return to Vendor (RTW)' ? 'All' : 'Return to Vendor (RTW)')}
              className={`bg-white border p-4.5 rounded-2xl shadow-sm text-left hover:border-blue-350 hover:shadow-md cursor-pointer transition-all ${
                selectedLocation === 'Return to Vendor (RTW)' ? 'border-blue-500 ring-2 ring-blue-50/50 scale-[1.01]' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Return to Vendor (RTW)</span>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total Items:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{rtwItems.length === 0 ? '--' : rtwItems.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Total Qty:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{rtwItems.length === 0 ? '--' : rtwQty}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-1.5 mt-1.5">
                  <span className="text-slate-400 font-medium">Value:</span>
                  <span className="font-extrabold text-orange-500">{rtwItems.length === 0 ? 'No data available' : `₹${rtwValue.toLocaleString('en-IN')}`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View switcher tabs */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('list')}
              className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeView === 'list' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-300'
              }`}
            >
              Inventory Items
            </button>
            <button
              onClick={() => {
                setActiveView('movements');
                fetchMovements();
              }}
              className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeView === 'movements' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-300'
              }`}
            >
              Inventory Movements
            </button>
            <button
              onClick={() => {
                setActiveView('suppliers');
                fetchSuppliers();
              }}
              className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeView === 'suppliers' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-300'
              }`}
            >
              Suppliers
            </button>
          </div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="pb-2 px-3 text-xs font-bold text-blue-600 hover:text-blue-750 dark:text-blue-400 cursor-pointer flex items-center gap-1.5 transition-all select-none"
          >
            {showSidebar ? "Hide Summary ➔" : "◀ Show Summary"}
          </button>
        </div>

        {/* Tab & Search controls */}
        {activeView === 'movements' ? (
          <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                <input 
                  type="text"
                  placeholder="e.g. 18 Jul"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</label>
                <select
                  value={filterLocation}
                  onChange={e => setFilterLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="All">All Locations</option>
                  <option value="Main Stock">Main Stock</option>
                  <option value="DPB">Damaged Parts (DPB)</option>
                  <option value="RPB">Recovery Parts (RPB)</option>
                  <option value="RTW">Return to Vendor (RTW)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Item</label>
                <input 
                  type="text"
                  placeholder="Item name..."
                  value={filterItem}
                  onChange={e => setFilterItem(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search User</label>
                <input 
                  type="text"
                  placeholder="Performed by..."
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setFilterDate('');
                  setFilterLocation('All');
                  setFilterItem('');
                  setFilterUser('');
                }}
                className="w-full md:w-auto px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : activeView === 'suppliers' ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-left">
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Suppliers Directory</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Add and manage repair components vendors</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl shrink-0">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${selectedCategory === cat ? 'bg-white text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search bar inside */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name or part number..." 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:bg-white dark:focus:bg-slate-800 transition"
              />
            </div>
          </div>
        )}

        {showLowStockOnly && (
          <div className="bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-amber-800 animate-scale-up">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Showing Low Stock and Out of Stock alerts only</span>
            </div>
            <button 
              onClick={() => setShowLowStockOnly(false)} 
              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              Clear filter <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Inventory Directory Table */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[320px]">
          <div className="overflow-x-auto flex-1 min-h-[250px]">
            <table className="w-full text-left border-collapse font-medium">
              {activeView === 'list' ? (
                <>
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <th className="px-6 py-5">Item Details</th>
                      <th className="px-6 py-5">Category</th>
                      <th className="px-6 py-5">Part Number</th>
                      <th className="px-6 py-5">Location</th>
                      <th className="px-6 py-5 text-center">Stock</th>
                      <th className="px-6 py-5 text-center">Reserved</th>
                      <th className="px-6 py-5 text-center">Available</th>
                      <th className="px-6 py-5">Cost Price</th>
                      <th className="px-6 py-5">Sale Price</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-slate-400 font-semibold">
                          No inventory items found. Add your first inventory item.
                        </td>
                      </tr>
                    ) : (
                      paginatedInventory.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/30 transition whitespace-nowrap">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3.5">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{item.brand} {item.model}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 rounded font-semibold">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-mono text-slate-500 dark:text-slate-400">{item.partNumber}</td>
                          <td className="px-6 py-5">{getLocationBadge(item.location || 'Main Stock')}</td>
                          <td className="px-6 py-5 text-center font-bold text-slate-700 dark:text-slate-200">{item.stock}</td>
                          <td className="px-6 py-5 text-center text-slate-400 font-bold">{item.reserved}</td>
                          <td className={`px-6 py-5 text-center ${getAvailableColor(item.available)}`}>{item.available}</td>
                          <td className="px-6 py-5 text-slate-500 dark:text-slate-400">₹{item.costPrice.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-5 font-bold text-slate-800 dark:text-slate-100">₹{item.salePrice.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-5">{getStatusBadge(item.status)}</td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  setSelectedItemForMove(item);
                                  setMoveQty(1);
                                  setMoveToLocation(
                                    (item.location || 'Main Stock') === 'Main Stock' 
                                      ? 'Damaged Parts (DPB)' 
                                      : 'Main Stock'
                                  );
                                  setMoveReason('Defective part identified');
                                  setMoveNotes('');
                                  setShowMoveModal(true);
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-[10px] transition cursor-pointer"
                              >
                                Move
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setItemFormName(item.name);
                                  setItemFormBrand(item.brand);
                                  setItemFormModel(item.model);
                                  setItemFormPartNumber(item.partNumber);
                                  setItemFormCategory(item.category);
                                  setItemFormCostPrice(item.costPrice);
                                  setItemFormSalePrice(item.salePrice);
                                  setItemFormStock(item.stock);
                                  setItemFormLocation(item.location || 'Main Stock');
                                  setItemFormSupplierId(item.supplierId || '');
                                  setShowItemModal(true);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-[10px] transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleItemDelete(item.id, item.name)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-[10px] transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              ) : activeView === 'movements' ? (
                <>
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <th className="px-6 py-5">Date</th>
                      <th className="px-6 py-5">Item Name</th>
                      <th className="px-6 py-5 text-center">Quantity</th>
                      <th className="px-6 py-5">From</th>
                      <th className="px-6 py-5">To</th>
                      <th className="px-6 py-5">Reason</th>
                      <th className="px-6 py-5">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {loadingMovements ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 font-semibold">
                          Loading movements...
                        </td>
                      </tr>
                    ) : filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 font-semibold">
                          No movements found. Move inventory items to create movements.
                        </td>
                      </tr>
                    ) : (
                      paginatedMovements.map(mov => (
                        <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/30 transition whitespace-nowrap">
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{mov.createdAt}</td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{mov.itemName}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200">{mov.quantity}</td>
                          <td className="px-6 py-4">{getLocationBadge(mov.fromLocation)}</td>
                          <td className="px-6 py-4">{getLocationBadge(mov.toLocation)}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{mov.reason}</span>
                            {mov.notes && (
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{mov.notes}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{mov.performedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <th className="px-6 py-5">Supplier Name</th>
                      <th className="px-6 py-5">Contact Person</th>
                      <th className="px-6 py-5">Phone Number</th>
                      <th className="px-6 py-5">Email</th>
                      <th className="px-6 py-5">City</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {loadingSuppliers ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 font-semibold">
                          Loading suppliers...
                        </td>
                      </tr>
                    ) : suppliers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 font-semibold">
                          No suppliers registered. Add your first supplier.
                        </td>
                      </tr>
                    ) : (
                      paginatedSuppliers.map(sup => (
                        <tr key={sup.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/30 transition whitespace-nowrap">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{sup.name}</td>
                          <td className="px-6 py-4">{sup.contactPerson || '--'}</td>
                          <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{sup.phone || '--'}</td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{sup.email || '--'}</td>
                          <td className="px-6 py-4">{sup.city || '--'}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleSupplierDelete(sup.id, sup.name)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-[10px] transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>
 
          {/* Table Footer pagination */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs text-slate-400 font-semibold">
              Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} records
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:hover:bg-transparent transition shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'border border-slate-200 dark:border-slate-700 hover:bg-white text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:hover:bg-transparent transition shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar Widgets Panel */}
      {showSidebar && (
        <div className="w-[360px] border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col text-left">
        
        {/* Buttons Header */}
        {activeView === 'suppliers' && (
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex gap-2">
            <button 
              onClick={() => {
                setSupplierFormName('');
                setSupplierFormContactPerson('');
                setSupplierFormPhone('');
                setSupplierFormEmail('');
                setSupplierFormCity('');
                setShowAddSupplierModal(true);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-full text-center shadow-sm shadow-blue-200 cursor-pointer transition"
            >
              Add Supplier
            </button>
          </div>
        )}

        {/* Widgets area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Low Stock Alerts */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Low Stock Alerts</h4>
              <button 
                onClick={() => {
                  setActiveView('list');
                  setShowLowStockOnly(true);
                }}
                className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-600 text-[9px] font-bold rounded transition cursor-pointer"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-2">
              {inventory.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock').slice(0, 5).map(item => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{item.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.brand} {item.model}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    item.available === 0 
                      ? 'bg-red-50 text-red-500' 
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {item.available === 0 ? 'Out of stock' : `${item.available} left`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Stock Value Items */}
          <div className="space-y-3.5">
            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Top Stock Value Items</h4>
            <div className="space-y-2.5">
              {inventory.slice(0, 3).map(item => {
                const totalVal = item.stock * item.costPrice;
                return (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.brand} {item.model} • {item.stock} pcs</p>
                    </div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">₹{totalVal.toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Circular inventory summary chart */}
          <div className="space-y-4 border-t border-slate-50 pt-5">
            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Inventory Summary</h4>
            <div className="flex items-center gap-5">
              {/* Draw custom SVG pie/donut chart representing categories */}
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                  {/* Circle segments */}
                  <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#e2e8f0" strokeWidth="3" />
                  {totalValuation > 0 && (
                    <>
                      {/* Mobile Parts */}
                      <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${mobilePartsPct} ${100 - mobilePartsPct}`} strokeDashoffset="100" />
                      {/* Accessories */}
                      <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#8b5cf6" strokeWidth="3" strokeDasharray={`${accessoriesPct} ${100 - accessoriesPct}`} strokeDashoffset={100 - mobilePartsPct} />
                      {/* Consumables */}
                      <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#10b981" strokeWidth="3" strokeDasharray={`${consumablesPct} ${100 - consumablesPct}`} strokeDashoffset={100 - mobilePartsPct - accessoriesPct} />
                      {/* Tools & Equipment */}
                      <circle cx="18" cy="18" r="15.91" fill="transparent" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${toolsPct} ${100 - toolsPct}`} strokeDashoffset={100 - mobilePartsPct - accessoriesPct - consumablesPct} />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Value</span>
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">{formatValueShort(totalValuation)}</span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="space-y-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                  <span>Mobile Parts ({mobilePartsPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500"></span>
                  <span>Accessories ({accessoriesPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-green-500"></span>
                  <span>Consumables ({consumablesPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span>Tools & Equipment ({toolsPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Stock Adjustment Dialog Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-left animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Stock In / Stock Out Adjustment</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Transaction Type</label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('in');
                      setAdjustReason('Purchase restock');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${adjustType === 'in' ? 'bg-white text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
                  >
                    Stock In (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('out');
                      setAdjustReason('Damaged / Write-off');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${adjustType === 'out' ? 'bg-white text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
                  >
                    Stock Out (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Spare Part *</label>
                {inventory.length === 0 ? (
                  <p className="text-xs text-red-500 font-semibold">No inventory items available. Create an inventory item first.</p>
                ) : (
                  <select 
                    value={selectedItemForAdjust}
                    onChange={(e) => setSelectedItemForAdjust(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                  >
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.brand} {item.model}) - Loc: {item.location}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantity *</label>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setAdjustQty(q => Math.max(1, q - 1))}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input 
                    type="number" 
                    min={1}
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center border border-slate-200 dark:border-slate-700 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setAdjustQty(q => q + 1)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reason / Reference Notes</label>
                <input 
                  type="text" 
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder={adjustType === 'in' ? 'e.g. Purchase restock, supplier transfer' : 'e.g. Broken part replacement, salvage write-off'}
                  className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={inventory.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm shadow-blue-200 cursor-pointer disabled:opacity-50"
                >
                  {adjustType === 'in' ? 'Stock In' : 'Stock Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Move Inventory Dialog Modal */}
      {showMoveModal && selectedItemForMove && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-left animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Move Inventory Location</h3>
              <button 
                onClick={() => {
                  setShowMoveModal(false);
                  setSelectedItemForMove(null);
                }} 
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleMoveSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Details</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">{selectedItemForMove.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {selectedItemForMove.brand} {selectedItemForMove.model} • Part #: {selectedItemForMove.partNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">From Location</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={selectedItemForMove.location || 'Main Stock'} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">To Location *</label>
                  <select 
                    value={moveToLocation}
                    onChange={(e) => setMoveToLocation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    {['Main Stock', 'Damaged Parts (DPB)', 'Recovery Parts (RPB)', 'Return to Vendor (RTW)']
                      .filter(loc => loc !== (selectedItemForMove.location || 'Main Stock'))
                      .map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantity to Move *</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min={1}
                      max={selectedItemForMove.available}
                      value={moveQty}
                      onChange={(e) => setMoveQty(Math.min(selectedItemForMove.available, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">/ {selectedItemForMove.available} max</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reason *</label>
                <input 
                  type="text" 
                  required
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  placeholder="e.g. Defective battery replacement, salvage screen"
                  className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                <textarea 
                  rows={2}
                  value={moveNotes}
                  onChange={(e) => setMoveNotes(e.target.value)}
                  placeholder="Additional context about this movement..."
                  className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowMoveModal(false);
                    setSelectedItemForMove(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={moveSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm shadow-blue-200 cursor-pointer disabled:opacity-50"
                >
                  {moveSaving ? 'Saving...' : 'Confirm Move'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Inventory Item Dialog Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-left animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {editingItemId ? 'Modify Spare Part Item' : 'Register New Spare Part Item'}
              </h3>
              <button 
                onClick={() => {
                  setShowItemModal(false);
                  setEditingItemId(null);
                }} 
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleItemSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Item Name *</label>
                  <input 
                    type="text" 
                    required
                    value={itemFormName}
                    onChange={(e) => setItemFormName(e.target.value)}
                    placeholder="e.g. iPhone 13 Pro Max OLED Screen Assembly"
                    className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Brand</label>
                  <input 
                    type="text" 
                    value={itemFormBrand}
                    onChange={(e) => setItemFormBrand(e.target.value)}
                    placeholder="e.g. Apple"
                    className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Model Compatibility</label>
                  <input 
                    type="text" 
                    value={itemFormModel}
                    onChange={(e) => setItemFormModel(e.target.value)}
                    placeholder="e.g. A2643"
                    className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Part Number / SKU *</label>
                  <input 
                    type="text" 
                    required
                    value={itemFormPartNumber}
                    onChange={(e) => setItemFormPartNumber(e.target.value)}
                    placeholder="e.g. AP-IP13PM-OLED"
                    className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category *</label>
                  <select 
                    value={itemFormCategory}
                    onChange={(e) => setItemFormCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Mobile Parts">Mobile Parts</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Tools & Equipment">Tools & Equipment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cost Price (₹) *</label>
                  <input 
                    type="number" 
                    min={0}
                    required
                    value={itemFormCostPrice === 0 ? '' : itemFormCostPrice}
                    onChange={(e) => setItemFormCostPrice(e.target.value === '' ? 0 : (Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sale Price (₹) *</label>
                  <input 
                    type="number" 
                    min={0}
                    required
                    value={itemFormSalePrice === 0 ? '' : itemFormSalePrice}
                    onChange={(e) => setItemFormSalePrice(e.target.value === '' ? 0 : (Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stock Level *</label>
                  <input 
                    type="number" 
                    min={0}
                    required
                    value={itemFormStock === 0 ? '' : itemFormStock}
                    onChange={(e) => setItemFormStock(e.target.value === '' ? 0 : (Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Storage Location *</label>
                  <select 
                    value={itemFormLocation}
                    onChange={(e) => setItemFormLocation(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Main Stock">Main Stock</option>
                    <option value="Damaged Parts (DPB)">Damaged Parts (DPB)</option>
                    <option value="Recovery Parts (RPB)">Recovery Parts (RPB)</option>
                    <option value="Return to Vendor (RTW)">Return to Vendor (RTW)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Supplier Partner</label>
                  <select 
                    value={itemFormSupplierId}
                    onChange={(e) => setItemFormSupplierId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">No Supplier Assigned</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowItemModal(false);
                    setEditingItemId(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={itemSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm shadow-blue-200 cursor-pointer disabled:opacity-50"
                >
                  {itemSaving ? 'Saving...' : 'Save Spare Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Dialog Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-left animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Register Supplier / Vendor</h3>
              <button 
                onClick={() => setShowAddSupplierModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSupplierSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Supplier/Company Name *</label>
                <input 
                  type="text" 
                  required
                  value={supplierFormName}
                  onChange={(e) => setSupplierFormName(e.target.value)}
                  placeholder="e.g. MaxParts wholesale distributors"
                  className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Person Name</label>
                <input 
                  type="text" 
                  value={supplierFormContactPerson}
                  onChange={(e) => setSupplierFormContactPerson(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input 
                    type="text" 
                    value={supplierFormPhone}
                    onChange={(e) => setSupplierFormPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={supplierFormEmail}
                    onChange={(e) => setSupplierFormEmail(e.target.value)}
                    placeholder="e.g. john@maxparts.com"
                    className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">City / Location</label>
                <input 
                  type="text" 
                  value={supplierFormCity}
                  onChange={(e) => setSupplierFormCity(e.target.value)}
                  placeholder="e.g. Delhi"
                  className="w-full border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={supplierSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm shadow-blue-200 cursor-pointer disabled:opacity-50"
                >
                  {supplierSaving ? 'Registering...' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
