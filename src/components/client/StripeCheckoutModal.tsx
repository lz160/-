import React, { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Smartphone, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrderMaster } from '../../types';

interface Props {
  order: OrderMaster;
  onSuccess: (updatedOrder: OrderMaster) => void;
  onClose: () => void;
}

export const StripeCheckoutModal: React.FC<Props> = ({ order, onSuccess, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE_CARD' | 'STRIPE_APPLE_PAY' | 'STRIPE_ALIPAY_GLOBAL'>('STRIPE_CARD');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardHolder, setCardHolder] = useState('ZHANG SAN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'INPUT' | 'PROCESSING_STRIPE' | 'WEBHOOK_DISPATCH' | 'SUCCESS'>('INPUT');
  const [pickupCodeResult, setPickupCodeResult] = useState<string>('');

  const handlePay = async () => {
    setIsProcessing(true);
    setStep('PROCESSING_STRIPE');

    // 1. Simulate Stripe payment token verification (600ms)
    await new Promise((r) => setTimeout(r, 600));

    // 2. Dispatch simulated Stripe Webhook callback to backend
    setStep('WEBHOOK_DISPATCH');
    try {
      const res = await fetch('/api/webhook/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          eventType: 'payment_intent.succeeded',
          paymentMethod,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Webhook verification failed');

      setPickupCodeResult(data.pickupCode);
      setStep('SUCCESS');

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch (e) {}

      // Fetch the updated complete order
      const fullOrderRes = await fetch(`/api/order/${order.id}`);
      const fullData = await fullOrderRes.json();

      setTimeout(() => {
        setIsProcessing(false);
        if (fullData.order) {
          onSuccess(fullData.order);
        }
      }, 1200);

    } catch (err: any) {
      alert('支付处理或Webhook回调失败: ' + err.message);
      setIsProcessing(false);
      setStep('INPUT');
    }
  };

  return (
    <div id="stripe-checkout-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700/80 rounded-3xl p-6 shadow-2xl text-stone-100 relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step 1: Input & Checkout Form */}
        {step === 'INPUT' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-stone-100 flex items-center gap-1.5 text-base">
                    Stripe 聚合支付收银台
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                      Sandbox
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400">无座轻餐饮先付结算通道</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-stone-800"
              >
                取消
              </button>
            </div>

            {/* Total Display */}
            <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-stone-400">应付金额 (Total Due)</div>
                <div className="text-2xl font-black text-amber-400">
                  ¥{order.totalAmount.toFixed(2)}
                </div>
              </div>
              <div className="text-right text-xs text-stone-400">
                <div>包含 {order.itemsCount} 份定制单品</div>
                <div className="text-emerald-400 flex items-center gap-1 justify-end font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> 256位加密保障
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('STRIPE_CARD')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs ${
                  paymentMethod === 'STRIPE_CARD'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold shadow-xs'
                    : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                信用卡 / 借记卡
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('STRIPE_APPLE_PAY')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs ${
                  paymentMethod === 'STRIPE_APPLE_PAY'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold shadow-xs'
                    : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Apple Pay / 快捷
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('STRIPE_ALIPAY_GLOBAL')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs ${
                  paymentMethod === 'STRIPE_ALIPAY_GLOBAL'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold shadow-xs'
                    : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                跨境快捷付
              </button>
            </div>

            {/* Credit Card Form Fields */}
            {paymentMethod === 'STRIPE_CARD' && (
              <div className="space-y-3 bg-stone-950/60 p-4 rounded-2xl border border-stone-800/80">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-stone-400 flex items-center justify-between">
                    <span>卡号 (Card Number)</span>
                    <span className="text-amber-500 text-[10px]">Stripe测试卡已预填</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                    <CreditCard className="w-4 h-4 text-stone-500 absolute right-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-stone-400">有效月年 (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-stone-400">安全码 (CVC)</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-stone-400">持卡人姓名</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              id="stripe-confirm-pay-btn"
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition text-sm active:scale-98"
            >
              <Lock className="w-4 h-4" />
              立即确认支付 ¥{order.totalAmount.toFixed(2)}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <div className="text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              先付模式：支付成功后将由后端实时生成专属取餐码并分发后厨KDS工位
            </div>
          </div>
        )}

        {/* Step 2 & 3: Processing & Webhook Status Screen */}
        {(step === 'PROCESSING_STRIPE' || step === 'WEBHOOK_DISPATCH') && (
          <div className="py-10 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-amber-400">
                S
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-stone-100">
                {step === 'PROCESSING_STRIPE' ? '正在连接 Stripe 支付网关...' : '⚡ 触发后端 Webhook 异步回调...'}
              </h4>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                {step === 'PROCESSING_STRIPE'
                  ? '锁定订单总额并请求支付凭证'
                  : '正在原子生成当日流水取餐码，并向水吧/炸台KDS工作站智能拆单分流'}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 text-[11px] text-amber-400 border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              实时事件驱动处理中
            </div>
          </div>
        )}

        {/* Step 4: Success Screen */}
        {step === 'SUCCESS' && (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                PAYMENT & WEBHOOK SUCCEEDED
              </span>
              <h4 className="text-xl font-black text-stone-100">
                支付成功！已进入后厨制作队列
              </h4>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-amber-500/30 max-w-xs mx-auto shadow-inner">
              <div className="text-xs text-stone-400 mb-1">您的当日专属取餐码</div>
              <div className="text-4xl font-black text-amber-400 tracking-wider">
                {pickupCodeResult || 'A006'}
              </div>
            </div>

            <p className="text-xs text-stone-400">正在为您跳转至实时出餐进度看板...</p>
          </div>
        )}

      </div>
    </div>
  );
};
