// Persistent Mock Database Service - Clean Production Edition
// Manages local state storage when database configuration is offline

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  createdAt: string;
  isVip: boolean;
  totalSpent: number;
  pendingAmount: number;
  totalJobs: number;
  lastVisit: string;
}

export interface BillingItem {
  id: string;
  name: string;
  description?: string;
  amount: number;
}

export interface PaymentItem {
  date: string;
  time: string;
  amount: number;
  method: string;
}

export interface RepairJob {
  id: string;
  type: 'CS' | 'DS';
  customerId: string;
  customerName: string;
  customerPhone: string;
  device: {
    brand: string;
    model: string;
    color?: string;
    imei?: string;
    serial?: string;
    storage?: string;
    warrantyStatus?: string;
  };
  complaint: string;
  status: 'Received' | 'Diagnosis' | 'Waiting Approval' | 'In Repair' | 'Testing' | 'Ready' | 'Completed' | 'Delivered' | 'Cancelled';
  technician?: string;
  receivedAt: string;
  expectedDelivery?: string;
  time: string;
  estimatedCost: number;
  advancePaid: number;
  remainingBalance: number;
  accessories: string[];
  condition: {
    scratches?: string;
    dents?: string;
    display?: string;
    backGlass?: string;
    photos: string[];
  };
  diagnosis?: {
    observedIssue: string;
    rootCause: string;
    notes: string;
  };
  billingItems: BillingItem[];
  paymentHistory: PaymentItem[];
  timeline: {
    status: string;
    notes: string;
    time: string;
    date: string;
    user: string;
  }[];
  tests: {
    name: string;
    status: 'pass' | 'fail' | 'na';
  }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  partNumber: string;
  category: 'Mobile Parts' | 'Accessories' | 'Consumables' | 'Tools & Equipment';
  stock: number;
  reserved: number;
  available: number;
  costPrice: number;
  salePrice: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image?: string;
  location?: 'Main Stock' | 'Damaged Parts (DPB)' | 'Recovery Parts (RPB)' | 'Return to Vendor (RTW)';
  supplierId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  reason: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}



export interface ActivityLog {
  id: string;
  time: string;
  date: string;
  type: 'info' | 'success' | 'warning' | 'error';
  description: string;
}

// Auto-purge old localStorage dummy data cache if present
const checkAndClearOldCache = () => {
  try {
    const cachedCustomers = localStorage.getItem('r_customers');
    if (cachedCustomers && cachedCustomers.includes('Rahul Sharma')) {
      localStorage.removeItem('r_customers');
      localStorage.removeItem('r_repairs');
      localStorage.removeItem('r_inventory');
      localStorage.removeItem('r_activities');
    }
  } catch (e) {}
};
checkAndClearOldCache();

// Initial Data empty for clean production database
const INITIAL_CUSTOMERS: Customer[] = [];
const INITIAL_REPAIRS: RepairJob[] = [];
const INITIAL_INVENTORY: InventoryItem[] = [];
const INITIAL_ACTIVITIES: ActivityLog[] = [];
const INITIAL_MOVEMENTS: InventoryMovement[] = [];
const INITIAL_SUPPLIERS: Supplier[] = [];

export class MockDatabase {
  private static getStored<T>(key: string, initial: T): T {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  }

  private static setStored<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Getters
  static getCustomers(): Customer[] {
    return this.getStored<Customer[]>('r_customers', INITIAL_CUSTOMERS);
  }

  static getRepairs(): RepairJob[] {
    return this.getStored<RepairJob[]>('r_repairs', INITIAL_REPAIRS);
  }

  static getInventory(): InventoryItem[] {
    const items = this.getStored<InventoryItem[]>('r_inventory', INITIAL_INVENTORY);
    // Ensure every item has a location default to 'Main Stock' if undefined
    return items.map(item => ({ ...item, location: item.location || 'Main Stock' }));
  }

  static getActivities(): ActivityLog[] {
    return this.getStored<ActivityLog[]>('r_activities', INITIAL_ACTIVITIES);
  }

  static getInventoryMovements(): InventoryMovement[] {
    return this.getStored<InventoryMovement[]>('r_inventory_movements', INITIAL_MOVEMENTS);
  }

  static getSuppliers(): Supplier[] {
    return this.getStored<Supplier[]>('r_suppliers', INITIAL_SUPPLIERS);
  }

  // Setters
  static saveCustomers(customers: Customer[]) {
    this.setStored('r_customers', customers);
  }

  static saveRepairs(repairs: RepairJob[]) {
    this.setStored('r_repairs', repairs);
  }

  static saveInventory(inventory: InventoryItem[]) {
    this.setStored('r_inventory', inventory);
  }

  static saveActivities(activities: ActivityLog[]) {
    this.setStored('r_activities', activities);
  }

  static saveInventoryMovements(movements: InventoryMovement[]) {
    this.setStored('r_inventory_movements', movements);
  }

  static saveSuppliers(suppliers: Supplier[]) {
    this.setStored('r_suppliers', suppliers);
  }

  // Transactions / Operations
  static addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'pendingAmount' | 'totalJobs' | 'lastVisit'>): Customer {
    const list = this.getCustomers();
    const newCustomer: Customer = {
      ...customer,
      id: `CUST-${String(list.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      totalSpent: 0,
      pendingAmount: 0,
      totalJobs: 0,
      lastVisit: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    list.unshift(newCustomer);
    this.saveCustomers(list);
    this.logActivity('info', `Customer ${newCustomer.name} registered.`);
    return newCustomer;
  }

  static updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'pendingAmount' | 'totalJobs' | 'lastVisit'>>): boolean {
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      const current = list[idx];
      if (updates.name !== undefined) current.name = updates.name;
      if (updates.phone !== undefined) current.phone = updates.phone;
      if (updates.email !== undefined) current.email = updates.email;
      if (updates.city !== undefined) current.city = updates.city;
      this.saveCustomers(list);
      this.logActivity('info', `Customer ${current.name} updated.`);
      return true;
    }
    return false;
  }

  static addRepair(repair: Omit<RepairJob, 'id' | 'receivedAt' | 'time' | 'billingItems' | 'paymentHistory' | 'timeline' | 'tests' | 'remainingBalance'>): RepairJob {
    const list = this.getRepairs();
    const idNum = list.length > 0 ? parseInt(list[0].id.replace('R-', '')) + 1 : 23925;
    const newId = `R-${idNum}`;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newRepair: RepairJob = {
      ...repair,
      id: newId,
      receivedAt: dateStr,
      time: timeStr,
      remainingBalance: repair.estimatedCost - repair.advancePaid,
      billingItems: [],
      paymentHistory: repair.advancePaid > 0 ? [{ date: dateStr, time: timeStr, amount: repair.advancePaid, method: 'Cash/Advance' }] : [],
      timeline: [
        { status: 'Received', notes: 'Job initialized via New Repair flow', time: timeStr, date: dateStr, user: 'Vishal Sharma' }
      ],
      tests: [
        { name: 'Power', status: 'na' },
        { name: 'Charging', status: 'na' },
        { name: 'Display', status: 'na' },
        { name: 'Touch', status: 'na' },
        { name: 'Speaker', status: 'na' },
        { name: 'Microphone', status: 'na' },
        { name: 'Camera', status: 'na' },
        { name: 'WiFi', status: 'na' }
      ]
    };

    list.unshift(newRepair);
    this.saveRepairs(list);

    // Update customer stats
    const customers = this.getCustomers();
    const cIndex = customers.findIndex(c => c.id === repair.customerId || c.phone === repair.customerPhone);
    if (cIndex !== -1) {
      customers[cIndex].totalJobs += 1;
      customers[cIndex].pendingAmount += newRepair.remainingBalance;
      customers[cIndex].lastVisit = dateStr;
      this.saveCustomers(customers);
    }

    this.logActivity('success', `Repair job #${newId} created for ${repair.customerName} (${repair.device.brand} ${repair.device.model}).`);
    return newRepair;
  }

  static updateRepairStatus(id: string, newStatus: RepairJob['status'], notes?: string): RepairJob | undefined {
    const list = this.getRepairs();
    const index = list.findIndex(r => r.id === id);
    if (index !== -1) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      list[index].status = newStatus;
      list[index].timeline.push({
        status: newStatus,
        notes: notes || `Repair status updated to ${newStatus}`,
        time: timeStr,
        date: dateStr,
        user: 'Vikram S.'
      });
      this.saveRepairs(list);
      this.logActivity('info', `Job #${id} status updated to ${newStatus}.`);
      return list[index];
    }
    return undefined;
  }

  static addBillingItem(repairId: string, item: Omit<BillingItem, 'id'>): RepairJob | undefined {
    const repairs = this.getRepairs();
    const index = repairs.findIndex(r => r.id === repairId);
    if (index !== -1) {
      const newItem = { ...item, id: `BILL-${Date.now()}` };
      repairs[index].billingItems.push(newItem);
      
      // Recalculate totals
      const totalAmount = repairs[index].billingItems.reduce((acc, curr) => acc + curr.amount, 0);
      repairs[index].estimatedCost = totalAmount;
      repairs[index].remainingBalance = totalAmount - repairs[index].advancePaid;

      // Update customer pending amount
      const customers = this.getCustomers();
      const cIndex = customers.findIndex(c => c.id === repairs[index].customerId);
      if (cIndex !== -1) {
        const custRepairs = repairs.filter(r => r.customerId === repairs[index].customerId);
        customers[cIndex].pendingAmount = custRepairs.reduce((acc, curr) => acc + curr.remainingBalance, 0);
        this.saveCustomers(customers);
      }

      this.saveRepairs(repairs);
      return repairs[index];
    }
    return undefined;
  }

  static addPayment(repairId: string, payment: Omit<PaymentItem, 'date' | 'time'>): RepairJob | undefined {
    const repairs = this.getRepairs();
    const index = repairs.findIndex(r => r.id === repairId);
    if (index !== -1) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      const newPayment = {
        ...payment,
        date: dateStr,
        time: timeStr
      };

      repairs[index].paymentHistory.push(newPayment);
      repairs[index].advancePaid += payment.amount;
      repairs[index].remainingBalance = repairs[index].estimatedCost - repairs[index].advancePaid;

      // Update customer stats
      const customers = this.getCustomers();
      const cIndex = customers.findIndex(c => c.id === repairs[index].customerId);
      if (cIndex !== -1) {
        customers[cIndex].totalSpent += payment.amount;
        const custRepairs = repairs.filter(r => r.customerId === repairs[index].customerId);
        customers[cIndex].pendingAmount = custRepairs.reduce((acc, curr) => acc + curr.remainingBalance, 0);
        this.saveCustomers(customers);
      }

      repairs[index].timeline.push({
        status: repairs[index].status,
        notes: `Payment of ₹${payment.amount} received via ${payment.method}`,
        time: timeStr,
        date: dateStr,
        user: 'Vishal Sharma'
      });

      this.saveRepairs(repairs);
      this.logActivity('success', `Payment of ₹${payment.amount} received for Job #${repairId}.`);
      return repairs[index];
    }
    return undefined;
  }

  static consumeInventory(itemId: string, qty: number): boolean {
    const inventory = this.getInventory();
    const index = inventory.findIndex(item => item.id === itemId);
    if (index !== -1 && inventory[index].available >= qty) {
      inventory[index].stock -= qty;
      inventory[index].available = inventory[index].stock - inventory[index].reserved;
      
      if (inventory[index].available === 0) {
        inventory[index].status = 'Out of Stock';
      } else if (inventory[index].available <= 5) {
        inventory[index].status = 'Low Stock';
      } else {
        inventory[index].status = 'In Stock';
      }

      this.saveInventory(inventory);
      this.logActivity('success', `Inventory spare part consumed: ${inventory[index].name} (${qty} pcs).`);
      return true;
    }
    return false;
  }

  static adjustStock(itemId: string, qty: number, reason: string): boolean {
    const inventory = this.getInventory();
    const index = inventory.findIndex(item => item.id === itemId);
    if (index !== -1) {
      inventory[index].stock += qty;
      inventory[index].available = inventory[index].stock - inventory[index].reserved;
      
      if (inventory[index].available <= 0) {
        inventory[index].status = 'Out of Stock';
      } else if (inventory[index].available <= 5) {
        inventory[index].status = 'Low Stock';
      } else {
        inventory[index].status = 'In Stock';
      }

      this.saveInventory(inventory);
      this.logActivity('info', `Stock adjusted for ${inventory[index].name} (${qty > 0 ? '+' : ''}${qty} pcs) due to: ${reason}`);
      return true;
    }
    return false;
  }

  static moveInventory(
    itemId: string,
    quantity: number,
    fromLocation: string,
    toLocation: string,
    reason: string,
    notes?: string,
    performedBy: string = 'Technician'
  ): boolean {
    const inventory = this.getInventory();
    const sourceIndex = inventory.findIndex(item => item.id === itemId);
    if (sourceIndex === -1) return false;

    const sourceItem = inventory[sourceIndex];
    if (sourceItem.available < quantity) return false;

    // 1. Deduct from source
    sourceItem.stock -= quantity;
    sourceItem.available = sourceItem.stock - sourceItem.reserved;
    if (sourceItem.available <= 0) {
      sourceItem.status = 'Out of Stock';
    } else if (sourceItem.available <= 5) {
      sourceItem.status = 'Low Stock';
    } else {
      sourceItem.status = 'In Stock';
    }

    // 2. Add to destination
    const destIndex = inventory.findIndex(
      item => item.partNumber === sourceItem.partNumber && item.location === toLocation
    );

    if (destIndex !== -1) {
      const destItem = inventory[destIndex];
      destItem.stock += quantity;
      destItem.available = destItem.stock - destItem.reserved;
      if (destItem.available <= 0) {
        destItem.status = 'Out of Stock';
      } else if (destItem.available <= 5) {
        destItem.status = 'Low Stock';
      } else {
        destItem.status = 'In Stock';
      }
    } else {
      const newId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newItem: InventoryItem = {
        id: newId,
        name: sourceItem.name,
        brand: sourceItem.brand,
        model: sourceItem.model,
        partNumber: sourceItem.partNumber,
        category: sourceItem.category,
        stock: quantity,
        reserved: 0,
        available: quantity,
        costPrice: sourceItem.costPrice,
        salePrice: sourceItem.salePrice,
        status: quantity <= 0 ? 'Out of Stock' : (quantity <= 5 ? 'Low Stock' : 'In Stock'),
        location: toLocation as any
      };
      inventory.push(newItem);
    }

    this.saveInventory(inventory);

    // 3. Save movement
    const movements = this.getInventoryMovements();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const newMovement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      itemId: sourceItem.id,
      itemName: sourceItem.name,
      quantity,
      fromLocation,
      toLocation,
      reason,
      notes,
      performedBy,
      createdAt: `${dateStr} ${timeStr}`
    };
    movements.unshift(newMovement);
    this.saveInventoryMovements(movements);

    this.logActivity('success', `Moved ${quantity} pcs of ${sourceItem.name} from ${fromLocation} to ${toLocation}.`);
    return true;
  }

  static addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const list = this.getSuppliers();
    const newSupplier: Supplier = {
      ...supplier,
      id: `SUP-${Date.now().toString().slice(-3)}`,
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    list.unshift(newSupplier);
    this.saveSuppliers(list);
    this.logActivity('success', `Supplier ${newSupplier.name} added.`);
    return newSupplier;
  }

  static deleteSupplier(supplierId: string): boolean {
    const list = this.getSuppliers();
    const index = list.findIndex(s => s.id === supplierId);
    if (index !== -1) {
      const name = list[index].name;
      list.splice(index, 1);
      this.saveSuppliers(list);
      this.logActivity('warning', `Supplier ${name} deleted.`);
      return true;
    }
    return false;
  }

  static addInventoryItem(item: Omit<InventoryItem, 'id' | 'status' | 'reserved' | 'available'>): InventoryItem {
    const list = this.getInventory();
    const id = `INV-${Date.now().toString().slice(-3)}`;
    const newItem: InventoryItem = {
      ...item,
      id,
      reserved: 0,
      available: item.stock,
      status: item.stock <= 0 ? 'Out of Stock' : (item.stock <= 5 ? 'Low Stock' : 'In Stock'),
      location: item.location || 'Main Stock'
    };
    list.push(newItem);
    this.saveInventory(list);
    this.logActivity('success', `Inventory item ${newItem.name} added.`);
    return newItem;
  }

  static editInventoryItem(itemId: string, updates: Partial<Omit<InventoryItem, 'id' | 'reserved' | 'available'>>): boolean {
    const list = this.getInventory();
    const index = list.findIndex(item => item.id === itemId);
    if (index !== -1) {
      const current = list[index];
      // Update values
      if (updates.name !== undefined) current.name = updates.name;
      if (updates.brand !== undefined) current.brand = updates.brand;
      if (updates.model !== undefined) current.model = updates.model;
      if (updates.partNumber !== undefined) current.partNumber = updates.partNumber;
      if (updates.category !== undefined) current.category = updates.category;
      if (updates.costPrice !== undefined) current.costPrice = updates.costPrice;
      if (updates.salePrice !== undefined) current.salePrice = updates.salePrice;
      if (updates.supplierId !== undefined) current.supplierId = updates.supplierId;
      if (updates.location !== undefined) current.location = updates.location;
      
      if (updates.stock !== undefined) {
        current.stock = updates.stock;
        current.available = current.stock - current.reserved;
        if (current.available <= 0) current.status = 'Out of Stock';
        else if (current.available <= 5) current.status = 'Low Stock';
        else current.status = 'In Stock';
      }

      this.saveInventory(list);
      this.logActivity('info', `Inventory item ${current.name} updated.`);
      return true;
    }
    return false;
  }

  static deleteInventoryItem(itemId: string): boolean {
    const list = this.getInventory();
    const index = list.findIndex(item => item.id === itemId);
    if (index !== -1) {
      const name = list[index].name;
      list.splice(index, 1);
      this.saveInventory(list);
      this.logActivity('warning', `Inventory item ${name} deleted.`);
      return true;
    }
    return false;
  }

  private static logActivity(type: ActivityLog['type'], description: string) {
    const list = this.getActivities();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    list.unshift({
      id: `act-${Date.now()}`,
      time: timeStr,
      date: dateStr,
      type,
      description
    });

    if (list.length > 50) {
      list.pop();
    }
    this.saveActivities(list);
  }
}
