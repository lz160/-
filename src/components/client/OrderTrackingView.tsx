import React from 'react';
import { OrderMaster } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  PackageCheck,
  ChevronLeft,
  Store,
  MapPin,
  Flame,
  CupSoda,
} from 'lucide-react';

interface Props {
  order: OrderMaster;
  onBackToMenu: () => void;
}

/**
 * 顾客端订单制作状态动态追踪卡片
 * 实时同步水吧、炸台完成进度与取餐码
 */
export const OrderTrackingView: React.FC<Props> = ({ order: initialOrder, onBackToMenu }) => {
  const { orders, store, theme, t } = useApp();
  const isLight = theme === 'light';

  // 从全局状态拉取该订单的最新动态（包含各个工位消单完成状态）
  const liveOrder = orders.find((o) => o.id === initialOrder.id) || initialOrder;

  const getStatusBadge = () => {
    switch (liveOrder.status) {
      case 'PENDING':
      case 'MAKING':
        return {
          title: t('kitchenPreparing'),
          desc: '水吧与后厨师傅正在为您按序制作中，请留意屏幕与播报',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          dot: 'bg-amber-500 animate-ping',
        };
      case 'READY':
        return {
          title: t('readyForPickup'),
          desc: '您的餐品已全部制作打包完毕，请凭取餐码前往吧台领取！',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          dot: 'bg-emerald-500 animate-bounce',
        };
      case 'COMPLETED':
        return {
          title: t('orderCompleted'),
          desc: '餐品已出餐核销，感谢您的光临！',
          color: 'text-stone-700 bg-stone-100 border-stone-200',
          dot: 'bg-stone-400',
        };
      default:
        return {
          title: '已提交',
          desc: '订单处理中',
          color: 'text-stone-700 bg-stone-100 border-stone-200',
          dot: 'bg-stone-400',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div
      id="order-tracking-view"
      className={`w-full h-full flex flex-col overflow-y-auto transition-colors ${
        isLight ? 'bg-stone-50 text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* 顶部返回导航 */}
      <div
        className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        <button
          type="button"
          onClick={onBackToMenu}
          className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('backToMenu')}</span>
        </button>

        <span className="text-xs font-bold text-stone-700">{t('orderTracking')}</span>
        <div className="w-12" />
      </div>

      <div className="p-4 sm:p-6 max-w-md mx-auto w-full space-y-4">
        {/* 核心醒目取餐码牌 */}
        <div
          className={`rounded-3xl border p-6 text-center shadow-lg relative overflow-hidden ${
            isLight
              ? 'bg-gradient-to-b from-amber-50/80 to-white border-amber-200'
              : 'bg-stone-900 border-amber-500/30'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 inline-block mb-2">
            {t('pickupCode')}
          </span>

          <div className="text-5xl sm:text-6xl font-black font-mono text-amber-600 tracking-wider my-1">
            {liveOrder.pickupCode}
          </div>

          <p className="text-xs text-stone-500 mt-1">
            单号: <span className="font-mono text-stone-700">{liveOrder.orderNo}</span>
          </p>

          <div className="mt-4 pt-4 border-t border-amber-100 flex items-center justify-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot}`} />
            <span className="text-xs font-bold text-stone-800">{statusInfo.title}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{statusInfo.desc}</p>
        </div>

        {/* 各工位制作明细状态 */}
        <div
          className={`rounded-2xl border p-4 shadow-xs ${
            isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
          }`}
        >
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>商品后厨工位流转</span>
          </h4>

          <div className="space-y-3 divide-y divide-stone-100">
            {liveOrder.items.map((item, idx) => (
              <div key={item.itemId || `track-item-${idx}`} className="pt-2.5 first:pt-0 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">{item.productName}</span>
                    <span className="text-xs font-bold text-amber-600">x{item.quantity}</span>
                  </div>
                  {item.selectedModifiers.length > 0 && (
                    <p className="text-[11px] text-stone-500">
                      {item.selectedModifiers.map((m) => m.itemName).join(' · ')}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {item.stationStatus === 'DONE' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      已出餐
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      <Clock className="w-3 h-3 animate-spin" />
                      制作中
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 支付与时间明细 */}
        <div
          className={`rounded-2xl border p-4 text-xs space-y-2 shadow-xs ${
            isLight ? 'bg-white border-stone-200 text-stone-600' : 'bg-stone-900 border-stone-800 text-stone-400'
          }`}
        >
          <div className="flex justify-between">
            <span>支付方式</span>
            <span className="font-semibold text-stone-800">{liveOrder.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>支付时间</span>
            <span className="font-mono text-stone-800">
              {new Date(liveOrder.paidAt || liveOrder.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-stone-100">
            <span className="font-bold text-stone-800">实付总计</span>
            <span className="font-bold text-amber-600 text-sm">
              {store.currency} {liveOrder.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
