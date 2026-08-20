import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryManager } from './CategoryManager';
import { ProductManager } from './ProductManager';
import { RolePermissionManager } from './RolePermissionManager';
import { MerchantManager } from './MerchantManager';
import { StoreManager } from './StoreManager';
import { MerchantSalesAnalytics } from '../merchant/MerchantSalesAnalytics';
import { StoreManagerDailyView } from '../manager/StoreManagerDailyView';
import { DomainRouterManager } from './DomainRouterManager';
import {
  Building2,
  FolderTree,
  Package,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  Layers,
  Globe,
  Coins,
  Calendar,
  DollarSign,
  UtensilsCrossed,
} from 'lucide-react';

type AdminTab =
  | 'MERCHANTS'
  | 'STORES'
  | 'DOMAINS'
  | 'MERCHANT_ANALYTICS'
  | 'STORE_MANAGER_DAILY'
  | 'CATEGORIES'
  | 'PRODUCTS'
  | 'ROLES_PERMS';

export const SaaSAdminDashboard: React.FC = () => {
  const {
    currentStore,
    currentMerchant,
    products,
    categories,
    orders,
    staffUsers,
    currentStaffUser,
    hasPermission,
    formatPrice,
    t,
    theme,
  } = useApp();

  const isSuperAdmin = currentStaffUser.role === 'SUPER_ADMIN';
  const isMerchant = currentStaffUser.role === 'MERCHANT';
  const isManager = currentStaffUser.role === 'STORE_MANAGER';

  // Default active tab according to role
  const [activeTab, setActiveTab] = useState<AdminTab>(
    isSuperAdmin
      ? 'MERCHANTS'
      : isMerchant
      ? 'MERCHANT_ANALYTICS'
      : 'STORE_MANAGER_DAILY'
  );

  // Stats calculation
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED').length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-stone-100 text-stone-800 select-none">
      {/* SaaS Admin Sub-Header */}
      <div className="px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base text-stone-900">
                {isSuperAdmin
                  ? 'SaaS 厂商总控系统'
                  : isMerchant
                  ? '连锁商家管理控制台'
                  : '门店数字化管理中心'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                {currentMerchant ? currentMerchant.name : currentStore.storeName}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {currentStore.storeName} · {currentStore.currency} 结算体系
            </p>
          </div>
        </div>

        {/* Quick Operational Metrics */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs bg-stone-50 border-stone-200">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-stone-400">实时总营收:</span>
            <strong className="text-emerald-600 font-bold font-mono">
              {formatPrice(totalRevenue)}
            </strong>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs bg-stone-50 border-stone-200">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-stone-400">已交付单量:</span>
            <strong className="text-amber-600 font-bold font-mono">{completedOrdersCount} 单</strong>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs bg-stone-50 border-stone-200">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-stone-400">在岗员工:</span>
            <strong className="text-indigo-600 font-bold font-mono">{staffUsers.length} 人</strong>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="px-6 py-2 border-b flex items-center gap-2 overflow-x-auto shrink-0 bg-white/80 border-stone-200">
        {/* 1. 商家管理 (SaaS服务商/系统销售者 专属) */}
        {hasPermission('perm_merchant_manage') && (
          <button
            type="button"
            onClick={() => setActiveTab('MERCHANTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'MERCHANTS'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('merchantAccounts')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10">Vendor</span>
          </button>
        )}

        {/* 2. 店铺管理 (SaaS厂商创建分配 / 商家查看所属门店) */}
        {hasPermission('perm_store_manage') && (
          <button
            type="button"
            onClick={() => setActiveTab('STORES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'STORES'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{t('storeManagement')}</span>
          </button>
        )}

        {/* 3. 独立域名管理 (多租户白标 Custom Domains) */}
        {(isSuperAdmin || isMerchant) && (
          <button
            type="button"
            onClick={() => setActiveTab('DOMAINS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'DOMAINS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>独立域名系统</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 font-mono">Domains</span>
          </button>
        )}

        {/* 4. 商家营业额与销量历史分析 (商家核心功能) */}
        {(isSuperAdmin || isMerchant || hasPermission('perm_reports_view')) && (
          <button
            type="button"
            onClick={() => setActiveTab('MERCHANT_ANALYTICS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'MERCHANT_ANALYTICS'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('merchantSalesAnalytics')}</span>
          </button>
        )}

        {/* 4. 店长工作台 (当日销售数据与食材库存) */}
        {(isSuperAdmin || isMerchant || isManager || hasPermission('perm_inventory_manage')) && (
          <button
            type="button"
            onClick={() => setActiveTab('STORE_MANAGER_DAILY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'STORE_MANAGER_DAILY'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('storeManagerDaily')}</span>
          </button>
        )}

        {/* 5. 分类管理 */}
        {hasPermission('perm_category_manage') && (
          <button
            type="button"
            onClick={() => setActiveTab('CATEGORIES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'CATEGORIES'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>{t('categoryList')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10">
              {categories.length}
            </span>
          </button>
        )}

        {/* 6. 菜品管理 */}
        {hasPermission('perm_product_manage') && (
          <button
            type="button"
            onClick={() => setActiveTab('PRODUCTS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'PRODUCTS'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t('productCatalog')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10">
              {products.length}
            </span>
          </button>
        )}

        {/* 7. 角色权限 */}
        {hasPermission('perm_staff_manage') && (
          <button
            type="button"
            onClick={() => setActiveTab('ROLES_PERMS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'ROLES_PERMS'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('rolePermissions')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10">
              {staffUsers.length}
            </span>
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'MERCHANTS' && <MerchantManager />}
        {activeTab === 'STORES' && <StoreManager />}
        {activeTab === 'DOMAINS' && <DomainRouterManager />}
        {activeTab === 'MERCHANT_ANALYTICS' && <MerchantSalesAnalytics />}
        {activeTab === 'STORE_MANAGER_DAILY' && <StoreManagerDailyView />}
        {activeTab === 'CATEGORIES' && <CategoryManager />}
        {activeTab === 'PRODUCTS' && <ProductManager />}
        {activeTab === 'ROLES_PERMS' && <RolePermissionManager />}
      </div>
    </div>
  );
};
