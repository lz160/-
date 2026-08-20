import React, { useEffect, useState } from 'react';
import { OrderMaster } from '../../types';
import { Clock, CheckCircle2, QrCode, Sparkles, ChevronLeft, Volume2, ShieldCheck, MapPin, Store } from 'lucide-react';
import { STORE_CONFIG } from '../../data/menuData';

interface Props {
  order: OrderMaster;
  onBackToMenu: () => void;
}

export const OrderTrackingView: React.FC<Props> = ({ order: initialOrder, onBackToMenu }) => {
  const [order, setOrder] = useState<OrderMaster>(initialOrder);

  // Poll order status if not completed
  useEffect(() => {
    setOrder(initialOrder);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/order/${initialOrder.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) setOrder(data.order);
        }
      } catch (err) {
        console.error('Polling order error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [initialOrder]);

  const isReady = order.status === 'READY';
  const isCompleted = order.status === 'COMPLETED';
  const isMaking = order.status === 'MAKING';
  const isPending = order.status === 'PENDING';

  return (
    <div id="order-tracking-view" className="min-h-full bg-stone-950 text-stone-100 p-4 sm:p-6 max-w-md mx-auto space-y-5 pb-20">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
        <button
          type="button"
          onClick={onBackToMenu}
          className="flex items-center gap-1 text-xs text-amber-400 font-medium hover:text-amber-300 py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          返回菜单点单
        </button>
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          <Store className="w-3.5 h-3.5 text-amber-500" />
          {STORE_CONFIG.storeName.split('(')[0]}
        </div>
      </div>

      {/* Hero Pickup Code Box */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all duration-300 text-center ${
        isReady
          ? 'bg-gradient-to-b from-amber-500/25 via-amber-950/40 to-stone-900 border-amber-400 shadow-2xl shadow-amber-500/20 animate-pulse'
          : isCompleted
          ? 'bg-stone-900/90 border-emerald-500/40'
          : 'bg-stone-900 border-stone-800 shadow-xl'
      }`}>
        
        {isReady && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-black mb-3 shadow-md">
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            已制作完成，请凭码到取餐口取餐！
          </div>
        )}

        {isCompleted && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            已于 {order.completedAt ? new Date(order.completedAt).toLocaleTimeString() : ''} 取餐核销
          </div>
        )}

        <div className="text-xs text-stone-400 uppercase tracking-wider mb-1">
          {isReady ? '请出示取餐流水码' : '您的专属取餐码 (Pickup Code)'}
        </div>
        
        <div className="text-6xl font-black text-amber-400 tracking-wider py-1 font-mono">
          {order.pickupCode || 'A006'}
        </div>

        {/* Dynamic Queue Position Indicator */}
        <div className="mt-4 pt-4 border-t border-stone-800/80 flex items-center justify-around text-xs">
          <div>
            <div className="text-stone-400">前方排队</div>
            <div className="text-base font-bold text-stone-200 mt-0.5">
              {isReady || isCompleted ? '0 份' : `${Math.max(1, order.queuePosition || 1)} 单`}
            </div>
          </div>
          <div className="w-px h-8 bg-stone-800" />
          <div>
            <div className="text-stone-400">预计等待</div>
            <div className="text-base font-bold text-amber-400 mt-0.5 flex items-center gap-1 justify-center">
              <Clock className="w-3.5 h-3.5" />
              {isReady || isCompleted ? '0 分钟' : `约 ${order.estimatedWaitMinutes || 5} 分钟`}
            </div>
          </div>
        </div>

      </div>

      {/* Step Status Flow (4 steps FSM) */}
      <div className="bg-stone-900/80 border border-stone-800/80 rounded-2xl p-4">
        <h4 className="text-xs font-bold text-stone-300 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          订单履约数字状态机
        </h4>

        <div className="grid grid-cols-4 gap-1 relative">
          <div className="text-center space-y-1">
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition ${
              isPending || isMaking || isReady || isCompleted
                ? 'bg-emerald-500 text-stone-950'
                : 'bg-stone-800 text-stone-500'
            }`}>
              ✓
            </div>
            <div className="text-[10px] text-stone-300 font-medium">已先付</div>
          </div>

          <div className="text-center space-y-1">
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition ${
              isMaking || isReady || isCompleted
                ? 'bg-emerald-500 text-stone-950'
                : isPending
                ? 'bg-amber-500 text-stone-950 animate-pulse'
                : 'bg-stone-800 text-stone-500'
            }`}>
              2
            </div>
            <div className="text-[10px] text-stone-300 font-medium">KDS分单制作</div>
          </div>

          <div className="text-center space-y-1">
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition ${
              isReady || isCompleted
                ? 'bg-emerald-500 text-stone-950'
                : 'bg-stone-800 text-stone-500'
            }`}>
              3
            </div>
            <div className="text-[10px] text-stone-300 font-medium">总控就绪叫号</div>
          </div>

          <div className="text-center space-y-1">
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition ${
              isCompleted
                ? 'bg-emerald-500 text-stone-950'
                : 'bg-stone-800 text-stone-500'
            }`}>
              4
            </div>
            <div className="text-[10px] text-stone-300 font-medium">扫码核销完成</div>
          </div>
        </div>
      </div>

      {/* Simulated QR Code for Counter Barcode Scanner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-center space-y-2">
        <div className="text-xs text-stone-400">核销专用条形码 / 碰一碰凭证</div>
        <div className="w-36 h-36 bg-white p-2.5 rounded-xl mx-auto shadow-inner flex flex-col items-center justify-center">
          <QrCode className="w-24 h-24 text-stone-950" />
          <span className="text-[10px] font-mono text-stone-900 font-bold tracking-widest mt-1">
            {order.orderNo.slice(-8)}
          </span>
        </div>
        <p className="text-[11px] text-stone-500">
          取餐时请向店员出示上述取餐码或条码，扫码枪将秒级核销
        </p>
      </div>

      {/* Itemized Order Receipt */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-xs text-stone-400">
          <span>商品明细 ({order.itemsCount}件)</span>
          <span>工位路由</span>
        </div>

        <div className="divide-y divide-stone-800/60">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
              <div className="space-y-0.5 flex-1">
                <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                  <span>{item.productName}</span>
                  <span className="text-amber-400">x{item.quantity}</span>
                </div>
                {item.selectedModifiers.length > 0 && (
                  <div className="text-[11px] text-stone-400 flex flex-wrap gap-1">
                    {item.selectedModifiers.map((m, mi) => (
                      <span key={mi} className="bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
                        {m.itemName}
                      </span>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <div className="text-[10px] text-amber-500 italic">备注: {item.notes}</div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-stone-200">¥{item.totalPrice.toFixed(1)}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  item.stationStatus === 'DONE'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : item.stationStatus === 'MAKING'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-stone-800 text-stone-400'
                }`}>
                  {item.targetStationId === 'station_bar' ? '水吧' : '炸台/煎烤'}・
                  {item.stationStatus === 'DONE' ? '已制备' : item.stationStatus === 'MAKING' ? '制作中' : '排队中'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-800 pt-3 flex items-center justify-between text-xs">
          <span className="text-stone-400">实付总额 (Stripe已扣款)</span>
          <span className="text-base font-black text-amber-400">¥{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

    </div>
  );
};
