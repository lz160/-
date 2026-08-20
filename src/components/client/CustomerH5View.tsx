import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductSKU, CartItem } from '../../types';
import { ProductModifierModal } from './ProductModifierModal';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import { OrderTrackingView } from './OrderTrackingView';
import {
  ShoppingBag,
  Sparkles,
  Clock,
  Flame,
  ChevronRight,
  Trash2,
  Plus,
  Minus,
  Store,
  MapPin,
  Smartphone,
  Info,
  CheckCircle,
} from 'lucide-react';

export const CustomerH5View: React.FC = () => {
  const {
    store,
    products,
    modifierGroups,
    queueSummary,
    createOrder,
    activeOrderForTracking,
    setActiveOrderForTracking,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('招牌鲜奶茶');
  const [selectedSkuForModifier, setSelectedSkuForModifier] = useState<ProductSKU | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unpaidOrderToCheckout, setUnpaidOrderToCheckout] = useState<any | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter products by active category
  const filteredProducts = products.filter((p) => p.category === activeCategory);

  // Cart calculations
  const cartTotalAmount = cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add customized item to cart
  const handleAddToCart = (item: {
    sku: ProductSKU;
    quantity: number;
    selectedModifiers: any[];
    unitPrice: number;
    notes?: string;
  }) => {
    const cartItemId = `cart_${Date.now()}_${Math.random()}`;
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

  // Submit cart & open Stripe payment modal
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

  return activeOrderForTracking ? (
    <div className="w-full h-full bg-stone-950 flex flex-col">
      <OrderTrackingView
        order={activeOrderForTracking}
        onBackToMenu={() => setActiveOrderForTracking(null)}
      />
    </div>
  ) : (
    <div id="customer-h5-view" className="w-full h-full bg-stone-950 flex flex-col relative text-stone-100 overflow-hidden">
      
      {/* Mobile Header with Dynamic Queue Status */}
      <div className="bg-stone-900 border-b border-stone-800 p-4 shrink-0 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-sm">
              茶
            </div>
            <div>
              <h2 className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                {store.storeName}
              </h2>
              <p className="text-[11px] text-stone-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-500" />
                无桌台外带自提窗口・即买即走
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              营业中
            </span>
          </div>
        </div>

        {/* Real-time Dynamic SLA & Waiting Cups Badge */}
        <div className="mt-3 bg-stone-950/70 border border-stone-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-stone-300">
              当前前方等待 <strong className="text-amber-400">{queueSummary.waitingCups}</strong> 杯
            </span>
          </div>
          <div className="text-stone-400">
            预计制作耗时: <strong className="text-stone-200">~{queueSummary.avgWaitTimeMinutes}</strong> 分钟
          </div>
        </div>
      </div>

      {/* Main Content: Left Category List + Right Product Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Categories Sidebar */}
        <div className="w-24 sm:w-28 bg-stone-900/60 border-r border-stone-800 overflow-y-auto shrink-0 py-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`w-full px-2.5 py-3.5 text-left text-xs font-medium border-l-2 transition flex flex-col gap-0.5 ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Right Product Listings */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 pb-24">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              {activeCategory} ({filteredProducts.length})
            </h3>
            <span className="text-[11px] text-stone-500">
              {activeCategory.includes('茶') ? '水吧制作台' : '炸台/铁板煎烤'}
            </span>
          </div>

          <div className="space-y-3">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-stone-900/90 border border-stone-800/80 rounded-2xl p-3 flex gap-3 hover:border-stone-700 transition relative overflow-hidden"
              >
                {/* Image */}
                <img
                  src={prod.image}
                  alt={prod.name}
                  referrerPolicy="no-referrer"
                  className="w-22 h-22 sm:w-24 sm:h-24 rounded-xl object-cover border border-stone-800 shrink-0"
                />

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-bold text-stone-100 truncate">{prod.name}</h4>
                    </div>

                    {prod.tags && prod.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prod.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-stone-400 line-clamp-2 mt-1">
                      {prod.description}
                    </p>
                  </div>

                  {/* Price & Customize Button */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-800/40">
                    <div className="text-base font-black text-amber-400">
                      ¥{prod.basePrice}
                      <span className="text-[10px] text-stone-500 font-normal ml-0.5">起</span>
                    </div>

                    <button
                      id={`select-sku-${prod.id}`}
                      type="button"
                      onClick={() => setSelectedSkuForModifier(prod)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition active:scale-95"
                    >
                      <span>选规格</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-stone-900 border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex items-center justify-between backdrop-blur-md">
            
            <button
              type="button"
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="flex items-center gap-3 text-left"
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 font-black shadow-md">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-stone-900">
                  {cartTotalCount}
                </span>
              </div>

              <div>
                <div className="text-xs text-stone-400">预选清单</div>
                <div className="text-lg font-black text-amber-400">
                  ¥{cartTotalAmount.toFixed(1)}
                </div>
              </div>
            </button>

            <button
              id="open-cart-checkout-btn"
              type="button"
              onClick={handleInitiateOrder}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-1.5 transition active:scale-98"
            >
              <span>去先付结算</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl p-5 text-stone-100 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                已选单品明细 ({cartTotalCount} 件)
              </h4>
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-stone-400 hover:text-rose-400 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空待点单
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-800/60 py-2 space-y-2">
              {cart.map((item) => (
                <div key={item.cartItemId} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-200">{item.sku.name}</div>
                    <div className="text-[11px] text-stone-400 flex flex-wrap gap-1 mt-0.5">
                      {item.selectedModifiers.map((m, idx) => (
                        <span key={idx} className="bg-stone-800 px-1.5 py-0.5 rounded text-stone-300">
                          {m.itemName}
                        </span>
                      ))}
                    </div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-500 italic mt-0.5">
                        备注: {item.notes}
                      </div>
                    )}
                    <div className="text-amber-400 font-bold mt-1">¥{item.itemTotalPrice.toFixed(1)}</div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-stone-800 rounded-lg border border-stone-700/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, -1)}
                      className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-stone-200 text-xs">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, 1)}
                      className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Optional Customer Phone & Store Pickup Note */}
            <div className="pt-3 border-t border-stone-800 space-y-2 text-xs">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="顾客手机号 (选填，用于取餐短信/推送)"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="整单备注 (如：全部打包外带)"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Total and Checkout button */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-4 mt-2">
              <div>
                <div className="text-xs text-stone-400">实付总额</div>
                <div className="text-xl font-black text-amber-400">¥{cartTotalAmount.toFixed(1)}</div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-700 text-stone-300 text-xs hover:bg-stone-800"
                >
                  继续选购
                </button>
                <button
                  id="submit-order-prepay-btn"
                  type="button"
                  onClick={handleInitiateOrder}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <span>立即支付</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modifier Customization Modal */}
      {selectedSkuForModifier && (
        <ProductModifierModal
          sku={selectedSkuForModifier}
          modifierGroups={modifierGroups}
          onClose={() => setSelectedSkuForModifier(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Stripe Pre-Pay Modal */}
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
