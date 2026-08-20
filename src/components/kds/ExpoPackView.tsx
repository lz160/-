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

export const ExpoPackView: React.FC = () => {
  const { orders, callExpoOrder, completeOrder } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForSticker, setSelectedOrderForSticker] = useState<OrderMaster | null>(null);

  // Active kitchen orders
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
    <div id="expo-pack-view" className="w-full h-full flex flex-col bg-stone-950 text-stone-100 p-4 overflow-y-auto">
      
      {/* Header & Search Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-stone-900 border border-stone-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-100">
              Expo 总控装配与打包出餐台
            </h3>
            <p className="text-xs text-stone-400">
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
            className="pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Orders Grid for Packager */}
      {filteredOrders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-stone-500 space-y-2">
          <PackageCheck className="w-12 h-12 text-stone-700" />
          <div className="text-sm font-semibold">当前总控打包台无待装配工单</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const allItemsDone = order.items.every((i) => i.stationStatus === 'DONE');
            const isReady = order.status === 'READY';

            return (
              <div
                key={order.id}
                className={`bg-stone-900 border-2 rounded-2xl p-4 flex flex-col justify-between shadow-xl transition duration-200 ${
                  isReady
                    ? 'border-amber-400 bg-gradient-to-b from-stone-900 to-amber-950/20'
                    : allItemsDone
                    ? 'border-emerald-500 shadow-emerald-500/10'
                    : 'border-stone-800'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-amber-400 font-mono tracking-wider">
                        {order.pickupCode}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-medium">
                        {order.channel === 'QR_H5' ? '手机H5扫码' : '外卖'}
                      </span>
                    </div>

                    <div className="text-right">
                      {isReady ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-400 text-stone-950 font-black">
                          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                          已叫号请取餐
                        </span>
                      ) : allItemsDone ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500 text-stone-950 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          分站已齐套
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          分站制作中...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sub-Station Progress Overview */}
                  <div className="space-y-2 mb-3">
                    <div className="text-xs font-semibold text-stone-400 flex items-center justify-between">
                      <span>单品工单拆分与装配清单:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForSticker(order)}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px]"
                      >
                        <Printer className="w-3 h-3" />
                        标签预览
                      </button>
                    </div>

                    <div className="divide-y divide-stone-800/80 bg-stone-950/70 rounded-xl p-2.5 border border-stone-800/80">
                      {order.items.map((item, idx) => {
                        const isDone = item.stationStatus === 'DONE';
                        return (
                          <div
                            key={idx}
                            className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                  isDone
                                    ? 'bg-emerald-500 text-stone-950'
                                    : 'bg-stone-800 text-stone-400'
                                }`}
                              >
                                {isDone ? '✓' : idx + 1}
                              </span>
                              <span className={`truncate ${isDone ? 'text-stone-200' : 'text-stone-400'}`}>
                                {item.productName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-stone-500">
                                {item.targetStationId === 'station_bar' ? '水吧' : '炸台/煎烤'}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  isDone
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {isDone ? '已送达Expo' : '制作中'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Expo Packager Bottom Action Bar */}
                <div className="pt-3 border-t border-stone-800 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCall(order)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isReady ? '再次播报叫号' : '装袋完成 & 叫号'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleComplete(order)}
                    className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition"
                    title="顾客已取餐核销"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Cloud Thermal Cup Sticker Modal Preview */}
      {selectedOrderForSticker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white text-stone-950 rounded-2xl p-5 shadow-2xl font-mono space-y-3">
            <div className="text-center border-b border-dashed border-stone-400 pb-2">
              <div className="text-xs font-bold uppercase">茶野集・云标签机杯贴 (TSPL/ESC-POS)</div>
              <div className="text-3xl font-black tracking-wider my-1">
                {selectedOrderForSticker.pickupCode}
              </div>
              <div className="text-[11px] text-stone-600">
                订单号: {selectedOrderForSticker.orderNo}
              </div>
            </div>

            <div className="space-y-2 text-xs divide-y divide-stone-200">
              {selectedOrderForSticker.items.map((item, idx) => (
                <div key={idx} className="pt-2">
                  <div className="font-bold flex justify-between">
                    <span>{item.productName}</span>
                    <span>x{item.quantity}</span>
                  </div>
                  <div className="text-[11px] text-stone-700">
                    规格: {item.selectedModifiers.map((m) => m.itemName).join(' / ')}
                  </div>
                  {item.notes && (
                    <div className="text-[10px] text-red-600 font-semibold">
                      备注: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-400 pt-2 text-[10px] text-stone-600 flex justify-between">
              <span>实付: ¥{selectedOrderForSticker.totalAmount.toFixed(2)} (Stripe已付)</span>
              <span>{new Date(selectedOrderForSticker.createdAt).toLocaleTimeString()}</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderForSticker(null)}
              className="w-full py-2 bg-stone-900 text-white font-bold rounded-xl text-xs hover:bg-stone-800"
            >
              关闭打印预览
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
