import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { CustomerH5View } from './components/client/CustomerH5View';
import { KDSView } from './components/kds/KDSView';
import { ExpoPackView } from './components/kds/ExpoPackView';
import { CallingScreen } from './components/calling/CallingScreen';
import { CounterScanView } from './components/counter/CounterScanView';
import { SaaSAdminDashboard } from './components/admin/SaaSAdminDashboard';
import { UnifiedMenuWorkshop } from './components/admin/UnifiedMenuWorkshop';
import { ArchitectureSpecView } from './components/docs/ArchitectureSpecView';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from './i18n/translations';
import {
  Smartphone,
  ChefHat,
  PackageCheck,
  Tv,
  QrCode,
  Layers,
  Cpu,
  Sparkles,
  Volume2,
  VolumeX,
  Store,
  Clock,
  Flame,
  CupSoda,
  Zap,
  Building2,
  Sun,
  Moon,
  Globe,
  ShieldAlert,
  ChevronDown,
  UserCheck,
  Coins,
  UtensilsCrossed,
} from 'lucide-react';

type ViewMode =
  | 'SAAS_ADMIN'
  | 'MENU_WORKSHOP'
  | 'CUSTOMER_H5'
  | 'COUNTER_SCAN'
  | 'KDS_STATIONS'
  | 'EXPO_PACK'
  | 'CALLING_TV'
  | 'SPLIT_SANDBOX'
  | 'ARCHITECTURE_SPEC';

const MainLayout: React.FC = () => {
  const {
    currentStore,
    setCurrentStore,
    stores,
    queueSummary,
    wsConnected,
    audioEnabled,
    setAudioEnabled,
    simulateTraffic,
    theme,
    setTheme,
    currentLang,
    setCurrentLang,
    currentStaffUser,
    setCurrentStaffUser,
    staffUsers,
    t,
  } = useApp();

  const [currentView, setCurrentView] = useState<ViewMode>('SAAS_ADMIN');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);

  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div
      className={`w-screen h-screen flex flex-col overflow-hidden select-none font-sans transition-colors duration-150 ${
        theme === 'light' ? 'bg-stone-100 text-stone-800' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* Top Global Navigation & Multi-Role SaaS Control Bar */}
      <header
        className={`px-3.5 py-2 shrink-0 z-30 shadow-xs border-b transition-colors ${
          theme === 'light' ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Logo & Store Selector & Role Switcher */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-sm shadow-xs">
              茶
            </div>

            {/* 门店快速切换下拉菜单 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsStoreMenuOpen(!isStoreMenuOpen);
                  setIsRoleMenuOpen(false);
                  setIsLangMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-800 transition"
              >
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span className="max-w-[130px] truncate">{currentStore.storeName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                  {currentStore.currency}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {isStoreMenuOpen && (
                <div className="absolute left-0 mt-1 w-64 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1 flex items-center justify-between">
                    <span>切换当前门店上下文</span>
                    <span className="font-mono text-amber-600">欧洲多国币种</span>
                  </div>
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setCurrentStore(s);
                        setIsStoreMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition ${
                        currentStore.id === s.id
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-bold">{s.storeName}</div>
                        <div className="text-[10px] text-stone-400 line-clamp-1">{s.address}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 font-mono shrink-0 ml-1">
                        {s.currency} ({s.currencySymbol})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 角色与权限快速切换 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsRoleMenuOpen(!isRoleMenuOpen);
                  setIsStoreMenuOpen(false);
                  setIsLangMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="max-w-[120px] truncate">{currentStaffUser.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 font-bold">
                  {currentStaffUser.role === 'SUPER_ADMIN'
                    ? '平台超级管理员'
                    : currentStaffUser.role === 'MERCHANT'
                    ? '商家'
                    : currentStaffUser.role === 'STORE_MANAGER'
                    ? '店长'
                    : currentStaffUser.role === 'CHEF'
                    ? '主厨'
                    : currentStaffUser.role === 'EXPO_PACKER'
                    ? '打包员'
                    : '收银员'}
                </span>
                <ChevronDown className="w-3 h-3 text-amber-700" />
              </button>

              {isRoleMenuOpen && (
                <div className="absolute left-0 mt-1 w-72 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
                    切换测试身份与权限矩阵
                  </div>
                  {staffUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setCurrentStaffUser(u);
                        setIsRoleMenuOpen(false);
                        if (u.role === 'SUPER_ADMIN') {
                          setCurrentView('SAAS_ADMIN');
                        } else if (u.role === 'MERCHANT') {
                          setCurrentView('MENU_WORKSHOP');
                        } else if (u.role === 'STORE_MANAGER') {
                          setCurrentView('SAAS_ADMIN');
                        } else if (u.role === 'CASHIER') {
                          setCurrentView('COUNTER_SCAN');
                        } else if (u.role === 'CHEF') {
                          setCurrentView('KDS_STATIONS');
                        } else if (u.role === 'EXPO_PACKER') {
                          setCurrentView('EXPO_PACK');
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition ${
                        currentStaffUser.id === u.id
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {currentStaffUser.id === u.id && (
                            <span className="text-[9px] px-1 rounded bg-stone-950 text-white font-mono">当前</span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {u.role === 'SUPER_ADMIN'
                            ? '服务商超管 / 权限·账户创建·舰队·大盘'
                            : u.role === 'MERCHANT'
                            ? '连锁商家 / 菜品配方BOM与多店销售'
                            : u.role === 'STORE_MANAGER'
                            ? '店长 / 当日销售与食材库存'
                            : u.role === 'CHEF'
                            ? '后厨主厨 / KDS出餐消单'
                            : u.role === 'EXPO_PACKER'
                            ? '打包员 / 总控打包叫号'
                            : '收银员 / 吧台点单核销'}
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 font-bold shrink-0 ml-1">
                        {u.role === 'SUPER_ADMIN'
                          ? '超管'
                          : u.role === 'MERCHANT'
                          ? '商家'
                          : u.role === 'STORE_MANAGER'
                          ? '店长'
                          : u.role === 'CHEF'
                          ? '主厨'
                          : u.role === 'EXPO_PACKER'
                          ? '打包'
                          : '收银'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Core Viewport & Role Terminal Switcher */}
          <div className="flex items-center p-1 rounded-2xl border border-stone-200 bg-stone-100 text-xs overflow-x-auto max-w-full">
            {/* SaaS Admin Tab */}
            <button
              id="nav-saas-admin-btn"
              type="button"
              onClick={() => setCurrentView('SAAS_ADMIN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'SAAS_ADMIN'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t('saasAdmin')}</span>
            </button>

            {/* Menu & Recipe BOM Workshop */}
            <button
              id="nav-menu-workshop-btn"
              type="button"
              onClick={() => setCurrentView('MENU_WORKSHOP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'MENU_WORKSHOP'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>菜品与配方工坊</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 font-bold">BOM</span>
            </button>

            {/* Split Sandbox */}
            <button
              id="nav-split-sandbox-btn"
              type="button"
              onClick={() => setCurrentView('SPLIT_SANDBOX')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'SPLIT_SANDBOX'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t('splitSandbox')}</span>
            </button>

            {/* Counter POS */}
            <button
              id="nav-counter-scan-btn"
              type="button"
              onClick={() => setCurrentView('COUNTER_SCAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'COUNTER_SCAN'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t('counterPos')}</span>
            </button>

            {/* Customer H5 */}
            <button
              id="nav-customer-h5-btn"
              type="button"
              onClick={() => setCurrentView('CUSTOMER_H5')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'CUSTOMER_H5'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t('customerH5')}</span>
            </button>

            {/* KDS Stations */}
            <button
              id="nav-kds-stations-btn"
              type="button"
              onClick={() => setCurrentView('KDS_STATIONS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'KDS_STATIONS'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>{t('kdsStations')}</span>
            </button>

            {/* Expo Pack */}
            <button
              id="nav-expo-pack-btn"
              type="button"
              onClick={() => setCurrentView('EXPO_PACK')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'EXPO_PACK'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>{t('expoPack')}</span>
            </button>

            {/* Calling TV */}
            <button
              id="nav-calling-tv-btn"
              type="button"
              onClick={() => setCurrentView('CALLING_TV')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'CALLING_TV'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{t('callingTv')}</span>
            </button>

            {/* Architecture Spec */}
            <button
              id="nav-architecture-spec-btn"
              type="button"
              onClick={() => setCurrentView('ARCHITECTURE_SPEC')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'ARCHITECTURE_SPEC'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{t('architectureSpec')}</span>
            </button>
          </div>

          {/* Multi-Language Switcher & Voice toggle */}
          <div className="flex items-center gap-2 text-xs">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsLangMenuOpen(!isLangMenuOpen);
                  setIsRoleMenuOpen(false);
                  setIsStoreMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold transition"
                title={t('langSwitch')}
              >
                <span>{activeLangObj.flag}</span>
                <span className="hidden sm:inline text-xs">{activeLangObj.nativeName.split(' ')[0]}</span>
                <Globe className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
                    {t('langSwitch')} (i18n Multi-Language)
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setCurrentLang(lang.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                        currentLang === lang.code
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      <span className="text-[10px] opacity-60 font-mono">{lang.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Queue Counter & Voice toggle */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-stone-200 bg-stone-50 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {t('waitingQueue')}: <strong className="text-amber-600 font-mono">{queueSummary.waitingCups}</strong>{' '}
                {t('cups')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-xl border border-stone-200 transition ${
                audioEnabled
                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                  : 'bg-stone-50 text-stone-400 hover:text-stone-600'
              }`}
              title={audioEnabled ? '已开启语音播报' : '已静音'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Body */}
      <main className="flex-1 overflow-hidden relative">
        {/* VIEW 0: SaaS Admin Dashboard */}
        {currentView === 'SAAS_ADMIN' && (
          <div className="w-full h-full overflow-hidden">
            <SaaSAdminDashboard />
          </div>
        )}

        {/* VIEW: Menu & Recipe BOM Workshop */}
        {currentView === 'MENU_WORKSHOP' && (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-stone-100 dark:bg-zinc-950">
            <div className="max-w-7xl mx-auto">
              <UnifiedMenuWorkshop />
            </div>
          </div>
        )}

        {/* VIEW 1: Split Sandbox Mode */}
        {currentView === 'SPLIT_SANDBOX' && (
          <div className="w-full h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-stone-200 bg-stone-100 overflow-hidden">
            {/* Customer H5 Simulator */}
            <div className="w-full lg:w-96 shrink-0 h-1/2 lg:h-full flex flex-col p-2 sm:p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 text-xs font-bold text-stone-500">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <Smartphone className="w-4 h-4" />
                  📱 {t('customerH5')}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">{currentStore.currency} 结账</span>
              </div>
              <div className="flex-1 border border-stone-300 rounded-3xl overflow-hidden shadow-sm relative bg-white">
                <CustomerH5View />
              </div>
            </div>

            {/* KDS Kitchen */}
            <div className="flex-1 h-1/2 lg:h-full flex flex-col p-2 sm:p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 text-xs font-bold text-stone-500">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <ChefHat className="w-4 h-4" />
                  🍳 {t('kdsStations')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => simulateTraffic(1)}
                    className="text-[11px] bg-stone-200 hover:bg-amber-500 hover:text-stone-950 font-bold px-2 py-0.5 rounded-lg transition"
                  >
                    +注入1单测试
                  </button>
                  <span className="text-[10px] text-stone-400">水吧 / 炸台 / Expo</span>
                </div>
              </div>
              <div className="flex-1 border border-stone-300 rounded-3xl overflow-hidden shadow-sm bg-white">
                <KDSView />
              </div>
            </div>

            {/* Calling Screen TV */}
            <div className="hidden xl:flex w-96 shrink-0 h-full flex-col p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 text-xs font-bold text-stone-500">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Tv className="w-4 h-4" />
                  📢 {t('callingTv')}
                </span>
                <span className="text-[10px] text-stone-400">取餐大屏</span>
              </div>
              <div className="flex-1 border border-stone-300 rounded-3xl overflow-hidden shadow-sm bg-white">
                <CallingScreen />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Customer H5 Standalone */}
        {currentView === 'CUSTOMER_H5' && (
          <div className="w-full h-full flex items-center justify-center p-0 sm:p-4 overflow-hidden bg-stone-100">
            <div className="w-full h-full max-w-md max-h-[96vh] sm:border sm:border-stone-300 sm:rounded-3xl sm:shadow-lg overflow-hidden bg-white">
              <CustomerH5View />
            </div>
          </div>
        )}

        {/* VIEW 3: KDS Stations */}
        {currentView === 'KDS_STATIONS' && (
          <div className="w-full h-full overflow-hidden">
            <KDSView />
          </div>
        )}

        {/* VIEW 4: Expo Pack */}
        {currentView === 'EXPO_PACK' && (
          <div className="w-full h-full overflow-hidden">
            <ExpoPackView />
          </div>
        )}

        {/* VIEW 5: Calling TV Screen */}
        {currentView === 'CALLING_TV' && (
          <div className="w-full h-full overflow-hidden">
            <CallingScreen />
          </div>
        )}

        {/* VIEW 6: Counter Scanner & POS Cashier */}
        {currentView === 'COUNTER_SCAN' && (
          <div className="w-full h-full overflow-hidden">
            <CounterScanView />
          </div>
        )}

        {/* VIEW 7: Architecture Spec & AI Master Prompt */}
        {currentView === 'ARCHITECTURE_SPEC' && (
          <div className="w-full h-full overflow-hidden">
            <ArchitectureSpecView />
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
