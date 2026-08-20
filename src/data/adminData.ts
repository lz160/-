import { MenuCategory, StaffUser, PermissionDefinition } from '../types';

export const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat_milk_tea', name: '招牌鲜奶茶', icon: 'CupSoda', sortOrder: 1, isActive: true },
  { id: 'cat_fruit_tea', name: '鲜果芝士茶', icon: 'Citrus', sortOrder: 2, isActive: true },
  { id: 'cat_pure_tea', name: '原叶清心茶', icon: 'Leaf', sortOrder: 3, isActive: true },
  { id: 'cat_coffee', name: '特调浓缩咖啡', icon: 'Coffee', sortOrder: 4, isActive: true },
  { id: 'cat_fried', name: '金牌炸鸡小食', icon: 'Flame', sortOrder: 5, isActive: true },
  { id: 'cat_fries', name: '香酥薯条炸物', icon: 'Sparkles', sortOrder: 6, isActive: true },
  { id: 'cat_burger', name: '现烤手工汉堡', icon: 'Beef', sortOrder: 7, isActive: true },
  { id: 'cat_panini', name: '热压帕尼尼卷', icon: 'Sandwich', sortOrder: 8, isActive: true },
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
  // 1. 系统销售方 / 平台超级管理员 (卖系统的)
  {
    id: 'staff_vendor_001',
    name: '林总 (系统服务提供商)',
    username: 'saas_vendor_lin',
    role: 'SUPER_ADMIN',
    storeId: 'store_bratislava_01',
    status: 'ACTIVE',
    pinCode: '8888',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    permissions: PERMISSION_DEFINITIONS.map(p => p.id),
  },

  // 2. 商家账户 (管理单店或多店权限，严禁创建店铺)
  {
    id: 'staff_merchant_001',
    name: '托马斯·诺瓦克 (商家负责人)',
    username: 'merchant_novak',
    role: 'MERCHANT',
    merchantId: 'merchant_001',
    storeId: 'store_prague_01',
    accessibleStoreIds: ['store_prague_01', 'store_brno_02'],
    status: 'ACTIVE',
    pinCode: '6688',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_store_manage',
      'perm_analytics_revenue',
      'perm_analytics_products',
      'perm_menu_view',
      'perm_menu_edit',
      'perm_menu_create',
      'perm_cat_manage',
      'perm_sku_soldout',
      'perm_staff_view',
      'perm_staff_edit',
      'perm_finance_view',
      'perm_finance_audit',
      'perm_order_create',
      'perm_order_verify',
    ],
  },

  // 3. 店长 (当日销售数据，食材库存)
  {
    id: 'staff_manager_001',
    name: '陈雅欣 (布拉迪斯拉发店长)',
    username: 'manager_chen',
    role: 'STORE_MANAGER',
    merchantId: 'merchant_002',
    storeId: 'store_bratislava_01',
    status: 'ACTIVE',
    pinCode: '1688',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_today_sales_view',
      'perm_inventory_view',
      'perm_inventory_operate',
      'perm_menu_view',
      'perm_sku_soldout',
      'perm_order_create',
      'perm_order_verify',
      'perm_kds_bump',
      'perm_expo_call',
      'perm_finance_view',
      'perm_finance_audit',
      'perm_staff_view',
    ],
  },

  // 4. 吧台收银员
  {
    id: 'staff_cashier_001',
    name: '张小峰 (吧台收银员)',
    username: 'cashier_zhang',
    role: 'CASHIER',
    storeId: 'store_bratislava_01',
    status: 'ACTIVE',
    pinCode: '0101',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_menu_view',
      'perm_sku_soldout',
      'perm_order_create',
      'perm_order_verify',
      'perm_finance_view',
    ],
  },

  // 5. 后厨主厨
  {
    id: 'staff_chef_001',
    name: '王大厨 (后厨主管)',
    username: 'chef_wang',
    role: 'CHEF',
    storeId: 'store_bratislava_01',
    status: 'ACTIVE',
    pinCode: '0202',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_menu_view',
      'perm_sku_soldout',
      'perm_kds_bump',
    ],
  },

  // 6. Expo 打包员
  {
    id: 'staff_expo_001',
    name: '李小薇 (Expo打包员)',
    username: 'expo_li',
    role: 'EXPO_PACKER',
    storeId: 'store_bratislava_01',
    status: 'ACTIVE',
    pinCode: '0303',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_menu_view',
      'perm_kds_bump',
      'perm_expo_call',
      'perm_order_verify',
    ],
  },
];
