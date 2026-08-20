export type OrderStatus = 'UNPAID' | 'PENDING' | 'MAKING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type StationTaskStatus = 'PENDING' | 'MAKING' | 'DONE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// Supported European Currencies
export type CurrencyCode = 'EUR' | 'CZK' | 'HUF' | 'PLN';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nativeName: string;
  flag: string;
  locale: string;
  symbolPosition: 'before' | 'after';
  exchangeRateToEur: number; // For multi-currency consolidated reporting
}

export interface ModifierItem {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  minSelections: number;
  maxSelections: number;
  required: boolean;
  items: ModifierItem[];
}

export interface ProductSKU {
  id: string;
  productId?: string;
  name: string;
  category: string;
  basePrice: number;
  image: string;
  description: string;
  targetStationId: 'station_bar' | 'station_fryer' | 'station_grill' | 'station_bakery' | string;
  prepTimeSeconds: number; // SLA standard duration
  modifierGroupIds?: string[];
  applicableModifierGroupIds?: string[];
  isSoldOut?: boolean;
  isRecommended?: boolean;
  tags?: string[];
  salesCount?: number; // Cumulative sales volume
  salesRevenue?: number; // Cumulative sales amount
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  sku: ProductSKU;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  unitPrice: number;
  itemTotalPrice: number;
  notes?: string;
}

export interface OrderItem {
  itemId: string;
  orderId: string;
  skuId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  targetStationId: 'station_bar' | 'station_fryer' | 'station_grill' | 'station_bakery' | string;
  selectedModifiers: SelectedModifier[];
  stationStatus: StationTaskStatus;
  prepTimeSeconds: number;
  startedAt?: number;
  completedAt?: number;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'POS_CARD' | 'STRIPE_CARD' | 'STRIPE_APPLE_PAY';

export interface OrderMaster {
  id: string;
  storeId: string;
  merchantId?: string;
  orderNo: string;
  pickupCode: string; // e.g. "A001", "B012", "C003"
  channel: 'QR_H5' | 'KIOSK' | 'DELIVERY_AGGREGATOR' | 'COUNTER_POS';
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string;
  cashDetails?: {
    receivedAmount: number;
    changeAmount: number;
  };
  cardDetails?: {
    cardLast4: string;
    authCode: string;
  };
  currency: CurrencyCode | string;
  currencySymbol?: string;
  totalAmount: number;
  itemsCount: number;
  items: OrderItem[];
  customerPhoneMasked?: string;
  notes?: string;
  createdAt: number;
  paidAt?: number;
  readyAt?: number;
  completedAt?: number;
  estimatedWaitMinutes: number;
  queuePosition: number;
}

export interface KDSStation {
  id: 'station_bar' | 'station_fryer' | 'station_grill' | 'station_bakery' | 'station_expo';
  name: string;
  type: 'MAKING' | 'EXPO';
  description: string;
  icon: string;
  supportedCategories: string[];
}

export interface BatchAggregationItem {
  skuId: string;
  productName: string;
  targetStationId: string;
  modifierSignature: string;
  modifierSummary: string;
  totalQuantity: number;
  orderRefs: { orderId: string; pickupCode: string; quantity: number; elapsedSeconds: number }[];
  earliestCreatedAt: number;
}

export interface QueueSummary {
  waitingCups: number;
  makingOrdersCount: number;
  readyOrdersCount: number;
  completedTodayCount: number;
  avgWaitTimeMinutes: number;
  currentCallingCodes: string[];
}

export interface WSEvent {
  type: 'NEW_ORDER' | 'PAYMENT_CONFIRMED' | 'TASK_BUMPED' | 'ORDER_READY' | 'ORDER_COMPLETED' | 'ITEM_SOLDOUT_CHANGED' | 'QUEUE_UPDATE' | 'MENU_UPDATED' | 'CATEGORIES_UPDATED' | 'INVENTORY_UPDATED' | 'STORES_UPDATED' | 'MERCHANTS_UPDATED';
  payload: any;
  timestamp: number;
}

// Staff and User Roles
export type StaffRole = 
  | 'SUPER_ADMIN'     // 卖系统的 / 平台超级管理员 (SaaS Vendor / Platform Super Admin)
  | 'MERCHANT'        // 商家账户 (Merchant Account)
  | 'STORE_MANAGER'   // 店长 (Store Manager)
  | 'CHEF'            // 后厨主厨
  | 'CASHIER'         // 吧台收银员
  | 'EXPO_PACKER';    // Expo 打包员

export interface PermissionDefinition {
  id: string;
  name: string;
  category: 'MERCHANT' | 'STORE' | 'MENU' | 'ORDERS' | 'STAFF' | 'FINANCE' | 'INVENTORY' | 'SYSTEM';
  description: string;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: StaffRole;
  merchantId?: string; // Associated merchant ID if role is MERCHANT
  storeId: string;     // Associated current active store ID
  accessibleStoreIds?: string[]; // Multiple stores for MERCHANT
  status: 'ACTIVE' | 'SUSPENDED';
  pinCode: string;
  avatar: string;
  lastLogin?: number;
  permissions: string[];
}

// Merchant Account Model (商家账户)
export interface MerchantAccount {
  id: string;
  name: string;               // 商家企业/品牌名称
  contactPerson: string;      // 联系人姓名
  email: string;              // 登录邮箱/账号
  phone: string;              // 联系电话
  status: 'ACTIVE' | 'SUSPENDED';
  assignedStoreIds: string[]; // 分配给该商家的门店ID列表
  plan: 'STANDARD' | 'PRO' | 'ENTERPRISE';
  customDomain?: string;      // 商家独立前端域名 (e.g. "order.danubefoods.sk" 或 "vienna-tea.seatless.eu")
  createdAt: number;
  notes?: string;
  totalRevenue?: number;      // 累计营收
}

// Store Entity Model (门店实体)
export interface StoreEntity {
  id: string;
  merchantId: string;         // 所属商家账户ID
  merchantName?: string;      // 所属商家名称
  storeName: string;          // 店铺名称
  currency: CurrencyCode;     // 结算币种 (EUR / CZK / HUF / PLN)
  currencySymbol: string;     // 符号 (€, Kč, Ft, zł)
  address: string;            // 物理地址
  operatingHours: string;     // 营业时间 (如 09:30 - 22:30)
  phone: string;              // 门店电话
  status: 'OPEN' | 'CLOSED';  // 营业状态
  customDomain?: string;      // 门店独立点餐专属域名/子域名 (e.g. "bratislava-main.danubefoods.sk")
  createdAt: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}

// Inventory / Raw Material (食材库存)
export type InventoryCategory = 'TEA' | 'DAIRY' | 'FRUIT' | 'MEAT' | 'SNACK' | 'PACKAGING' | 'SAUCE';

export interface InventoryItem {
  id: string;
  storeId: string;
  name: string;
  category: InventoryCategory;
  categoryName: string;
  currentStock: number;
  unit: string;
  minThreshold: number; // 安全库存报警阈值
  costPerUnit: number;
  lastUpdated: number;
  status: 'SUFFICIENT' | 'LOW' | 'CRITICAL';
}

export interface InventoryLog {
  id: string;
  storeId: string;
  itemId: string;
  itemName: string;
  type: 'RESTOCK' | 'CONSUME' | 'WASTE' | 'CALIBRATE';
  quantityDelta: number;
  balance: number;
  operator: string;
  timestamp: number;
  notes?: string;
}
