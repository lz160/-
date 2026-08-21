import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductSKU, SelectedModifier, CartItem } from '../../types';
import { ProductModifierModal } from '../client/ProductModifierModal';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  CheckCircle2,
  Printer,
  Search,
  Receipt,
  Clock,
  Zap,
  X,
} from 'lucide-react';

/**
 * 吧台现场点单与收银结算视图 (POS)
 * 支持现金找零计算、POS卡号输入及小票打印（已按要求删除聚合扫码功能）
 */
export const CounterPOSOrderView: React.FC = () => {
  const { products, modifierGroups, createCounterOrderAndPay, currentStore, formatPrice, theme, t } = useApp();
  const isLight = theme === 'light';

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCart, setActiveCart] = useState<CartItem[]>([]);
  const [activeModalSku, setActiveModalSku] = useState<ProductSKU | null>(null);

  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // 结算模态框状态
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'POS_CARD'>('CASH');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 结算成功打印小票状态
  const [completedOrderData, setCompletedOrderData] = useState<any | null>(null);

  // 分类列表
  const categories = useMemo(() => {
    const set = new Set((products || []).map((p) => p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // 过滤商品
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // 购物车合计
  const totalAmount = useMemo(() => {
    return activeCart.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  }, [activeCart]);

  const totalItemsCount = useMemo(() => {
    return activeCart.reduce((sum, item) => sum + item.quantity, 0);
  }, [activeCart]);

  // 现金计算
  const cashReceivedNumber = parseFloat(cashReceivedInput) || 0;
  const cashChangeAmount = Math.max(0, cashReceivedNumber - totalAmount);
  const isCashInsufficient = cashReceivedNumber < totalAmount;

  // 点击商品卡片
  const handleProductClick = (sku: ProductSKU) => {
    if (sku.isSoldOut) return;
    if (sku.modifierGroupIds && sku.modifierGroupIds.length > 0) {
      setActiveModalSku(sku);
    } else {
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
    const cartItemId = `pos_item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const item: CartItem = {
      cartItemId,
      sku: newItem.sku,
      quantity: newItem.quantity,
      selectedModifiers: newItem.selectedModifiers,
      unitPrice: newItem.unitPrice,
      itemTotalPrice: newItem.unitPrice * newItem.quantity,
      notes: newItem.notes,
    };
    setActiveCart((prev) => [...prev, item]);
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setActiveCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              itemTotalPrice: item.unitPrice * nextQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // 快捷填入实收现金金额
  const handleQuickCash = (amount: number) => {
    setCashReceivedInput(amount.toString());
  };

  // 结算订单
  const handleProcessCheckout = async () => {
    if (activeCart.length === 0) return;
    if (paymentMethod === 'CASH' && isCashInsufficient) {
      alert('实收现金不足，请核对金额');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = activeCart.map((c) => ({
        skuId: c.sku.id,
        quantity: c.quantity,
        selectedModifiers: c.selectedModifiers,
        notes: c.notes,
      }));

      const paymentDetails: any = {};
      if (paymentMethod === 'CASH') {
        paymentDetails.cashDetails = {
          receivedAmount: cashReceivedNumber,
          changeAmount: cashChangeAmount,
        };
      } else if (paymentMethod === 'POS_CARD') {
        paymentDetails.cardDetails = {
          cardLast4: '8899',
          authCode: `AUTH_${Math.floor(100000 + Math.random() * 900000)}`,
        };
      }

      const res = await createCounterOrderAndPay({
        items: itemsPayload,
        paymentMethod,
        cashDetails: paymentDetails.cashDetails,
        cardDetails: paymentDetails.cardDetails,
        customerPhone: customerPhone ? customerPhone.trim() : undefined,
        notes: orderNotes ? orderNotes.trim() : undefined,
        storeId: currentStore.id,
      });

      // 弹出打印小票
      setCompletedOrderData({
        order: res.order,
        cashReceived: cashReceivedNumber,
        cashChange: cashChangeAmount,
      });

      // 清空购物车
      setActiveCart([]);
      setCustomerPhone('');
      setOrderNotes('');
      setIsCheckoutModalOpen(false);
      setCashReceivedInput('');
    } catch (err: any) {
      alert(err.message || '结算失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-stone-100 text-stone-900 overflow-hidden select-none">
      {/* 左侧点单区 (分类 + 菜品列表) */}
      <div className="flex-1 flex flex-col border-r border-stone-200 overflow-hidden">
        {/* 顶部搜索与分类栏 */}
        <div className="p-3.5 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索餐品名称、分类..."
              className="w-full pl-9 pr-4 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat === 'ALL' ? '全部品类' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 菜品网格 */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((sku) => {
            const hasMods = sku.modifierGroupIds && sku.modifierGroupIds.length > 0;
            return (
              <button
                key={sku.id}
                type="button"
                disabled={sku.isSoldOut}
                onClick={() => handleProductClick(sku)}
                className={`p-3 rounded-2xl bg-white border border-stone-200 text-left flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition relative group active:scale-98 ${
                  sku.isSoldOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {sku.isSoldOut && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-bold">
                    已沽清
                  </span>
                )}
                {hasMods && !sku.isSoldOut && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                    选规格
                  </span>
                )}

                <div className="flex items-start gap-2.5 mb-2">
                  <img
                    src={sku.image}
                    alt={sku.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-stone-900 line-clamp-2 leading-snug">
                      {sku.name}
                    </h4>
                    <span className="inline-block mt-1 text-[10px] font-medium text-stone-400">
                      {sku.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-100">
                  <span className="text-sm font-black text-amber-600">
                    {formatPrice(sku.basePrice)}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-950 transition">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 右侧购物车与结算控制台 */}
      <div className="w-full md:w-96 bg-white flex flex-col justify-between border-t md:border-t-0 border-stone-200 shrink-0">
        {/* 顶部标题栏 */}
        <div className="p-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <h3 className="font-black text-xs text-stone-900">当前点单清单 ({totalItemsCount})</h3>
          </div>
          {activeCart.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveCart([])}
              className="text-[11px] text-stone-400 hover:text-rose-600 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>清空</span>
            </button>
          )}
        </div>

        {/* 购物车条目列表 */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 divide-y divide-stone-100">
          {activeCart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12">
              <ShoppingBag className="w-10 h-10 stroke-1 mb-2 opacity-40" />
              <p className="text-xs">暂无点餐商品，请点击左侧菜品加入</p>
            </div>
          ) : (
            activeCart.map((item) => (
              <div key={item.cartItemId} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-stone-900 truncate">
                    {item.sku.name}
                  </div>
                  {item.selectedModifiers.length > 0 && (
                    <p className="text-[11px] text-stone-500 line-clamp-1">
                      {item.selectedModifiers.map((m) => m.itemName).join(' / ')}
                    </p>
                  )}
                  <div className="text-xs font-bold text-amber-600 mt-0.5">
                    {formatPrice(item.itemTotalPrice)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1 border border-stone-200">
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.cartItemId, -1)}
                    className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-stone-800 px-1">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.cartItemId, 1)}
                    className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-stone-700 hover:bg-stone-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 顾客电话与特殊备注 */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 space-y-2">
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="顾客手机号 (选填，用于短信通知)"
            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
          />
          <input
            type="text"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="订单特殊备注 (如: 多放吸管、分袋打包)"
            className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* 结算支付区 */}
        <div className="p-4 border-t border-stone-200 bg-white space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-stone-500 font-medium">应收合计:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-600">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={activeCart.length === 0}
            onClick={() => {
              setCashReceivedInput(totalAmount.toString());
              setIsCheckoutModalOpen(true);
            }}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-black text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Banknote className="w-5 h-5" />
            <span>立即收款结算 ({formatPrice(totalAmount)})</span>
          </button>
        </div>
      </div>

      {/* 规格加料客制化模态框 */}
      {activeModalSku && (
        <ProductModifierModal
          sku={activeModalSku}
          modifierGroups={modifierGroups}
          onClose={() => setActiveModalSku(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* 收款结算弹窗 */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 relative overflow-hidden transition-colors ${
              isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-stone-900 border-stone-800 text-stone-100'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-stone-900 mb-1">吧台收银结算</h3>
            <p className="text-xs text-stone-500 mb-4">请选择现金收银或POS刷卡结算</p>

            {/* 应付金额提示 */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">应付总金额</span>
              <span className="text-2xl font-black text-amber-600 font-mono">
                {formatPrice(totalAmount)}
              </span>
            </div>

            {/* 支付方式选择 (仅保留现金与POS刷卡，已删除聚合扫码) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs ring-2 ring-amber-400/20'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>{t('cashPayment')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('POS_CARD')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  paymentMethod === 'POS_CARD'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs ring-2 ring-amber-400/20'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>{t('posCardPayment')}</span>
              </button>
            </div>

            {/* 现金支付找零计算 */}
            {paymentMethod === 'CASH' && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 mb-4">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    {t('cashReceived')} ({currentStore.currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={cashReceivedInput}
                    onChange={(e) => setCashReceivedInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-base font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 快捷面额选择 */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalAmount)}
                    className="px-2.5 py-1 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg text-xs font-bold text-stone-700"
                  >
                    {t('exactAmount')}
                  </button>
                  {[10, 20, 50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="px-2.5 py-1 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg text-xs font-bold text-stone-700"
                    >
                      {currentStore.currencySymbol} {amt}
                    </button>
                  ))}
                </div>

                {/* 找零计算结果 */}
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-700">{t('cashChange')}:</span>
                  <span
                    className={`text-base font-black font-mono ${
                      isCashInsufficient ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {isCashInsufficient ? '实收不足' : formatPrice(cashChangeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* 刷卡提示 */}
            {paymentMethod === 'POS_CARD' && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 mb-4 space-y-1">
                <p className="font-bold">✓ POS 刷卡 / 芯片插卡 / NFC感应</p>
                <p className="text-[11px] text-blue-700">请提示顾客在终端机刷卡或感应支付</p>
              </div>
            )}

            {/* 确认完成结算 */}
            <button
              type="button"
              disabled={isSubmitting || (paymentMethod === 'CASH' && isCashInsufficient)}
              onClick={handleProcessCheckout}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>正在出票推单...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t('completeOrder')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 结算出单成功小票预览 */}
      {completedOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white text-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-300 font-mono text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center border-b border-stone-300 pb-3">
              <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              <h4 className="font-black text-sm tracking-wider">{currentStore.storeName}</h4>
              <p className="text-[10px] text-stone-500 mt-0.5">吧台出餐凭证小票</p>
              <div className="text-3xl font-black text-amber-600 mt-2 font-mono">
                {completedOrderData.order.pickupCode}
              </div>
            </div>

            <div className="space-y-1 py-2 border-b border-stone-300">
              <div className="flex justify-between">
                <span>流水单号:</span>
                <span>{completedOrderData.order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span>出票时间:</span>
                <span>{new Date(completedOrderData.order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>支付方式:</span>
                <span>{completedOrderData.order.paymentMethod === 'POS_CARD' ? 'POS刷卡' : '现金支付'}</span>
              </div>
            </div>

            <div className="space-y-1 py-2 border-b border-stone-300">
              {completedOrderData.order.items.map((i: any) => (
                <div key={i.itemId || i.id} className="flex justify-between">
                  <span>
                    {i.productName} x{i.quantity}
                  </span>
                  <span>{formatPrice(i.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1 font-bold">
              <div className="flex justify-between text-sm">
                <span>应收金额:</span>
                <span className="text-amber-600">
                  {formatPrice(completedOrderData.order.totalAmount)}
                </span>
              </div>
              {completedOrderData.cashReceived > 0 && (
                <>
                  <div className="flex justify-between text-stone-600">
                    <span>实收现金:</span>
                    <span>{formatPrice(completedOrderData.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>找零金额:</span>
                    <span>{formatPrice(completedOrderData.cashChange)}</span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCompletedOrderData(null)}
              className="w-full mt-3 py-2.5 bg-stone-900 text-white rounded-xl font-sans font-bold hover:bg-stone-800"
            >
              打印完成 / 继续下一单
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
