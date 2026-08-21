import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { STORE_CONFIG, KDS_STATIONS, MODIFIER_GROUPS, INITIAL_PRODUCTS } from './src/data/menuData';
import { INITIAL_CATEGORIES, INITIAL_STAFF_USERS, PERMISSION_DEFINITIONS } from './src/data/adminData';
import { INITIAL_MERCHANTS, INITIAL_STORES } from './src/data/merchantStoreData';
import { INITIAL_INVENTORY_ITEMS, INITIAL_INVENTORY_LOGS } from './src/data/inventoryData';
import { 
  OrderMaster, 
  OrderItem, 
  SelectedModifier, 
  QueueSummary, 
  MenuCategory, 
  StaffUser, 
  ProductSKU, 
  MerchantAccount, 
  StoreEntity, 
  InventoryItem, 
  InventoryLog,
  CurrencyCode
} from './src/types';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// In-Memory Database & State Management
let dailySequenceCount = 0;
let ordersDb: OrderMaster[] = [];
let soldOutSkuIds = new Set<string>();
let productsDb: ProductSKU[] = [...INITIAL_PRODUCTS];
let categoriesDb: MenuCategory[] = [...INITIAL_CATEGORIES];
let staffUsersDb: StaffUser[] = [...INITIAL_STAFF_USERS];
let merchantsDb: MerchantAccount[] = [...INITIAL_MERCHANTS];
let storesDb: StoreEntity[] = [...INITIAL_STORES];
let inventoryDb: InventoryItem[] = [...INITIAL_INVENTORY_ITEMS];
let inventoryLogsDb: InventoryLog[] = [...INITIAL_INVENTORY_LOGS];
let currentStoreConfig = { ...STORE_CONFIG };

// Helper to calculate daily pickup code
function generatePickupCode(channel: string = 'QR_H5'): string {
  dailySequenceCount += 1;
  const prefix = channel === 'DELIVERY_AGGREGATOR' ? 'B' : channel === 'COUNTER_POS' ? 'C' : 'A';
  const numStr = dailySequenceCount.toString().padStart(3, '0');
  return `${prefix}${numStr}`;
}

// WebSocket Server
const wss = new WebSocketServer({ server });

function broadcastWSEvent(type: string, payload: any) {
  const message = JSON.stringify({
    type,
    payload,
    timestamp: Date.now(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('WebSocket send error:', err);
      }
    }
  });
}

wss.on('connection', (ws) => {
  const summary = calculateQueueSummary();
  ws.send(JSON.stringify({
    type: 'QUEUE_UPDATE',
    payload: summary,
    timestamp: Date.now()
  }));
});

function calculateQueueSummary(): QueueSummary {
  const activeOrders = ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING');
  const readyOrders = ordersDb.filter(o => o.status === 'READY');
  const completedToday = ordersDb.filter(o => o.status === 'COMPLETED').length;

  let totalWaitingItems = 0;
  activeOrders.forEach(o => {
    o.items.forEach(i => {
      if (i.stationStatus !== 'DONE') totalWaitingItems += i.quantity;
    });
  });

  const callingCodes = readyOrders.map(o => o.pickupCode);

  return {
    waitingCups: totalWaitingItems,
    makingOrdersCount: activeOrders.length,
    readyOrdersCount: readyOrders.length,
    completedTodayCount: completedToday,
    avgWaitTimeMinutes: Math.max(3, Math.ceil(totalWaitingItems * 1.8)),
    currentCallingCodes: callingCodes,
  };
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// 1. Get Store Menu & Metadata (Store Isolated)
app.get('/api/menu', (req, res) => {
  const storeId = (req.query.storeId as string) || currentStoreConfig.storeId || 'store_default_01';
  
  // Filter products by storeId or default
  const storeProducts = productsDb.filter(p => !p.storeId || p.storeId === storeId);
  const storeCategories = categoriesDb.filter(c => !c.storeId || c.storeId === storeId);

  const productsWithStatus = storeProducts.map(p => ({
    ...p,
    isSoldOut: soldOutSkuIds.has(p.id)
  }));

  const categoriesWithCounts = storeCategories.map(c => ({
    ...c,
    productCount: storeProducts.filter(p => p.category === c.name).length
  }));

  const targetStore = storesDb.find(s => s.id === storeId) || storesDb[0];

  res.json({
    store: {
      ...currentStoreConfig,
      storeId: targetStore ? targetStore.id : storeId,
      storeName: targetStore ? targetStore.storeName : currentStoreConfig.storeName,
      currency: targetStore ? targetStore.currency : 'EUR',
      defaultCurrency: targetStore ? targetStore.currencySymbol : '€',
      address: targetStore ? targetStore.address : currentStoreConfig.address,
    },
    stations: KDS_STATIONS,
    modifierGroups: MODIFIER_GROUPS,
    categories: categoriesWithCounts,
    products: productsWithStatus,
    queue: calculateQueueSummary(),
  });
});

// -------------------------------------------------------------
// SaaS Vendor: Merchant Management Endpoints
// -------------------------------------------------------------
app.get('/api/admin/merchants', (req, res) => {
  // Calculate dynamic revenue for merchants based on their assigned stores
  const merchantsWithStats = merchantsDb.map(m => {
    const assignedStores = storesDb.filter(s => m.assignedStoreIds.includes(s.id));
    const storeOrders = ordersDb.filter(o => m.assignedStoreIds.includes(o.storeId) && o.paymentStatus === 'PAID');
    const totalRev = storeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      ...m,
      assignedStoresCount: m.assignedStoreIds.length,
      assignedStoresList: assignedStores,
      totalOrdersCount: storeOrders.length,
      calculatedRevenue: totalRev,
    };
  });
  res.json({ merchants: merchantsWithStats });
});

app.post('/api/admin/merchants', (req, res) => {
  try {
    const { name, contactPerson, email, phone, plan = 'STANDARD', notes = '', customDomain = '', assignedStoreIds = [] } = req.body;
    if (!name || !contactPerson || !email) {
      return res.status(400).json({ error: 'Name, contact person and email are required' });
    }

    const newMerchant: MerchantAccount = {
      id: `merchant_${Date.now()}`,
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      status: 'ACTIVE',
      assignedStoreIds: Array.isArray(assignedStoreIds) ? assignedStoreIds : [],
      plan,
      customDomain: (customDomain || '').trim(),
      createdAt: Date.now(),
      notes,
      totalRevenue: 0,
    };

    merchantsDb.unshift(newMerchant);

    // Update stores assigned to this merchant
    if (newMerchant.assignedStoreIds.length > 0) {
      storesDb.forEach(s => {
        if (newMerchant.assignedStoreIds.includes(s.id)) {
          s.merchantId = newMerchant.id;
          s.merchantName = newMerchant.name;
        }
      });
    }

    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({ success: true, merchant: newMerchant, merchants: merchantsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/merchants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const merchant = merchantsDb.find(m => m.id === id);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    const { name, contactPerson, email, phone, status, plan, notes, customDomain, assignedStoreIds } = req.body;
    if (name !== undefined) merchant.name = name.trim();
    if (contactPerson !== undefined) merchant.contactPerson = contactPerson.trim();
    if (email !== undefined) merchant.email = email.trim();
    if (phone !== undefined) merchant.phone = phone.trim();
    if (status !== undefined) merchant.status = status;
    if (plan !== undefined) merchant.plan = plan;
    if (notes !== undefined) merchant.notes = notes;
    if (customDomain !== undefined) merchant.customDomain = customDomain.trim();

    if (assignedStoreIds !== undefined && Array.isArray(assignedStoreIds)) {
      merchant.assignedStoreIds = assignedStoreIds;
      // Sync store links
      storesDb.forEach(s => {
        if (assignedStoreIds.includes(s.id)) {
          s.merchantId = merchant.id;
          s.merchantName = merchant.name;
        } else if (s.merchantId === merchant.id) {
          // Unassigned
          s.merchantId = '';
          s.merchantName = '未分配商家';
        }
      });
    }

    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({ success: true, merchant, merchants: merchantsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/merchants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const idx = merchantsDb.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Merchant not found' });

    const [deleted] = merchantsDb.splice(idx, 1);
    // Unlink stores
    storesDb.forEach(s => {
      if (s.merchantId === id) {
        s.merchantId = '';
        s.merchantName = '未分配商家';
      }
    });

    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({ success: true, deleted, merchants: merchantsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SaaS Vendor: Store Management & Allocation Endpoints
// -------------------------------------------------------------
app.get('/api/admin/stores', (req, res) => {
  const storesWithStats = storesDb.map(s => {
    const merchant = merchantsDb.find(m => m.id === s.merchantId);
    const storeOrders = ordersDb.filter(o => o.storeId === s.id && o.paymentStatus === 'PAID');
    const totalRev = storeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      ...s,
      merchantName: merchant ? merchant.name : (s.merchantName || '未分配商家'),
      totalOrdersCount: storeOrders.length,
      totalRevenue: totalRev,
    };
  });
  res.json({ stores: storesWithStats });
});

app.post('/api/admin/stores', (req, res) => {
  try {
    const { storeName, currency = 'EUR', address = '', phone = '', operatingHours = '09:00 - 22:30', merchantId = '', customDomain = '' } = req.body;
    if (!storeName || !storeName.trim()) {
      return res.status(400).json({ error: 'Store name is required' });
    }

    const currencySymbols: Record<CurrencyCode, string> = {
      EUR: '€',
      CZK: 'Kč',
      HUF: 'Ft',
      PLN: 'zł',
    };

    const assignedMerchant = merchantsDb.find(m => m.id === merchantId);

    const newStore: StoreEntity = {
      id: `store_${Date.now()}`,
      merchantId: merchantId || '',
      merchantName: assignedMerchant ? assignedMerchant.name : '未分配商家',
      storeName: storeName.trim(),
      currency: currency as CurrencyCode,
      currencySymbol: currencySymbols[currency as CurrencyCode] || '€',
      address: address.trim(),
      phone: phone.trim(),
      operatingHours: operatingHours.trim(),
      status: 'OPEN',
      customDomain: (customDomain || '').trim(),
      createdAt: Date.now(),
    };

    storesDb.push(newStore);

    if (assignedMerchant && !assignedMerchant.assignedStoreIds.includes(newStore.id)) {
      assignedMerchant.assignedStoreIds.push(newStore.id);
    }

    broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
    res.json({ success: true, store: newStore, stores: storesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/stores/:id', (req, res) => {
  try {
    const { id } = req.params;
    const store = storesDb.find(s => s.id === id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const { storeName, currency, address, phone, operatingHours, status, merchantId, customDomain } = req.body;
    if (storeName !== undefined) store.storeName = storeName.trim();
    if (currency !== undefined) {
      store.currency = currency;
      store.currencySymbol = currency === 'CZK' ? 'Kč' : currency === 'HUF' ? 'Ft' : currency === 'PLN' ? 'zł' : '€';
    }
    if (address !== undefined) store.address = address.trim();
    if (phone !== undefined) store.phone = phone.trim();
    if (operatingHours !== undefined) store.operatingHours = operatingHours.trim();
    if (status !== undefined) store.status = status;
    if (customDomain !== undefined) store.customDomain = customDomain.trim();

    if (merchantId !== undefined && merchantId !== store.merchantId) {
      // Remove from old merchant
      const oldMerchant = merchantsDb.find(m => m.id === store.merchantId);
      if (oldMerchant) {
        oldMerchant.assignedStoreIds = oldMerchant.assignedStoreIds.filter(sid => sid !== store.id);
      }
      // Add to new merchant
      store.merchantId = merchantId;
      const newMerchant = merchantsDb.find(m => m.id === merchantId);
      if (newMerchant) {
        store.merchantName = newMerchant.name;
        if (!newMerchant.assignedStoreIds.includes(store.id)) {
          newMerchant.assignedStoreIds.push(store.id);
        }
      } else {
        store.merchantName = '未分配商家';
      }
    }

    broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
    res.json({ success: true, store, stores: storesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Domain Routing / Tenant Resolution by Domain / Hostname
app.get('/api/tenant/resolve', (req, res) => {
  const host = (req.query.host as string) || req.headers.host || '';
  const cleanHost = host.split(':')[0].toLowerCase().trim();

  // 1. Check if matches a store custom domain directly
  const matchedStore = storesDb.find(
    s => s.customDomain && s.customDomain.toLowerCase() === cleanHost
  );
  if (matchedStore) {
    const merchant = merchantsDb.find(m => m.id === matchedStore.merchantId);
    return res.json({
      matched: true,
      type: 'STORE',
      store: matchedStore,
      merchant: merchant || null,
      host: cleanHost,
    });
  }

  // 2. Check if matches a merchant custom domain
  const matchedMerchant = merchantsDb.find(
    m => m.customDomain && m.customDomain.toLowerCase() === cleanHost
  );
  if (matchedMerchant) {
    const merchantStores = storesDb.filter(s => matchedMerchant.assignedStoreIds.includes(s.id));
    return res.json({
      matched: true,
      type: 'MERCHANT',
      merchant: matchedMerchant,
      stores: merchantStores,
      defaultStore: merchantStores[0] || null,
      host: cleanHost,
    });
  }

  // 3. Fallback default
  res.json({
    matched: false,
    type: 'DEFAULT',
    defaultStore: storesDb[0] || null,
    host: cleanHost,
  });
});

app.post('/api/admin/stores/:id/assign', (req, res) => {
  try {
    const { id } = req.params;
    const { merchantId } = req.body;
    const store = storesDb.find(s => s.id === id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    // Remove from old
    if (store.merchantId) {
      const oldMerchant = merchantsDb.find(m => m.id === store.merchantId);
      if (oldMerchant) {
        oldMerchant.assignedStoreIds = oldMerchant.assignedStoreIds.filter(sid => sid !== store.id);
      }
    }

    store.merchantId = merchantId || '';
    const newMerchant = merchantsDb.find(m => m.id === merchantId);
    if (newMerchant) {
      store.merchantName = newMerchant.name;
      if (!newMerchant.assignedStoreIds.includes(store.id)) {
        newMerchant.assignedStoreIds.push(store.id);
      }
    } else {
      store.merchantName = '未分配商家';
    }

    broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({ success: true, store, stores: storesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/stores/:id', (req, res) => {
  try {
    const { id } = req.params;
    const storeIdx = storesDb.findIndex(s => s.id === id);
    if (storeIdx === -1) return res.status(404).json({ error: 'Store not found' });

    const [deleted] = storesDb.splice(storeIdx, 1);
    // Unassign from merchant
    if (deleted.merchantId) {
      const merchant = merchantsDb.find(m => m.id === deleted.merchantId);
      if (merchant) {
        merchant.assignedStoreIds = merchant.assignedStoreIds.filter(sid => sid !== id);
      }
    }

    broadcastWSEvent('STORES_UPDATED', { stores: storesDb });
    broadcastWSEvent('MERCHANTS_UPDATED', { merchants: merchantsDb });
    res.json({ success: true, deleted, stores: storesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Store Manager: Ingredient Raw Material Inventory Endpoints
// -------------------------------------------------------------
app.get('/api/admin/inventory', (req, res) => {
  const { storeId } = req.query;
  let items = [...inventoryDb];
  if (storeId) {
    items = items.filter(i => i.storeId === storeId);
  }
  res.json({ inventory: items, logs: inventoryLogsDb.slice(0, 50) });
});

app.post('/api/admin/inventory/adjust', (req, res) => {
  try {
    const { itemId, type, delta = 0, targetBalance, operator = '店长', notes = '' } = req.body;
    const item = inventoryDb.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });

    const numDelta = Number(delta);
    let oldBalance = item.currentStock;
    let newBalance = oldBalance;

    if (type === 'RESTOCK') {
      newBalance = oldBalance + Math.abs(numDelta);
    } else if (type === 'CONSUME' || type === 'WASTE') {
      newBalance = Math.max(0, oldBalance - Math.abs(numDelta));
    } else if (type === 'CALIBRATE' && targetBalance !== undefined) {
      newBalance = Number(targetBalance);
    }

    item.currentStock = Number(newBalance.toFixed(2));
    item.lastUpdated = Date.now();

    // Recalculate status
    if (item.currentStock <= item.minThreshold * 0.5) {
      item.status = 'CRITICAL';
    } else if (item.currentStock <= item.minThreshold) {
      item.status = 'LOW';
    } else {
      item.status = 'SUFFICIENT';
    }

    const log: InventoryLog = {
      id: `log_${Date.now()}`,
      storeId: item.storeId,
      itemId: item.id,
      itemName: item.name,
      type,
      quantityDelta: Number((newBalance - oldBalance).toFixed(2)),
      balance: item.currentStock,
      operator,
      timestamp: Date.now(),
      notes,
    };

    inventoryLogsDb.unshift(log);

    broadcastWSEvent('INVENTORY_UPDATED', { inventory: inventoryDb, latestLog: log });
    res.json({ success: true, item, log, inventory: inventoryDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/inventory/create', (req, res) => {
  try {
    const { storeId = 'store_bratislava_01', name, category = 'TEA', categoryName = '茶底原叶', currentStock = 10, unit = 'kg', minThreshold = 5, costPerUnit = 20 } = req.body;
    if (!name) return res.status(400).json({ error: 'Item name is required' });

    const newItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      storeId,
      name: name.trim(),
      category,
      categoryName,
      currentStock: Number(currentStock),
      unit,
      minThreshold: Number(minThreshold),
      costPerUnit: Number(costPerUnit),
      lastUpdated: Date.now(),
      status: Number(currentStock) <= Number(minThreshold) ? 'LOW' : 'SUFFICIENT',
    };

    inventoryDb.unshift(newItem);
    broadcastWSEvent('INVENTORY_UPDATED', { inventory: inventoryDb });
    res.json({ success: true, item: newItem, inventory: inventoryDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Merchant & Store Manager: Multi-dimension Analytics API
// -------------------------------------------------------------
app.get('/api/admin/analytics/sales', (req, res) => {
  const { storeId, merchantId, timeRange, startDate, endDate, category } = req.query;
  const now = new Date();
  const dayMs = 86400000;

  let filteredOrders = ordersDb.filter(o => o.paymentStatus === 'PAID');

  // 1. Filter by merchantId (if specified, filter orders from stores belonging to this merchant)
  if (merchantId && merchantId !== 'ALL') {
    const merchant = merchantsDb.find(m => m.id === merchantId);
    if (merchant && Array.isArray(merchant.assignedStoreIds)) {
      filteredOrders = filteredOrders.filter(o => merchant.assignedStoreIds.includes(o.storeId));
    } else {
      // Fallback: match store's merchantId
      const merchantStoreIds = storesDb.filter(s => s.merchantId === merchantId).map(s => s.id);
      filteredOrders = filteredOrders.filter(o => merchantStoreIds.includes(o.storeId));
    }
  }

  // 2. Filter by storeId
  if (storeId && storeId !== 'ALL') {
    filteredOrders = filteredOrders.filter(o => o.storeId === storeId);
  }

  // 3. Filter by date range or preset (default to current month)
  if (startDate && endDate) {
    // Exact date range
    const start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    filteredOrders = filteredOrders.filter(o => o.createdAt >= start.getTime() && o.createdAt <= end.getTime());
  } else if (timeRange === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    filteredOrders = filteredOrders.filter(o => o.createdAt >= startOfToday.getTime());
  } else if (timeRange === 'yesterday') {
    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    filteredOrders = filteredOrders.filter(o => o.createdAt >= startOfYesterday.getTime() && o.createdAt <= endOfYesterday.getTime());
  } else if (timeRange === 'last7') {
    filteredOrders = filteredOrders.filter(o => o.createdAt >= Date.now() - 7 * dayMs);
  } else if (timeRange === 'last30') {
    filteredOrders = filteredOrders.filter(o => o.createdAt >= Date.now() - 30 * dayMs);
  } else if (timeRange === 'all') {
    // All history
  } else {
    // Default: Current month (当月 1 号 00:00 到当月末 23:59)
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    filteredOrders = filteredOrders.filter(o => o.createdAt >= firstDayOfMonth.getTime() && o.createdAt <= lastDayOfMonth.getTime());
  }

  // Aggregate Metrics
  let totalRevenue = 0;
  let cashIncome = 0;
  let cardIncome = 0;
  let totalItemsSold = 0;

  const productSalesMap: Record<string, {
    skuId: string;
    productName: string;
    category: string;
    volume: number;
    revenue: number;
  }> = {};

  // Hourly stats for today
  const hourlyOrders: Record<number, { hour: string; count: number; revenue: number }> = {};
  for (let h = 8; h <= 23; h++) {
    hourlyOrders[h] = { hour: `${h.toString().padStart(2, '0')}:00`, count: 0, revenue: 0 };
  }

  filteredOrders.forEach(ord => {
    totalRevenue += ord.totalAmount;
    if (ord.paymentMethod === 'CASH') {
      cashIncome += ord.totalAmount;
    } else {
      cardIncome += ord.totalAmount;
    }

    const orderHour = new Date(ord.createdAt).getHours();
    if (hourlyOrders[orderHour]) {
      hourlyOrders[orderHour].count += 1;
      hourlyOrders[orderHour].revenue += ord.totalAmount;
    }

    ord.items.forEach(item => {
      totalItemsSold += item.quantity;
      if (!productSalesMap[item.skuId]) {
        productSalesMap[item.skuId] = {
          skuId: item.skuId,
          productName: item.productName,
          category: item.category,
          volume: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.skuId].volume += item.quantity;
      productSalesMap[item.skuId].revenue += item.totalPrice;
    });
  });

  let productRankings = Object.values(productSalesMap);
  if (category && category !== 'ALL') {
    productRankings = productRankings.filter(p => p.category === category);
  }

  productRankings.sort((a, b) => b.volume - a.volume);

  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  res.json({
    metrics: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders: filteredOrders.length,
      avgOrderValue: Number(avgOrderValue.toFixed(2)),
      cashIncome: Number(cashIncome.toFixed(2)),
      cardIncome: Number(cardIncome.toFixed(2)),
      totalItemsSold,
    },
    hourlyTrend: Object.values(hourlyOrders),
    productRankings,
  });
});

// Categories Management
app.get('/api/admin/categories', (req, res) => {
  const storeId = req.query.storeId as string;
  let filteredCategories = [...categoriesDb];
  if (storeId) {
    filteredCategories = filteredCategories.filter(c => !c.storeId || c.storeId === storeId);
  }
  const categoriesWithCounts = filteredCategories.map(c => ({
    ...c,
    productCount: productsDb.filter(p => p.category === c.name && (!storeId || !p.storeId || p.storeId === storeId)).length
  }));
  res.json({ categories: categoriesWithCounts });
});

app.post('/api/admin/categories', (req, res) => {
  try {
    const { name, icon = 'CupSoda', sortOrder = categoriesDb.length + 1, storeId = 'store_default_01' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const newCategory: MenuCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      storeId,
      name: name.trim(),
      icon,
      sortOrder: Number(sortOrder) || categoriesDb.length + 1,
      isActive: true,
      productCount: 0,
    };
    categoriesDb.push(newCategory);
    categoriesDb.sort((a, b) => a.sortOrder - b.sortOrder);

    broadcastWSEvent('CATEGORIES_UPDATED', { categories: categoriesDb });
    res.json({ success: true, category: newCategory, categories: categoriesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, sortOrder, isActive, storeId } = req.body;
    const cat = categoriesDb.find(c => c.id === id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const oldName = cat.name;
    if (name !== undefined) cat.name = name.trim();
    if (icon !== undefined) cat.icon = icon;
    if (sortOrder !== undefined) cat.sortOrder = Number(sortOrder);
    if (isActive !== undefined) cat.isActive = Boolean(isActive);
    if (storeId !== undefined) cat.storeId = storeId;

    if (name && name.trim() !== oldName) {
      productsDb.forEach(p => {
        if (p.category === oldName && (!cat.storeId || !p.storeId || p.storeId === cat.storeId)) {
          p.category = name.trim();
        }
      });
    }

    categoriesDb.sort((a, b) => a.sortOrder - b.sortOrder);
    broadcastWSEvent('CATEGORIES_UPDATED', { categories: categoriesDb });
    broadcastWSEvent('MENU_UPDATED', { products: productsDb });
    res.json({ success: true, category: cat, categories: categoriesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const catIndex = categoriesDb.findIndex(c => c.id === id);
    if (catIndex === -1) return res.status(404).json({ error: 'Category not found' });

    const [deleted] = categoriesDb.splice(catIndex, 1);
    broadcastWSEvent('CATEGORIES_UPDATED', { categories: categoriesDb });
    res.json({ success: true, deleted, categories: categoriesDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Products Management
app.get('/api/admin/products', (req, res) => {
  const storeId = req.query.storeId as string;
  let filtered = [...productsDb];
  if (storeId) {
    filtered = filtered.filter(p => !p.storeId || p.storeId === storeId);
  }
  res.json({ products: filtered });
});

app.post('/api/admin/products', (req, res) => {
  try {
    const { 
      name, 
      category, 
      basePrice, 
      targetStationId = 'station_bar', 
      prepTimeSeconds = 60, 
      image, 
      description, 
      isRecommended = false, 
      storeId = 'store_default_01',
      tags = [],
      recipeBOM = [] 
    } = req.body;

    if (!name || !category || basePrice === undefined) {
      return res.status(400).json({ error: 'Name, category, and basePrice are required' });
    }

    // Calculate BOM cost & gross margin
    let estimatedCost = 0;
    if (Array.isArray(recipeBOM) && recipeBOM.length > 0) {
      recipeBOM.forEach((bom: any) => {
        const cost = (Number(bom.quantity) || 0) * (Number(bom.unitCost) || 0);
        estimatedCost += cost;
      });
    }
    const priceNum = Number(basePrice);
    const grossMargin = priceNum > 0 ? Number((((priceNum - estimatedCost) / priceNum) * 100).toFixed(1)) : 0;

    const newProduct: ProductSKU = {
      id: `sku_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      storeId,
      name: name.trim(),
      category: category.trim(),
      basePrice: priceNum,
      targetStationId,
      prepTimeSeconds: Number(prepTimeSeconds),
      image: image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
      description: description || '',
      isRecommended: Boolean(isRecommended),
      tags,
      recipeBOM,
      estimatedCost: Number(estimatedCost.toFixed(3)),
      grossMargin,
    };

    productsDb.unshift(newProduct);
    broadcastWSEvent('MENU_UPDATED', { products: productsDb });
    res.json({ success: true, product: newProduct, products: productsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const prod = productsDb.find(p => p.id === id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });

    const { name, category, basePrice, targetStationId, prepTimeSeconds, image, description, isRecommended, storeId, tags, recipeBOM } = req.body;
    if (name !== undefined) prod.name = name.trim();
    if (category !== undefined) prod.category = category.trim();
    if (basePrice !== undefined) prod.basePrice = Number(basePrice);
    if (targetStationId !== undefined) prod.targetStationId = targetStationId;
    if (prepTimeSeconds !== undefined) prod.prepTimeSeconds = Number(prepTimeSeconds);
    if (image !== undefined) prod.image = image;
    if (description !== undefined) prod.description = description;
    if (isRecommended !== undefined) prod.isRecommended = Boolean(isRecommended);
    if (storeId !== undefined) prod.storeId = storeId;
    if (tags !== undefined) prod.tags = tags;
    if (recipeBOM !== undefined) prod.recipeBOM = recipeBOM;

    // Recalculate cost & margin
    let estimatedCost = 0;
    if (Array.isArray(prod.recipeBOM) && prod.recipeBOM.length > 0) {
      prod.recipeBOM.forEach((bom: any) => {
        const cost = (Number(bom.quantity) || 0) * (Number(bom.unitCost) || 0);
        estimatedCost += cost;
      });
    }
    prod.estimatedCost = Number(estimatedCost.toFixed(3));
    prod.grossMargin = prod.basePrice > 0 ? Number((((prod.basePrice - estimatedCost) / prod.basePrice) * 100).toFixed(1)) : 0;

    broadcastWSEvent('MENU_UPDATED', { products: productsDb });
    res.json({ success: true, product: prod, products: productsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const idx = productsDb.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const [deleted] = productsDb.splice(idx, 1);
    broadcastWSEvent('MENU_UPDATED', { products: productsDb });
    res.json({ success: true, deleted, products: productsDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Staff Management
app.get('/api/admin/staff', (req, res) => {
  res.json({
    staff: staffUsersDb,
    permissions: PERMISSION_DEFINITIONS,
  });
});

app.post('/api/admin/staff', (req, res) => {
  try {
    const { name, username, role, pinCode, permissions = [] } = req.body;
    if (!name || !username || !role) {
      return res.status(400).json({ error: 'Name, username and role are required' });
    }
    const newStaff: StaffUser = {
      id: `staff_${Date.now()}`,
      name: name.trim(),
      username: username.trim(),
      role,
      storeId: currentStoreConfig.storeId,
      status: 'ACTIVE',
      pinCode: pinCode || '1234',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
      permissions,
    };
    staffUsersDb.push(newStaff);
    res.json({ success: true, staff: newStaff, staffList: staffUsersDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/staff/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = staffUsersDb.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'Staff user not found' });

    const { name, username, role, status, pinCode, permissions } = req.body;
    if (name !== undefined) user.name = name.trim();
    if (username !== undefined) user.username = username.trim();
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (pinCode !== undefined) user.pinCode = pinCode;
    if (permissions !== undefined) user.permissions = permissions;

    res.json({ success: true, staff: user, staffList: staffUsersDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/staff/:id', (req, res) => {
  try {
    const { id } = req.params;
    const idx = staffUsersDb.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Staff user not found' });

    const [deleted] = staffUsersDb.splice(idx, 1);
    res.json({ success: true, deleted, staffList: staffUsersDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// H5 Pre-Order
app.post('/api/order/create', (req, res) => {
  try {
    const { items, customerPhone, notes, channel = 'QR_H5' } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least 1 item' });
    }

    const now = Date.now();
    let calculatedTotal = 0;
    let totalItemsCount = 0;
    const orderItems: OrderItem[] = [];

    items.forEach((cartItem: any, idx: number) => {
      const sku = productsDb.find(p => p.id === (cartItem.skuId || cartItem.sku?.id)) || INITIAL_PRODUCTS[0];
      let itemUnitPrice = sku.basePrice;
      const selectedModifiers: SelectedModifier[] = [];

      if (cartItem.selectedModifiers && Array.isArray(cartItem.selectedModifiers)) {
        cartItem.selectedModifiers.forEach((mod: any) => {
          itemUnitPrice += Number(mod.price || 0);
          selectedModifiers.push({
            groupId: mod.groupId,
            groupName: mod.groupName,
            itemId: mod.itemId,
            itemName: mod.itemName,
            price: Number(mod.price || 0),
          });
        });
      }

      const itemTotalPrice = itemUnitPrice * cartItem.quantity;
      calculatedTotal += itemTotalPrice;
      totalItemsCount += cartItem.quantity;

      orderItems.push({
        itemId: `item_${now}_${idx}`,
        orderId: '',
        skuId: sku.id,
        productName: sku.name,
        category: sku.category,
        quantity: cartItem.quantity,
        unitPrice: itemUnitPrice,
        totalPrice: itemTotalPrice,
        targetStationId: sku.targetStationId,
        selectedModifiers,
        stationStatus: 'PENDING',
        prepTimeSeconds: sku.prepTimeSeconds,
        notes: cartItem.notes || '',
      });
    });

    const orderId = `ord_${now}_${Math.floor(Math.random() * 1000)}`;
    orderItems.forEach(i => i.orderId = orderId);

    const newOrder: OrderMaster = {
      id: orderId,
      storeId: 'store_bratislava_01',
      merchantId: 'merchant_002',
      orderNo: 'ORD' + now,
      pickupCode: '',
      channel,
      status: 'UNPAID',
      paymentStatus: 'PENDING',
      paymentMethod: 'STRIPE_CARD',
      stripePaymentIntentId: `pi_mock_${now}_${Math.random().toString(36).substring(7)}`,
      currency: 'EUR',
      currencySymbol: '€',
      totalAmount: calculatedTotal,
      itemsCount: totalItemsCount,
      items: orderItems,
      customerPhoneMasked: customerPhone ? customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : undefined,
      notes: notes || '',
      createdAt: now,
      estimatedWaitMinutes: Math.max(4, Math.ceil(totalItemsCount * 2)),
      queuePosition: ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING').length + 1,
    };

    ordersDb.unshift(newOrder);

    res.json({
      success: true,
      order: newOrder,
      stripeClientSecret: `pi_secret_mock_${newOrder.stripePaymentIntentId}`,
      publishableKey: STORE_CONFIG.stripePublishableKey,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// Stripe Webhook Simulator
app.post('/api/webhook/stripe', (req, res) => {
  try {
    const { orderId, paymentMethod = 'STRIPE_CARD' } = req.body;
    const order = ordersDb.find(o => o.id === orderId);

    if (!order) return res.status(404).json({ error: 'Order not found for webhook' });

    if (order.status !== 'UNPAID' && order.paymentStatus === 'PAID') {
      return res.json({ message: 'Order already paid and routed', order });
    }

    const now = Date.now();
    const pickupCode = generatePickupCode(order.channel);

    order.pickupCode = pickupCode;
    order.status = 'PENDING';
    order.paymentStatus = 'PAID';
    order.paidAt = now;
    order.paymentMethod = paymentMethod;

    order.items.forEach(item => {
      item.stationStatus = 'PENDING';
    });

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('PAYMENT_CONFIRMED', {
      order,
      pickupCode,
      queue: queueSummary,
    });

    res.json({
      success: true,
      orderId: order.id,
      pickupCode,
      status: order.status,
      timestamp: now,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
});

// Counter POS Checkout (Only CASH & POS_CARD supported, QR aggregated payments removed)
app.post('/api/counter/order/create-and-pay', (req, res) => {
  try {
    const { items, paymentMethod = 'CASH', cashDetails, cardDetails, customerPhone, notes, storeId = 'store_bratislava_01' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least 1 item' });
    }

    const targetStore = storesDb.find(s => s.id === storeId) || storesDb[0];

    const now = Date.now();
    let calculatedTotal = 0;
    let totalItemsCount = 0;
    const orderItems: OrderItem[] = [];

    items.forEach((cartItem: any, idx: number) => {
      const sku = productsDb.find(p => p.id === (cartItem.skuId || cartItem.sku?.id)) || INITIAL_PRODUCTS[0];
      let itemUnitPrice = sku.basePrice;
      const selectedModifiers: SelectedModifier[] = [];

      if (cartItem.selectedModifiers && Array.isArray(cartItem.selectedModifiers)) {
        cartItem.selectedModifiers.forEach((mod: any) => {
          itemUnitPrice += Number(mod.price || 0);
          selectedModifiers.push({
            groupId: mod.groupId,
            groupName: mod.groupName,
            itemId: mod.itemId,
            itemName: mod.itemName,
            price: Number(mod.price || 0),
          });
        });
      }

      const itemTotalPrice = itemUnitPrice * cartItem.quantity;
      calculatedTotal += itemTotalPrice;
      totalItemsCount += cartItem.quantity;

      orderItems.push({
        itemId: `item_${now}_pos_${idx}`,
        orderId: '',
        skuId: sku.id,
        productName: sku.name,
        category: sku.category,
        quantity: cartItem.quantity,
        unitPrice: itemUnitPrice,
        totalPrice: itemTotalPrice,
        targetStationId: sku.targetStationId,
        selectedModifiers,
        stationStatus: 'PENDING',
        prepTimeSeconds: sku.prepTimeSeconds,
        notes: cartItem.notes || '',
      });
    });

    const orderId = `ord_pos_${now}_${Math.floor(Math.random() * 1000)}`;
    orderItems.forEach(i => i.orderId = orderId);

    const pickupCode = generatePickupCode('COUNTER_POS');

    const newOrder: OrderMaster = {
      id: orderId,
      storeId: targetStore.id,
      merchantId: targetStore.merchantId,
      orderNo: 'POS' + now,
      pickupCode,
      channel: 'COUNTER_POS',
      status: 'PENDING',
      paymentStatus: 'PAID',
      paymentMethod: paymentMethod === 'POS_CARD' ? 'POS_CARD' : 'CASH',
      cashDetails: cashDetails || (paymentMethod === 'CASH' ? { receivedAmount: calculatedTotal, changeAmount: 0 } : undefined),
      cardDetails: cardDetails || (paymentMethod === 'POS_CARD' ? { cardLast4: '8899', authCode: `AUTH_${Math.floor(100000 + Math.random() * 900000)}` } : undefined),
      currency: targetStore.currency,
      currencySymbol: targetStore.currencySymbol,
      totalAmount: Number(calculatedTotal.toFixed(2)),
      itemsCount: totalItemsCount,
      items: orderItems,
      customerPhoneMasked: customerPhone ? customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : undefined,
      notes: notes || '',
      createdAt: now,
      paidAt: now,
      estimatedWaitMinutes: Math.max(3, Math.ceil(totalItemsCount * 2)),
      queuePosition: ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING').length + 1,
    };

    ordersDb.unshift(newOrder);

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('PAYMENT_CONFIRMED', {
      order: newOrder,
      pickupCode,
      queue: queueSummary,
    });

    res.json({
      success: true,
      order: newOrder,
      pickupCode,
      queue: queueSummary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Counter order creation failed' });
  }
});

// Orders List & Query
app.get('/api/orders', (req, res) => {
  const { status, pickupCode, storeId, limit = 100 } = req.query;
  let filtered = [...ordersDb];

  if (storeId && storeId !== 'ALL') {
    filtered = filtered.filter(o => o.storeId === storeId);
  }
  if (status) {
    filtered = filtered.filter(o => o.status === status);
  }
  if (pickupCode) {
    filtered = filtered.filter(o => o.pickupCode === pickupCode);
  }

  res.json({
    orders: filtered.slice(0, Number(limit)),
    total: filtered.length,
    queue: calculateQueueSummary(),
  });
});

app.get('/api/order/:id', (req, res) => {
  const order = ordersDb.find(o => o.id === req.params.id || o.pickupCode === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const activeOrders = ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING');
  const orderIndex = activeOrders.findIndex(o => o.id === order.id);
  const queuePos = orderIndex >= 0 ? orderIndex + 1 : 0;

  res.json({
    order: {
      ...order,
      queuePosition: queuePos,
    },
    queue: calculateQueueSummary(),
  });
});

// KDS Tasks & Operations
app.get('/api/kds/station/:stationId/tasks', (req, res) => {
  const { stationId } = req.params;
  const isExpo = stationId === 'station_expo';

  const activeOrders = ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING' || (isExpo && o.status === 'READY'));

  if (isExpo) {
    return res.json({
      stationId,
      stationName: '总控装配打包台 (Expo)',
      activeOrders: activeOrders.map(order => ({
        ...order,
        allItemsDone: order.items.every(i => i.stationStatus === 'DONE'),
      })),
      queue: calculateQueueSummary(),
    });
  }

  const stationTasks: { order: OrderMaster; item: OrderItem }[] = [];
  activeOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.targetStationId === stationId && item.stationStatus !== 'DONE') {
        stationTasks.push({ order, item });
      }
    });
  });

  res.json({
    stationId,
    tasks: stationTasks,
    queue: calculateQueueSummary(),
  });
});

app.post('/api/kds/task/bump', (req, res) => {
  try {
    const { orderId, itemId, stationId, action = 'BUMP_ITEM' } = req.body;
    const order = ordersDb.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const now = Date.now();

    if (action === 'BUMP_ALL') {
      order.items.forEach(it => {
        it.stationStatus = 'DONE';
        it.completedAt = now;
      });
      order.status = 'READY';
      order.readyAt = now;
    } else if (itemId) {
      const item = order.items.find(i => i.itemId === itemId);
      if (item) {
        item.stationStatus = 'DONE';
        item.completedAt = now;
      }
      const allDone = order.items.every(i => i.stationStatus === 'DONE');
      if (allDone) {
        order.status = 'READY';
        order.readyAt = now;
      } else {
        order.status = 'MAKING';
      }
    }

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('TASK_BUMPED', {
      orderId: order.id,
      pickupCode: order.pickupCode,
      status: order.status,
      queue: queueSummary,
    });

    if (order.status === 'READY') {
      broadcastWSEvent('ORDER_READY', {
        orderId: order.id,
        pickupCode: order.pickupCode,
        voiceText: `请 ${order.pickupCode} 号顾客到取餐口取餐`,
        queue: queueSummary,
      });
    }

    res.json({ success: true, order, queue: queueSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kds/expo/call', (req, res) => {
  try {
    const { orderId, pickupCode } = req.body;
    const order = ordersDb.find(o => o.id === orderId || o.pickupCode === pickupCode);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'READY';
    order.readyAt = Date.now();

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('ORDER_READY', {
      orderId: order.id,
      pickupCode: order.pickupCode,
      voiceText: `请 ${order.pickupCode} 号顾客到取餐口取餐`,
      queue: queueSummary,
    });

    res.json({ success: true, pickupCode: order.pickupCode, queue: queueSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kds/order/complete', (req, res) => {
  try {
    const { pickupCode, orderId } = req.body;
    const order = ordersDb.find(o => (pickupCode && o.pickupCode === pickupCode) || (orderId && o.id === orderId));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'COMPLETED';
    order.completedAt = Date.now();

    const queueSummary = calculateQueueSummary();

    broadcastWSEvent('ORDER_COMPLETED', {
      orderId: order.id,
      pickupCode: order.pickupCode,
      queue: queueSummary,
    });

    res.json({ success: true, order, queue: queueSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/simulate/traffic', (req, res) => {
  try {
    const { count = 1 } = req.body;
    const now = Date.now();

    for (let c = 0; c < count; c++) {
      const pickupCode = generatePickupCode('QR_H5');
      const randomSku = productsDb[Math.floor(Math.random() * productsDb.length)] || INITIAL_PRODUCTS[0];

      const simOrder: OrderMaster = {
        id: `ord_sim_${now}_${c}`,
        storeId: 'store_bratislava_01',
        merchantId: 'merchant_002',
        orderNo: 'SIM' + (now + c),
        pickupCode,
        channel: 'QR_H5',
        status: 'PENDING',
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE_CARD',
        currency: 'EUR',
        currencySymbol: '€',
        totalAmount: randomSku.basePrice,
        itemsCount: 1,
        items: [
          {
            itemId: `sim_item_${now}_${c}`,
            orderId: `ord_sim_${now}_${c}`,
            skuId: randomSku.id,
            productName: randomSku.name,
            category: randomSku.category,
            quantity: 1,
            unitPrice: randomSku.basePrice,
            totalPrice: randomSku.basePrice,
            targetStationId: randomSku.targetStationId,
            selectedModifiers: [],
            stationStatus: 'PENDING',
            prepTimeSeconds: randomSku.prepTimeSeconds,
          }
        ],
        createdAt: now,
        paidAt: now,
        estimatedWaitMinutes: 5,
        queuePosition: ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING').length + 1,
      };

      ordersDb.unshift(simOrder);
    }

    const queueSummary = calculateQueueSummary();
    broadcastWSEvent('PAYMENT_CONFIRMED', { queue: queueSummary });

    res.json({ success: true, count, queue: queueSummary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/kds/sku/soldout', (req, res) => {
  const { skuId, isSoldOut } = req.body;
  if (isSoldOut) {
    soldOutSkuIds.add(skuId);
  } else {
    soldOutSkuIds.delete(skuId);
  }
  broadcastWSEvent('ITEM_SOLDOUT_CHANGED', { skuId, isSoldOut });
  res.json({ success: true, skuId, isSoldOut });
});

// -------------------------------------------------------------
// System Architecture Spec & AI Master Prompt Specification
// -------------------------------------------------------------
app.get('/api/architecture/spec', (req, res) => {
  res.json({
    ddl: `-- MySQL 8.0 餐饮SaaS多租户核心表结构规范
CREATE TABLE \`tenant_merchants\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(128) NOT NULL,
  \`contact_person\` VARCHAR(64),
  \`email\` VARCHAR(128),
  \`phone\` VARCHAR(32),
  \`status\` ENUM('ACTIVE', 'SUSPENDED', 'PENDING') DEFAULT 'ACTIVE',
  \`plan_type\` ENUM('TRIAL', 'PRO', 'ENTERPRISE') DEFAULT 'PRO',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`tenant_stores\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`merchant_id\` VARCHAR(64) NOT NULL,
  \`store_name\` VARCHAR(128) NOT NULL,
  \`country\` VARCHAR(64) NOT NULL,
  \`currency\` VARCHAR(16) NOT NULL DEFAULT 'EUR',
  \`currency_symbol\` VARCHAR(8) NOT NULL DEFAULT '€',
  \`address\` VARCHAR(256),
  \`operating_hours\` VARCHAR(128),
  \`status\` ENUM('OPEN', 'BUSY', 'CLOSED') DEFAULT 'OPEN',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_merchant\` (\`merchant_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`orders_master\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`store_id\` VARCHAR(64) NOT NULL,
  \`merchant_id\` VARCHAR(64),
  \`order_no\` VARCHAR(64) NOT NULL UNIQUE,
  \`pickup_code\` VARCHAR(16) NOT NULL,
  \`channel\` ENUM('QR_H5', 'COUNTER_POS', 'KIOSK', 'DELIVERY_AGGREGATOR') DEFAULT 'QR_H5',
  \`status\` ENUM('UNPAID', 'PENDING', 'MAKING', 'READY', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  \`payment_status\` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PAID',
  \`payment_method\` ENUM('CASH', 'POS_CARD', 'STRIPE_CARD', 'STRIPE_APPLE_PAY') DEFAULT 'STRIPE_CARD',
  \`currency\` VARCHAR(16) NOT NULL DEFAULT 'EUR',
  \`total_amount\` DECIMAL(10, 2) NOT NULL,
  \`items_count\` INT NOT NULL DEFAULT 1,
  \`created_at\` BIGINT NOT NULL,
  \`paid_at\` BIGINT,
  \`ready_at\` BIGINT,
  \`completed_at\` BIGINT,
  INDEX \`idx_store_created\` (\`store_id\`, \`created_at\`),
  INDEX \`idx_pickup_code\` (\`pickup_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`order_items\` (
  \`item_id\` VARCHAR(64) PRIMARY KEY,
  \`order_id\` VARCHAR(64) NOT NULL,
  \`sku_id\` VARCHAR(64) NOT NULL,
  \`product_name\` VARCHAR(128) NOT NULL,
  \`category\` VARCHAR(64) NOT NULL,
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`unit_price\` DECIMAL(10, 2) NOT NULL,
  \`total_price\` DECIMAL(10, 2) NOT NULL,
  \`target_station_id\` VARCHAR(64) NOT NULL,
  \`selected_modifiers\` JSON,
  \`station_status\` ENUM('PENDING', 'MAKING', 'DONE') DEFAULT 'PENDING',
  \`prep_time_seconds\` INT DEFAULT 60,
  INDEX \`idx_order_id\` (\`order_id\`),
  INDEX \`idx_station\` (\`target_station_id\`, \`station_status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    apiContract: [
      { method: 'POST', path: '/api/order/create', desc: '顾客手机H5扫码提交定制订单并初始化付款' },
      { method: 'POST', path: '/api/counter/order/create-and-pay', desc: '吧台POS操作员直接收银(现金/POS刷卡)即时出单' },
      { method: 'GET', path: '/api/orders', desc: '根据门店与状态筛选获取当前工单流水' },
      { method: 'POST', path: '/api/kds/task/bump', desc: 'KDS分工位触屏一键消单推进制作状态' },
      { method: 'POST', path: '/api/kds/expo/call', desc: 'Expo总控打包台齐套确认触发大屏叫号与语音TTS' },
      { method: 'POST', path: '/api/kds/order/complete', desc: '顾客取餐核销完成闭环' },
      { method: 'GET', path: '/api/admin/analytics/sales', desc: '商家与店长多维度营业额与商品销量统计分析' },
      { method: 'GET', path: '/api/admin/inventory', desc: '店长查询当前门店原料物料库存与预警台账' },
      { method: 'POST', path: '/api/admin/inventory/adjust', desc: '店长执行采购入库、制作消耗、损耗报废、盘点校准' }
    ],
    wsTopics: [
      { topic: 'ORDER_CREATED', desc: '新订单入库，通知所有终端' },
      { topic: 'PAYMENT_CONFIRMED', desc: '支付成功，KDS分站与排队引擎实时刷新' },
      { topic: 'STATION_TASK_BUMPED', desc: '分工位制作推进，Expo装配看板同步更新' },
      { topic: 'EXPO_ORDER_CALLED', desc: '总控齐套叫号，取餐大屏翻牌与TTS语音播报' },
      { topic: 'ORDER_COMPLETED', desc: '出餐核销，移出活动列表' },
      { topic: 'MERCHANTS_UPDATED', desc: '商家信息及门店管辖范围变动实时推送' },
      { topic: 'STORES_UPDATED', desc: '门店基础信息与法定币种配置变动实时推送' },
      { topic: 'INVENTORY_UPDATED', desc: '食材库存发生变动，即时同步店长端' }
    ]
  });
});

// Vite Middleware integration for SPA
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Seatless SaaS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
