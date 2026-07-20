import { supabase, isSupabaseConfigured } from './supabaseClient';
import { MockDatabase, Customer, RepairJob, InventoryItem, ActivityLog, BillingItem, PaymentItem, Supplier } from './mockDb';

// Utility to convert Snake Case DB keys to Camel Case front-end objects
const mapCustomer = (db: any): Customer => ({
  id: db.id,
  name: db.name,
  phone: db.phone,
  email: db.email,
  city: db.city,
  createdAt: new Date(db.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  isVip: db.is_vip,
  totalSpent: Number(db.total_spent),
  pendingAmount: Number(db.pending_amount),
  totalJobs: Number(db.total_jobs),
  lastVisit: db.last_visit ? new Date(db.last_visit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
});

const mapInventory = (db: any): InventoryItem => ({
  id: db.id,
  name: db.name,
  brand: db.brand,
  model: db.model,
  partNumber: db.part_number,
  category: db.category,
  stock: Number(db.stock),
  reserved: Number(db.reserved),
  available: Number(db.available),
  costPrice: Number(db.cost_price),
  salePrice: Number(db.sale_price),
  status: db.status,
  location: db.location || 'Main Stock'
});

const mapSupplier = (db: any): Supplier => ({
  id: db.id,
  name: db.name,
  contactPerson: db.contact_person,
  phone: db.phone,
  email: db.email,
  city: db.city,
  createdAt: new Date(db.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
});

const mapRepair = (db: any, items: any[] = [], pays: any[] = [], timeline: any[] = []): RepairJob => ({
  id: db.id,
  type: db.type,
  customerId: db.customer_id,
  customerName: db.customer_name,
  customerPhone: db.customer_phone,
  device: {
    brand: db.device_brand,
    model: db.device_model,
    color: db.device_color,
    imei: db.device_imei,
    serial: db.device_serial
  },
  complaint: db.complaint,
  status: db.status,
  technician: db.technician,
  receivedAt: db.received_at,
  expectedDelivery: db.expected_delivery,
  time: db.time,
  estimatedCost: Number(db.estimated_cost),
  advancePaid: Number(db.advance_paid),
  remainingBalance: Number(db.remaining_balance),
  accessories: db.accessories || [],
  condition: {
    scratches: db.scratches,
    dents: db.dents,
    display: db.display_condition,
    backGlass: db.back_glass_condition,
    photos: []
  },
  tests: db.tests || [],
  diagnosis: db.diagnosis_issue ? {
    observedIssue: db.diagnosis_issue,
    rootCause: db.diagnosis_cause,
    notes: db.diagnosis_notes
  } : undefined,
  billingItems: items.map(i => ({ id: i.id, name: i.name, description: i.description, amount: Number(i.amount) })),
  paymentHistory: pays.map(p => ({ date: p.date, time: p.time, amount: Number(p.amount), method: p.method })),
  timeline: timeline.map(t => ({ status: t.status, notes: t.notes, time: t.time, date: t.date, user: t.user_name }))
});

export class DatabaseService {
  static offline = !navigator.onLine;
  static syncQueue: any[] = [];

  static isUsingCloud(): boolean {
    return isSupabaseConfigured;
  }

  // Load sync queue state
  static initQueue() {
    try {
      this.syncQueue = JSON.parse(localStorage.getItem('r_sync_queue') || '[]');
    } catch (e) {
      this.syncQueue = [];
    }
  }

  static saveSyncQueue() {
    localStorage.setItem('r_sync_queue', JSON.stringify(this.syncQueue));
  }

  static notifySyncStatus() {
    window.dispatchEvent(new CustomEvent('db-sync-status', {
      detail: {
        pending: this.syncQueue.length,
        offline: this.offline
      }
    }));
  }

  // Unified executor that wraps cloud mutations in try-catch and queues actions if offline
  static async executeAction<T>(
    cloudFn: () => Promise<T>,
    localFn: () => Promise<T>,
    actionName: string,
    payload: any,
    isMutation: boolean = true
  ): Promise<T> {
    if (!this.isUsingCloud()) {
      return localFn();
    }

    if (this.offline && !isMutation) {
      return localFn();
    }

    try {
      const result = await cloudFn();
      if (this.offline && this.syncQueue.length === 0) {
        this.offline = false;
        this.notifySyncStatus();
      }
      return result;
    } catch (error) {
      console.warn(`Database fallback to offline. Action: ${actionName}`, error);
      
      this.offline = true;
      this.notifySyncStatus();

      if (isMutation) {
        this.syncQueue.push({ actionName, payload, timestamp: Date.now() });
        this.saveSyncQueue();
        this.notifySyncStatus();
      }

      return localFn();
    }
  }

  // Cloud action runners called by queue synchronizer
  private static async performCloudAddCustomer(customer: any) {
    const { error } = await supabase.from('customers').insert([{
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      is_vip: customer.isVip,
      total_spent: 0,
      pending_amount: 0,
      total_jobs: 0
    }]);
    if (error) throw error;
  }

  private static async performCloudAddRepair(payload: any) {
    const { error } = await supabase.from('repairs').insert([{
      id: payload.newId,
      type: payload.repair.type,
      customer_id: payload.repair.customerId,
      customer_name: payload.repair.customerName,
      customer_phone: payload.repair.customerPhone,
      device_brand: payload.repair.device.brand,
      device_model: payload.repair.device.model,
      device_color: payload.repair.device.color,
      device_imei: payload.repair.device.imei,
      device_serial: payload.repair.device.serial,
      complaint: payload.repair.complaint,
      status: payload.repair.status,
      technician: payload.repair.technician,
      received_at: payload.dateStr,
      expected_delivery: payload.repair.expectedDelivery,
      time: payload.timeStr,
      estimated_cost: payload.repair.estimatedCost,
      advance_paid: payload.repair.advancePaid,
      remaining_balance: payload.repair.estimatedCost - payload.repair.advancePaid,
      accessories: payload.repair.accessories,
      scratches: payload.repair.condition.scratches,
      dents: payload.repair.condition.dents,
      display_condition: payload.repair.condition.display,
      back_glass_condition: payload.repair.condition.backGlass,
      tests: [
        { name: 'Power', status: 'na' },
        { name: 'Display & Touch', status: 'na' },
        { name: 'Charging', status: 'na' },
        { name: 'Audio (Mic/Spk)', status: 'na' },
        { name: 'Camera (Front/Rear)', status: 'na' },
        { name: 'Wifi/Network', status: 'na' }
      ]
    }]);
    if (error) throw error;

    await supabase.from('timeline_events').insert([{
      repair_id: payload.newId,
      status: 'Received',
      notes: 'Job initialized via New Repair flow',
      time: payload.timeStr,
      date: payload.dateStr,
      user_name: 'Vishal Sharma'
    }]);

    const { data: custData } = await supabase.from('customers').select('*').eq('id', payload.repair.customerId).single();
    if (custData) {
      await supabase.from('customers').update({
        total_jobs: Number(custData.total_jobs) + 1,
        pending_amount: Number(custData.pending_amount) + (payload.repair.estimatedCost - payload.repair.advancePaid),
        last_visit: new Date().toISOString()
      }).eq('id', payload.repair.customerId);
    }
  }

  private static async performCloudUpdateRepairStatus(id: string, newStatus: any, notes: any) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const { error } = await supabase.from('repairs').update({ status: newStatus }).eq('id', id);
    if (error) throw error;

    await supabase.from('timeline_events').insert([{
      repair_id: id,
      status: newStatus,
      notes: notes || `Repair status updated to ${newStatus}`,
      time: timeStr,
      date: dateStr,
      user_name: 'Vikram S.'
    }]);
  }

  private static async performCloudAddBillingItem(repairId: string, item: any) {
    const itemId = `BILL-${Date.now().toString().slice(-4)}`;
    const newItem = {
      id: itemId,
      repair_id: repairId,
      name: item.name,
      description: item.description,
      amount: item.amount
    };

    const { error: bErr } = await supabase.from('billing_items').insert([newItem]);
    if (bErr) throw bErr;

    // Fetch and sync totals
    const { data: rep } = await supabase.from('repairs').select('*').eq('id', repairId).single();
    const { data: items } = await supabase.from('billing_items').select('*').eq('repair_id', repairId);
    if (rep && items) {
      const newTotal = items.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
      const newBalance = newTotal - Number(rep.advance_paid);

      await supabase.from('repairs').update({
        estimated_cost: newTotal,
        remaining_balance: newBalance
      }).eq('id', repairId);

      const { data: custData } = await supabase.from('customers').select('*').eq('id', rep.customer_id).single();
      if (custData) {
        await supabase.from('customers').update({
          pending_amount: Number(custData.pending_amount) + (newBalance - Number(rep.remaining_balance))
        }).eq('id', rep.customer_id);
      }
    }
  }

  private static async performCloudAddPayment(repairId: string, payment: any) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newPayment = {
      repair_id: repairId,
      amount: payment.amount,
      method: payment.method,
      time: timeStr,
      date: dateStr
    };

    const { error: pErr } = await supabase.from('payments').insert([newPayment]);
    if (pErr) throw pErr;

    const { data: rep } = await supabase.from('repairs').select('*').eq('id', repairId).single();
    if (rep) {
      const newAdvance = Number(rep.advance_paid) + payment.amount;
      const newBalance = Number(rep.estimated_cost) - newAdvance;

      await supabase.from('repairs').update({
        advance_paid: newAdvance,
        remaining_balance: newBalance
      }).eq('id', repairId);

      const { data: custData } = await supabase.from('customers').select('*').eq('id', rep.customer_id).single();
      if (custData) {
        await supabase.from('customers').update({
          total_spent: Number(custData.total_spent) + payment.amount,
          pending_amount: Math.max(0, Number(custData.pending_amount) - payment.amount)
        }).eq('id', rep.customer_id);
      }

      await supabase.from('timeline_events').insert([{
        repair_id: repairId,
        status: rep.status,
        notes: `Payment of ₹${payment.amount} received via ${payment.method}`,
        time: timeStr,
        date: dateStr,
        user_name: 'Vishal Sharma'
      }]);
    }
  }

  private static async performCloudConsumeInventory(itemId: string, qty: number) {
    const { data: item } = await supabase.from('inventory').select('*').eq('id', itemId).single();
    if (item && Number(item.available) >= qty) {
      const newStock = Number(item.stock) - qty;
      const newAvail = newStock - Number(item.reserved);
      let status = 'In Stock';
      if (newAvail <= 0) status = 'Out of Stock';
      else if (newAvail <= 5) status = 'Low Stock';

      const { error } = await supabase.from('inventory').update({
        stock: newStock,
        available: newAvail,
        status
      }).eq('id', itemId);
      if (error) throw error;
    }
  }

  private static async performCloudAdjustStock(itemId: string, qty: number, reason: string) {
    const { data: item } = await supabase.from('inventory').select('*').eq('id', itemId).single();
    if (item) {
      const newStock = Number(item.stock) + qty;
      const newAvail = newStock - Number(item.reserved);
      let status = 'In Stock';
      if (newAvail <= 0) status = 'Out of Stock';
      else if (newAvail <= 5) status = 'Low Stock';

      const { error } = await supabase.from('inventory').update({
        stock: newStock,
        available: newAvail,
        status
      }).eq('id', itemId);
      if (error) throw error;
    }
  }

  private static async performCloudMoveInventory(
    itemId: string,
    quantity: number,
    fromLocation: string,
    toLocation: string,
    reason: string,
    notes?: string,
    performedBy: string = 'Operator'
  ) {
    const { data: sourceItem } = await supabase.from('inventory').select('*').eq('id', itemId).single();
    if (!sourceItem || Number(sourceItem.available) < quantity) throw new Error('Insufficient inventory available');

    const sourceNewStock = Number(sourceItem.stock) - quantity;
    const sourceNewAvail = sourceNewStock - Number(sourceItem.reserved);
    let sourceStatus = 'In Stock';
    if (sourceNewAvail <= 0) sourceStatus = 'Out of Stock';
    else if (sourceNewAvail <= 5) sourceStatus = 'Low Stock';

    await supabase.from('inventory').update({
      stock: sourceNewStock,
      available: sourceNewAvail,
      status: sourceStatus
    }).eq('id', itemId);

    const { data: destItem } = await supabase.from('inventory')
      .select('*')
      .eq('part_number', sourceItem.part_number)
      .eq('location', toLocation)
      .maybeSingle();

    if (destItem) {
      const destNewStock = Number(destItem.stock) + quantity;
      const destNewAvail = destNewStock - Number(destItem.reserved);
      let destStatus = 'In Stock';
      if (destNewAvail <= 0) destStatus = 'Out of Stock';
      else if (destNewAvail <= 5) destStatus = 'Low Stock';

      await supabase.from('inventory').update({
        stock: destNewStock,
        available: destNewAvail,
        status: destStatus
      }).eq('id', destItem.id);
    } else {
      const newId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let destStatus = 'In Stock';
      if (quantity <= 0) destStatus = 'Out of Stock';
      else if (quantity <= 5) destStatus = 'Low Stock';

      await supabase.from('inventory').insert([{
        id: newId,
        name: sourceItem.name,
        brand: sourceItem.brand,
        model: sourceItem.model,
        part_number: sourceItem.part_number,
        category: sourceItem.category,
        stock: quantity,
        reserved: 0,
        available: quantity,
        cost_price: sourceItem.cost_price,
        sale_price: sourceItem.sale_price,
        status: destStatus,
        location: toLocation
      }]);
    }

    await supabase.from('inventory_movements').insert([{
      item_id: sourceItem.id,
      item_name: sourceItem.name,
      quantity,
      from_location: fromLocation,
      to_location: toLocation,
      reason,
      notes: notes || null,
      performed_by: performedBy
    }]);
  }

  private static async performCloudSaveRepairDiagnosis(id: string, diagnosis: any) {
    const { error } = await supabase.from('repairs').update({
      diagnosis_issue: diagnosis.observedIssue,
      diagnosis_cause: diagnosis.rootCause,
      diagnosis_notes: diagnosis.notes
    }).eq('id', id);
    if (error) throw error;
  }

  private static async performCloudSaveRepairTests(id: string, tests: any[]) {
    const { error } = await supabase.from('repairs').update({ tests }).eq('id', id);
    if (error) throw error;
  }

  private static async performCloudAddSupplier(supplier: any) {
    const { error } = await supabase.from('suppliers').insert([{
      id: supplier.id,
      name: supplier.name,
      contact_person: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      city: supplier.city
    }]);
    if (error) throw error;
  }

  private static async performCloudDeleteSupplier(supplierId: string) {
    const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
    if (error) throw error;
  }

  private static async performCloudAddInventoryItem(item: any) {
    const status = item.stock <= 0 ? 'Out of Stock' : (item.stock <= 5 ? 'Low Stock' : 'In Stock');
    const { error } = await supabase.from('inventory').insert([{
      id: item.id,
      name: item.name,
      brand: item.brand,
      model: item.model,
      part_number: item.partNumber,
      category: item.category,
      stock: item.stock,
      reserved: 0,
      available: item.stock,
      cost_price: item.costPrice,
      sale_price: item.salePrice,
      status,
      location: item.location || 'Main Stock',
      supplier_id: item.supplierId || null
    }]);
    if (error) throw error;
  }

  private static async performCloudEditInventoryItem(itemId: string, updates: any) {
    const { data: current } = await supabase.from('inventory').select('*').eq('id', itemId).single();
    if (!current) throw new Error('Item not found');

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
    if (updates.model !== undefined) dbUpdates.model = updates.model;
    if (updates.partNumber !== undefined) dbUpdates.part_number = updates.partNumber;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
    if (updates.supplierId !== undefined) dbUpdates.supplier_id = updates.supplierId || null;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    
    if (updates.stock !== undefined) {
      dbUpdates.stock = updates.stock;
      const reserved = Number(current.reserved);
      dbUpdates.available = updates.stock - reserved;
      if (dbUpdates.available <= 0) dbUpdates.status = 'Out of Stock';
      else if (dbUpdates.available <= 5) dbUpdates.status = 'Low Stock';
      else dbUpdates.status = 'In Stock';
    }

    const { error } = await supabase.from('inventory').update(dbUpdates).eq('id', itemId);
    if (error) throw error;
  }

  private static async performCloudDeleteInventoryItem(itemId: string) {
    const { error } = await supabase.from('inventory').delete().eq('id', itemId);
    if (error) throw error;
  }

  // Queue background processor
  static async syncOfflineChanges() {
    if (this.syncQueue.length === 0) {
      if (this.offline) {
        this.offline = false;
        this.notifySyncStatus();
      }
      return;
    }

    console.log(`Processing sync queue containing ${this.syncQueue.length} entries...`);
    
    // Copy queue entries to loop
    const queueCopy = [...this.syncQueue];

    for (const item of queueCopy) {
      try {
        switch (item.actionName) {
          case 'addCustomer':
            await this.performCloudAddCustomer(item.payload);
            break;
          case 'addRepair':
            await this.performCloudAddRepair(item.payload);
            break;
          case 'updateRepairStatus':
            await this.performCloudUpdateRepairStatus(item.payload.id, item.payload.newStatus, item.payload.notes);
            break;
          case 'addBillingItem':
            await this.performCloudAddBillingItem(item.payload.repairId, item.payload.item);
            break;
          case 'addPayment':
            await this.performCloudAddPayment(item.payload.repairId, item.payload.payment);
            break;
          case 'consumeInventory':
            await this.performCloudConsumeInventory(item.payload.itemId, item.payload.qty);
            break;
          case 'adjustStock':
            await this.performCloudAdjustStock(item.payload.itemId, item.payload.qty, item.payload.reason);
            break;
          case 'moveInventory':
            await this.performCloudMoveInventory(
              item.payload.itemId,
              item.payload.quantity,
              item.payload.fromLocation,
              item.payload.toLocation,
              item.payload.reason,
              item.payload.notes,
              item.payload.performedBy
            );
            break;
          case 'saveRepairDiagnosis':
            await this.performCloudSaveRepairDiagnosis(item.payload.id, item.payload.diagnosis);
            break;
          case 'saveRepairTests':
            await this.performCloudSaveRepairTests(item.payload.id, item.payload.tests);
            break;
          case 'addSupplier':
            await this.performCloudAddSupplier(item.payload);
            break;
          case 'deleteSupplier':
            await this.performCloudDeleteSupplier(item.payload);
            break;
          case 'addInventoryItem':
            await this.performCloudAddInventoryItem(item.payload);
            break;
          case 'editInventoryItem':
            await this.performCloudEditInventoryItem(item.payload.itemId, item.payload.updates);
            break;
          case 'deleteInventoryItem':
            await this.performCloudDeleteInventoryItem(item.payload);
            break;
        }

        // Successfully synced, remove it from queue
        this.syncQueue.shift();
        this.saveSyncQueue();
        this.notifySyncStatus();
      } catch (err: any) {
        console.error('Offline Sync error for item:', item, err);
        
        // Skip items that throw database-level constraint/validation/auth errors (LWW / prevent deadlock)
        const errCode = String(err?.code || err?.status || '');
        const errMsg = String(err?.message || '').toLowerCase();
        
        const isConstraintOrAuthError = 
          errCode === '23505' || // Duplicate key
          errCode === '23503' || // Foreign key violation
          errCode === '401' || // Unauthorized (RLS blocked)
          errCode === '403' || // Forbidden (RLS blocked)
          errCode === '409' || // Conflict
          errCode === '400' || // Bad Request
          errMsg.includes('already exists') || 
          errMsg.includes('duplicate key') || 
          errMsg.includes('violates foreign key');

        if (isConstraintOrAuthError) {
          console.warn('Persistent database error encountered. Discarding queue item to prevent deadlock:', item, err);
          this.syncQueue.shift();
          this.saveSyncQueue();
          this.notifySyncStatus();
          continue;
        }

        // Network connection error: break out and retry on next interval
        this.offline = true;
        this.notifySyncStatus();
        return;
      }
    }

    this.offline = false;
    this.notifySyncStatus();
    console.log('Offline synchronization completed successfully!');
  }

  // Getters with Caching fallbacks
  static async getCustomers(): Promise<Customer[]> {
    return this.executeAction(
      async () => {
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const mapped = data.map(mapCustomer);
        localStorage.setItem('cache_customers', JSON.stringify(mapped));
        return mapped;
      },
      async () => {
        const cache = localStorage.getItem('cache_customers');
        if (cache) return JSON.parse(cache);
        return MockDatabase.getCustomers();
      },
      'getCustomers',
      null,
      false
    );
  }

  static async getRepairs(): Promise<RepairJob[]> {
    return this.executeAction(
      async () => {
        const { data: repairsData, error } = await supabase.from('repairs').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        const { data: billingData } = await supabase.from('billing_items').select('*');
        const { data: paymentsData } = await supabase.from('payments').select('*');
        const { data: timelineData } = await supabase.from('timeline_events').select('*');

        const mapped = repairsData.map(rep => {
          const items = (billingData || []).filter(i => i.repair_id === rep.id);
          const pays = (paymentsData || []).filter(p => p.repair_id === rep.id);
          const timeline = (timelineData || []).filter(t => t.repair_id === rep.id);
          return mapRepair(rep, items, pays, timeline);
        });

        localStorage.setItem('cache_repairs', JSON.stringify(mapped));
        return mapped;
      },
      async () => {
        const cache = localStorage.getItem('cache_repairs');
        if (cache) return JSON.parse(cache);
        return MockDatabase.getRepairs();
      },
      'getRepairs',
      null,
      false
    );
  }

  static async getInventory(): Promise<InventoryItem[]> {
    return this.executeAction(
      async () => {
        const { data, error } = await supabase.from('inventory').select('*').order('name', { ascending: true });
        if (error) throw error;
        const mapped = data.map(mapInventory);
        localStorage.setItem('cache_inventory', JSON.stringify(mapped));
        return mapped;
      },
      async () => {
        const cache = localStorage.getItem('cache_inventory');
        if (cache) return JSON.parse(cache);
        return MockDatabase.getInventory();
      },
      'getInventory',
      null,
      false
    );
  }

  static async getInventoryMovements(): Promise<any[]> {
    return this.executeAction(
      async () => {
        const { data, error } = await supabase.from('inventory_movements').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const mapped = data.map(db => ({
          id: db.id,
          itemId: db.item_id,
          itemName: db.item_name,
          quantity: Number(db.quantity),
          fromLocation: db.from_location,
          toLocation: db.to_location,
          reason: db.reason,
          notes: db.notes,
          performedBy: db.performed_by,
          createdAt: new Date(db.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }));
        localStorage.setItem('cache_movements', JSON.stringify(mapped));
        return mapped;
      },
      async () => {
        const cache = localStorage.getItem('cache_movements');
        if (cache) return JSON.parse(cache);
        return MockDatabase.getInventoryMovements();
      },
      'getInventoryMovements',
      null,
      false
    );
  }

  static async getSuppliers(): Promise<Supplier[]> {
    return this.executeAction(
      async () => {
        const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const mapped = data.map(mapSupplier);
        localStorage.setItem('cache_suppliers', JSON.stringify(mapped));
        return mapped;
      },
      async () => {
        const cache = localStorage.getItem('cache_suppliers');
        if (cache) return JSON.parse(cache);
        return MockDatabase.getSuppliers();
      },
      'getSuppliers',
      null,
      false
    );
  }

  // Mutations
  static async addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'pendingAmount' | 'totalJobs' | 'lastVisit'>): Promise<Customer> {
    const id = `CUST-${Date.now().toString().slice(-4)}`;
    const newCust = {
      ...customer,
      id,
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      isVip: false,
      totalSpent: 0,
      pendingAmount: 0,
      totalJobs: 0,
      lastVisit: 'N/A'
    };

    return this.executeAction(
      async () => {
        const { data, error } = await supabase.from('customers').insert([{
          id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          city: customer.city,
          is_vip: false,
          total_spent: 0,
          pending_amount: 0,
          total_jobs: 0
        }]).select();
        if (error) throw error;
        return mapCustomer(data[0]);
      },
      async () => {
        return MockDatabase.addCustomer(customer);
      },
      'addCustomer',
      newCust
    );
  }

  static async addRepair(repair: Omit<RepairJob, 'id' | 'receivedAt' | 'time' | 'remainingBalance' | 'billingItems' | 'paymentHistory' | 'timeline' | 'tests'>): Promise<RepairJob> {
    const newId = `R-${Date.now().toString().slice(-5)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const payload = { repair, newId, timeStr, dateStr };

    const result = await this.executeAction(
      async () => {
        const { data: repData, error } = await supabase.from('repairs').insert([{
          id: newId,
          type: repair.type,
          customer_id: repair.customerId,
          customer_name: repair.customerName,
          customer_phone: repair.customerPhone,
          device_brand: repair.device.brand,
          device_model: repair.device.model,
          device_color: repair.device.color,
          device_imei: repair.device.imei,
          device_serial: repair.device.serial,
          complaint: repair.complaint,
          status: repair.status,
          technician: repair.technician,
          received_at: dateStr,
          expected_delivery: repair.expectedDelivery,
          time: timeStr,
          estimated_cost: repair.estimatedCost,
          advance_paid: repair.advancePaid,
          remaining_balance: repair.estimatedCost - repair.advancePaid,
          accessories: repair.accessories,
          scratches: repair.condition.scratches,
          dents: repair.condition.dents,
          display_condition: repair.condition.display,
          back_glass_condition: repair.condition.backGlass,
          tests: [
            { name: 'Power', status: 'na' },
            { name: 'Display & Touch', status: 'na' },
            { name: 'Charging', status: 'na' },
            { name: 'Audio (Mic/Spk)', status: 'na' },
            { name: 'Camera (Front/Rear)', status: 'na' },
            { name: 'Wifi/Network', status: 'na' }
          ]
        }]).select();
        if (error) throw error;

        await supabase.from('timeline_events').insert([{
          repair_id: newId,
          status: 'Received',
          notes: 'Job initialized via New Repair flow',
          time: timeStr,
          date: dateStr,
          user_name: 'Vishal Sharma'
        }]);

        const { data: custData } = await supabase.from('customers').select('*').eq('id', repair.customerId).single();
        if (custData) {
          await supabase.from('customers').update({
            total_jobs: Number(custData.total_jobs) + 1,
            pending_amount: Number(custData.pending_amount) + (repair.estimatedCost - repair.advancePaid),
            last_visit: now.toISOString()
          }).eq('id', repair.customerId);
        }

        return mapRepair(repData[0], [], [], [{ status: 'Received', notes: 'Job initialized', time: timeStr, date: dateStr, user_name: 'Vishal Sharma' }]);
      },
      async () => {
        return MockDatabase.addRepair(repair);
      },
      'addRepair',
      payload
    );

    // Background automated dispatch
    this.sendAutomatedWhatsApp(result, 'intake');

    return result;
  }

  static async updateRepairStatus(id: string, newStatus: RepairJob['status'], notes?: string): Promise<RepairJob | undefined> {
    const payload = { id, newStatus, notes };
    const result = await this.executeAction(
      async () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const { error } = await supabase.from('repairs').update({ status: newStatus }).eq('id', id);
        if (error) throw error;

        await supabase.from('timeline_events').insert([{
          repair_id: id,
          status: newStatus,
          notes: notes || `Repair status updated to ${newStatus}`,
          time: timeStr,
          date: dateStr,
          user_name: 'Vikram S.'
        }]);

        const repairs = await this.getRepairs();
        return repairs.find(r => r.id === id);
      },
      async () => {
        return MockDatabase.updateRepairStatus(id, newStatus, notes);
      },
      'updateRepairStatus',
      payload
    );

    // Background automated dispatch if completed or ready for collection
    if (result && (newStatus === 'Completed' || newStatus === 'Ready')) {
      this.sendAutomatedWhatsApp(result, 'ready');
    }

    return result;
  }

  static async addBillingItem(repairId: string, item: Omit<BillingItem, 'id'>): Promise<RepairJob | undefined> {
    const payload = { repairId, item };
    return this.executeAction(
      async () => {
        const itemId = `BILL-${Date.now().toString().slice(-4)}`;
        const newItem = {
          id: itemId,
          repair_id: repairId,
          name: item.name,
          description: item.description,
          amount: item.amount
        };

        const { error } = await supabase.from('billing_items').insert([newItem]);
        if (error) throw error;

        const { data: rep } = await supabase.from('repairs').select('*').eq('id', repairId).single();
        const { data: items } = await supabase.from('billing_items').select('*').eq('repair_id', repairId);
        if (rep && items) {
          const newTotal = items.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
          const newBalance = newTotal - Number(rep.advance_paid);

          await supabase.from('repairs').update({
            estimated_cost: newTotal,
            remaining_balance: newBalance
          }).eq('id', repairId);

          const { data: custData } = await supabase.from('customers').select('*').eq('id', rep.customer_id).single();
          if (custData) {
            await supabase.from('customers').update({
              pending_amount: Number(custData.pending_amount) + (newBalance - Number(rep.remaining_balance))
            }).eq('id', rep.customer_id);
          }
        }

        const repairs = await this.getRepairs();
        return repairs.find(r => r.id === repairId);
      },
      async () => {
        return MockDatabase.addBillingItem(repairId, item);
      },
      'addBillingItem',
      payload
    );
  }

  static async addPayment(repairId: string, payment: Omit<PaymentItem, 'date' | 'time'>): Promise<RepairJob | undefined> {
    const payload = { repairId, payment };
    return this.executeAction(
      async () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const newPayment = {
          repair_id: repairId,
          amount: payment.amount,
          method: payment.method,
          time: timeStr,
          date: dateStr
        };

        const { error } = await supabase.from('payments').insert([newPayment]);
        if (error) throw error;

        const { data: rep } = await supabase.from('repairs').select('*').eq('id', repairId).single();
        if (rep) {
          const newAdvance = Number(rep.advance_paid) + payment.amount;
          const newBalance = Number(rep.estimated_cost) - newAdvance;

          await supabase.from('repairs').update({
            advance_paid: newAdvance,
            remaining_balance: newBalance
          }).eq('id', repairId);

          const { data: custData } = await supabase.from('customers').select('*').eq('id', rep.customer_id).single();
          if (custData) {
            await supabase.from('customers').update({
              total_spent: Number(custData.total_spent) + payment.amount,
              pending_amount: Math.max(0, Number(custData.pending_amount) - payment.amount)
            }).eq('id', rep.customer_id);
          }

          await supabase.from('timeline_events').insert([{
            repair_id: repairId,
            status: rep.status,
            notes: `Payment of ₹${payment.amount} received via ${payment.method}`,
            time: timeStr,
            date: dateStr,
            user_name: 'Vishal Sharma'
          }]);
        }

        const repairs = await this.getRepairs();
        return repairs.find(r => r.id === repairId);
      },
      async () => {
        return MockDatabase.addPayment(repairId, payment);
      },
      'addPayment',
      payload
    );
  }

  static async consumeInventory(itemId: string, qty: number): Promise<boolean> {
    const payload = { itemId, qty };
    return this.executeAction(
      async () => {
        await this.performCloudConsumeInventory(itemId, qty);
        return true;
      },
      async () => {
        return MockDatabase.consumeInventory(itemId, qty);
      },
      'consumeInventory',
      payload
    );
  }

  static async adjustStock(itemId: string, qty: number, reason: string): Promise<boolean> {
    const payload = { itemId, qty, reason };
    return this.executeAction(
      async () => {
        await this.performCloudAdjustStock(itemId, qty, reason);
        return true;
      },
      async () => {
        return MockDatabase.adjustStock(itemId, qty, reason);
      },
      'adjustStock',
      payload
    );
  }

  static async moveInventory(
    itemId: string,
    quantity: number,
    fromLocation: string,
    toLocation: string,
    reason: string,
    notes?: string,
    performedBy: string = 'Operator'
  ): Promise<boolean> {
    const payload = { itemId, quantity, fromLocation, toLocation, reason, notes, performedBy };
    return this.executeAction(
      async () => {
        await this.performCloudMoveInventory(itemId, quantity, fromLocation, toLocation, reason, notes, performedBy);
        return true;
      },
      async () => {
        return MockDatabase.moveInventory(itemId, quantity, fromLocation, toLocation, reason, notes, performedBy);
      },
      'moveInventory',
      payload
    );
  }

  static async saveRepairDiagnosis(id: string, diagnosis: { observedIssue: string; rootCause: string; notes: string }): Promise<boolean> {
    const payload = { id, diagnosis };
    return this.executeAction(
      async () => {
        await this.performCloudSaveRepairDiagnosis(id, diagnosis);
        return true;
      },
      async () => {
        const list = MockDatabase.getRepairs();
        const idx = list.findIndex(r => r.id === id);
        if (idx !== -1) {
          list[idx].diagnosis = diagnosis;
          MockDatabase.saveRepairs(list);
          return true;
        }
        return false;
      },
      'saveRepairDiagnosis',
      payload
    );
  }

  static async saveRepairTests(id: string, tests: any[]): Promise<boolean> {
    const payload = { id, tests };
    return this.executeAction(
      async () => {
        await this.performCloudSaveRepairTests(id, tests);
        return true;
      },
      async () => {
        const list = MockDatabase.getRepairs();
        const idx = list.findIndex(r => r.id === id);
        if (idx !== -1) {
          list[idx].tests = tests;
          MockDatabase.saveRepairs(list);
          return true;
        }
        return false;
      },
      'saveRepairTests',
      payload
    );
  }

  static async addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> {
    const id = `SUP-${Date.now().toString().slice(-3)}`;
    const newSupplier = {
      ...supplier,
      id,
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    return this.executeAction(
      async () => {
        const { data, error } = await supabase.from('suppliers').insert([{
          id,
          name: supplier.name,
          contact_person: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email,
          city: supplier.city
        }]).select();
        if (error) throw error;
        return mapSupplier(data[0]);
      },
      async () => {
        return MockDatabase.addSupplier(supplier);
      },
      'addSupplier',
      newSupplier
    );
  }

  static async deleteSupplier(supplierId: string): Promise<boolean> {
    return this.executeAction(
      async () => {
        await this.performCloudDeleteSupplier(supplierId);
        return true;
      },
      async () => {
        return MockDatabase.deleteSupplier(supplierId);
      },
      'deleteSupplier',
      supplierId
    );
  }

  static async addInventoryItem(item: Omit<InventoryItem, 'id' | 'status' | 'reserved' | 'available'>): Promise<InventoryItem> {
    const id = `INV-${Date.now().toString().slice(-3)}`;
    const status = (item.stock <= 0 ? 'Out of Stock' : (item.stock <= 5 ? 'Low Stock' : 'In Stock')) as InventoryItem['status'];
    const newInvItem = {
      ...item,
      id,
      status,
      reserved: 0,
      available: item.stock
    };

    return this.executeAction(
      async () => {
        await this.performCloudAddInventoryItem(newInvItem);
        return newInvItem;
      },
      async () => {
        return MockDatabase.addInventoryItem(item);
      },
      'addInventoryItem',
      newInvItem
    );
  }

  static async editInventoryItem(itemId: string, updates: Partial<Omit<InventoryItem, 'id' | 'reserved' | 'available'>>): Promise<boolean> {
    const payload = { itemId, updates };
    return this.executeAction(
      async () => {
        await this.performCloudEditInventoryItem(itemId, updates);
        return true;
      },
      async () => {
        return MockDatabase.editInventoryItem(itemId, updates);
      },
      'editInventoryItem',
      payload
    );
  }

  static async deleteInventoryItem(itemId: string): Promise<boolean> {
    return this.executeAction(
      async () => {
        await this.performCloudDeleteInventoryItem(itemId);
        return true;
      },
      async () => {
        return MockDatabase.deleteInventoryItem(itemId);
      },
      'deleteInventoryItem',
      itemId
    );
  }

  static async updateCustomer(
    id: string, 
    updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'pendingAmount' | 'totalJobs' | 'lastVisit'>>
  ): Promise<boolean> {
    const payload = { id, updates };
    return this.executeAction(
      async () => {
        const { error } = await supabase.from('customers').update({
          name: updates.name,
          phone: updates.phone,
          email: updates.email,
          city: updates.city
        }).eq('id', id);
        if (error) throw error;
        return true;
      },
      async () => {
        return MockDatabase.updateCustomer(id, updates);
      },
      'updateCustomer',
      payload
    );
  }

  static async getActivities(): Promise<ActivityLog[]> {
    return this.executeAction(
      async () => {
        const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        const mapped = data.map(db => ({
          id: db.id,
          time: db.time,
          date: db.date,
          type: db.type as ActivityLog['type'],
          description: db.description
        }));
        localStorage.setItem('cache_activities', JSON.stringify(mapped));
        return mapped;
      },
      async () => {
        const cache = localStorage.getItem('cache_activities');
        if (cache) return JSON.parse(cache);
        return MockDatabase.getActivities();
      },
      'getActivities',
      null,
      false
    );
  }

  static async sendAutomatedWhatsApp(job: RepairJob, type: 'intake' | 'ready') {
    const gateway = localStorage.getItem('cfg_wa_gateway') || 'Meta Cloud API';
    
    let phoneClean = (job.customerPhone || '').replace(/\D/g, '');
    if (phoneClean.length === 10) {
      phoneClean = '91' + phoneClean;
    }
    
    const trackingUrl = `${window.location.origin}/`;
    const deviceDetails = `${job.device.brand} ${job.device.model} (${job.device.color || 'No Color'})`;
    const advancePaidStr = job.advancePaid > 0 ? `Advance Paid: ₹${job.advancePaid}` : '';

    // 1. Meta Cloud API Dispatch
    if (gateway === 'Meta Cloud API') {
      const phoneId = localStorage.getItem('cfg_wa_phone_number_id');
      const token = localStorage.getItem('cfg_wa_access_token');
      if (!phoneId || !token) return;

      const tplIntake = localStorage.getItem('cfg_wa_tpl_intake') || 'repair_intake_alert';
      const tplReady = localStorage.getItem('cfg_wa_tpl_ready') || 'repair_ready_alert';
      const activeTemplate = type === 'intake' ? tplIntake : tplReady;
      
      let parameters: any[] = [];
      if (type === 'intake') {
        parameters = [
          { type: 'text', text: job.customerName },
          { type: 'text', text: deviceDetails },
          { type: 'text', text: job.id },
          { type: 'text', text: advancePaidStr || 'No Advance Payment' },
          { type: 'text', text: trackingUrl }
        ];
      } else {
        parameters = [
          { type: 'text', text: job.customerName },
          { type: 'text', text: deviceDetails },
          { type: 'text', text: job.id },
          { type: 'text', text: String(job.estimatedCost) },
          { type: 'text', text: String(job.advancePaid) },
          { type: 'text', text: String(job.remainingBalance) },
          { type: 'text', text: trackingUrl }
        ];
      }

      try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneClean,
            type: 'template',
            template: {
              name: activeTemplate,
              language: { code: 'en_US' },
              components: [
                {
                  type: 'body',
                  parameters: parameters
                }
              ]
            }
          })
        });
        
        const resData = await response.json();
        if (!response.ok) {
          console.error('Automated WhatsApp Meta API error:', resData);
        } else {
          console.log('Automated WhatsApp message sent successfully via Meta API', resData.messages?.[0]?.id);
        }
      } catch (err) {
        console.error('Automated WhatsApp send failed:', err);
      }
    }
    
    // 2. Custom Webhook API Dispatch
    if (gateway === 'Custom Webhook') {
      const customUrl = localStorage.getItem('cfg_wa_custom_url');
      const customToken = localStorage.getItem('cfg_wa_custom_token');
      if (!customUrl) return;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (customToken) {
        headers['Authorization'] = customToken.startsWith('Bearer') || customToken.startsWith('Key')
          ? customToken
          : `Bearer ${customToken}`;
      }

      try {
        const response = await fetch(customUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            recipient: phoneClean,
            type: type,
            jobId: job.id,
            customerName: job.customerName,
            device: deviceDetails,
            advancePaid: job.advancePaid,
            estimatedCost: job.estimatedCost,
            remainingBalance: job.remainingBalance,
            complaint: job.complaint,
            trackingUrl: trackingUrl
          })
        });

        if (!response.ok) {
          const errMsg = await response.text();
          console.error('Automated WhatsApp Webhook error status:', response.status, errMsg);
        } else {
          console.log('Automated WhatsApp message sent successfully via Custom Webhook');
        }
      } catch (err) {
        console.error('Automated WhatsApp Webhook send failed:', err);
      }
    }
  }

  static async clearAllData() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('timeline_events').delete().neq('id', '0');
        await supabase.from('billing_items').delete().neq('id', '0');
        await supabase.from('payments').delete().neq('id', '0');
        await supabase.from('repairs').delete().neq('id', '0');
        await supabase.from('inventory').delete().neq('id', '0');
        await supabase.from('customers').delete().neq('id', '0');
        await supabase.from('suppliers').delete().neq('id', '0');
      } catch (e) {
        console.error('Cloud clear error', e);
      }
    }
    MockDatabase.clearAllData();
  }
}

// Initialize adapter states
DatabaseService.initQueue();

// Register browser sync listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    DatabaseService.offline = false;
    DatabaseService.syncOfflineChanges();
  });
  window.addEventListener('offline', () => {
    DatabaseService.offline = true;
    DatabaseService.notifySyncStatus();
  });

  // Check periodically
  setInterval(() => {
    if (navigator.onLine) {
      DatabaseService.syncOfflineChanges();
    }
  }, 12000);
}
