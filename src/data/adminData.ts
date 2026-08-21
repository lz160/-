import { MenuCategory, StaffUser, PermissionDefinition } from '../types';

export const INITIAL_CATEGORIES: MenuCategory[] = [
  {
    id: 'cat_milk_tea',
    storeId: 'store_default_01',
    name: '招牌鲜奶茶',
    icon: 'CupSoda',
    sortOrder: 1,
    isActive: true,
    productCount: 2,
  },
  {
    id: 'cat_burger',
    storeId: 'store_default_01',
    name: '现烤手工汉堡',
    icon: 'Beef',
    sortOrder: 2,
    isActive: true,
    productCount: 1,
  },
  {
    id: 'cat_fried_snack',
    storeId: 'store_default_01',
    name: '金牌炸鸡小食',
    icon: 'Flame',
    sortOrder: 3,
    isActive: true,
    productCount: 1,
  },
  {
    id: 'cat_pure_tea',
    storeId: 'store_default_01',
    name: '原叶清心茶',
    icon: 'Leaf',
    sortOrder: 4,
    isActive: true,
    productCount: 0,
  },
];

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Merchant & Vendor (平台超级管理员与商家)
  { id: 'perm_merchant_manage', name: '商家账户创建与管理', category: 'MERCHANT', description: '创建商家账户、分配门店、启停商家状态（系统销售方专用）' },
  { id: 'perm_store_create', name: '创建新门店与币种配置', category: 'STORE', description: '创建店铺实体、设定币种（EUR/CZK/HUF/PLN）、分配给商家（系统销售方专用）' },
  { id: 'perm_store_manage', name: '管理名下门店业务', category: 'STORE', description: '商家管理名下单店或多家店铺全部日常运营权限（不可新建店铺）' },

  // Analytics & Sales
  { id: 'perm_analytics_revenue', name: '营业额与历史数据分析', category: 'FINANCE', description: '查看营收趋势、多日期范围筛选、多门店对比与支付渠道构成' },
  { id: 'perm_analytics_products', name: '商品销量与排行统计', category: 'FINANCE', description: '查看所有SKU单品销量、销售额、分类筛选与排序' },
  { id: 'perm_today_sales_view', name: '查看当日实时销售数据', category: 'FINANCE', description: '店长查看当日实时营业额、订单量、出餐时效与热销榜' },

  // Raw Material Inventory (食材库存)
  { id: 'perm_inventory_view', name: '查看食材库存与预警', category: 'INVENTORY', description: '店长实时监控原料库存、安全库存预警与紧缺提醒' },
  { id: 'perm_inventory_operate', name: '食材出入库与盘点校准', category: 'INVENTORY', description: '执行原料入库、领用出库、报损登记与盘点修正' },

  // Menu & Product
  { id: 'perm_menu_view', name: '查看菜单与分类', category: 'MENU', description: '浏览商品价格、规格加料及分类' },
  { id: 'perm_menu_edit', name: '编辑单品与价格', category: 'MENU', description: '修改单品名称、基础售价、出餐工位与图片' },
  { id: 'perm_menu_create', name: '创建/下架单品', category: 'MENU', description: '新增SKU单品，或彻底删除/归档单品' },
  { id: 'perm_cat_manage', name: '分类管理与排序', category: 'MENU', description: '新增、重命名、禁用及调整分类展示顺序' },
  { id: 'perm_sku_soldout', name: '单品即时估清/上架', category: 'MENU', description: '吧台/后厨一键将单品标记为售罄或恢复供应' },

  // Orders & POS
  { id: 'perm_order_create', name: '吧台点单与收银', category: 'ORDERS', description: '使用吧台POS终端点单、收现金、POS刷卡' },
  { id: 'perm_order_verify', name: '核销出餐交付', category: 'ORDERS', description: '输入取餐流水码或扫码确认交付' },
  { id: 'perm_kds_bump', name: 'KDS划单与工位流转', category: 'ORDERS', description: '在后厨分工位屏幕上完成制作划单' },
  { id: 'perm_expo_call', name: 'Expo打包与大屏叫号', category: 'ORDERS', description: '在总控打包台触发叫号大屏翻牌与TTS语音播报' },

  // Staff & RBAC
  { id: 'perm_staff_view', name: '查看员工账号', category: 'STAFF', description: '查看本店或名下所有员工列表' },
  { id: 'perm_staff_edit', name: '员工账号与角色分配', category: 'STAFF', description: '新增员工、分配岗位角色、修改登录密码与PIN码' },

  // Finance & Audit
  { id: 'perm_finance_view', name: '查看收银流水与明细', category: 'FINANCE', description: '查看当日钱箱现金与POS刷卡流水' },
  { id: 'perm_finance_audit', name: '交班对账与小票补打', category: 'FINANCE', description: '执行交班结账、现金差额核对与补打存根' },
];

export const INITIAL_STAFF_USERS: StaffUser[] = [
  // 1. 平台最高权限超级管理员 (SaaS Platform Super Admin)
  {
    id: 'staff_super_admin',
    name: '超级管理员 (Super Admin)',
    username: 'admin',
    role: 'SUPER_ADMIN',
    storeId: 'store_paris_01',
    status: 'ACTIVE',
    pinCode: '8888',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    permissions: PERMISSION_DEFINITIONS.map(p => p.id),
  },

  // 2. 连锁商家 / 品牌主 (Merchant Brand Owner)
  {
    id: 'staff_merchant_boss',
    name: '多瑙品牌主 (Roger Boss)',
    username: 'merchant_boss',
    role: 'MERCHANT',
    merchantId: 'merchant_danube',
    storeId: 'store_paris_01',
    accessibleStoreIds: ['store_paris_01', 'store_berlin_01', 'store_prague_01'],
    status: 'ACTIVE',
    pinCode: '6666',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_analytics_revenue',
      'perm_analytics_products',
      'perm_menu_view',
      'perm_menu_edit',
      'perm_menu_create',
      'perm_cat_manage',
      'perm_sku_soldout',
      'perm_inventory_view',
      'perm_inventory_operate',
      'perm_store_manage',
    ],
  },

  // 3. 门店店长 (Store Manager)
  {
    id: 'staff_manager_pierre',
    name: '巴黎旗舰店店长 (Pierre)',
    username: 'manager_pierre',
    role: 'STORE_MANAGER',
    storeId: 'store_paris_01',
    status: 'ACTIVE',
    pinCode: '1111',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_today_sales_view',
      'perm_inventory_view',
      'perm_inventory_operate',
      'perm_menu_view',
      'perm_sku_soldout',
      'perm_order_create',
      'perm_order_verify',
      'perm_finance_view',
      'perm_finance_audit',
      'perm_staff_view',
    ],
  },

  // 4. 后厨主厨 (Kitchen Chef)
  {
    id: 'staff_chef_marco',
    name: '后厨主厨 (Marco Chef)',
    username: 'chef_marco',
    role: 'CHEF',
    storeId: 'store_paris_01',
    status: 'ACTIVE',
    pinCode: '2222',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_kds_bump',
      'perm_sku_soldout',
      'perm_menu_view',
      'perm_order_verify',
    ],
  },

  // 5. 前台吧台收银员 (Front Cashier)
  {
    id: 'staff_cashier_emma',
    name: '吧台收银员 (Emma Cashier)',
    username: 'cashier_emma',
    role: 'CASHIER',
    storeId: 'store_paris_01',
    status: 'ACTIVE',
    pinCode: '3333',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_order_create',
      'perm_order_verify',
      'perm_sku_soldout',
      'perm_finance_view',
      'perm_menu_view',
    ],
  },

  // 6. 总控装配打包员 (Expo Packer)
  {
    id: 'staff_expo_lucas',
    name: '打包总控员 (Lucas Expo)',
    username: 'expo_lucas',
    role: 'EXPO_PACKER',
    storeId: 'store_paris_01',
    status: 'ACTIVE',
    pinCode: '4444',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_expo_call',
      'perm_order_verify',
      'perm_kds_bump',
      'perm_menu_view',
    ],
  },
];
