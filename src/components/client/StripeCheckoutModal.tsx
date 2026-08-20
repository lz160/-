import React, { useState } from 'react';
import { OrderMaster } from '../../types';
import { useApp } from '../../context/AppContext';
import { CreditCard, Lock, CheckCircle, AlertCircle, ShieldCheck, X } from 'lucide-react';

interface Props {
  order: OrderMaster;
  onClose: () => void;
  onSuccess: (paidOrder: OrderMaster) => void;
}

/**
 * 顾客端在线模拟支付弹窗 (Stripe 线上支付沙盒)
 */
export const StripeCheckoutModal: React.FC<Props> = ({ order, onClose, onSuccess }) => {
  const { payOrder, store, theme, t } = useApp();
  const isLight = theme === 'light';

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 模拟 Stripe 扣款与服务器核销
      const res = await payOrder(order.id, 'STRIPE', {
        brand: 'Visa',
        last4: '4242',
      });
      onSuccess(res.order);
    } catch (err: any) {
      setErrorMsg(err.message || '支付失败，请重试');
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="stripe-checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 relative overflow-hidden transition-colors ${
          isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-stone-900 border-stone-800 text-stone-100'
        }`}
      >
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 标题 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900">Stripe 安全预结账</h3>
            <p className="text-xs text-stone-500">256-bit 端到端金融级加密流水收银</p>
          </div>
        </div>

        {/* 金额提示框 */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-medium">待支付金额</div>
            <div className="text-2xl font-black text-amber-600">
              {store.currency} {order.totalAmount.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-stone-600 border border-stone-200">
              单号: {order.orderNo.slice(-6)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 支付表单 */}
        <form onSubmit={handlePay} className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">信用卡卡号</label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono focus:outline-none focus:border-indigo-500 pl-9"
              />
              <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">有效期</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono text-center focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">CVC 安全码</label>
              <div className="relative">
                <input
                  type="password"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono text-center focus:outline-none focus:border-indigo-500"
                />
                <Lock className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full mt-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md active:scale-98 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span>正在向 Stripe 网关鉴权并出票...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>立即支付 {store.currency} {order.totalAmount.toFixed(2)}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            {t('stripeMockNotice')}
          </p>
        </div>
      </div>
    </div>
  );
};
