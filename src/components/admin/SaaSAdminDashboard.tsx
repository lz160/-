import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryManager } from './CategoryManager';
import { ProductManager } from './ProductManager';
import { RolePermissionManager } from './RolePermissionManager';
import {
  Building2,
  FolderTree,
  Package,
  ShieldCheck,
  Store,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Layers,
  Globe,
} from 'lucide-react';

type AdminTab = 'CATEGORIES' | 'PRODUCTS' | 'ROLES_PERMS' | 'STORE_INFO';

export const SaaSAdminDashboard: React.FC = () => {
  const { store, products, categories, orders, staffUsers, currentStaffUser, t, theme } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('CATEGORIES');

  // Stats calculation
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED').length;

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${
      theme === 'light' ? 'bg-stone-100 text-stone-800' : 'bg-stone-950 text-stone-100'
    }`}>
      
      {/* SaaS Admin Sub-Header */}
      <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
        theme === 'light' ? 'bg-white border-stone-200 shadow-xs' : 'bg-stone-900 border-stone-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base">
                {t('adminDashboard')}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold">
                {store.tenantName}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {t('adminSubTitle')}
            </p>
          </div>
        </div>

        {/* Quick Operational Metrics */}
        <div className="hidden lg:flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
            theme === 'light' ? 'bg-stone-50 border-stone-200' : 'bg-stone-950 border-stone-800'
          }`}>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-stone-400">今日总营收:</span>
            <strong className="text-emerald-500 font-bold">¥{totalRevenue.toFixed(2)}</strong>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
            theme === 'light' ? 'bg-stone-50 border-stone-200' : 'bg-stone-950 border-stone-800'
          }`}>
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-stone-400">已交付单量:</span>
            <strong className="text-amber-500 font-bold">{completedOrdersCount} 单</strong>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
            theme === 'light' ? 'bg-stone-50 border-stone-200' : 'bg-stone-950 border-stone-800'
          }`}>
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-stone-400">在岗员工:</span>
            <strong className="text-indigo-400 font-bold">{staffUsers.length} 人</strong>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className={`px-6 py-2 border-b flex items-center gap-2 overflow-x-auto shrink-0 ${
        theme === 'light' ? 'bg-white/80 border-stone-200' : 'bg-stone-900/60 border-stone-800'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab('CATEGORIES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'CATEGORIES'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>{t('categoryList')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10">
            {categories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRODUCTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'PRODUCTS'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t('productCatalog')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10">
            {products.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ROLES_PERMS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'ROLES_PERMS'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('rolePermissions')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10">
            {staffUsers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STORE_INFO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'STORE_INFO'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>{t('storeManagement')}</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'CATEGORIES' && <CategoryManager />}
        {activeTab === 'PRODUCTS' && <ProductManager />}
        {activeTab === 'ROLES_PERMS' && <RolePermissionManager />}
        {activeTab === 'STORE_INFO' && (
          <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto space-y-6">
            <div className={`p-6 rounded-3xl border ${
              theme === 'light' ? 'bg-white border-stone-200 shadow-xs' : 'bg-stone-900 border-stone-800'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                <Store className="w-4 h-4 text-amber-500" />
                <span>门店与连锁租户基础信息</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-400 block mb-1">所属集团租户</span>
                  <strong className="text-sm">{store.tenantName} ({store.tenantId})</strong>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-400 block mb-1">当前门店名称</span>
                  <strong className="text-sm">{store.storeName}</strong>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-400 block mb-1">门店物理地址</span>
                  <p className="font-medium">{store.address}</p>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-400 block mb-1">营业时间 & 结算币种</span>
                  <p className="font-medium">{store.operatingHours} | 默认币种: {store.defaultCurrency}</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-3xl border ${
              theme === 'light' ? 'bg-white border-stone-200 shadow-xs' : 'bg-stone-900 border-stone-800'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-sky-500" />
                <span>国际化与周边多语言支持矩阵</span>
              </h3>
              <p className="text-xs text-stone-400 mb-4">
                当前系统原生支持中英、斯洛伐克语（Slovak）及邻国语言（捷克语、波兰语、匈牙利语、奥地利德语）。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                  <span>🇨🇳</span>
                  <span>中文 (简体)</span>
                </div>
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                  <span>🇬🇧</span>
                  <span>English (Global)</span>
                </div>
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                  <span>🇸🇰</span>
                  <span>Slovenčina (斯洛伐克)</span>
                </div>
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                  <span>🇨🇿</span>
                  <span>Čeština (捷克)</span>
                </div>
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                  <span>🇵🇱</span>
                  <span>Polski (波兰)</span>
                </div>
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                  <span>🇭🇺</span>
                  <span>Magyar (匈牙利)</span>
                </div>
                <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                  <span>🇦🇹</span>
                  <span>Deutsch (奥地利)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
