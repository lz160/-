import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderMaster } from '../../types';
import {
  Banknote,
  CreditCard,
  QrCode,
  TrendingUp,
  Receipt,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';

/**
 * 吧台收银流水与当日对账视图 (Cashier Register Audit)
 * 统计现金收入、找零总额、POS刷卡和聚合二维码收款明细
 */
export const CounterRegisterAuditView: React.FC = () => {
  const { orders, store, theme, t } = useApp();
  const isLight = theme === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [reprintOrder, setReprintOrder] = useState<OrderMaster | null>(null);

  // 过滤订单列表
  const counterOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !searchTerm ||
        o.pickupCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customerPhoneMasked && o.customerPhoneMasked.includes(searchTerm));

      const matchPay =
        paymentFilter === 'ALL' ||
        (paymentFilter === 'CASH' && o.paymentMethod === 'CASH') ||
        (paymentFilter === 'CARD' &&
          (o.paymentMethod === 'POS_CARD' || o.paymentMethod === 'STRIPE_CARD')) ||
        (paymentFilter === 'QR' &&
          (o.paymentMethod === 'COUNTER_WECHAT' ||
            o.paymentMethod === 'COUNTER_ALIPAY' ||
            o.paymentMethod === 'STRIPE_APPLE_PAY' ||
            o.paymentMethod === 'STRIPE_ALIPAY_GLOBAL'));

      return matchSearch && matchPay;
    });
  }, [orders, searchTerm, paymentFilter]);

  // 财务统计指标
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cashTotal = 0;
    let cashChangeTotal = 0;
    let cardTotal = 0;
    let qrTotal = 0;

    orders.forEach((o) => {
      if (o.paymentStatus === 'PAID') {
        totalRevenue += o.totalAmount;
        if (o.paymentMethod === 'CASH') {
          cashTotal += o.totalAmount;
          if (o.cashDetails?.changeAmount) {
            cashChangeTotal += o.cashDetails.changeAmount;
          }
        } else if (o.paymentMethod === 'POS_CARD' || o.paymentMethod === 'STRIPE_CARD') {
          cardTotal += o.totalAmount;
        } else {
          qrTotal += o.totalAmount;
        }
      }
    });

    return {
      totalRevenue,
      cashTotal,
      cashChangeTotal,
      cardTotal,
      qrTotal,
      totalOrders: orders.length,
      paidOrders: orders.filter((o) => o.paymentStatus === 'PAID').length,
    };
  }, [orders]);

  return (
    <div
      id="counter-register-audit-view"
      className="w-full h-full flex flex-col p-4 sm:p-6 overflow-y-auto max-w-5xl mx-auto space-y-6"
    >
      {/* 头部统计横幅 */}
      <div
        className={`rounded-3xl p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 border transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        <div>
          <h2 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <span>吧台收银流水与当日交班对账 (Cashier Audit)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            实时统计现金收付、找零存底、POS刷卡入账与在线聚合支付流水
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-stone-500">今日总实收营业额</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600">
            {store.currency} {metrics.totalRevenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 财务指标卡片矩阵 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 现金收入 */}
        <div
          className={`rounded-2xl p-4 border shadow-xs ${
            isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>现金净实收</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-stone-900 font-mono mt-1">
            {store.currency} {metrics.cashTotal.toFixed(2)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">
            找零支出: {store.currency} {metrics.cashChangeTotal.toFixed(2)}
          </p>
        </div>

        {/* POS刷卡 */}
        <div
          className={`rounded-2xl p-4 border shadow-xs ${
            isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>POS 刷卡入账</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-stone-900 font-mono mt-1">
            {store.currency} {metrics.cardTotal.toFixed(2)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">银行卡/EMV芯片扣款</p>
        </div>

        {/* 扫码与移动支付 */}
        <div
          className={`rounded-2xl p-4 border shadow-xs ${
            isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>聚合扫码/H5</span>
            <QrCode className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-stone-900 font-mono mt-1">
            {store.currency} {metrics.qrTotal.toFixed(2)}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">微信 / 支付宝 / Stripe</p>
        </div>

        {/* 总交付单量 */}
        <div
          className={`rounded-2xl p-4 border shadow-xs ${
            isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>总计出单量</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-stone-900 font-mono mt-1">
            {metrics.paidOrders} <span className="text-xs font-normal text-stone-500">单</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1">
            全店有效流水账单
          </p>
        </div>
      </div>

      {/* 过滤与流水明细列表 */}
      <div
        className={`rounded-3xl border shadow-sm p-5 space-y-4 ${
          isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-stone-900">当日交易明细流水表</h3>

          {/* 筛选与搜索 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setPaymentFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  paymentFilter === 'ALL'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                全部渠道
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('CASH')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  paymentFilter === 'CASH'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                现金
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('CARD')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  paymentFilter === 'CARD'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                POS刷卡
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('QR')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  paymentFilter === 'QR'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                聚合扫码
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索单号、取餐码..."
                className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 交易表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-600 font-bold uppercase border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">取餐码</th>
                <th className="py-2.5 px-3">订单流水号</th>
                <th className="py-2.5 px-3">渠道与方式</th>
                <th className="py-2.5 px-3">支付金额</th>
                <th className="py-2.5 px-3">下单时间</th>
                <th className="py-2.5 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {counterOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3 px-3 font-mono font-black text-amber-600 text-sm">
                    {ord.pickupCode}
                  </td>
                  <td className="py-3 px-3 font-mono text-stone-700">{ord.orderNo}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 font-bold border border-stone-200 text-[11px]">
                      {ord.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-stone-900">
                    {store.currency} {ord.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-stone-500">
                    {new Date(ord.paidAt || ord.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setReprintOrder(ord)}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>重印小票</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 小票重印预览模态框 */}
      {reprintOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white text-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-300 font-mono text-xs space-y-3">
            <div className="text-center border-b border-stone-300 pb-3">
              <h4 className="font-black text-sm tracking-wider">{store.storeName}</h4>
              <p className="text-[10px] text-stone-500 mt-0.5">补打收银小票存根</p>
              <div className="text-3xl font-black text-amber-600 mt-2 font-mono">
                {reprintOrder.pickupCode}
              </div>
            </div>

            <div className="space-y-1 py-2 border-b border-stone-300">
              <div className="flex justify-between">
                <span>单号:</span>
                <span>{reprintOrder.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span>交易方式:</span>
                <span>{reprintOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>时间:</span>
                <span>{new Date(reprintOrder.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1 py-2 border-b border-stone-300">
              {reprintOrder.items.map((i, idx) => (
                <div key={i.itemId || `reprint-item-${idx}`} className="flex justify-between">
                  <span>
                    {i.productName} x{i.quantity}
                  </span>
                  <span>{store.currency} {i.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-sm pt-1">
              <span>实收金额:</span>
              <span className="text-amber-600">
                {store.currency} {reprintOrder.totalAmount.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setReprintOrder(null)}
              className="w-full mt-3 py-2.5 bg-stone-900 text-white rounded-xl font-sans font-bold hover:bg-stone-800"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
