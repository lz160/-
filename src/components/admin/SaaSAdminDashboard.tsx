import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RolePermissionManager } from './RolePermissionManager';
import { MerchantManager } from './MerchantManager';
import { StoreManager } from './StoreManager';
import { MerchantSalesAnalytics } from '../merchant/MerchantSalesAnalytics';
import { StoreManagerDailyView } from '../manager/StoreManagerDailyView';
import { DomainRouterManager } from './DomainRouterManager';
import { UnifiedMenuWorkshop } from './UnifiedMenuWorkshop';
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
  ChefHat,
  Network,
  BarChart3,
  Lock,
  ArrowRight
} from 'lucide-react';

type AdminTab =
  | 'FLEET_HUB'           // 商家与多店舰队中枢 (商家账户 + 门店管理 + 独立域名路由)
  | 'STAFF_RBAC'          // 全平台员工与RBAC权限中枢 (超管专属，商家不可管)
  | 'PLATFORM_ANALYTICS'  // 平台多商户营收与大盘分析
  | 'MENU_WORKSHOP'       // 菜品与配方工坊 (原料到成品BOM)
  | 'STORE_DAILY';        // 门店当日销售与库存

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

  // Sub-tab state for FLEET_HUB (商家、门店、域名)
  const [fleetSubTab, setFleetSubTab] = useState<'MERCHANTS' | 'STORES' | 'DOMAINS'>('MERCHANTS');

  // Primary Navigation tabs based on strict role boundary:
  // 超管: 只管权限与账户创建 (STAFF_RBAC), 商家/门店/域名中枢 (FLEET_HUB), 商户多店营收分析 (PLATFORM_ANALYTICS)
  // 商家: 旗下多店营收分析 (PLATFORM_ANALYTICS - 只读/导出), 菜单与配方工坊 (MENU_WORKSHOP - 读写), 门店库存台账 (STORE_DAILY - 查看/入库/盘点)
  // 店长: 门店当日营业与库存看板 (STORE_DAILY), 菜品工坊 (MENU_WORKSHOP)
  const defaultTab: AdminTab = isSuperAdmin
    ? 'FLEET_HUB'
    : isMerchant
    ? 'PLATFORM_ANALYTICS'
    : 'STORE_DAILY';

  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTab);

  // Auto reset active tab if switching role to one that lacks access
  React.useEffect(() => {
    if (isSuperAdmin) {
      if (activeTab === 'MENU_WORKSHOP' || activeTab === 'STORE_DAILY') {
        setActiveTab('FLEET_HUB');
      }
    } else if (isMerchant) {
      if (activeTab === 'FLEET_HUB' || activeTab === 'STAFF_RBAC') {
        setActiveTab('PLATFORM_ANALYTICS');
      }
    } else if (isManager) {
      if (activeTab === 'FLEET_HUB' || activeTab === 'STAFF_RBAC') {
        setActiveTab('STORE_DAILY');
      }
    }
  }, [currentStaffUser.role, isSuperAdmin, isMerchant, isManager]);

  // Stats calculation
  const totalRevenue = (orders || [])
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const completedOrdersCount = (orders || []).filter((o) => o.status === 'COMPLETED').length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-stone-100 dark:bg-zinc-950 text-stone-800 dark:text-zinc-100 select-none">
      {/* SaaS Admin Sub-Header */}
      <div className="px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base text-stone-900 dark:text-zinc-100">
                {isSuperAdmin
                  ? 'SaaS 厂商超级管理员中台'
                  : isMerchant
                  ? '连锁商家多店管理控制台'
                  : '门店数字化管理中心'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-800">
                {isSuperAdmin ? '平台超管全权中枢' : currentMerchant ? currentMerchant.name : currentStore.storeName}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-zinc-400">
              {currentStore.storeName} · {currentStore.currency} 多币种结算体系 · 跨店数据隔离
            </p>
          </div>
        </div>

        {/* Quick Operational Metrics */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs bg-stone-50 dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-stone-400">实时总营收:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
              {formatPrice(totalRevenue)}
            </strong>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs bg-stone-50 dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-stone-400">已交付单量:</span>
            <strong className="text-amber-600 dark:text-amber-400 font-bold font-mono">{completedOrdersCount} 单</strong>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs bg-stone-50 dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700">
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-stone-400">全平台员工:</span>
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{staffUsers.length} 人</strong>
          </div>
        </div>
      </div>

      {/* Primary Consolidated Navigation Bar */}
      <div className="px-6 py-2.5 border-b flex items-center justify-between gap-3 overflow-x-auto shrink-0 bg-white/90 dark:bg-zinc-900/90 border-stone-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {/* 1. 商家/门店/域名中枢 (超管专属) */}
          {isSuperAdmin && (
            <button
              id="admin-tab-fleet"
              type="button"
              onClick={() => setActiveTab('FLEET_HUB')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'FLEET_HUB'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>商家/门店/域名中枢</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 font-bold">3合1总控</span>
            </button>
          )}

          {/* 2. 账户创建与RBAC权限中枢 (超管专属) */}
          {isSuperAdmin && (
            <button
              id="admin-tab-staff-rbac"
              type="button"
              onClick={() => setActiveTab('STAFF_RBAC')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'STAFF_RBAC'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>账户创建与权限管理</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 font-bold">
                {staffUsers.length} 人
              </span>
            </button>
          )}

          {/* 3. 商户多店营收分析 / 平台大盘 (超管与商家可见 - 只读·导出) */}
          {(isSuperAdmin || isMerchant || hasPermission('perm_reports_view')) && (
            <button
              id="admin-tab-analytics"
              type="button"
              onClick={() => setActiveTab('PLATFORM_ANALYTICS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'PLATFORM_ANALYTICS'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{isSuperAdmin ? '商户多店营收大盘分析' : isMerchant ? '旗下多店营收分析 (只读·导出)' : t('merchantSalesAnalytics')}</span>
            </button>
          )}

          {/* 4. 菜单与配方工坊 (商家与店长业务端 - 读写·BOM) */}
          {!isSuperAdmin && (isMerchant || isManager || hasPermission('perm_menu_edit')) && (
            <button
              id="admin-tab-menu-workshop"
              type="button"
              onClick={() => setActiveTab('MENU_WORKSHOP')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'MENU_WORKSHOP'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>{isMerchant ? '菜单与配方工坊 (读写·BOM)' : '菜品与配方工坊'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 font-bold">
                BOM配方
              </span>
            </button>
          )}

          {/* 5. 门店库存台账 (商家与店长 - 查看·入库·盘点) */}
          {!isSuperAdmin && (isMerchant || isManager || hasPermission('perm_inventory_manage')) && (
            <button
              id="admin-tab-store-daily"
              type="button"
              onClick={() => setActiveTab('STORE_DAILY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'STORE_DAILY'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{isMerchant ? '门店库存台账 (查看·入库·盘点)' : t('storeManagerDaily')}</span>
            </button>
          )}
        </div>

        {/* Merchant Notice about staff permission isolation */}
        {isMerchant && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
            <Lock className="w-3.5 h-3.5" />
            <span>员工账号与角色权限由 SaaS 超级管理员统一调度分配</span>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* TAB 1: FLEET HUB (Integrated 商家账户 + 门店管理 + 独立域名路由) */}
        {activeTab === 'FLEET_HUB' && isSuperAdmin && (
          <div className="space-y-5">
            {/* Sub navigation for Fleet Hub */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 max-w-fit shadow-xs">
              <button
                type="button"
                onClick={() => setFleetSubTab('MERCHANTS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  fleetSubTab === 'MERCHANTS'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>商家账户管理 (创建与签约套餐)</span>
              </button>

              <button
                type="button"
                onClick={() => setFleetSubTab('STORES')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  fleetSubTab === 'STORES'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>门店创建与分配 (多币种与物理地址)</span>
              </button>

              <button
                type="button"
                onClick={() => setFleetSubTab('DOMAINS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  fleetSubTab === 'DOMAINS'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>独立域名与白标路由系统</span>
              </button>
            </div>

            {/* Sub views */}
            <div>
              {fleetSubTab === 'MERCHANTS' && <MerchantManager />}
              {fleetSubTab === 'STORES' && <StoreManager />}
              {fleetSubTab === 'DOMAINS' && <DomainRouterManager />}
            </div>
          </div>
        )}

        {/* TAB 2: STAFF & RBAC CENTRAL (Super Admin Exclusive) */}
        {activeTab === 'STAFF_RBAC' && isSuperAdmin && (
          <RolePermissionManager />
        )}

        {/* TAB 3: MENU & BOM WORKSHOP */}
        {activeTab === 'MENU_WORKSHOP' && (
          <UnifiedMenuWorkshop />
        )}

        {/* TAB 4: PLATFORM / MERCHANT ANALYTICS */}
        {activeTab === 'PLATFORM_ANALYTICS' && (
          <MerchantSalesAnalytics />
        )}

        {/* TAB 5: STORE DAILY SALES & INVENTORY */}
        {activeTab === 'STORE_DAILY' && (
          <StoreManagerDailyView />
        )}
      </div>
    </div>
  );
};
