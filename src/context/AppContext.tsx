import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { OrderMaster, ProductSKU, ModifierGroup, KDSStation, QueueSummary, WSEvent, MenuCategory, StaffUser, PermissionDefinition } from '../types';
import { STORE_CONFIG, KDS_STATIONS, MODIFIER_GROUPS, INITIAL_PRODUCTS } from '../data/menuData';
import { INITIAL_CATEGORIES, INITIAL_STAFF_USERS, PERMISSION_DEFINITIONS } from '../data/adminData';
import { SupportedLanguage, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../i18n/translations';
import { sound } from '../utils/audio';

interface AppContextType {
  store: typeof STORE_CONFIG;
  stations: KDSStation[];
  modifierGroups: ModifierGroup[];
  categories: MenuCategory[];
  products: ProductSKU[];
  orders: OrderMaster[];
  queueSummary: QueueSummary;
  wsConnected: boolean;
  activeOrderForTracking: OrderMaster | null;
  lastCalledCode: string | null;
  audioEnabled: boolean;
  theme: 'light' | 'dark';
  currentLang: SupportedLanguage;
  currentStaffUser: StaffUser;
  staffUsers: StaffUser[];
  permissionsList: PermissionDefinition[];
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrentLang: (lang: SupportedLanguage) => void;
  setCurrentStaffUser: (user: StaffUser) => void;
  t: (key: string) => string;
  setAudioEnabled: (enabled: boolean) => void;
  setActiveOrderForTracking: (order: OrderMaster | null) => void;
  refreshOrders: () => Promise<void>;
  fetchMenu: () => Promise<void>;
  createOrder: (items: any[], customerPhone?: string, notes?: string) => Promise<any>;
  createCounterOrderAndPay: (payload: {
    items: any[];
    paymentMethod: 'CASH' | 'POS_CARD' | 'COUNTER_WECHAT' | 'COUNTER_ALIPAY';
    cashDetails?: { receivedAmount: number; changeAmount: number };
    cardDetails?: { cardLast4: string; authCode: string };
    customerPhone?: string;
    notes?: string;
  }) => Promise<any>;
  triggerStripeWebhook: (orderId: string) => Promise<any>;
  bumpKdsTask: (orderId: string, itemId?: string, stationId?: string, action?: string) => Promise<any>;
  callExpoOrder: (orderId: string, pickupCode: string) => Promise<any>;
  completeOrder: (pickupCode: string) => Promise<any>;
  simulateTraffic: (count?: number) => Promise<any>;
  toggleSkuSoldOut: (skuId: string, isSoldOut: boolean) => Promise<void>;
  
  // Category Admin CRUD
  createCategory: (name: string, icon?: string, sortOrder?: number) => Promise<any>;
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
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<MenuCategory[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<ProductSKU[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<OrderMaster[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(INITIAL_STAFF_USERS);
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser>(INITIAL_STAFF_USERS[1]); // Default to Store Manager (陈雅欣)
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Default to requested Light Style
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('zh');

  const [queueSummary, setQueueSummary] = useState<QueueSummary>({
    waitingCups: 4,
    makingOrdersCount: 2,
    readyOrdersCount: 1,
    completedTodayCount: 1,
    avgWaitTimeMinutes: 6,
    currentCallingCodes: ['A002'],
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [activeOrderForTracking, setActiveOrderForTracking] = useState<OrderMaster | null>(null);
  const [lastCalledCode, setLastCalledCode] = useState<string | null>('A002');
  const [audioEnabled, setAudioEnabled] = useState(true);

  // i18n Translation Lookup
  const t = useCallback((key: string): string => {
    const langDict = TRANSLATIONS[currentLang] || TRANSLATIONS.zh;
    return langDict[key] || TRANSLATIONS.zh[key] || key;
  }, [currentLang]);

  // RBAC Permission Checker
  const hasPermission = useCallback((permissionId: string): boolean => {
    if (!currentStaffUser) return false;
    if (currentStaffUser.role === 'SUPER_ADMIN') return true;
    return currentStaffUser.permissions.includes(permissionId);
  }, [currentStaffUser]);

  // Fetch full state from backend
  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.queue) setQueueSummary(data.queue);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        if (data.products) setProducts(data.products);
        if (data.categories) setCategories(data.categories);
        if (data.queue) setQueueSummary(data.queue);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  }, []);

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

  // Setup WebSocket Listener
  useEffect(() => {
    fetchMenu();
    fetchStaff();
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
  }, [fetchMenu, fetchStaff, refreshOrders]);

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
    paymentMethod: 'CASH' | 'POS_CARD' | 'COUNTER_WECHAT' | 'COUNTER_ALIPAY';
    cashDetails?: { receivedAmount: number; changeAmount: number };
    cardDetails?: { cardLast4: string; authCode: string };
    customerPhone?: string;
    notes?: string;
  }) => {
    const res = await fetch('/api/counter/order/create-and-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_mock_${Date.now()}`,
            metadata: { orderId },
            status: 'succeeded',
          },
        },
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
  const createCategory = async (name: string, icon = 'CupSoda', sortOrder?: number) => {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon, sortOrder }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '添加分类失败');
    await fetchMenu();
    return data;
  };

  const updateCategory = async (id: string, updates: Partial<MenuCategory>) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新分类失败');
    await fetchMenu();
    return data;
  };

  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除分类失败');
    await fetchMenu();
    return data;
  };

  // Product Admin CRUD Handlers
  const createProduct = async (product: Partial<ProductSKU>) => {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '创建商品失败');
    await fetchMenu();
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<ProductSKU>) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '更新商品失败');
    await fetchMenu();
    return data;
  };

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除商品失败');
    await fetchMenu();
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

  return (
    <AppContext.Provider
      value={{
        store: STORE_CONFIG,
        stations: KDS_STATIONS,
        modifierGroups: MODIFIER_GROUPS,
        categories,
        products,
        orders,
        queueSummary,
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
        t,
        setAudioEnabled,
        setActiveOrderForTracking,
        refreshOrders,
        fetchMenu,
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
