import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductSKU, CartItem } from '../../types';
import { ProductModifierModal } from './ProductModifierModal';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import { OrderTrackingView } from './OrderTrackingView';
import {
  ShoppingBag,
  Clock,
  MapPin,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react';

/**
 * 顾客手机端 H5 点单页面
 * 支持商品分类切换、加料选配、购物车管理、Stripe 沙盒预结账及后厨制作追踪
 */
export const CustomerH5View: React.FC = () => {
  const {
    store,
    products,
    modifierGroups,
    queueSummary,
    createOrder,
    activeOrderForTracking,
    setActiveOrderForTracking,
    t,
    theme,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('招牌鲜奶茶');
  const [selectedSkuForModifier, setSelectedSkuForModifier] = useState<ProductSKU | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unpaidOrderToCheckout, setUnpaidOrderToCheckout] = useState<any | null>(null);

  // 提取唯一分类列表
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // 过滤当前选中分类的商品
  const filteredProducts = products.filter((p) => p.category === activeCategory);

  // 购物车计算
  const cartTotalAmount = cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 添加客制化商品至购物车
  const handleAddToCart = (item: {
    sku: ProductSKU;
    quantity: number;
    selectedModifiers: any[];
    unitPrice: number;
    notes?: string;
  }) => {
    const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newCartItem: CartItem = {
      cartItemId,
      sku: item.sku,
      quantity: item.quantity,
      selectedModifiers: item.selectedModifiers,
      unitPrice: item.unitPrice,
      itemTotalPrice: item.unitPrice * item.quantity,
      notes: item.notes,
    };
    setCart((prev) => [...prev, newCartItem]);
  };

  // 修改购物车内单项数量
  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              itemTotalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // 提交订单并弹出支付模态框
  const handleInitiateOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const payloadItems = cart.map((c) => ({
        skuId: c.sku.id,
        quantity: c.quantity,
        selectedModifiers: c.selectedModifiers,
        notes: c.notes,
      }));

      const res = await createOrder(payloadItems, customerPhone, orderNotes);
      setUnpaidOrderToCheckout(res.order);
      setIsCartOpen(false);
    } catch (err: any) {
      alert('创建预订单失败: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLight = theme === 'light';

  return activeOrderForTracking ? (
    <div className={`w-full h-full flex flex-col ${isLight ? 'bg-stone-100' : 'bg-stone-950'}`}>
      <OrderTrackingView
        order={activeOrderForTracking}
        onBackToMenu={() => setActiveOrderForTracking(null)}
      />
    </div>
  ) : (
    <div
      id="customer-h5-view"
      className={`w-full h-full flex flex-col relative overflow-hidden transition-colors ${
        isLight ? 'bg-stone-50 text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* 顶部门店信息与排队状态 */}
      <div
        className={`p-4 shrink-0 shadow-sm transition-colors border-b ${
          isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shadow-sm">
              茶
            </div>
            <div>
              <h2 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                {store.storeName}
              </h2>
              <p className="text-[11px] text-stone-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                {t('takeoutOnly')}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('openNow')}
            </span>
          </div>
        </div>

        {/* 实时排队情况及预计等待时间 */}
        <div
          className={`mt-3 rounded-xl p-2.5 flex items-center justify-between text-xs border ${
            isLight
              ? 'bg-amber-50/60 border-amber-200/80 text-stone-700'
              : 'bg-stone-950/70 border-stone-800/80 text-stone-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>
              {t('currentWaiting')}{' '}
              <strong className="text-amber-600 font-bold">{queueSummary.waitingCups}</strong>{' '}
              {t('cups')}
            </span>
          </div>
          <div className="text-stone-500">
            {t('estimatedWaitTime')}:{' '}
            <strong className="text-stone-800 font-semibold">
              ~{queueSummary.avgWaitTimeMinutes}
            </strong>{' '}
            {t('minutes')}
          </div>
        </div>
      </div>

      {/* 主体点单区：左侧分类列表 + 右侧商品列表 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧分类导航 */}
        <div
          className={`w-24 sm:w-28 border-r overflow-y-auto shrink-0 py-2 transition-colors ${
            isLight ? 'bg-stone-100/90 border-stone-200' : 'bg-stone-900/60 border-stone-800'
          }`}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`w-full px-2.5 py-3.5 text-left text-xs font-medium border-l-3 transition flex flex-col gap-0.5 ${
                  isActive
                    ? 'bg-white border-amber-600 text-amber-700 font-bold shadow-xs'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* 右侧商品卡片列表 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 pb-24">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              {activeCategory} ({filteredProducts.length})
            </h3>
            <span className="text-[11px] text-stone-400">
              {activeCategory.includes('茶') ? t('waterBarStation') : t('fryerStation')}
            </span>
          </div>

          <div className="space-y-3">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className={`border rounded-2xl p-3 flex gap-3 transition relative overflow-hidden ${
                  isLight
                    ? 'bg-white border-stone-200 shadow-xs hover:border-amber-400'
                    : 'bg-stone-900/90 border-stone-800/80 hover:border-stone-700'
                }`}
              >
                {/* 商品配图 */}
                <img
                  src={prod.image}
                  alt={prod.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl object-cover border border-stone-200 shrink-0"
                />

                {/* 商品详情 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-bold text-stone-900 truncate">{prod.name}</h4>
                    </div>

                    {prod.tags && prod.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prod.tags.map((tg, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded text-[10px] font-medium"
                          >
                            {tg}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">
                      {prod.description}
                    </p>
                  </div>

                  {/* 价格与选配按钮 */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-amber-600 font-bold">{store.currency}</span>
                      <span className="text-base font-black text-amber-600">
                        {prod.basePrice.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSkuForModifier(prod)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold shadow-xs hover:bg-amber-400 active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('selectModifiers')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部悬浮购物车栏 */}
      {cart.length > 0 && (
        <div
          className={`absolute bottom-0 inset-x-0 border-t p-3.5 flex items-center justify-between gap-3 shadow-xl backdrop-blur-md transition-colors ${
            isLight
              ? 'bg-white/95 border-stone-200 text-stone-900'
              : 'bg-stone-900/95 border-stone-800 text-stone-100'
          }`}
        >
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setIsCartOpen(!isCartOpen)}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-black rounded-full px-1.5 py-0.5 border-2 border-white">
                {cartTotalCount}
              </span>
            </div>

            <div>
              <div className="text-xs text-stone-500 font-medium">{t('totalPrice')}</div>
              <div className="text-lg font-black text-amber-600">
                {store.currency} {cartTotalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 text-stone-950 text-sm font-bold shadow-md hover:bg-amber-400 active:scale-95 transition flex items-center gap-1.5"
          >
            <span>{t('checkout')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 选配弹窗 */}
      {selectedSkuForModifier && (
        <ProductModifierModal
          sku={selectedSkuForModifier}
          modifierGroups={modifierGroups}
          onClose={() => setSelectedSkuForModifier(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 购物车展开弹层 */}
      {isCartOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
              isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
            }`}
          >
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-stone-900">
                  {t('cart')} ({cartTotalCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                {t('clearCart')}
              </button>
            </div>

            {/* 购物车单项列表 */}
            <div className="p-4 overflow-y-auto space-y-3 divide-y divide-stone-100">
              {cart.map((item) => (
                <div key={item.cartItemId} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-stone-900">{item.sku.name}</h4>
                    {item.selectedModifiers.length > 0 && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {item.selectedModifiers.map((m) => m.itemName).join(' / ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-amber-700 mt-0.5">备注: {item.notes}</p>
                    )}
                    <div className="text-xs font-bold text-amber-600 mt-1">
                      {store.currency} {item.itemTotalPrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1 border border-stone-200">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, -1)}
                      className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-stone-800 px-1">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, 1)}
                      className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 顾客信息输入 */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                  {t('customerPhone')}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="例如: 13800000000"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                  {t('orderNotes')}
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="例如: 奶盖分开装，少冰"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleInitiateOrder}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shadow-md hover:bg-amber-400 active:scale-95 disabled:opacity-50 transition"
                >
                  {isSubmitting ? '提交中...' : `${t('checkout')} (${store.currency} ${cartTotalAmount.toFixed(2)})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stripe 支付模态框 */}
      {unpaidOrderToCheckout && (
        <StripeCheckoutModal
          order={unpaidOrderToCheckout}
          onClose={() => setUnpaidOrderToCheckout(null)}
          onSuccess={(paidOrder) => {
            setUnpaidOrderToCheckout(null);
            setCart([]);
            setActiveOrderForTracking(paidOrder);
          }}
        />
      )}
    </div>
  );
};
