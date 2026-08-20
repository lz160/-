import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderMaster } from '../../types';
import {
  PackageCheck,
  CheckCircle2,
  Volume2,
  Printer,
  QrCode,
  Clock,
  Sparkles,
  Search,
  Check,
  Flame,
  CupSoda,
  Beef,
} from 'lucide-react';

/**
 * Expo 总控打包出餐台
 * 汇集各工位制作进度，整单齐套后装袋并一键触发 TV 叫号与语音播报
 */
export const ExpoPackView: React.FC = () => {
  const { orders, callExpoOrder, completeOrder, theme, t, store } = useApp();
  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForSticker, setSelectedOrderForSticker] = useState<OrderMaster | null>(null);

  // 活跃后厨订单
  const activeOrders = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'MAKING' || o.status === 'READY'
  );

  const filteredOrders = activeOrders.filter(
    (o) =>
      o.pickupCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCall = async (order: OrderMaster) => {
    await callExpoOrder(order.id, order.pickupCode);
  };

  const handleComplete = async (order: OrderMaster) => {
    await completeOrder(order.pickupCode);
  };

  return (
    <div
      id="expo-pack-view"
      className={`w-full h-full flex flex-col p-4 overflow-y-auto transition-colors ${
        isLight ? 'bg-stone-100 text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* 头部搜索与说明条 */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 mb-4 p-3.5 rounded-2xl border shadow-xs transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xs">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-900">
              Expo 总控装配与打包出餐台
            </h3>
            <p className="text-xs text-stone-500">
              核对各分站就绪状态，整单齐套后装袋并触发大屏翻牌与叫号TTS语音
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索取餐码 (如 A003)..."
            className={`pl-9 pr-3 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-amber-500 ${
              isLight
                ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400'
                : 'bg-stone-950 border-stone-700 text-stone-200 placeholder:text-stone-500'
            }`}
          />
        </div>
      </div>

      {/* 工单卡片列表 */}
      {filteredOrders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-stone-400 space-y-2">
          <PackageCheck className="w-12 h-12 text-stone-300" />
          <div className="text-sm font-bold text-stone-600">当前总控打包台无待装配工单</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const allItemsDone = order.items.every((i) => i.stationStatus === 'DONE');
            const isReady = order.status === 'READY';

            return (
              <div
                key={order.id}
                className={`rounded-2xl p-4 flex flex-col justify-between shadow-sm transition border-2 ${
                  isReady
                    ? 'bg-amber-50/70 border-amber-400'
                    : allItemsDone
                    ? 'bg-emerald-50/60 border-emerald-400'
                    : 'bg-white border-stone-200'
                }`}
              >
                {/* 头部信息 */}
                <div>
                  <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black font-mono tracking-wider text-stone-900">
                        {order.pickupCode}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-stone-600 border border-stone-300 uppercase font-bold">
                        {order.channel === 'QR_H5' ? '手机H5' : '吧台POS'}
                      </span>
                    </div>

                    <div className="text-right">
                      {isReady ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-black shadow-xs animate-pulse">
                          <Volume2 className="w-3.5 h-3.5" />
                          已叫号待取
                        </span>
                      ) : allItemsDone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          餐品已齐套
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          后厨制作中
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 各项餐品完成进度清单 */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, itemIdx) => {
                      const isItemDone = item.stationStatus === 'DONE';
                      return (
                        <div
                          key={item.itemId || `item-${order.id}-${itemIdx}`}
                          className="flex items-start justify-between text-xs py-1 border-b border-stone-100 last:border-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900">{item.productName}</span>
                              <span className="font-bold text-amber-600">x{item.quantity}</span>
                            </div>
                            {item.selectedModifiers.length > 0 && (
                              <p className="text-[11px] text-stone-500">
                                {item.selectedModifiers.map((m) => m.itemName).join(' / ')}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 ml-2">
                            {isItemDone ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ✓ 已就绪
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                制作中
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 底部操作按钮：叫号与出餐 */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForSticker(order)}
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center gap-1"
                    title="打印杯贴/小票"
                  >
                    <Printer className="w-4 h-4" />
                    <span>杯贴小票</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCall(order)}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-1 active:scale-95"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isReady ? '重新叫号' : '大屏叫号'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleComplete(order)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>已核销出餐</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 杯贴与出餐单模拟预览 */}
      {selectedOrderForSticker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white text-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-300 font-mono text-xs space-y-3">
            <div className="text-center border-b border-stone-300 pb-3">
              <h4 className="font-black text-sm tracking-wider">{store.storeName}</h4>
              <p className="text-[10px] text-stone-500 mt-0.5">热敏杯贴 / 出餐清单凭证</p>
              <div className="text-3xl font-black text-amber-600 mt-2">
                {selectedOrderForSticker.pickupCode}
              </div>
            </div>

            <div className="space-y-2 py-2 border-b border-stone-300">
              <div className="flex justify-between">
                <span>订单号:</span>
                <span>{selectedOrderForSticker.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span>时间:</span>
                <span>{new Date(selectedOrderForSticker.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>类型:</span>
                <span>外带即走 / 预付款</span>
              </div>
            </div>

            <div className="space-y-1.5 py-2 border-b border-stone-300">
              {selectedOrderForSticker.items.map((i, stickerItemIdx) => (
                <div key={i.itemId || `sticker-item-${stickerItemIdx}`} className="flex justify-between">
                  <span>
                    {i.productName} x{i.quantity}
                  </span>
                  <span>{store.currency} {i.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-sm pt-1">
              <span>合计实收:</span>
              <span className="text-amber-600">
                {store.currency} {selectedOrderForSticker.totalAmount.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderForSticker(null)}
              className="w-full mt-3 py-2.5 bg-stone-900 text-white rounded-xl font-sans font-bold hover:bg-stone-800"
            >
              关闭预览
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
