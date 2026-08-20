export type OrderStatus = 'UNPAID' | 'PENDING' | 'MAKING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type StationTaskStatus = 'PENDING' | 'MAKING' | 'DONE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

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
  productId: string;
  name: string;
  category: string;
  basePrice: number;
  image: string;
  description: string;
  targetStationId: 'station_bar' | 'station_fryer' | 'station_grill' | 'station_bakery';
  prepTimeSeconds: number; // SLA standard duration
  modifierGroupIds: string[];
  isSoldOut?: boolean;
  tags?: string[];
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
  targetStationId: 'station_bar' | 'station_fryer' | 'station_grill' | 'station_bakery';
  selectedModifiers: SelectedModifier[];
  stationStatus: StationTaskStatus;
  prepTimeSeconds: number;
  startedAt?: number;
  completedAt?: number;
  notes?: string;
}

export interface OrderMaster {
  id: string;
  storeId: string;
  tenantId: string;
  orderNo: string;
  pickupCode: string; // e.g. "A001", "B012", "C003"
  channel: 'QR_H5' | 'KIOSK' | 'DELIVERY_AGGREGATOR' | 'COUNTER_POS';
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'STRIPE_APPLE_PAY' | 'STRIPE_CARD' | 'STRIPE_ALIPAY_GLOBAL' | 'CASH' | 'POS_CARD' | 'COUNTER_WECHAT' | 'COUNTER_ALIPAY';
  stripePaymentIntentId?: string;
  cashDetails?: {
    receivedAmount: number;
    changeAmount: number;
  };
  cardDetails?: {
    cardLast4: string;
    authCode: string;
  };
  currency: string;
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
  modifierSignature: string; // serialized key of modifiers
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
  type: 'NEW_ORDER' | 'PAYMENT_CONFIRMED' | 'TASK_BUMPED' | 'ORDER_READY' | 'ORDER_COMPLETED' | 'ITEM_SOLDOUT_CHANGED' | 'QUEUE_UPDATE' | 'MENU_UPDATED' | 'CATEGORIES_UPDATED';
  payload: any;
  timestamp: number;
}

export type StaffRole = 'SUPER_ADMIN' | 'STORE_MANAGER' | 'CHEF' | 'CASHIER' | 'EXPO_PACKER';

export interface PermissionDefinition {
  id: string;
  name: string;
  category: 'MENU' | 'ORDERS' | 'STAFF' | 'FINANCE' | 'SYSTEM';
  description: string;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: StaffRole;
  storeId: string;
  status: 'ACTIVE' | 'SUSPENDED';
  pinCode: string;
  avatar: string;
  lastLogin?: number;
  permissions: string[]; // specific permission overrides
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}

