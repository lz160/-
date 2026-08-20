import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sound } from '../../utils/audio';
import { Volume2, VolumeX, Sparkles, Tv, CheckCircle2, Flame, Clock } from 'lucide-react';
import { STORE_CONFIG } from '../../data/menuData';

export const CallingScreen: React.FC = () => {
  const { orders, lastCalledCode, audioEnabled, setAudioEnabled } = useApp();
  const [testInputCode, setTestInputCode] = useState('A008');

  // Preparing orders (PENDING or MAKING)
  const preparingOrders = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'MAKING'
  );

  // Ready for pickup orders
  const readyOrders = orders.filter((o) => o.status === 'READY');

  const handleTestBroadcast = (code: string) => {
    sound.playCallingChime();
    setTimeout(() => {
      sound.speak(`请 ${code} 号到取餐口取餐`);
    }, 400);
  };

  return (
    <div id="calling-screen" className="w-full h-full flex flex-col bg-stone-950 text-stone-100 p-4 sm:p-6 select-none overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-lg">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-100 tracking-wide">
              {STORE_CONFIG.storeName}・取餐叫号大屏
            </h2>
            <p className="text-xs text-stone-400">
              实时动态翻牌看板与多语种 TTS 语音合成播报中枢
            </p>
          </div>
        </div>

        {/* Audio Toggle & Test Trigger */}
        <div className="flex items-center gap-3">
          <button
            id="toggle-tv-audio-btn"
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              audioEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-500'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{audioEnabled ? 'TTS 语音播报开启' : '静音模式'}</span>
          </button>

          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-1 text-xs">
            <input
              type="text"
              value={testInputCode}
              onChange={(e) => setTestInputCode(e.target.value.toUpperCase())}
              className="w-16 px-2 py-1 bg-stone-950 rounded-lg text-center font-mono font-bold text-amber-400 focus:outline-none"
              placeholder="A008"
            />
            <button
              type="button"
              onClick={() => handleTestBroadcast(testInputCode)}
              className="px-2.5 py-1 text-xs font-semibold text-stone-300 hover:text-white"
            >
              试听播报
            </button>
          </div>
        </div>
      </div>

      {/* Top Hero Banner: Latest Calling Notice */}
      {lastCalledCode && (
        <div className="my-4 bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent border-2 border-amber-400/80 rounded-3xl p-4 flex items-center justify-between shadow-2xl shadow-amber-500/15 shrink-0 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black animate-bounce shadow-md">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                CURRENT CALLING NOTIFICATION
              </div>
              <div className="text-2xl sm:text-3xl font-black text-stone-100 flex items-center gap-3">
                <span>请</span>
                <span className="text-amber-400 font-mono tracking-widest text-4xl sm:text-5xl font-black bg-stone-950/80 px-4 py-1 rounded-2xl border border-amber-400">
                  {lastCalledCode}
                </span>
                <span>号到取餐口取餐</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTestBroadcast(lastCalledCode)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow transition"
          >
            <Volume2 className="w-4 h-4" />
            重播语音
          </button>
        </div>
      )}

      {/* Dual Column High-Contrast Display Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
        
        {/* Left Column: 制作中 (PREPARING) */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 flex flex-col overflow-hidden shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
              <h3 className="text-lg font-black text-stone-100 tracking-wide">
                制作中 PREPARING
              </h3>
            </div>
            <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
              {preparingOrders.length} 单排队中
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-stone-600 text-sm font-semibold">
                当前后厨无积压制作工单
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {preparingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-stone-950/80 border border-stone-800 rounded-2xl p-3.5 text-center transition hover:border-blue-500/50"
                  >
                    <div className="text-3xl font-black font-mono text-stone-200 tracking-wider">
                      {order.pickupCode}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      约 {order.estimatedWaitMinutes} 分钟
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 请取餐 (READY FOR PICKUP) */}
        <div className="bg-gradient-to-b from-stone-900 to-amber-950/20 border-2 border-amber-500/60 rounded-3xl p-5 flex flex-col overflow-hidden shadow-2xl shadow-amber-500/10">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <h3 className="text-lg font-black text-amber-300 tracking-wide">
                请取餐 READY FOR PICKUP
              </h3>
            </div>
            <span className="text-xs font-bold bg-amber-400 text-stone-950 px-3 py-1 rounded-full shadow-sm">
              {readyOrders.length} 份已就绪
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {readyOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-stone-600 text-sm font-semibold">
                当前暂无待领取的餐品
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {readyOrders.map((order) => {
                  const isLatest = order.pickupCode === lastCalledCode;
                  return (
                    <div
                      key={order.id}
                      onClick={() => handleTestBroadcast(order.pickupCode)}
                      className={`rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 ${
                        isLatest
                          ? 'bg-amber-400 text-stone-950 border-2 border-white shadow-xl shadow-amber-500/40 scale-102 font-black'
                          : 'bg-stone-950 border-2 border-amber-500/50 text-amber-400 hover:border-amber-400'
                      }`}
                    >
                      <div className="text-4xl font-black font-mono tracking-widest">
                        {order.pickupCode}
                      </div>
                      <div
                        className={`text-[11px] mt-1 font-bold ${
                          isLatest ? 'text-stone-900' : 'text-stone-400'
                        }`}
                      >
                        请凭码取餐
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
