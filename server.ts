import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { STORE_CONFIG, KDS_STATIONS, MODIFIER_GROUPS, INITIAL_PRODUCTS } from './src/data/menuData';
import { INITIAL_CATEGORIES, INITIAL_STAFF_USERS, PERMISSION_DEFINITIONS } from './src/data/adminData';
import { OrderMaster, OrderItem, SelectedModifier, BatchAggregationItem, QueueSummary, MenuCategory, StaffUser } from './src/types';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// In-Memory Database & State Management (Persistent across sessions during runtime)
let dailySequenceCount = 6; // Seed with a few initial orders
let ordersDb: OrderMaster[] = [];
let soldOutSkuIds = new Set<string>();
let productsDb = [...INITIAL_PRODUCTS];
let categoriesDb: MenuCategory[] = [...INITIAL_CATEGORIES];
let staffUsersDb: StaffUser[] = [...INITIAL_STAFF_USERS];
let currentStoreConfig = { ...STORE_CONFIG };


// Helper to calculate daily pickup code
function generatePickupCode(channel: string = 'QR_H5'): string {
  dailySequenceCount += 1;
  const prefix = channel === 'DELIVERY_AGGREGATOR' ? 'B' : channel === 'COUNTER_POS' ? 'C' : 'A';
  const numStr = dailySequenceCount.toString().padStart(3, '0');
  return `${prefix}${numStr}`;
}

// Seed initial orders so KDS, Call screen and C-end have realistic active workload immediately
function initSeedOrders() {
  const now = Date.now();
  
  // Order A001 - COMPLETED
  ordersDb.push({
    id: 'ord_seed_001',
    storeId: STORE_CONFIG.storeId,
    tenantId: STORE_CONFIG.tenantId,
    orderNo: 'ORD' + (now - 1200000),
    pickupCode: 'A001',
    channel: 'QR_H5',
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    paymentMethod: 'STRIPE_CARD',
    currency: '¥',
    totalAmount: 38,
    itemsCount: 2,
    items: [
      {
        itemId: 'item_001_1',
        orderId: 'ord_seed_001',
        skuId: 'sku_tea_01',
        productName: '幽兰幽香・生酪鲜奶茶',
        category: '招牌鲜奶茶',
        quantity: 1,
        unitPrice: 20,
        totalPrice: 20,
        targetStationId: 'station_bar',
        selectedModifiers: [
          { groupId: 'mod_sweetness', groupName: '甜度选择', itemId: 'sweet_70', itemName: '七分甜 (70%)', price: 0 },
          { groupId: 'mod_temperature', groupName: '冰度/温度', itemId: 'ice_less', itemName: '少冰 (推荐)', price: 0 },
          { groupId: 'mod_toppings', groupName: '风味加料', itemId: 'top_boba', itemName: '黑糖琥珀珍珠', price: 2 },
        ],
        stationStatus: 'DONE',
        prepTimeSeconds: 45,
      },
      {
        itemId: 'item_001_2',
        orderId: 'ord_seed_001',
        skuId: 'sku_tea_02',
        productName: '茉莉初雪・清心白月光',
        category: '招牌鲜奶茶',
        quantity: 1,
        unitPrice: 18,
        totalPrice: 18,
        targetStationId: 'station_bar',
        selectedModifiers: [
          { groupId: 'mod_sweetness', groupName: '甜度选择', itemId: 'sweet_50', itemName: '五分甜 (50%)', price: 0 },
          { groupId: 'mod_temperature', groupName: '冰度/温度', itemId: 'ice_none', itemName: '去冰', price: 0 },
          { groupId: 'mod_toppings', groupName: '风味加料', itemId: 'top_jelly', itemName: '茉莉茶冻', price: 2 },
        ],
        stationStatus: 'DONE',
        prepTimeSeconds: 40,
      }
    ],
    createdAt: now - 900000,
    paidAt: now - 890000,
    readyAt: now - 500000,
    completedAt: now - 200000,
    estimatedWaitMinutes: 6,
    queuePosition: 0,
  });

  // Order A002 - READY (Please Pickup)
  ordersDb.push({
    id: 'ord_seed_002',
    storeId: STORE_CONFIG.storeId,
    tenantId: STORE_CONFIG.tenantId,
    orderNo: 'ORD' + (now - 480000),
    pickupCode: 'A002',
    channel: 'QR_H5',
    status: 'READY',
    paymentStatus: 'PAID',
    paymentMethod: 'STRIPE_APPLE_PAY',
    currency: '¥',
    totalAmount: 33,
    itemsCount: 2,
    items: [
      {
        itemId: 'item_002_1',
        orderId: 'ord_seed_002',
        skuId: 'sku_fry_01',
        productName: '金牌黄金蒜香脆皮炸鸡 (2块)',
        category: '金牌炸鸡小食',
        quantity: 1,
        unitPrice: 19,
        totalPrice: 19,
        targetStationId: 'station_fryer',
        selectedModifiers: [
          { groupId: 'mod_spice_level', groupName: '辣度风味', itemId: 'spice_mild', itemName: '微辣 (香辣过瘾)', price: 0 }
        ],
        stationStatus: 'DONE',
        prepTimeSeconds: 90,
      },
      {
        itemId: 'item_002_2',
        orderId: 'ord_seed_002',
        skuId: 'sku_fry_02',
        productName: '黄金粗薯条配黑松露风味酱',
        category: '香酥薯条炸物',
        quantity: 1,
        unitPrice: 14,
        totalPrice: 14,
        targetStationId: 'station_fryer',
        selectedModifiers: [
          { groupId: 'mod_spice_level', groupName: '辣度风味', itemId: 'spice_none', itemName: '原味不辣 (经典椒盐)', price: 0 }
        ],
        stationStatus: 'DONE',
        prepTimeSeconds: 50,
      }
    ],
    createdAt: now - 480000,
    paidAt: now - 470000,
    readyAt: now - 60000,
    estimatedWaitMinutes: 5,
    queuePosition: 0,
  });

  // Order A003 - MAKING (Mixed: Bar + Grill)
  ordersDb.push({
    id: 'ord_seed_003',
    storeId: STORE_CONFIG.storeId,
    tenantId: STORE_CONFIG.tenantId,
    orderNo: 'ORD' + (now - 240000),
    pickupCode: 'A003',
    channel: 'QR_H5',
    status: 'MAKING',
    paymentStatus: 'PAID',
    paymentMethod: 'STRIPE_CARD',
    currency: '¥',
    totalAmount: 56,
    itemsCount: 2,
    items: [
      {
        itemId: 'item_003_1',
        orderId: 'ord_seed_003',
        skuId: 'sku_burger_01',
        productName: '手打双层安格斯厚牛芝士堡',
        category: '现烤手工汉堡',
        quantity: 1,
        unitPrice: 37,
        totalPrice: 37,
        targetStationId: 'station_grill',
        selectedModifiers: [
          { groupId: 'mod_burger_addons', groupName: '汉堡增配加料', itemId: 'add_bacon', itemName: '香煎烟熏培根', price: 5 }
        ],
        stationStatus: 'MAKING',
        prepTimeSeconds: 120,
        startedAt: now - 180000,
      },
      {
        itemId: 'item_003_2',
        orderId: 'ord_seed_003',
        skuId: 'sku_tea_01',
        productName: '幽兰幽香・生酪鲜奶茶',
        category: '招牌鲜奶茶',
        quantity: 1,
        unitPrice: 19,
        totalPrice: 19,
        targetStationId: 'station_bar',
        selectedModifiers: [
          { groupId: 'mod_sweetness', groupName: '甜度选择', itemId: 'sweet_30', itemName: '微糖三分 (30%)', price: 0 },
          { groupId: 'mod_temperature', groupName: '冰度/温度', itemId: 'ice_less', itemName: '少冰 (推荐)', price: 0 },
        ],
        stationStatus: 'DONE', // Bar already finished, waiting for grill
        prepTimeSeconds: 45,
      }
    ],
    createdAt: now - 240000,
    paidAt: now - 230000,
    estimatedWaitMinutes: 4,
    queuePosition: 1,
  });

  // Order A004 - MAKING (Bar item)
  ordersDb.push({
    id: 'ord_seed_004',
    storeId: STORE_CONFIG.storeId,
    tenantId: STORE_CONFIG.tenantId,
    orderNo: 'ORD' + (now - 120000),
    pickupCode: 'A004',
    channel: 'QR_H5',
    status: 'MAKING',
    paymentStatus: 'PAID',
    paymentMethod: 'STRIPE_CARD',
    currency: '¥',
    totalAmount: 22,
    itemsCount: 1,
    items: [
      {
        itemId: 'item_004_1',
        orderId: 'ord_seed_004',
        skuId: 'sku_tea_03',
        productName: '多肉芝士手剥多汁葡萄',
        category: '鲜果芝士茶',
        quantity: 1,
        unitPrice: 22,
        totalPrice: 22,
        targetStationId: 'station_bar',
        selectedModifiers: [
          { groupId: 'mod_sweetness', groupName: '甜度选择', itemId: 'sweet_50', itemName: '五分甜 (50%)', price: 0 },
          { groupId: 'mod_temperature', groupName: '冰度/温度', itemId: 'ice_standard', itemName: '推荐正常冰', price: 0 },
        ],
        stationStatus: 'MAKING',
        prepTimeSeconds: 60,
        startedAt: now - 90000,
      }
    ],
    createdAt: now - 120000,
    paidAt: now - 110000,
    estimatedWaitMinutes: 6,
    queuePosition: 2,
  });

  // Order A005 - PENDING (Just paid, waiting in line)
  ordersDb.push({
    id: 'ord_seed_005',
    storeId: STORE_CONFIG.storeId,
    tenantId: STORE_CONFIG.tenantId,
    orderNo: 'ORD' + (now - 30000),
    pickupCode: 'A005',
    channel: 'QR_H5',
    status: 'PENDING',
    paymentStatus: 'PAID',
    paymentMethod: 'STRIPE_CARD',
    currency: '¥',
    totalAmount: 38,
    itemsCount: 2,
    items: [
      {
        itemId: 'item_005_1',
        orderId: 'ord_seed_005',
        skuId: 'sku_tea_01',
        productName: '幽兰幽香・生酪鲜奶茶',
        category: '招牌鲜奶茶',
        quantity: 1,
        unitPrice: 18,
        totalPrice: 18,
        targetStationId: 'station_bar',
        selectedModifiers: [
          { groupId: 'mod_sweetness', groupName: '甜度选择', itemId: 'sweet_70', itemName: '七分甜 (70%)', price: 0 },
          { groupId: 'mod_temperature', groupName: '冰度/温度', itemId: 'ice_less', itemName: '少冰 (推荐)', price: 0 },
        ],
        stationStatus: 'PENDING',
        prepTimeSeconds: 45,
      },
      {
        itemId: 'item_005_2',
        orderId: 'ord_seed_005',
        skuId: 'sku_fry_01',
        productName: '金牌黄金蒜香脆皮炸鸡 (2块)',
        category: '金牌炸鸡小食',
        quantity: 1,
        unitPrice: 20,
        totalPrice: 20,
        targetStationId: 'station_fryer',
        selectedModifiers: [
          { groupId: 'mod_spice_level', groupName: '辣度风味', itemId: 'spice_hot', itemName: '特辣 (魔鬼双椒)', price: 1 }
        ],
        stationStatus: 'PENDING',
        prepTimeSeconds: 90,
      }
    ],
    createdAt: now - 30000,
    paidAt: now - 20000,
    estimatedWaitMinutes: 8,
    queuePosition: 3,
  });
}

initSeedOrders();

// WebSocket Server Initialization
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
  // Send current queue state immediately upon connection
  const summary = calculateQueueSummary();
  ws.send(JSON.stringify({
    type: 'QUEUE_UPDATE',
    payload: summary,
    timestamp: Date.now()
  }));
});

// Helper for Queue stats
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

  // Recalculate category product counts
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

// SaaS Admin Endpoints: Categories Management
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

    // If category name changed, update corresponding products
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

// SaaS Admin Endpoints: Products CRUD
app.post('/api/admin/products', (req, res) => {
  try {
    const { name, category, basePrice, targetStationId = 'station_bar', prepTimeSeconds = 45, image, description, isRecommended = false } = req.body;
    if (!name || !category || basePrice === undefined) {
      return res.status(400).json({ error: 'Name, category and basePrice are required' });
    }

    const newSku: ProductSKU = {
      id: `sku_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      category: category.trim(),
      basePrice: Number(basePrice),
      targetStationId,
      prepTimeSeconds: Number(prepTimeSeconds) || 45,
      image: image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
      description: description || '',
      isRecommended: Boolean(isRecommended),
      applicableModifierGroupIds: targetStationId === 'station_bar' ? ['mod_cup_size', 'mod_sweetness', 'mod_temperature', 'mod_toppings'] : targetStationId === 'station_grill' ? ['mod_burger_addons'] : [],
    };

    productsDb.unshift(newSku);
    broadcastWSEvent('MENU_UPDATED', { products: productsDb });
    res.json({ success: true, product: newSku, products: productsDb });
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

// SaaS Admin Endpoints: Staff & Permissions RBAC
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
      avatar: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1534528741775-53994a69daeb' : '1507003211169-0a1dd7228f2d'}?w=100&auto=format&fit=crop&q=80`,
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


// 2. Client H5 Pre-Order / Checkout Intent
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
      const sku = INITIAL_PRODUCTS.find(p => p.id === cartItem.skuId);
      if (!sku) throw new Error(`SKU not found: ${cartItem.skuId}`);

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
        orderId: '', // populated below
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
      storeId: STORE_CONFIG.storeId,
      tenantId: STORE_CONFIG.tenantId,
      orderNo: 'ORD' + now,
      pickupCode: '', // Generated upon successful payment callback!
      channel,
      status: 'UNPAID',
      paymentStatus: 'PENDING',
      paymentMethod: 'STRIPE_CARD',
      stripePaymentIntentId: `pi_mock_${now}_${Math.random().toString(36).substring(7)}`,
      currency: '¥',
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

// 3. Simulated Stripe Webhook (Instant Payment Confirmation & KDS Task Routing)
app.post('/api/webhook/stripe', (req, res) => {
  try {
    const { orderId, eventType = 'payment_intent.succeeded', paymentMethod = 'STRIPE_CARD' } = req.body;
    const order = ordersDb.find(o => o.id === orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found for webhook' });
    }

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

    // Split tasks for KDS
    order.items.forEach(item => {
      item.stationStatus = 'PENDING';
    });

    const queueSummary = calculateQueueSummary();

    // Broadcast Realtime Events
    broadcastWSEvent('PAYMENT_CONFIRMED', {
      order,
      pickupCode,
      cloudPrintJob: {
        printerId: 'PRINTER_CLOUD_BAR_01',
        title: `【茶野集】取餐码: ${pickupCode}`,
        items: order.items.map(it => ({
          name: it.productName,
          spec: it.selectedModifiers.map(m => m.itemName).join(' / '),
          quantity: it.quantity,
          station: it.targetStationId,
        })),
        createdAt: new Date(now).toLocaleTimeString(),
      },
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

// 3.1 Counter Assisted POS Ordering & Direct Payment Settlement (Cash, POS Card, or Counter QR)
app.post('/api/counter/order/create-and-pay', (req, res) => {
  try {
    const { items, paymentMethod = 'CASH', cashDetails, cardDetails, customerPhone, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least 1 item' });
    }

    const now = Date.now();
    let calculatedTotal = 0;
    let totalItemsCount = 0;
    const orderItems: OrderItem[] = [];

    items.forEach((cartItem: any, idx: number) => {
      const sku = INITIAL_PRODUCTS.find(p => p.id === (cartItem.skuId || cartItem.sku?.id));
      if (!sku) throw new Error(`SKU not found: ${cartItem.skuId || cartItem.sku?.id}`);

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
        orderId: '', // set below
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
      storeId: STORE_CONFIG.storeId,
      tenantId: STORE_CONFIG.tenantId,
      orderNo: 'POS' + now,
      pickupCode,
      channel: 'COUNTER_POS',
      status: 'PENDING',
      paymentStatus: 'PAID',
      paymentMethod,
      cashDetails: cashDetails || (paymentMethod === 'CASH' ? { receivedAmount: calculatedTotal, changeAmount: 0 } : undefined),
      cardDetails: cardDetails || (paymentMethod === 'POS_CARD' ? { cardLast4: '8899', authCode: `AUTH_${Math.floor(100000 + Math.random() * 900000)}` } : undefined),
      currency: '¥',
      totalAmount: calculatedTotal,
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

    // Broadcast Realtime Event to KDS Stations, Call Screens, and Cloud Printers
    broadcastWSEvent('PAYMENT_CONFIRMED', {
      order: newOrder,
      pickupCode,
      cloudPrintJob: {
        printerId: 'PRINTER_COUNTER_POS_01',
        title: `【吧台收银】取餐码: ${pickupCode}`,
        items: newOrder.items.map(it => ({
          name: it.productName,
          spec: it.selectedModifiers.map(m => m.itemName).join(' / '),
          quantity: it.quantity,
          station: it.targetStationId,
        })),
        payment: {
          method: paymentMethod,
          total: calculatedTotal,
          cashReceived: cashDetails?.receivedAmount,
          cashChange: cashDetails?.changeAmount,
        },
        createdAt: new Date(now).toLocaleTimeString(),
      },
      queue: queueSummary,
    });

    res.json({
      success: true,
      order: newOrder,
      pickupCode,
      queue: queueSummary,
      receiptPreview: {
        storeName: STORE_CONFIG.storeName,
        orderNo: newOrder.orderNo,
        pickupCode,
        channel: '吧台现场收银',
        cashier: '01号收银员 (吧台总控)',
        paymentMethod: paymentMethod === 'CASH' ? '现金支付' : paymentMethod === 'POS_CARD' ? 'POS刷卡支付' : paymentMethod === 'COUNTER_WECHAT' ? '微信扫码' : '支付宝扫码',
        totalAmount: calculatedTotal,
        cashDetails: newOrder.cashDetails,
        cardDetails: newOrder.cardDetails,
        time: new Date(now).toLocaleString(),
        items: newOrder.items.map(it => ({
          name: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          modifiers: it.selectedModifiers.map(m => m.itemName).join(', ')
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Counter order creation failed' });
  }
});

// 4. Get Orders List (for C-End Tracking or B-End History)
app.get('/api/orders', (req, res) => {
  const { status, pickupCode, limit = 50 } = req.query;
  let filtered = [...ordersDb];

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

// 5. Get Specific Order (C-End Live Status Tracking)
app.get('/api/order/:id', (req, res) => {
  const order = ordersDb.find(o => o.id === req.params.id || o.pickupCode === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  // Calculate dynamic queue position
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

// 6. KDS Station Tasks Query (Includes Batch Aggregation)
app.get('/api/kds/station/:stationId/tasks', (req, res) => {
  const { stationId } = req.params;
  const isExpo = stationId === 'station_expo';

  // Orders that are currently in kitchen
  const activeOrders = ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING' || (isExpo && o.status === 'READY'));

  // If Expo, show full orders with their station breakdown
  if (isExpo) {
    return res.json({
      stationId,
      stationName: '总控装配打包台 (Expo)',
      activeOrders: activeOrders.map(order => {
        const allItemsDone = order.items.every(i => i.stationStatus === 'DONE');
        return {
          ...order,
          allItemsDone,
        };
      }),
      queue: calculateQueueSummary(),
    });
  }

  // If specific making station (Water Bar, Fryer, Grill)
  const stationOrders: any[] = [];
  const batchMap = new Map<string, BatchAggregationItem>();

  activeOrders.forEach(order => {
    const stationItems = order.items.filter(i => i.targetStationId === stationId);
    if (stationItems.length > 0) {
      stationOrders.push({
        orderId: order.id,
        orderNo: order.orderNo,
        pickupCode: order.pickupCode,
        channel: order.channel,
        orderStatus: order.status,
        createdAt: order.createdAt,
        paidAt: order.paidAt || order.createdAt,
        items: stationItems,
      });

      // Populate batch aggregation map for pending/making items
      stationItems.forEach(item => {
        if (item.stationStatus !== 'DONE') {
          const modSummary = item.selectedModifiers.map(m => m.itemName).sort().join(', ');
          const signature = `${item.skuId}___${modSummary}`;

          const existing = batchMap.get(signature);
          const elapsedSec = Math.floor((Date.now() - (order.paidAt || order.createdAt)) / 1000);

          if (existing) {
            existing.totalQuantity += item.quantity;
            existing.orderRefs.push({
              orderId: order.id,
              pickupCode: order.pickupCode,
              quantity: item.quantity,
              elapsedSeconds: elapsedSec,
            });
            if (order.createdAt < existing.earliestCreatedAt) {
              existing.earliestCreatedAt = order.createdAt;
            }
          } else {
            batchMap.set(signature, {
              skuId: item.skuId,
              productName: item.productName,
              targetStationId: stationId,
              modifierSignature: signature,
              modifierSummary: modSummary || '标准原味',
              totalQuantity: item.quantity,
              orderRefs: [{
                orderId: order.id,
                pickupCode: order.pickupCode,
                quantity: item.quantity,
                elapsedSeconds: elapsedSec,
              }],
              earliestCreatedAt: order.createdAt,
            });
          }
        }
      });
    }
  });

  const batchAggregation = Array.from(batchMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);

  res.json({
    stationId,
    stationName: KDS_STATIONS.find(s => s.id === stationId)?.name || stationId,
    orders: stationOrders,
    batchAggregation,
    queue: calculateQueueSummary(),
  });
});

// 7. KDS Bump Action (Single item or all items of order at station)
app.post('/api/kds/task/bump', (req, res) => {
  try {
    const { orderId, itemId, stationId, action = 'BUMP_ITEM' } = req.body;
    const order = ordersDb.find(o => o.id === orderId);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const now = Date.now();

    if (action === 'BUMP_ALL_STATION' && stationId) {
      order.items.forEach(item => {
        if (item.targetStationId === stationId) {
          item.stationStatus = 'DONE';
          item.completedAt = now;
        }
      });
    } else if (itemId) {
      const item = order.items.find(i => i.itemId === itemId);
      if (item) {
        if (item.stationStatus === 'PENDING') {
          item.stationStatus = 'MAKING';
          item.startedAt = now;
        } else if (item.stationStatus === 'MAKING') {
          item.stationStatus = 'DONE';
          item.completedAt = now;
        } else {
          item.stationStatus = 'DONE';
          item.completedAt = now;
        }
      }
    }

    // Check if order was PENDING and at least one item is now MAKING
    const anyMaking = order.items.some(i => i.stationStatus === 'MAKING' || i.stationStatus === 'DONE');
    if (order.status === 'PENDING' && anyMaking) {
      order.status = 'MAKING';
    }

    // Check if ALL items in order across all stations are DONE
    const allDone = order.items.every(i => i.stationStatus === 'DONE');
    if (allDone && order.status !== 'COMPLETED') {
      order.status = 'READY';
      order.readyAt = now;

      // Broadcast order ready event for Calling Screen & TTS
      broadcastWSEvent('ORDER_READY', {
        orderId: order.id,
        pickupCode: order.pickupCode,
        voiceText: `请 ${order.pickupCode} 号到取餐口取餐`,
        order,
        queue: calculateQueueSummary(),
      });
    } else {
      broadcastWSEvent('TASK_BUMPED', {
        orderId: order.id,
        pickupCode: order.pickupCode,
        itemId,
        stationId,
        orderStatus: order.status,
        queue: calculateQueueSummary(),
      });
    }

    res.json({
      success: true,
      order,
      queue: calculateQueueSummary(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Expo Trigger Call / Voice Broadcast Again
app.post('/api/kds/expo/call', (req, res) => {
  const { orderId, pickupCode } = req.body;
  const order = ordersDb.find(o => o.id === orderId || o.pickupCode === pickupCode);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.status !== 'READY' && order.status !== 'COMPLETED') {
    order.status = 'READY';
    order.readyAt = Date.now();
  }

  broadcastWSEvent('ORDER_READY', {
    orderId: order.id,
    pickupCode: order.pickupCode,
    voiceText: `请 ${order.pickupCode} 号到取餐口取餐`,
    order,
    queue: calculateQueueSummary(),
  });

  res.json({
    success: true,
    pickupCode: order.pickupCode,
    status: order.status,
  });
});

// 9. Scan Code / Complete Order
app.post('/api/kds/order/complete', (req, res) => {
  const { orderId, pickupCode } = req.body;
  const order = ordersDb.find(o => o.id === orderId || o.pickupCode === pickupCode);

  if (!order) return res.status(404).json({ error: 'Order not found with provided code' });

  const now = Date.now();
  order.status = 'COMPLETED';
  order.completedAt = now;

  broadcastWSEvent('ORDER_COMPLETED', {
    orderId: order.id,
    pickupCode: order.pickupCode,
    turnaroundSeconds: Math.floor((now - order.createdAt) / 1000),
    queue: calculateQueueSummary(),
  });

  res.json({
    success: true,
    order,
    queue: calculateQueueSummary(),
  });
});

// 10. Toggle Sku Sold Out
app.post('/api/kds/sku/soldout', (req, res) => {
  const { skuId, isSoldOut } = req.body;
  if (isSoldOut) {
    soldOutSkuIds.add(skuId);
  } else {
    soldOutSkuIds.delete(skuId);
  }

  broadcastWSEvent('ITEM_SOLDOUT_CHANGED', {
    skuId,
    isSoldOut,
  });

  res.json({ success: true, soldOutSkuIds: Array.from(soldOutSkuIds) });
});

// 11. High-Concurrency Traffic Simulation Endpoint
app.post('/api/simulate/traffic', (req, res) => {
  const { count = 3 } = req.body;
  const createdList: OrderMaster[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const randomSku = INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)];
    const randomSku2 = Math.random() > 0.4 ? INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)] : null;

    const items: OrderItem[] = [
      {
        itemId: `sim_item_${now}_${i}_1`,
        orderId: '',
        skuId: randomSku.id,
        productName: randomSku.name,
        category: randomSku.category,
        quantity: Math.floor(Math.random() * 2) + 1,
        unitPrice: randomSku.basePrice + 2,
        totalPrice: (randomSku.basePrice + 2) * 1,
        targetStationId: randomSku.targetStationId,
        selectedModifiers: [
          { groupId: 'mod_sweetness', groupName: '甜度选择', itemId: 'sweet_70', itemName: '七分甜 (70%)', price: 0 },
          { groupId: 'mod_toppings', groupName: '风味加料', itemId: 'top_boba', itemName: '黑糖琥珀珍珠', price: 2 },
        ],
        stationStatus: 'PENDING',
        prepTimeSeconds: randomSku.prepTimeSeconds,
      }
    ];

    if (randomSku2) {
      items.push({
        itemId: `sim_item_${now}_${i}_2`,
        orderId: '',
        skuId: randomSku2.id,
        productName: randomSku2.name,
        category: randomSku2.category,
        quantity: 1,
        unitPrice: randomSku2.basePrice,
        totalPrice: randomSku2.basePrice,
        targetStationId: randomSku2.targetStationId,
        selectedModifiers: [],
        stationStatus: 'PENDING',
        prepTimeSeconds: randomSku2.prepTimeSeconds,
      });
    }

    const orderId = `sim_ord_${now}_${i}`;
    items.forEach(it => it.orderId = orderId);

    const pickupCode = generatePickupCode('QR_H5');
    const totalAmount = items.reduce((sum, it) => sum + it.totalPrice, 0);

    const simOrder: OrderMaster = {
      id: orderId,
      storeId: STORE_CONFIG.storeId,
      tenantId: STORE_CONFIG.tenantId,
      orderNo: 'ORD' + (now + i * 100),
      pickupCode,
      channel: 'QR_H5',
      status: 'PENDING',
      paymentStatus: 'PAID',
      paymentMethod: 'STRIPE_CARD',
      currency: '¥',
      totalAmount,
      itemsCount: items.reduce((s, it) => s + it.quantity, 0),
      items,
      createdAt: now + i * 200,
      paidAt: now + i * 200 + 50,
      estimatedWaitMinutes: Math.max(5, Math.ceil(items.length * 2.5)),
      queuePosition: ordersDb.filter(o => o.status === 'PENDING' || o.status === 'MAKING').length + 1,
    };

    ordersDb.unshift(simOrder);
    createdList.push(simOrder);

    broadcastWSEvent('PAYMENT_CONFIRMED', {
      order: simOrder,
      pickupCode,
      queue: calculateQueueSummary(),
    });
  }

  res.json({
    success: true,
    message: `Generated ${count} high-concurrency peak orders with instant Webhook verification`,
    orders: createdList,
    queue: calculateQueueSummary(),
  });
});

// 12. Full System Architecture, MySQL 8.0 DDL & Master Prompt Spec
app.get('/api/architecture/spec', (req, res) => {
  const ddl = `
-- =========================================================================
-- 无座茶饮与快餐业态 SaaS 生产级 MySQL 8.0 DDL 架构设计脚本
-- 核心特性：多租户隔离、先付流水排队、树状多层级规格变价、KDS多工位解耦
-- =========================================================================

CREATE DATABASE IF NOT EXISTS \`seatless_catering_saas\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`seatless_catering_saas\`;

-- 1. 租户表
CREATE TABLE IF NOT EXISTS \`tenant\` (
  \`tenant_id\` VARCHAR(32) NOT NULL COMMENT '租户ID (如 TENANT_001)',
  \`name\` VARCHAR(128) NOT NULL COMMENT '品牌/租户企业名称',
  \`contact_name\` VARCHAR(64) NULL COMMENT '联系人',
  \`contact_phone\` VARCHAR(32) NULL COMMENT '联系电话',
  \`status\` ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE' COMMENT '状态',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`tenant_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户基础表';

-- 2. 门店表
CREATE TABLE IF NOT EXISTS \`store\` (
  \`store_id\` VARCHAR(32) NOT NULL COMMENT '门店ID',
  \`tenant_id\` VARCHAR(32) NOT NULL COMMENT '所属租户ID',
  \`name\` VARCHAR(128) NOT NULL COMMENT '门店名称 (如 科技园旗舰店)',
  \`address\` VARCHAR(255) NOT NULL COMMENT '门店物理地址',
  \`business_status\` ENUM('OPEN', 'CLOSED', 'BUSY') NOT NULL DEFAULT 'OPEN',
  \`timezone\` VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
  \`operating_hours\` VARCHAR(64) NOT NULL DEFAULT '09:00-22:00',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`store_id\`),
  INDEX \`idx_tenant_store\` (\`tenant_id\`, \`business_status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门店配置表';

-- 3. KDS 工作站配置表
CREATE TABLE IF NOT EXISTS \`kds_station\` (
  \`station_id\` VARCHAR(32) NOT NULL COMMENT '工作站唯一ID (如 station_bar)',
  \`store_id\` VARCHAR(32) NOT NULL COMMENT '门店ID',
  \`tenant_id\` VARCHAR(32) NOT NULL COMMENT '租户ID',
  \`name\` VARCHAR(64) NOT NULL COMMENT '站台名称 (水吧台/炸台/煎烤台/Expo总控)',
  \`station_type\` ENUM('MAKING', 'EXPO') NOT NULL DEFAULT 'MAKING' COMMENT '站台类型',
  \`sort_order\` INT NOT NULL DEFAULT 0 COMMENT '排序权重',
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`station_id\`),
  INDEX \`idx_store_station\` (\`store_id\`, \`station_type\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='KDS厨房显示工作站配置表';

-- 4. 商品与SKU体系 (分类、SPU、SKU)
CREATE TABLE IF NOT EXISTS \`product_category\` (
  \`category_id\` VARCHAR(32) NOT NULL,
  \`store_id\` VARCHAR(32) NOT NULL,
  \`tenant_id\` VARCHAR(32) NOT NULL,
  \`name\` VARCHAR(64) NOT NULL COMMENT '分类名称 (招牌鲜奶茶/炸鸡小食)',
  \`sort_order\` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (\`category_id\`),
  INDEX \`idx_store_cat\` (\`store_id\`, \`sort_order\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品类目表';

CREATE TABLE IF NOT EXISTS \`product_sku\` (
  \`sku_id\` VARCHAR(32) NOT NULL,
  \`category_id\` VARCHAR(32) NOT NULL,
  \`store_id\` VARCHAR(32) NOT NULL,
  \`tenant_id\` VARCHAR(32) NOT NULL,
  \`name\` VARCHAR(128) NOT NULL COMMENT '单品名称',
  \`base_price\` DECIMAL(10,2) NOT NULL COMMENT '基础售价',
  \`image_url\` VARCHAR(512) NULL,
  \`target_station_id\` VARCHAR(32) NOT NULL COMMENT '默认路由到的制作站台',
  \`prep_time_seconds\` INT NOT NULL DEFAULT 60 COMMENT '标准工时SLA(秒)',
  \`is_sold_out\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否沽清',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`sku_id\`),
  INDEX \`idx_store_sku\` (\`store_id\`, \`category_id\`, \`is_sold_out\`),
  INDEX \`idx_station_sku\` (\`target_station_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品SKU表';

-- 5. 树状规格加料组与选项表
CREATE TABLE IF NOT EXISTS \`modifier_group\` (
  \`group_id\` VARCHAR(32) NOT NULL,
  \`tenant_id\` VARCHAR(32) NOT NULL,
  \`name\` VARCHAR(64) NOT NULL COMMENT '规格组名 (甜度/温度/加料)',
  \`type\` ENUM('SINGLE', 'MULTIPLE') NOT NULL DEFAULT 'SINGLE',
  \`min_selections\` INT NOT NULL DEFAULT 0,
  \`max_selections\` INT NOT NULL DEFAULT 1,
  \`is_required\` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (\`group_id\`),
  INDEX \`idx_tenant_modgroup\` (\`tenant_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规格组定义表';

CREATE TABLE IF NOT EXISTS \`modifier_item\` (
  \`item_id\` VARCHAR(32) NOT NULL,
  \`group_id\` VARCHAR(32) NOT NULL,
  \`name\` VARCHAR(64) NOT NULL COMMENT '定制项 (七分甜/少冰/珍珠+2元)',
  \`extra_price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '加价金额',
  \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (\`item_id\`),
  INDEX \`idx_group_item\` (\`group_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规格定制细项表';

-- 6. 主订单表
CREATE TABLE IF NOT EXISTS \`order_master\` (
  \`order_id\` VARCHAR(64) NOT NULL COMMENT '订单唯一ID',
  \`store_id\` VARCHAR(32) NOT NULL,
  \`tenant_id\` VARCHAR(32) NOT NULL,
  \`order_no\` VARCHAR(64) NOT NULL COMMENT '业务订单流水号',
  \`pickup_code\` VARCHAR(16) NOT NULL COMMENT '当日取餐流水码 (如 A001, B002)',
  \`channel\` ENUM('QR_H5', 'KIOSK', 'DELIVERY_AGGREGATOR') NOT NULL DEFAULT 'QR_H5',
  \`status\` ENUM('UNPAID', 'PENDING', 'MAKING', 'READY', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UNPAID',
  \`payment_status\` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  \`payment_method\` VARCHAR(32) NOT NULL DEFAULT 'STRIPE_CARD',
  \`stripe_payment_intent_id\` VARCHAR(128) NULL,
  \`total_amount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  \`items_count\` INT NOT NULL DEFAULT 1,
  \`customer_phone\` VARCHAR(32) NULL,
  \`estimated_wait_minutes\` INT NOT NULL DEFAULT 5,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`paid_at\` DATETIME NULL,
  \`ready_at\` DATETIME NULL,
  \`completed_at\` DATETIME NULL,
  PRIMARY KEY (\`order_id\`),
  UNIQUE INDEX \`uniq_store_bizdate_pickup\` (\`store_id\`, \`created_at\`, \`pickup_code\`),
  INDEX \`idx_store_status_time\` (\`store_id\`, \`status\`, \`created_at\`),
  INDEX \`idx_order_no\` (\`order_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主订单表';

-- 7. 订单明细与制作工单任务表
CREATE TABLE IF NOT EXISTS \`order_item\` (
  \`item_id\` VARCHAR(64) NOT NULL,
  \`order_id\` VARCHAR(64) NOT NULL,
  \`sku_id\` VARCHAR(32) NOT NULL,
  \`product_name\` VARCHAR(128) NOT NULL,
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`unit_price\` DECIMAL(10,2) NOT NULL,
  \`total_price\` DECIMAL(10,2) NOT NULL,
  \`target_station_id\` VARCHAR(32) NOT NULL COMMENT '路由KDS站台',
  \`station_status\` ENUM('PENDING', 'MAKING', 'DONE') NOT NULL DEFAULT 'PENDING',
  \`prep_time_seconds\` INT NOT NULL DEFAULT 60,
  \`started_at\` DATETIME NULL,
  \`completed_at\` DATETIME NULL,
  PRIMARY KEY (\`item_id\`),
  INDEX \`idx_order_item\` (\`order_id\`),
  INDEX \`idx_station_task\` (\`target_station_id\`, \`station_status\`, \`item_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细与工位制作任务表';

-- 8. 订单明细规格加价快照表 (防止后续改价影响历史财务对账)
CREATE TABLE IF NOT EXISTS \`order_item_modifier\` (
  \`snapshot_id\` BIGINT AUTO_INCREMENT,
  \`item_id\` VARCHAR(64) NOT NULL,
  \`group_id\` VARCHAR(32) NOT NULL,
  \`group_name\` VARCHAR(64) NOT NULL,
  \`item_id_ref\` VARCHAR(32) NOT NULL,
  \`item_name\` VARCHAR(64) NOT NULL,
  \`extra_price\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (\`snapshot_id\`),
  INDEX \`idx_item_snapshot\` (\`item_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定制规格变价快照表';
`;

  res.json({
    ddl,
    apiContract: [
      { method: 'POST', path: '/api/order/create', desc: 'C端H5创建预订单，校验树状加料并返回 Stripe ClientSecret' },
      { method: 'POST', path: '/api/webhook/stripe', desc: 'Stripe异步Webhook回调，原子生成取餐流水号并触发KDS路由与云打印' },
      { method: 'GET', path: '/api/kds/station/:stationId/tasks', desc: 'KDS制作站台获取工单列表与同品项聚类看板' },
      { method: 'POST', path: '/api/kds/task/bump', desc: '工位消单(Bump)，整单完成自动拉起总控并触发叫号' },
      { method: 'POST', path: '/api/kds/expo/call', desc: '总控打包台呼叫取餐码，触发叫号大屏翻牌与TTS语音播报' },
      { method: 'POST', path: '/api/kds/order/complete', desc: '扫码枪/取餐码快速核销并归档' },
    ],
    wsTopics: [
      { topic: 'PAYMENT_CONFIRMED', desc: '支付成功，通知KDS刷单与云打印机出杯贴' },
      { topic: 'TASK_BUMPED', desc: '分站完成制作工单消单，更新总控进度' },
      { topic: 'ORDER_READY', desc: '整单制作就绪，叫号大屏翻牌高亮并播报语音' },
      { topic: 'ORDER_COMPLETED', desc: '顾客取餐核销，更新排队看板' },
    ],
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
