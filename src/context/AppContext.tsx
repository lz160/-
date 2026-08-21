import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  OrderMaster, 
  ProductSKU, 
  ModifierGroup, 
  KDSStation, 
  QueueSummary, 
  WSEvent, 
  MenuCategory, 
  StaffUser, 
  PermissionDefinition,
  MerchantAccount,
  StoreEntity,
  InventoryItem,
  InventoryLog,
  CurrencyCode
} from '../types';
import { STORE_CONFIG, KDS_STATIONS, MODIFIER_GROUPS, INITIAL_PRODUCTS } from '../data/menuData';
import { INITIAL_CATEGORIES, INITIAL_STAFF_USERS, PERMISSION_DEFINITIONS } from '../data/adminData';
import { INITIAL_MERCHANTS, INITIAL_STORES } from '../data/merchantStoreData';
import { INITIAL_INVENTORY_ITEMS, INITIAL_INVENTORY_LOGS } from '../data/inventoryData';
import { SupportedLanguage, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../i18n/translations';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../data/currencies';
import { sound } from '../utils/audio';

interface AppContextType {
  store: typeof STORE_CONFIG;
  currentStore: StoreEntity;
  stores: StoreEntity[];
  merchants: MerchantAccount[];
  currentMerchant: MerchantAccount | null;
  stations: KDSStation[];
  modifierGroups: ModifierGroup[];
  categories: MenuCategory[];
  products: ProductSKU[];
  orders: OrderMaster[];
  queueSummary: QueueSummary;
  inventoryItems: InventoryItem[];
  inventoryLogs: InventoryLog[];
  wsConnected: boolean;
  activeOrderForTracking: OrderMaster | null;
  lastCalledCode: string | null;
  audioEnabled: boolean;
  theme: 'light' | 'dark';
  currentLang: SupportedLanguage;
  currentStaffUser: StaffUser;
  staffUsers: StaffUser[];
  permissionsList: PermissionDefinition[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrentLang: (lang: SupportedLanguage) => void;
  setCurrentStaffUser: (user: StaffUser) => void;
  setCurrentStore: (store: StoreEntity) => void;
  switchActiveStore: (storeId: string) => void;
  t: (key: string) => string;
  formatPrice: (amount: number, currencyCode?: CurrencyCode | string) => string;
  setAudioEnabled: (enabled: boolean) => void;
  setActiveOrderForTracking: (order: OrderMaster | null) => void;
  refreshOrders: () => Promise<void>;
  fetchMenu: (targetStoreId?: string) => Promise<void>;
  fetchMerchants: () => Promise<void>;
  fetchStores: () => Promise<void>;
  fetchInventory: (targetStoreId?: string) => Promise<void>;
  
  // Order Operations
  createOrder: (items: any[], customerPhone?: string, notes?: string) => Promise<any>;
  createCounterOrderAndPay: (payload: {
    items: any[];
    paymentMethod: 'CASH' | 'POS_CARD';
    cashDetails?: { receivedAmount: number; changeAmount: number };
    cardDetails?: { cardLast4: string; authCode: string };
    customerPhone?: string;
    notes?: string;
    storeId?: string;
  }) => Promise<any>;
  triggerStripeWebhook: (orderId: string) => Promise<any>;
  bumpKdsTask: (orderId: string, itemId?: string, stationId?: string, action?: string) => Promise<any>;
  callExpoOrder: (orderId: string, pickupCode: string) => Promise<any>;
  completeOrder: (pickupCode: string) => Promise<any>;
  simulateTraffic: (count?: number) => Promise<any>;
  toggleSkuSoldOut: (skuId: string, isSoldOut: boolean) => Promise<void>;
  
  // Category Admin CRUD
  createCategory: (name: string, icon?: string, sortOrder?: number, targetStoreId?: string) => Promise<any>;
  updateCategory: (id: string, updates: Partial<MenuCategory>) => Promise<any>;
  deleteCategory: (id: string) => Promise<any>;

  // Product Admin CRUD
  createProduct: (product: Partial<ProductSKU>) => Promise<any>;
  updateProduct: (id: string, updates: Partial<ProductSKU>) => Promise<any>;
  deleteProduct: (id: string) => Promise<any>;

  // Staff & RBAC Admin CRUD
  createStaffUser: (staff: Partial<StaffUser>) => Promise<any>;
  updateStaffUser: (id: string, updates: Partial<StaffUser>) => Promise<any>;
  deleteStaffUser: (id: string) => Promise<any>;
  hasPermission: (permissionId: string) => boolean;

  // Merchant Management (Vendor SUPER_ADMIN)
  createMerchantAccount: (merchant: Partial<MerchantAccount>) => Promise<any>;
  updateMerchantAccount: (id: string, updates: Partial<MerchantAccount>) => Promise<any>;
  deleteMerchantAccount: (id: string) => Promise<any>;

  // Store Management (Vendor SUPER_ADMIN)
  createStoreEntity: (store: Partial<StoreEntity>) => Promise<any>;
  updateStoreEntity: (id: string, updates: Partial<StoreEntity>) => Promise<any>;
  assignStoreToMerchant: (storeId: string, merchantId: string) => Promise<any>;

  // Ingredient Inventory (Store Manager)
  adjustInventory: (payload: {
    itemId: string;
    type: 'RESTOCK' | 'CONSUME' | 'WASTE' | 'CALIBRATE';
    delta?: number;
    targetBalance?: number;
    notes?: string;
  }) => Promise<any>;
  createInventoryItem: (item: Partial<InventoryItem>) => Promise<any>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<MenuCategory[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<ProductSKU[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<OrderMaster[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(INITIAL_STAFF_USERS);
  
  // Multi-merchant & Multi-store state
  const [merchants, setMerchants] = useState<MerchantAccount[]>(INITIAL_MERCHANTS);
  const [stores, setStores] = useState<StoreEntity[]>(INITIAL_STORES);
  const [currentStore, setCurrentStore] = useState<StoreEntity>(INITIAL_STORES[0]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(INITIAL_INVENTORY_ITEMS);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(INITIAL_INVENTORY_LOGS);

  // Active Role User (Default to Super Admin)
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser>(INITIAL_STAFF_USERS[0]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Requested Pure Light Style
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('zh');

  const [queueSummary, setQueueSummary] = useState<QueueSummary>({
    waitingCups: 0,
    makingOrdersCount: 0,
    readyOrdersCount: 0,
    completedTodayCount: 0,
    avgWaitTimeMinutes: 0,
    currentCallingCodes: [],
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [activeOrderForTracking, setActiveOrderForTracking] = useState<OrderMaster | null>(null);
  const [lastCalledCode, setLastCalledCode] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Get current merchant associated with currentStore or currentStaffUser
  const currentMerchant = merchants.find(m => m.id === currentStore.merchantId) || (currentStaffUser.merchantId ? merchants.find(m => m.id === currentStaffUser.merchantId) : null) || null;

  // i18n Translation Lookup
  const t = useCallback((key: string): string => {
    const langDict = TRANSLATIONS[currentLang] || TRANSLATIONS.zh;
    return langDict[key] || TRANSLATIONS.zh[key] || key;
  }, [currentLang]);

  // Format Price with active store currency
  const formatPrice = useCallback((amount: number, currencyCode?: CurrencyCode | string): string => {
    const code = (currencyCode || currentStore.currency || 'EUR') as CurrencyCode;
    return formatCurrency(amount, code);
  }, [currentStore.currency]);

  // RBAC Permission Checker
  const hasPermission = useCallback((permissionId: string): boolean => {
    if (!currentStaffUser) return false;
    if (currentStaffUser.role === 'SUPER_ADMIN') return true;
    if (currentStaffUser.role === 'MERCHANT') {
      // Merchant has access to all store management, analytics, products, staff, but CANNOT create stores or manage SaaS vendors
      if (permissionId === 'perm_merchant_manage' || permissionId === 'perm_store_create') {
        return false;
      }
      return true;
    }
    return currentStaffUser.permissions.includes(permissionId);
  }, [currentStaffUser]);

  // Switch Active Store
  const switchActiveStore = useCallback((storeId: string) => {
    const found = stores.find(s => s.id === storeId);
    if (found) {
      setCurrentStore(found);
    }
  }, [stores]);

  // Fetch full state from backend
  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?storeId=${currentStore.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.queue) setQueueSummary(data.queue);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, [currentStore.id]);

  const fetchMenu = useCallback(async (targetStoreId?: string) => {
    try {
      const activeStoreId = targetStoreId || currentStore.id || 'store_default_01';
      const res = await fetch(`/api/menu?storeId=${encodeURIComponent(activeStoreId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.products) setProducts(data.products);
        if (data.categories) setCategories(data.categories);
        if (data.queue) setQueueSummary(data.queue);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  }, [currentStore.id]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        if (data.staff) setStaffUsers(data.staff);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  }, []);

  const fetchMerchants = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/merchants');
      if (res.ok) {
        const data = await res.json();
        if (data.merchants) setMerchants(data.merchants);
      }
    } catch (err) {
      console.error('Failed to fetch merchants:', err);
    }
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stores');
      if (res.ok) {
        const data = await res.json();
        if (data.stores) {
          setStores(data.stores);
          // Keep currentStore updated
          const updatedCurrent = data.stores.find((s: StoreEntity) => s.id === currentStore.id);
          if (updatedCurrent) setCurrentStore(updatedCurrent);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  }, [currentStore.id]);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/inventory?storeId=${currentStore.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.inventory) setInventoryItems(data.inventory);
        if (data.logs) setInventoryLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  }, [currentStore.id]);

  // Auto-detect domain/tenant resolution on startup
  useEffect(() => {
    const resolveDomainTenant = async () => {
      try {
        const hostname = window.location.hostname;
        if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return;
        const res = await fetch(`/api/tenant/resolve?host=${encodeURIComponent(hostname)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.matched && data.store) {
            setCurrentStore(data.store);
          }
        }
      } catch (e) {
        console.warn('Domain resolve check skipped:', e);
      }
    };
    resolveDomainTenant();
  }, []);

  // Setup WebSocket Listener
  useEffect(() => {
    fetchMenu();
    fetchStaff();
    fetchMerchants();
    fetchStores();
    fetchInventory();
    refreshOrders();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWs = () => {
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data: WSEvent = JSON.parse(event.data);
            handleWsEvent(data);
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWs, 3000);
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (e) {
        console.error('WS Connect error:', e);
      }
    };

    connectWs();

    return () => {
      if (socket) socket.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [fetchMenu, fetchStaff, fetchMerchants, fetchStores, fetchInventory, refreshOrders]);

  const handleWsEvent = (event: WSEvent) => {
    refreshOrders();

    if (event.type === 'QUEUE_UPDATE' && event.payload) {
      setQueueSummary(event.payload);
    } else if (event.type === 'PAYMENT_CONFIRMED') {
      sound.playNewOrderChime();
    } else if (event.type === 'TASK_BUMPED') {
      sound.playBumpSound();
    } else if (event.type === 'ORDER_READY') {
      const { pickupCode, voiceText } = event.payload;
      setLastCalledCode(pickupCode);
      sound.playCallingChime();
      if (audioEnabled && voiceText) {
        setTimeout(() => sound.speak(voiceText), 300);
      }
    } else if (event.type === 'ITEM_SOLDOUT_CHANGED' || event.type === 'MENU_UPDATED') {
      fetchMenu();
    } else if (event.type === 'CATEGORIES_UPDATED') {
      fetchMenu();
    } else if (event.type === 'MERCHANTS_UPDATED') {
      fetchMerchants();
    } else if (event.type === 'STORES_UPDATED') {
      fetchStores();
    } else if (event.type === 'INVENTORY_UPDATED') {
      fetchInventory();
    }
  };

  const createOrder = async (items: any[], customerPhone?: string, notes?: string) => {
    const res = await fetch('/api/order/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, customerPhone, notes, channel: 'QR_H5' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '下单失败');
    return data;
  };

  const createCounterOrderAndPay = async (payload: {
    items: any[];
    paymentMethod: 'CASH' | 'POS_CARD';
    cashDetails?: { receivedAmount: number; changeAmount: number };
    cardDetails?: { cardLast4: string; authCode: string };
    customerPhone?: string;
    notes?: string;
    storeId?: string;
  }) => {
    const res = await fetch('/api/counter/order/create-and-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        storeId: payload.storeId || currentStore.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '吧台收银结算失败');
    await refreshOrders();
    return data;
  };

  const triggerStripeWebhook = async (orderId: string) => {
    const res = await fetch('/api/webhook/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        eventType: 'payment_intent.succeeded',
        paymentMethod: 'STRIPE_CARD',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '支付回调确认失败');
    await refreshOrders();
    return data;
  };

  const bumpKdsTask = async (orderId: string, itemId?: string, stationId?: string, action = 'BUMP_ITEM') => {
    const res = await fetch('/api/kds/task/bump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, itemId, stationId, action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '消单失败');
    await refreshOrders();
    return data;
  };

  const callExpoOrder = async (orderId: string, pickupCode: string) => {
    const res = await fetch('/api/kds/expo/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, pickupCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '呼叫失败');
    return data;
  };

  const completeOrder = async (pickupCode: string) => {
    const res = await fetch('/api/kds/order/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickupCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '核销失败');
    await refreshOrders();
    return data;
  };

  const simulateTraffic = async (count = 3) => {
    const res = await fetch('/api/simulate/traffic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '并发压测生成失败');
    await refreshOrders();
    return data;
  };

  const toggleSkuSoldOut = async (skuId: string, isSoldOut: boolean) => {
    await fetch('/api/kds/sku/soldout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skuId, isSoldOut }),
    });
    await fetchMenu();
  };

  // Category Admin CRUD Handlers
  const createCategory = async (name: string, icon = 'CupSoda', sortOrder?: number, targetStoreId?: string) => {
    const storeId = targetStoreId || currentStore.id || 'store_default_01';
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon, sortOrder, storeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '添加分类失败');
    await fetchMenu(storeId);
    return data;
  };

  const updateCategory = async (id: string, updates: Partial<MenuCategory>) => {
    const storeId = updates.storeId || currentStore.id || 'store_default_01';
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, storeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新分类失败');
    await fetchMenu(storeId);
    return data;
  };

  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除分类失败');
    await fetchMenu(currentStore.id);
    return data;
  };

  // Product Admin CRUD Handlers
  const createProduct = async (product: Partial<ProductSKU>) => {
    const storeId = product.storeId || currentStore.id || 'store_default_01';
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, storeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '创建商品失败');
    await fetchMenu(storeId);
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<ProductSKU>) => {
    const storeId = updates.storeId || currentStore.id || 'store_default_01';
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, storeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新商品失败');
    await fetchMenu(storeId);
    return data;
  };

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除商品失败');
    await fetchMenu(currentStore.id);
    return data;
  };

  // Staff & RBAC Admin CRUD Handlers
  const createStaffUser = async (staff: Partial<StaffUser>) => {
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '创建员工失败');
    await fetchStaff();
    return data;
  };

  const updateStaffUser = async (id: string, updates: Partial<StaffUser>) => {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新员工失败');
    await fetchStaff();
    return data;
  };

  const deleteStaffUser = async (id: string) => {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除员工失败');
    await fetchStaff();
    return data;
  };

  // Merchant Account Management Handlers
  const createMerchantAccount = async (merchant: Partial<MerchantAccount>) => {
    const res = await fetch('/api/admin/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merchant),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '创建商家账户失败');
    await fetchMerchants();
    await fetchStores();
    return data;
  };

  const updateMerchantAccount = async (id: string, updates: Partial<MerchantAccount>) => {
    const res = await fetch(`/api/admin/merchants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新商家账户失败');
    await fetchMerchants();
    await fetchStores();
    return data;
  };

  const deleteMerchantAccount = async (id: string) => {
    const res = await fetch(`/api/admin/merchants/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除商家账户失败');
    await fetchMerchants();
    await fetchStores();
    return data;
  };

  // Store Management Handlers
  const createStoreEntity = async (store: Partial<StoreEntity>) => {
    const res = await fetch('/api/admin/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '创建店铺失败');
    await fetchStores();
    await fetchMerchants();
    return data;
  };

  const updateStoreEntity = async (id: string, updates: Partial<StoreEntity>) => {
    const res = await fetch(`/api/admin/stores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新店铺失败');
    await fetchStores();
    await fetchMerchants();
    return data;
  };

  const assignStoreToMerchant = async (storeId: string, merchantId: string) => {
    const res = await fetch(`/api/admin/stores/${storeId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '分配店铺失败');
    await fetchStores();
    await fetchMerchants();
    return data;
  };

  // Inventory Management Handlers
  const adjustInventory = async (payload: {
    itemId: string;
    type: 'RESTOCK' | 'CONSUME' | 'WASTE' | 'CALIBRATE';
    delta?: number;
    targetBalance?: number;
    notes?: string;
  }) => {
    const res = await fetch('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        operator: currentStaffUser.name,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '库存调整失败');
    await fetchInventory();
    return data;
  };

  const createInventoryItem = async (item: Partial<InventoryItem>) => {
    const res = await fetch('/api/admin/inventory/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...item,
        storeId: currentStore.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '添加原料物料失败');
    await fetchInventory();
    return data;
  };

  return (
    <AppContext.Provider
      value={{
        store: STORE_CONFIG,
        currentStore,
        stores,
        merchants,
        currentMerchant,
        stations: KDS_STATIONS,
        modifierGroups: MODIFIER_GROUPS,
        categories,
        products,
        orders,
        queueSummary,
        inventoryItems,
        inventoryLogs,
        wsConnected,
        activeOrderForTracking,
        lastCalledCode,
        audioEnabled,
        theme,
        currentLang,
        currentStaffUser,
        staffUsers,
        permissionsList: PERMISSION_DEFINITIONS,
        setTheme,
        setCurrentLang,
        setCurrentStaffUser,
        setCurrentStore,
        switchActiveStore,
        t,
        formatPrice,
        setAudioEnabled,
        setActiveOrderForTracking,
        refreshOrders,
        fetchMenu,
        fetchMerchants,
        fetchStores,
        fetchInventory,
        createOrder,
        createCounterOrderAndPay,
        triggerStripeWebhook,
        bumpKdsTask,
        callExpoOrder,
        completeOrder,
        simulateTraffic,
        toggleSkuSoldOut,
        createCategory,
        updateCategory,
        deleteCategory,
        createProduct,
        updateProduct,
        deleteProduct,
        createStaffUser,
        updateStaffUser,
        deleteStaffUser,
        hasPermission,
        createMerchantAccount,
        updateMerchantAccount,
        deleteMerchantAccount,
        createStoreEntity,
        updateStoreEntity,
        assignStoreToMerchant,
        adjustInventory,
        createInventoryItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
