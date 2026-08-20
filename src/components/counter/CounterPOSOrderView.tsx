import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductSKU, ModifierGroup, SelectedModifier, CartItem } from '../../types';
import { ProductModifierModal } from '../client/ProductModifierModal';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Printer,
  Sparkles,
  Search,
  RotateCcw,
  Phone,
  MessageSquare,
  Receipt,
  Clock,
  Zap,
  Tag,
  ArrowRight,
  X,
} from 'lucide-react';

export const CounterPOSOrderView: React.FC = () => {
  const { products, modifierGroups, createCounterOrderAndPay } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCart, setActiveCart] = useState<CartItem[]>([]);
  const [activeModalSku, setActiveModalSku] = useState<ProductSKU | null>(null);
  
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Payment Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'POS_CARD' | 'COUNTER_WECHAT' | 'COUNTER_ALIPAY'>('CASH');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Receipt State
  const [completedOrderData, setCompletedOrderData] = useState<any | null>(null);

  // Categories list derived from products
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Totals
  const totalAmount = useMemo(() => {
    return activeCart.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  }, [activeCart]);

  const totalItemsCount = useMemo(() => {
    return activeCart.reduce((sum, item) => sum + item.quantity, 0);
  }, [activeCart]);

  // Cash calculations
  const cashReceivedNumber = parseFloat(cashReceivedInput) || 0;
  const cashChangeAmount = Math.max(0, cashReceivedNumber - totalAmount);
  const isCashInsufficient = cashReceivedNumber < totalAmount;

  // Handle click on product card
  const handleProductClick = (sku: ProductSKU) => {
    if (sku.isSoldOut) return;
    if (sku.modifierGroupIds && sku.modifierGroupIds.length > 0) {
      setActiveModalSku(sku);
    } else {
      // Direct add to cart
      addToCart({
        sku,
        quantity: 1,
        selectedModifiers: [],
        unitPrice: sku.basePrice,
      });
    }
  };

  const addToCart = (newItem: {
    sku: ProductSKU;
    quantity: number;
    selectedModifiers: SelectedModifier[];
    unitPrice: number;
    notes?: string;
  }) => {
    const modSig = newItem.selectedModifiers
      .map((m) => m.itemId)
      .sort()
      .join('-');
    const cartItemId = `${newItem.sku.id}_${modSig}`;

    setActiveCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const current = updated[existingIdx];
        const newQty = current.quantity + newItem.quantity;
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          itemTotalPrice: newQty * current.unitPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            cartItemId,
            sku: newItem.sku,
            quantity: newItem.quantity,
            selectedModifiers: newItem.selectedModifiers,
            unitPrice: newItem.unitPrice,
            itemTotalPrice: newItem.quantity * newItem.unitPrice,
            notes: newItem.notes,
          },
        ];
      }
    });
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setActiveCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              itemTotalPrice: nextQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setActiveCart([]);
    setCustomerPhone('');
    setOrderNotes('');
  };

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (activeCart.length === 0) return;
    setCashReceivedInput(totalAmount.toString());
    setPaymentMethod('CASH');
    setIsCheckoutModalOpen(true);
  };

  // Submit Order and Settle Payment
  const handleConfirmPayment = async () => {
    if (isSubmitting || activeCart.length === 0) return;
    if (paymentMethod === 'CASH' && isCashInsufficient) return;

    setIsSubmitting(true);
    try {
      const itemsPayload = activeCart.map((item) => ({
        skuId: item.sku.id,
        quantity: item.quantity,
        selectedModifiers: item.selectedModifiers,
        notes: item.notes,
      }));

      const res = await createCounterOrderAndPay({
        items: itemsPayload,
        paymentMethod,
        cashDetails:
          paymentMethod === 'CASH'
            ? {
                receivedAmount: cashReceivedNumber,
                changeAmount: cashChangeAmount,
              }
            : undefined,
        cardDetails:
          paymentMethod === 'POS_CARD'
            ? {
                cardLast4: '6228',
                authCode: `AUTH_${Math.floor(100000 + Math.random() * 900000)}`,
              }
            : undefined,
        customerPhone: customerPhone || undefined,
        notes: orderNotes || undefined,
      });

      setCompletedOrderData(res);
      setIsCheckoutModalOpen(false);
      clearCart();
    } catch (err: any) {
      alert('吧台结算失败: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="counter-pos-order-view" className="w-full h-full flex flex-col lg:flex-row bg-stone-950 text-stone-100 overflow-hidden select-none">
      
      {/* LEFT SECTION: Catalog & Product Selector */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-stone-800 bg-stone-950 overflow-hidden">
        
        {/* Header & Quick Search Bar */}
        <div className="p-3 sm:p-4 bg-stone-900 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              吧台现场快速点单收银终端 (POS)
            </h3>
            <p className="text-xs text-stone-400">
              触屏点单・定制规格加料・现金找零・POS刷卡与聚合扫码极速出单
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索单品 / 首字母 / 分类..."
                className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="px-3 py-2 bg-stone-950 border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {cat === 'ALL' ? '全部品类' : cat}
            </button>
          ))}
        </div>

        {/* Product SKU Touch Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((sku) => {
              const inCartCount = activeCart
                .filter((i) => i.sku.id === sku.id)
                .reduce((s, i) => s + i.quantity, 0);

              return (
                <div
                  key={sku.id}
                  id={`pos-sku-${sku.id}`}
                  onClick={() => handleProductClick(sku)}
                  className={`group relative bg-stone-900 border rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition active:scale-98 shadow-md ${
                    sku.isSoldOut
                      ? 'opacity-40 border-stone-800 cursor-not-allowed'
                      : inCartCount > 0
                      ? 'border-amber-500/80 bg-stone-900/90 shadow-amber-500/10'
                      : 'border-stone-800 hover:border-amber-500/50 hover:bg-stone-850'
                  }`}
                >
                  {/* Badge of in-cart count */}
                  {inCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center shadow-lg border-2 border-stone-950 z-10 animate-in zoom-in-50">
                      {inCartCount}
                    </span>
                  )}

                  <div>
                    <div className="aspect-4/3 rounded-xl overflow-hidden mb-2 bg-stone-950 relative">
                      <img
                        src={sku.image}
                        alt={sku.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-stone-950/80 text-[10px] font-mono text-stone-300">
                        {sku.targetStationId === 'station_bar' ? '水吧' : sku.targetStationId === 'station_fryer' ? '炸台' : '后厨'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-stone-100 line-clamp-1 group-hover:text-amber-300 transition">
                      {sku.name}
                    </h4>
                    <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                      {sku.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-between">
                    <div className="text-amber-400 font-bold font-mono text-sm sm:text-base">
                      ¥{sku.basePrice}
                    </div>

                    <button
                      type="button"
                      disabled={sku.isSoldOut}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-stone-950 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{sku.modifierGroupIds.length > 0 ? '选规格' : '点选'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Active Bill, Cart & Payment Console */}
      <div className="w-full lg:w-96 xl:w-104 bg-stone-900 flex flex-col shrink-0 border-t lg:border-t-0 border-stone-800 overflow-hidden shadow-2xl">
        
        {/* Cart Header */}
        <div className="p-3.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-sm text-stone-100">
                当前收银账单 (Cart)
              </h4>
              <span className="text-[10px] text-stone-400">
                共 {totalItemsCount} 件品项
              </span>
            </div>
          </div>

          {activeCart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空账单</span>
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeCart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-500 space-y-2">
              <ShoppingBag className="w-12 h-12 text-stone-700 stroke-1" />
              <p className="text-xs font-semibold">点击左侧菜品即可加入当前收银账单</p>
            </div>
          ) : (
            activeCart.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-stone-950 border border-stone-800 rounded-2xl p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-bold text-xs sm:text-sm text-stone-100">
                      {item.sku.name}
                    </div>
                    {item.selectedModifiers.length > 0 && (
                      <div className="text-[11px] text-amber-400/90 mt-0.5">
                        {item.selectedModifiers.map((m) => m.itemName).join(' / ')}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        备注: {item.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-amber-400">
                      ¥{item.itemTotalPrice}
                    </span>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-[11px] text-stone-500 font-mono">
                    单价: ¥{item.unitPrice}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                      className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono font-black text-xs text-stone-100">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                      className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Optional Customer Phone & Remarks */}
        <div className="p-3 bg-stone-950/80 border-t border-stone-800 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Phone className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="顾客手机号 (选填/积分通知)"
                className="w-full pl-8 pr-2 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="relative flex-1">
              <MessageSquare className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="整单备注 (如少辣/打包)"
                className="w-full pl-8 pr-2 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Bill Summary & Payment Trigger */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 space-y-3 shrink-0">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-stone-400">应收总金额:</span>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-amber-400">
                ¥{totalAmount}
              </span>
              <span className="text-[10px] text-stone-500 block">
                含税 / 包含选配加料费
              </span>
            </div>
          </div>

          <button
            type="button"
            id="pos-proceed-payment-btn"
            disabled={activeCart.length === 0}
            onClick={handleOpenCheckout}
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition active:scale-98 ${
              activeCart.length === 0
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/20'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>立即结算收款 (¥{totalAmount})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL 1: Product Modifier Selector */}
      {activeModalSku && (
        <ProductModifierModal
          sku={activeModalSku}
          modifierGroups={modifierGroups}
          onClose={() => setActiveModalSku(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* MODAL 2: Counter Payment Settlement Modal (Cash/POS Card/QR Pay) */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-100 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-100">
                    吧台收银结算与支付方式
                  </h3>
                  <p className="text-xs text-stone-400">
                    应收总额: <strong className="text-amber-400 font-mono">¥{totalAmount}</strong> (共 {totalItemsCount} 件)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Method Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="pay-tab-cash"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2.5 px-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">💵 现金收款</span>
              </button>

              <button
                type="button"
                id="pay-tab-card"
                onClick={() => setPaymentMethod('POS_CARD')}
                className={`py-2.5 px-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'POS_CARD'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">💳 POS 刷卡/插卡</span>
              </button>

              <button
                type="button"
                id="pay-tab-qr"
                onClick={() => setPaymentMethod('COUNTER_WECHAT')}
                className={`py-2.5 px-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'COUNTER_WECHAT' || paymentMethod === 'COUNTER_ALIPAY'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">📱 聚合扫码支付</span>
              </button>
            </div>

            {/* TAB 1: CASH PAYMENT CONTROLLER */}
            {paymentMethod === 'CASH' && (
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs text-stone-400 font-medium">实收现金金额 (¥):</div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-400 font-mono">¥</span>
                    <input
                      type="number"
                      value={cashReceivedInput}
                      onChange={(e) => setCashReceivedInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-xl font-bold font-mono text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCashReceivedInput(totalAmount.toString())}
                    className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-bold text-stone-300"
                  >
                    刚好 (¥{totalAmount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceivedInput((Math.ceil(totalAmount / 10) * 10).toString())}
                    className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-bold text-stone-300"
                  >
                    整十 (¥{Math.ceil(totalAmount / 10) * 10})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceivedInput('50')}
                    className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-bold text-stone-300"
                  >
                    ¥50
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceivedInput('100')}
                    className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-xl text-xs font-bold text-stone-300"
                  >
                    ¥100
                  </button>
                </div>

                {/* Change Breakdown */}
                <div className="p-3 bg-stone-900/90 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-stone-400">系统应找零 (Change):</span>
                  <span className={`text-lg font-black font-mono ${isCashInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isCashInsufficient ? `金额不足 (差 ¥${(totalAmount - cashReceivedNumber).toFixed(1)})` : `¥${cashChangeAmount.toFixed(1)}`}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: POS CARD PAYMENT CONTROLLER */}
            {paymentMethod === 'POS_CARD' && (
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-200">
                    外接 EMV / 银联 / Visa 刷卡机终端就绪
                  </h4>
                  <p className="text-xs text-stone-400 mt-1">
                    请提示顾客在POS机具上贴卡或插卡，输入密码后点击确认
                  </p>
                </div>
                <div className="p-2.5 bg-stone-900 rounded-xl font-mono text-xs text-emerald-400 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>POS机通讯正常 (Terminal ID: POS_88012)</span>
                </div>
              </div>
            )}

            {/* TAB 3: COUNTER QR WECHAT / ALIPAY */}
            {(paymentMethod === 'COUNTER_WECHAT' || paymentMethod === 'COUNTER_ALIPAY') && (
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-200">
                    吧台红外扫码枪付款 / 聚合码
                  </h4>
                  <p className="text-xs text-stone-400 mt-1">
                    使用扫码枪扫描顾客微信/支付宝付款码，或顾客扫描台卡立牌
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COUNTER_WECHAT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      paymentMethod === 'COUNTER_WECHAT'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    微信支付 (WeChat Pay)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COUNTER_ALIPAY')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      paymentMethod === 'COUNTER_ALIPAY'
                        ? 'bg-sky-600 text-white'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    支付宝 (Alipay)
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-2xl transition"
              >
                取消返回
              </button>
              <button
                type="button"
                id="pos-confirm-and-print-btn"
                disabled={isSubmitting || (paymentMethod === 'CASH' && isCashInsufficient)}
                onClick={handleConfirmPayment}
                className={`flex-2 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl transition ${
                  paymentMethod === 'CASH' && isCashInsufficient
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                }`}
              >
                {isSubmitting ? (
                  <span>正在出单核销中...</span>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>确认已收款・打印小票并下发KDS</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Order Success & Thermal Receipt Preview Modal */}
      {completedOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in zoom-in-95 duration-150">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-100 space-y-4">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-stone-100">
                吧台收银成功・工单已下发
              </h3>
              <p className="text-xs text-stone-400">
                KDS制作站台与叫号大屏已实时同步
              </p>
            </div>

            {/* Huge Pickup Code Banner */}
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/50 rounded-2xl p-4 text-center space-y-1">
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                顾客取餐流水号 (Pickup Code)
              </div>
              <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-wider">
                {completedOrderData.pickupCode}
              </div>
              <div className="text-[11px] text-stone-400">
                订单号: {completedOrderData.order?.orderNo}
              </div>
            </div>

            {/* Receipt Preview Slip */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2 font-mono text-xs text-stone-300">
              <div className="text-center font-bold text-sm text-stone-200 pb-2 border-b border-stone-800 border-dashed">
                === 茶野集・吧台收银小票 ===
              </div>
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>支付方式:</span>
                <span className="text-stone-200">{completedOrderData.receiptPreview?.paymentMethod || '现金支付'}</span>
              </div>
              {completedOrderData.order?.cashDetails && (
                <>
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>实收现金:</span>
                    <span>¥{completedOrderData.order.cashDetails.receivedAmount}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-400 font-bold">
                    <span>找零金额:</span>
                    <span>¥{completedOrderData.order.cashDetails.changeAmount}</span>
                  </div>
                </>
              )}
              <div className="pt-2 border-t border-stone-800 border-dashed space-y-1">
                {completedOrderData.order?.items?.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.productName} x{it.quantity}</span>
                    <span>¥{it.totalPrice}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-stone-800 flex justify-between font-bold text-amber-400">
                <span>实收总计:</span>
                <span>¥{completedOrderData.order?.totalAmount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCompletedOrderData(null);
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-2xl shadow transition"
              >
                完成・继续为下一位顾客点单
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
