import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { CustomerH5View } from './components/client/CustomerH5View';
import { KDSView } from './components/kds/KDSView';
import { ExpoPackView } from './components/kds/ExpoPackView';
import { CallingScreen } from './components/calling/CallingScreen';
import { CounterScanView } from './components/counter/CounterScanView';
import { SaaSAdminDashboard } from './components/admin/SaaSAdminDashboard';
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
} from 'lucide-react';

type ViewMode = 'CUSTOMER_H5' | 'KDS_STATIONS' | 'EXPO_PACK' | 'CALLING_TV' | 'COUNTER_SCAN' | 'SAAS_ADMIN' | 'SPLIT_SANDBOX' | 'ARCHITECTURE_SPEC';

const MainLayout: React.FC = () => {
  const {
    store,
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
    t,
  } = useApp();

  const [currentView, setCurrentView] = useState<ViewMode>('SAAS_ADMIN');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden select-none font-sans transition-colors duration-200 ${
      theme === 'light' ? 'bg-stone-100 text-stone-800' : 'bg-stone-950 text-stone-100'
    }`}>
      
      {/* Top Global Navigation & Multi-Role SaaS Control Bar */}
      <header className={`px-3 py-2 shrink-0 z-30 shadow-xs border-b transition-colors ${
        theme === 'light' ? 'bg-white border-stone-200 shadow-stone-200/50' : 'bg-stone-900 border-stone-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Logo & Store & Active Role Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 flex items-center justify-center font-black text-sm shadow-md">
              茶
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm">
                  {store.storeName.split('(')[0]}
                </span>
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-amber-500 animate-ping'}`} />
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                  {currentStaffUser.name} ({currentStaffUser.role === 'STORE_MANAGER' ? '店长' : currentStaffUser.role === 'SUPER_ADMIN' ? '超级管理员' : '收银员'})
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                {t('appSubTitle')}
              </p>
            </div>
          </div>

          {/* Core Viewport & Role Terminal Switcher */}
          <div className={`flex items-center p-1 rounded-2xl border text-xs overflow-x-auto max-w-full ${
            theme === 'light' ? 'bg-stone-100 border-stone-200' : 'bg-stone-950 border-stone-800'
          }`}>
            
            {/* SaaS Admin Tab (Primary Requested) */}
            <button
              id="nav-saas-admin-btn"
              type="button"
              onClick={() => setCurrentView('SAAS_ADMIN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'SAAS_ADMIN'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t('saasAdmin')}</span>
            </button>

            {/* Split Sandbox */}
            <button
              id="nav-split-sandbox-btn"
              type="button"
              onClick={() => setCurrentView('SPLIT_SANDBOX')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'SPLIT_SANDBOX'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t('splitSandbox')}</span>
            </button>

            {/* Customer H5 */}
            <button
              id="nav-customer-h5-btn"
              type="button"
              onClick={() => setCurrentView('CUSTOMER_H5')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'CUSTOMER_H5'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t('customerH5')}</span>
            </button>

            {/* Counter POS */}
            <button
              id="nav-counter-scan-btn"
              type="button"
              onClick={() => setCurrentView('COUNTER_SCAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'COUNTER_SCAN'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t('counterPos')}</span>
            </button>

            {/* KDS Stations */}
            <button
              id="nav-kds-stations-btn"
              type="button"
              onClick={() => setCurrentView('KDS_STATIONS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                currentView === 'KDS_STATIONS'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
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
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
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
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
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
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{t('architectureSpec')}</span>
            </button>
          </div>

          {/* Multi-Language Switcher & Light/Dark Theme Switcher */}
          <div className="flex items-center gap-2 text-xs">
            
            {/* Language Dropdown (Chinese, English, Slovak, and bordering countries: CZ, PL, HU, AT) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-bold transition ${
                  theme === 'light' ? 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700' : 'bg-stone-950 border-stone-800 hover:bg-stone-800 text-stone-200'
                }`}
                title="切换语言 (Slovak & Bordering Countries)"
              >
                <span>{activeLangObj.flag}</span>
                <span className="hidden sm:inline text-xs">{activeLangObj.nativeName.split(' ')[0]}</span>
                <Globe className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {isLangMenuOpen && (
                <div className={`absolute right-0 mt-1 w-52 rounded-2xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
                  theme === 'light' ? 'bg-white border-stone-200 text-stone-800' : 'bg-stone-900 border-stone-800 text-stone-100'
                }`}>
                  <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800 mb-1">
                    {t('langSwitch')} (Slovakia & Neighbors)
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
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      <span className="text-[10px] opacity-60 font-mono">
                        {lang.code.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-xl border transition ${
                theme === 'light'
                  ? 'bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100 shadow-xs'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-amber-400'
              }`}
              title={theme === 'light' ? t('themeLight') : t('themeDark')}
            >
              {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Queue Counter & Voice toggle */}
            <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs ${
              theme === 'light' ? 'bg-stone-50 border-stone-200' : 'bg-stone-950 border-stone-800'
            }`}>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('waitingQueue')}: <strong className="text-amber-500">{queueSummary.waitingCups}</strong> {t('cups')}</span>
            </div>

            <button
              type="button"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-xl border transition ${
                audioEnabled
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-500'
                  : theme === 'light' ? 'bg-stone-50 border-stone-200 text-stone-400' : 'bg-stone-950 border-stone-800 text-stone-500'
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
        
        {/* VIEW 0: SaaS Admin Dashboard & Store Manager Category Control */}
        {currentView === 'SAAS_ADMIN' && (
          <div className="w-full h-full overflow-hidden">
            <SaaSAdminDashboard />
          </div>
        )}

        {/* VIEW 1: Split Sandbox Mode */}
        {currentView === 'SPLIT_SANDBOX' && (
          <div className={`w-full h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x overflow-hidden ${
            theme === 'light' ? 'divide-stone-200 bg-stone-100' : 'divide-stone-800 bg-stone-950'
          }`}>
            
            {/* Customer H5 Simulator */}
            <div className="w-full lg:w-96 shrink-0 h-1/2 lg:h-full flex flex-col p-2 sm:p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 text-xs font-bold text-stone-500">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Smartphone className="w-4 h-4" />
                  📱 {t('customerH5')}
                </span>
                <span className="text-[10px] text-stone-400">先付 + Stripe Webhook</span>
              </div>
              <div className={`flex-1 border-2 rounded-3xl overflow-hidden shadow-xl relative ${
                theme === 'light' ? 'bg-white border-stone-300' : 'bg-stone-900 border-stone-800'
              }`}>
                <CustomerH5View />
              </div>
            </div>

            {/* KDS Kitchen */}
            <div className="flex-1 h-1/2 lg:h-full flex flex-col p-2 sm:p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 text-xs font-bold text-stone-500">
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <ChefHat className="w-4 h-4" />
                  🍳 {t('kdsStations')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => simulateTraffic(1)}
                    className="text-[11px] bg-stone-200 dark:bg-stone-800 hover:bg-amber-500 hover:text-stone-950 font-bold px-2 py-0.5 rounded-lg transition"
                  >
                    +注入1单测试
                  </button>
                  <span className="text-[10px] text-stone-400">水吧 / 炸台 / Expo</span>
                </div>
              </div>
              <div className={`flex-1 border-2 rounded-3xl overflow-hidden shadow-xl ${
                theme === 'light' ? 'bg-white border-stone-300' : 'bg-stone-900 border-stone-800'
              }`}>
                <KDSView />
              </div>
            </div>

            {/* Calling Screen TV */}
            <div className="hidden xl:flex w-96 shrink-0 h-full flex-col p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 text-xs font-bold text-stone-500">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Tv className="w-4 h-4" />
                  📢 {t('callingTv')}
                </span>
                <span className="text-[10px] text-stone-400">动态更新</span>
              </div>
              <div className={`flex-1 border-2 rounded-3xl overflow-hidden shadow-xl ${
                theme === 'light' ? 'bg-white border-stone-300' : 'bg-stone-900 border-stone-800'
              }`}>
                <CallingScreen />
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: Customer H5 Standalone */}
        {currentView === 'CUSTOMER_H5' && (
          <div className="w-full h-full flex items-center justify-center p-0 sm:p-4 overflow-hidden">
            <div className={`w-full h-full max-w-md max-h-[96vh] sm:border-2 sm:rounded-3xl sm:shadow-2xl overflow-hidden ${
              theme === 'light' ? 'sm:bg-white sm:border-stone-300' : 'sm:bg-stone-900 sm:border-stone-800'
            }`}>
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
