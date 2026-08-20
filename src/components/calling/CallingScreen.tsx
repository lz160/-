import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sound } from '../../utils/audio';
import { Volume2, VolumeX, Tv, CheckCircle2, Clock } from 'lucide-react';
import { STORE_CONFIG } from '../../data/menuData';

/**
 * 吧台取餐叫号大屏 TV
 * 支持动态翻牌看板、后厨制作队列状态展示与多语种 TTS 语音合成播报
 */
export const CallingScreen: React.FC = () => {
  const { orders, lastCalledCode, audioEnabled, setAudioEnabled, theme, t, lang } = useApp();
  const [testInputCode, setTestInputCode] = useState('A008');
  const isLight = theme === 'light';

  // 制作中的订单 (PENDING 或 MAKING)
  const preparingOrders = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'MAKING'
  );

  // 制作完成等待取餐的订单
  const readyOrders = orders.filter((o) => o.status === 'READY');

  const handleTestBroadcast = (code: string) => {
    sound.playCallingChime();
    setTimeout(() => {
      if (lang === 'vi') {
        sound.speak(`Mời số ${code} đến quầy nhận món`, 'vi-VN');
      } else if (lang === 'sk') {
        sound.speak(`Číslo ${code}, prosím vyzdvihnite si objednávku pri pulte`, 'sk-SK');
      } else if (lang === 'cz') {
        sound.speak(`Číslo ${code}, prosím k výdejnímu pultu`, 'cs-CZ');
      } else if (lang === 'pl') {
        sound.speak(`Numer ${code}, prosimy o odbiór zamówienia przy barze`, 'pl-PL');
      } else if (lang === 'hu') {
        sound.speak(`${code}-as sorszám, kérjük fáradjon a kiadópulthoz`, 'hu-HU');
      } else if (lang === 'at') {
        sound.speak(`Nummer ${code}, bitte an die Ausgabe kommen`, 'de-AT');
      } else if (lang === 'en') {
        sound.speak(`Order number ${code}, please pick up at the counter`, 'en-US');
      } else {
        sound.speak(`请 ${code} 号到取餐口取餐`, 'zh-CN');
      }
    }, 400);
  };

  return (
    <div
      id="calling-screen"
      className={`w-full h-full flex flex-col p-4 sm:p-6 select-none overflow-hidden transition-colors ${
        isLight ? 'bg-stone-100 text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* 顶部标题与控制栏 */}
      <div
        className={`flex items-center justify-between pb-3 shrink-0 border-b ${
          isLight ? 'border-stone-200' : 'border-stone-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-wide">
              {STORE_CONFIG.storeName}・{t('callingScreenTitle')}
            </h2>
            <p className="text-xs text-stone-500">
              {t('callingScreenSub')}
            </p>
          </div>
        </div>

        {/* 语音开关与试听 */}
        <div className="flex items-center gap-3">
          <button
            id="toggle-tv-audio-btn"
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              audioEnabled
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-white border-stone-300 text-stone-500'
            }`}
          >
            {audioEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-600" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span>{audioEnabled ? t('ttsBroadcasting') : t('ttsMuted')}</span>
          </button>

          <div className="flex items-center bg-white border border-stone-300 rounded-xl p-1 text-xs shadow-xs">
            <input
              type="text"
              value={testInputCode}
              onChange={(e) => setTestInputCode(e.target.value.toUpperCase())}
              className="w-16 px-2 py-1 bg-stone-50 rounded-lg text-center font-mono font-bold text-amber-600 focus:outline-none"
              placeholder="A008"
            />
            <button
              type="button"
              onClick={() => handleTestBroadcast(testInputCode)}
              className="px-2.5 py-1 text-xs font-bold text-stone-700 hover:text-stone-950"
            >
              {t('testAudio')}
            </button>
          </div>
        </div>
      </div>

      {/* 顶部高亮横幅：最新呼叫通知 */}
      {lastCalledCode && (
        <div className="my-4 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-2 border-amber-500 rounded-3xl p-4 flex items-center justify-between shadow-lg shadow-amber-500/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black animate-bounce shadow-md">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                {t('currentCalling')}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-3">
                <span>请</span>
                <span className="text-amber-600 font-mono tracking-widest text-4xl sm:text-5xl font-black bg-white px-4 py-1 rounded-2xl border-2 border-amber-500 shadow-sm">
                  {lastCalledCode}
                </span>
                <span>{t('pleasePickup')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主体分栏：左侧正在制作 (Preparing) + 右侧请取餐 (Ready for Pickup) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 overflow-hidden">
        
        {/* 左侧：后厨正在制作 (Preparing) */}
        <div
          className={`rounded-3xl border p-4 sm:p-5 flex flex-col overflow-hidden shadow-sm transition-colors ${
            isLight ? 'bg-white border-stone-200' : 'bg-stone-900/90 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-black text-base text-stone-900 tracking-wide">
                {t('preparingList')}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono">
              {preparingOrders.length} 单
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-stone-400 text-xs font-medium">
                暂无等待制作单
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {preparingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center flex flex-col items-center justify-center shadow-xs"
                  >
                    <span className="text-2xl sm:text-3xl font-black font-mono text-stone-800">
                      {ord.pickupCode}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-0.5">制作中</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：请取餐 (Ready for Pickup) */}
        <div
          className={`rounded-3xl border-2 p-4 sm:p-5 flex flex-col overflow-hidden shadow-sm transition-colors ${
            isLight
              ? 'bg-emerald-50/40 border-emerald-300'
              : 'bg-emerald-950/20 border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-base text-emerald-900 tracking-wide">
                {t('readyList')}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
              {readyOrders.length} 单
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {readyOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-stone-400 text-xs font-medium">
                待取餐区空闲
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {readyOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-2xl bg-white border-2 border-emerald-400 text-center flex flex-col items-center justify-center shadow-sm animate-pulse"
                  >
                    <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-700">
                      {ord.pickupCode}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 mt-1">请至取餐口</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
