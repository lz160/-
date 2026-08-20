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
  // Menu & Product
  { id: 'perm_menu_view', name: '查看菜单与分类', category: 'MENU', description: '浏览商品价格、规格加料及分类' },
  { id: 'perm_menu_edit', name: '编辑单品与价格', category: 'MENU', description: '修改单品名称、基础售价、出餐工位与图片' },
  { id: 'perm_menu_create', name: '创建/下架单品', category: 'MENU', description: '新增SKU单品，或彻底删除/归档单品' },
  { id: 'perm_cat_manage', name: '分类管理与排序', category: 'MENU', description: '新增、重命名、禁用及调整分类展示顺序' },
  { id: 'perm_sku_soldout', name: '单品即时估清/上架', category: 'MENU', description: '吧台/后厨一键将单品标记为售罄或恢复供应' },

  // Orders & POS
  { id: 'perm_order_create', name: '吧台点单与收银', category: 'ORDERS', description: '使用吧台POS终端点单、收现金、刷卡与聚合扫码' },
  { id: 'perm_order_verify', name: '扫码核销出餐', category: 'ORDERS', description: '扫描或输入取餐流水码确认交付' },
  { id: 'perm_kds_bump', name: 'KDS划单与工位流转', category: 'ORDERS', description: '在后厨分工位屏幕上完成制作划单' },
  { id: 'perm_expo_call', name: 'Expo打包与大屏叫号', category: 'ORDERS', description: '在总控打包台触发叫号大屏翻牌与TTS语音播报' },

  // Staff & RBAC
  { id: 'perm_staff_view', name: '查看员工账号', category: 'STAFF', description: '查看本店或全集团所有员工列表' },
  { id: 'perm_staff_edit', name: '员工账号与角色分配', category: 'STAFF', description: '新增员工、分配岗位角色、修改登录密码与PIN码' },
  { id: 'perm_role_override', name: '细粒度权限微调', category: 'STAFF', description: '单独为某位员工开启或关闭特定系统模块权限' },

  // Finance & Audit
  { id: 'perm_finance_view', name: '查看收银流水与营收', category: 'FINANCE', description: '查看当日钱箱现金、POS刷卡及在线支付流水' },
  { id: 'perm_finance_audit', name: '交班对账与结账小票补打', category: 'FINANCE', description: '执行交班结账、现金差额核对与补打存根' },

  // System & Multi-store
  { id: 'perm_store_config', name: '门店基础信息配置', category: 'SYSTEM', description: '修改门店名称、营业时间、出餐规则与语音配置' },
  { id: 'perm_tenant_config', name: '多租户与集团级权限', category: 'SYSTEM', description: '跨门店调配资源、新建连锁分店与集团级结算' },
];

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff_001',
    name: '林超 (总监)',
    username: 'admin_lin',
    role: 'SUPER_ADMIN',
    storeId: 'STORE_SHANGHAI_088',
    status: 'ACTIVE',
    pinCode: '8888',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    permissions: PERMISSION_DEFINITIONS.map(p => p.id),
  },
  {
    id: 'staff_002',
    name: '陈雅欣 (店长)',
    username: 'manager_chen',
    role: 'STORE_MANAGER',
    storeId: 'STORE_SHANGHAI_088',
    status: 'ACTIVE',
    pinCode: '1688',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_menu_view',
      'perm_menu_edit',
      'perm_menu_create',
      'perm_cat_manage',
      'perm_sku_soldout',
      'perm_order_create',
      'perm_order_verify',
      'perm_kds_bump',
      'perm_expo_call',
      'perm_staff_view',
      'perm_staff_edit',
      'perm_finance_view',
      'perm_finance_audit',
      'perm_store_config',
    ],
  },
  {
    id: 'staff_003',
    name: '张小峰 (吧台收银员)',
    username: 'cashier_zhang',
    role: 'CASHIER',
    storeId: 'STORE_SHANGHAI_088',
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
  {
    id: 'staff_004',
    name: '王大厨 (后厨主管)',
    username: 'chef_wang',
    role: 'CHEF',
    storeId: 'STORE_SHANGHAI_088',
    status: 'ACTIVE',
    pinCode: '0202',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    permissions: [
      'perm_menu_view',
      'perm_sku_soldout',
      'perm_kds_bump',
    ],
  },
  {
    id: 'staff_005',
    name: '李小薇 (Expo打包员)',
    username: 'expo_li',
    role: 'EXPO_PACKER',
    storeId: 'STORE_SHANGHAI_088',
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
