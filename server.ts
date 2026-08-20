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
let dailySequenceCount = 12;
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

// Seed initial orders across today and historical days for realistic analytics
function initSeedOrders() {
  const now = Date.now();
  const dayMs = 86400000;

  // TODAY Orders (Bratislava - EUR)
  ordersDb.push({
    id: 'ord_today_001',
    storeId: 'store_bratislava_01',
    merchantId: 'merchant_002',
    orderNo: 'ORD' + (now - 1200000),
    pickupCode: 'A001',
    channel: 'QR_H5',
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'STRIPE_CARD',
    currency: 'EUR',
    currencySymbol: '€',
    totalAmount: 18.50,
    itemsCount: 2,
    items: [
      {
        itemId: 'item_t1_1',
        orderId: 'ord_today_001',
        skuId: 'sku_tea_01',
        productName: '幽兰幽香・生酪鲜奶茶',
        category: '招牌鲜奶茶',
        quantity: 1,
        unitPrice: 5.50,
        totalPrice: 5.50,
        targetStationId: 'station_bar',
        selectedModifiers: [
          { groupId: 'mod_sweetness', groupName: '甜度', itemId: 'sweet_70', itemName: '七分甜 (70%)', price: 0 },
          { groupId: 'mod_temperature', groupName: '温度', itemId: 'ice_less', itemName: '少冰 (推荐)', price: 0 },
        ],
        stationStatus: 'DONE',
        prepTimeSeconds: 45,
      },
      {
        itemId: 'item_t1_2',
        orderId: 'ord_today_001',
        skuId: 'sku_burger_01',
        productName: '手打双层安格斯厚牛芝士堡',
        category: '现烤手工汉堡',
        quantity: 1,
        unitPrice: 13.00,
        totalPrice: 13.00,
        targetStationId: 'station_grill',
        selectedModifiers: [],
        stationStatus: 'DONE',
        prepTimeSeconds: 120,
      }
    ],
    createdAt: now - 900000,
    paidAt: now - 890000,
    readyAt: now - 500000,
    completedAt: now - 200000,
    estimatedWaitMinutes: 6,
    queuePosition: 0,
  });

  ordersDb.push({
    id: 'ord_today_002',
    storeId: 'store_bratislava_01',
    merchantId: 'merchant_002',
    orderNo: 'POS' + (now - 600000),
    pickupCode: 'C002',
    channel: 'COUNTER_POS',
    status: 'READY',
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    cashDetails: { receivedAmount: 20.00, changeAmount: 6.50 },
    currency: 'EUR',
    currencySymbol: '€',
    totalAmount: 13.50,
    itemsCount: 2,
    items: [
      {
        itemId: 'item_t2_1',
        orderId: 'ord_today_002',
        skuId: 'sku_fry_01',
        productName: '金牌黄金蒜香脆皮炸鸡 (2块)',
        category: '金牌炸鸡小食',
        quantity: 1,
        unitPrice: 8.50,
        totalPrice: 8.50,
        targetStationId: 'station_fryer',
        selectedModifiers: [],
        stationStatus: 'DONE',
        prepTimeSeconds: 90,
      },
      {
        itemId: 'item_t2_2',
        orderId: 'ord_today_002',
        skuId: 'sku_fry_02',
        productName: '黄金粗薯条配黑松露风味酱',
        category: '香酥薯条炸物',
        quantity: 1,
        unitPrice: 5.00,
        totalPrice: 5.00,
        targetStationId: 'station_fryer',
        selectedModifiers: [],
        stationStatus: 'DONE',
        prepTimeSeconds: 50,
      }
    ],
    createdAt: now - 600000,
    paidAt: now - 590000,
    readyAt: now - 60000,
    estimatedWaitMinutes: 4,
    queuePosition: 0,
  });

  ordersDb.push({
    id: 'ord_today_003',
    storeId: 'store_bratislava_01',
    merchantId: 'merchant_002',
    orderNo: 'POS' + (now - 200000),
    pickupCode: 'C003',
    channel: 'COUNTER_POS',
    status: 'MAKING',
    paymentStatus: 'PAID',
    paymentMethod: 'POS_CARD',
    cardDetails: { cardLast4: '4242', authCode: 'AUTH_89123' },
    currency: 'EUR',
    currencySymbol: '€',
    totalAmount: 16.50,
    itemsCount: 2,
    items: [
      {
        itemId: 'item_t3_1',
        orderId: 'ord_today_003',
        skuId: 'sku_tea_02',
        productName: '茉莉初雪・清心白月光',
        category: '招牌鲜奶茶',
        quantity: 1,
        unitPrice: 4.50,
        totalPrice: 4.50,
        targetStationId: 'station_bar',
        selectedModifiers: [],
        stationStatus: 'DONE',
        prepTimeSeconds: 40,
      },
      {
        itemId: 'item_t3_2',
        orderId: 'ord_today_003',
        skuId: 'sku_burger_01',
        productName: '手打双层安格斯厚牛芝士堡',
        category: '现烤手工汉堡',
        quantity: 1,
        unitPrice: 12.00,
        totalPrice: 12.00,
        targetStationId: 'station_grill',
        selectedModifiers: [],
        stationStatus: 'MAKING',
        prepTimeSeconds: 120,
        startedAt: now - 100000,
      }
    ],
    createdAt: now - 200000,
    paidAt: now - 190000,
    estimatedWaitMinutes: 5,
    queuePosition: 1,
  });

  // TODAY Orders (Prague - CZK)
  ordersDb.push({
    id: 'ord_prague_001',
    storeId: 'store_prague_01',
    merchantId: 'merchant_001',
    orderNo: 'PRG' + (now - 1500000),
    pickupCode: 'A010',
    channel: 'QR_H5',
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'STRIPE_CARD',
    currency: 'CZK',
    currencySymbol: 'Kč',
    totalAmount: 380,
    itemsCount: 3,
    items: [
      {
        itemId: 'item_p1_1',
        orderId: 'ord_prague_001',
        skuId: 'sku_tea_01',
        productName: '幽兰幽香・生酪鲜奶茶',
        category: '招牌鲜奶茶',
        quantity: 2,
        unitPrice: 130,
        totalPrice: 260,
        targetStationId: 'station_bar',
        selectedModifiers: [],
        stationStatus: 'DONE',
        prepTimeSeconds: 45,
      },
      {
        itemId: 'item_p1_2',
        orderId: 'ord_prague_001',
        skuId: 'sku_fry_02',
        productName: '黄金粗薯条配黑松露风味酱',
        category: '香酥薯条炸物',
        quantity: 1,
        unitPrice: 120,
        totalPrice: 120,
        targetStationId: 'station_fryer',
        selectedModifiers: [],
        stationStatus: 'DONE',
        prepTimeSeconds: 50,
      }
    ],
    createdAt: now - 1500000,
    paidAt: now - 1490000,
    readyAt: now - 1200000,
    completedAt: now - 1000000,
    estimatedWaitMinutes: 5,
    queuePosition: 0,
  });

  // Historical Orders (Yesterday and past days)
  const historicalDates = [1, 2, 3, 5, 7, 10, 14, 20, 25];
  historicalDates.forEach((daysAgo, idx) => {
    const timestamp = now - daysAgo * dayMs + (idx * 3600000);
    
    // Bratislava history (EUR)
    ordersDb.push({
      id: `ord_hist_bts_${idx}`,
      storeId: 'store_bratislava_01',
      merchantId: 'merchant_002',
      orderNo: `HIST_BTS_${1000 + idx}`,
      pickupCode: `A${(idx + 10).toString().padStart(3, '0')}`,
      channel: idx % 2 === 0 ? 'COUNTER_POS' : 'QR_H5',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: idx % 3 === 0 ? 'CASH' : 'POS_CARD',
      currency: 'EUR',
      currencySymbol: '€',
      totalAmount: 22.50 + (idx * 4.2),
      itemsCount: 3,
      items: [
        {
          itemId: `hist_item_1_${idx}`,
          orderId: `ord_hist_bts_${idx}`,
          skuId: 'sku_burger_01',
          productName: '手打双层安格斯厚牛芝士堡',
          category: '现烤手工汉堡',
          quantity: 1,
          unitPrice: 12.50,
          totalPrice: 12.50,
          targetStationId: 'station_grill',
          selectedModifiers: [],
          stationStatus: 'DONE',
          prepTimeSeconds: 120,
        },
        {
          itemId: `hist_item_2_${idx}`,
          orderId: `ord_hist_bts_${idx}`,
          skuId: 'sku_tea_01',
          productName: '幽兰幽香・生酪鲜奶茶',
          category: '招牌鲜奶茶',
          quantity: 2,
          unitPrice: 5.00,
          totalPrice: 10.00,
          targetStationId: 'station_bar',
          selectedModifiers: [],
          stationStatus: 'DONE',
          prepTimeSeconds: 45,
        }
      ],
      createdAt: timestamp,
      paidAt: timestamp + 60000,
      readyAt: timestamp + 400000,
      completedAt: timestamp + 600000,
      estimatedWaitMinutes: 5,
      queuePosition: 0,
    });

    // Prague history (CZK)
    ordersDb.push({
      id: `ord_hist_prg_${idx}`,
      storeId: 'store_prague_01',
      merchantId: 'merchant_001',
      orderNo: `HIST_PRG_${2000 + idx}`,
      pickupCode: `C${(idx + 20).toString().padStart(3, '0')}`,
      channel: 'COUNTER_POS',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: idx % 2 === 0 ? 'CASH' : 'POS_CARD',
      currency: 'CZK',
      currencySymbol: 'Kč',
      totalAmount: 480 + (idx * 60),
      itemsCount: 4,
      items: [
        {
          itemId: `hist_prg_1_${idx}`,
          orderId: `ord_hist_prg_${idx}`,
          skuId: 'sku_fry_01',
          productName: '金牌黄金蒜香脆皮炸鸡 (2块)',
          category: '金牌炸鸡小食',
          quantity: 2,
          unitPrice: 160,
          totalPrice: 320,
          targetStationId: 'station_fryer',
          selectedModifiers: [],
          stationStatus: 'DONE',
          prepTimeSeconds: 90,
        },
        {
          itemId: `hist_prg_2_${idx}`,
          orderId: `ord_hist_prg_${idx}`,
          skuId: 'sku_tea_03',
          productName: '多肉芝士手剥多汁葡萄',
          category: '鲜果芝士茶',
          quantity: 1,
          unitPrice: 160,
          totalPrice: 160,
          targetStationId: 'station_bar',
          selectedModifiers: [],
          stationStatus: 'DONE',
          prepTimeSeconds: 60,
        }
      ],
      createdAt: timestamp - 3600000,
      paidAt: timestamp - 3540000,
      readyAt: timestamp - 3200000,
      completedAt: timestamp - 3000000,
      estimatedWaitMinutes: 6,
      queuePosition: 0,
    });
  });
}

initSeedOrders();

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

// 1. Get Store Menu & Metadata
app.get('/api/menu', (req, res) => {
  const productsWithStatus = productsDb.map(p => ({
    ...p,
    isSoldOut: soldOutSkuIds.has(p.id)
  }));

  const categoriesWithCounts = categoriesDb.map(c => ({
    ...c,
    productCount: productsDb.filter(p => p.category === c.name).length
  }));

  res.json({
    store: currentStoreConfig,
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
  const { storeId, timeRange = 'all', startDate, endDate, category } = req.query;
  const now = Date.now();
  const dayMs = 86400000;

  let filteredOrders = ordersDb.filter(o => o.paymentStatus === 'PAID');

  // Filter by store
  if (storeId && storeId !== 'ALL') {
    filteredOrders = filteredOrders.filter(o => o.storeId === storeId);
  }

  // Filter by time range
  if (timeRange === 'today') {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    filteredOrders = filteredOrders.filter(o => o.createdAt >= startOfToday);
  } else if (timeRange === 'yesterday') {
    const startOfYesterday = new Date().setHours(0, 0, 0, 0) - dayMs;
    const endOfYesterday = startOfYesterday + dayMs;
    filteredOrders = filteredOrders.filter(o => o.createdAt >= startOfYesterday && o.createdAt < endOfYesterday);
  } else if (timeRange === 'last7') {
    filteredOrders = filteredOrders.filter(o => o.createdAt >= now - 7 * dayMs);
  } else if (timeRange === 'last30') {
    filteredOrders = filteredOrders.filter(o => o.createdAt >= now - 30 * dayMs);
  } else if (startDate && endDate) {
    const start = new Date(startDate as string).getTime();
    const end = new Date(endDate as string).getTime() + dayMs;
    filteredOrders = filteredOrders.filter(o => o.createdAt >= start && o.createdAt <= end);
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
  const categoriesWithCounts = categoriesDb.map(c => ({
    ...c,
    productCount: productsDb.filter(p => p.category === c.name).length
  }));
  res.json({ categories: categoriesWithCounts });
});

app.post('/api/admin/categories', (req, res) => {
  try {
    const { name, icon = 'CupSoda', sortOrder = categoriesDb.length + 1 } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const newCategory: MenuCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
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
    const { name, icon, sortOrder, isActive } = req.body;
    const cat = categoriesDb.find(c => c.id === id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const oldName = cat.name;
    if (name !== undefined) cat.name = name.trim();
    if (icon !== undefined) cat.icon = icon;
    if (sortOrder !== undefined) cat.sortOrder = Number(sortOrder);
    if (isActive !== undefined) cat.isActive = Boolean(isActive);

    if (name && name.trim() !== oldName) {
      productsDb.forEach(p => {
        if (p.category === oldName) {
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
  res.json({ products: productsDb });
});

app.post('/api/admin/products', (req, res) => {
  try {
    const { name, category, basePrice, targetStationId = 'station_bar', prepTimeSeconds = 60, image, description, isRecommended = false } = req.body;
    if (!name || !category || basePrice === undefined) {
      return res.status(400).json({ error: 'Name, category, and basePrice are required' });
    }

    const newProduct: ProductSKU = {
      id: `sku_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      category: category.trim(),
      basePrice: Number(basePrice),
      targetStationId,
      prepTimeSeconds: Number(prepTimeSeconds),
      image: image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
      description: description || '',
      isRecommended: Boolean(isRecommended),
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

    const { name, category, basePrice, targetStationId, prepTimeSeconds, image, description, isRecommended } = req.body;
    if (name !== undefined) prod.name = name.trim();
    if (category !== undefined) prod.category = category.trim();
    if (basePrice !== undefined) prod.basePrice = Number(basePrice);
    if (targetStationId !== undefined) prod.targetStationId = targetStationId;
    if (prepTimeSeconds !== undefined) prod.prepTimeSeconds = Number(prepTimeSeconds);
    if (image !== undefined) prod.image = image;
    if (description !== undefined) prod.description = description;
    if (isRecommended !== undefined) prod.isRecommended = Boolean(isRecommended);

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
