import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderMaster } from '../../types';
import {
  Banknote,
  CreditCard,
  QrCode,
  DollarSign,
  TrendingUp,
  Receipt,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';

export const CounterRegisterAuditView: React.FC = () => {
  const { orders } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [reprintOrder, setReprintOrder] = useState<OrderMaster | null>(null);

  // Filtered Orders
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
        (paymentFilter === 'CARD' && (o.paymentMethod === 'POS_CARD' || o.paymentMethod === 'STRIPE_CARD')) ||
        (paymentFilter === 'QR' && (o.paymentMethod === 'COUNTER_WECHAT' || o.paymentMethod === 'COUNTER_ALIPAY' || o.paymentMethod === 'STRIPE_APPLE_PAY' || o.paymentMethod === 'STRIPE_ALIPAY_GLOBAL'));

      return matchSearch && matchPay;
    });
  }, [orders, searchTerm, paymentFilter]);

  // Financial Metrics Breakdown
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
    <div id="counter-register-audit-view" className="w-full h-full flex flex-col bg-stone-950 text-stone-100 p-4 sm:p-6 overflow-y-auto max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-amber-400 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            吧台收银流水与当日交班对账 (Cashier Audit)
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            实时统计现金收付、找零存底、POS刷卡入账与在线聚合支付流水
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-stone-400">今日总实收营业额</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            ¥{metrics.totalRevenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Cash */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Banknote className="w-4 h-4" />
              现金实收
            </span>
            <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded">钱箱存现</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-stone-100">
            ¥{metrics.cashTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400">
            累计找零: ¥{metrics.cashChangeTotal.toFixed(2)}
          </div>
        </div>

        {/* Metric 2: POS Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <CreditCard className="w-4 h-4" />
              POS 刷卡入账
            </span>
            <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded">银联/EMV</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-stone-100">
            ¥{metrics.cardTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400">
            自动对账核销结算
          </div>
        </div>

        {/* Metric 3: QR Mobile */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <QrCode className="w-4 h-4" />
              扫码与在线支付
            </span>
            <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded">微信/支付宝</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-stone-100">
            ¥{metrics.qrTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-400">
            H5手机点单 + 吧台扫码
          </div>
        </div>

        {/* Metric 4: Total Orders */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-sky-400">
              <TrendingUp className="w-4 h-4" />
              订单总量
            </span>
            <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded">今日单量</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-stone-100">
            {metrics.paidOrders} <span className="text-xs font-normal text-stone-400">单已结算</span>
          </div>
          <div className="text-[11px] text-stone-400">
            客单价: ¥{(metrics.totalRevenue / (metrics.paidOrders || 1)).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Orders Audit Table Section */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-xl">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-stone-100">
              流水明细记录 ({counterOrders.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setPaymentFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  paymentFilter === 'ALL' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                }`}
              >
                全部
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('CASH')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  paymentFilter === 'CASH' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                }`}
              >
                现金
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('CARD')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  paymentFilter === 'CARD' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                }`}
              >
                刷卡
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('QR')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  paymentFilter === 'QR' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                }`}
              >
                扫码
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索取餐码 / 订单号..."
                className="pl-8 pr-3 py-1 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950/80 text-stone-400 border-b border-stone-800 text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3">取餐码</th>
                <th className="py-2.5 px-3">订单流水号</th>
                <th className="py-2.5 px-3">下单渠道</th>
                <th className="py-2.5 px-3">支付方式</th>
                <th className="py-2.5 px-3">品项摘要</th>
                <th className="py-2.5 px-3">金额</th>
                <th className="py-2.5 px-3">状态</th>
                <th className="py-2.5 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {counterOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    暂无符合条件的收银流水记录
                  </td>
                </tr>
              ) : (
                counterOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-850 transition">
                    <td className="py-2.5 px-3 font-mono font-black text-amber-400 text-sm">
                      {order.pickupCode}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-stone-400 text-[11px]">
                      {order.orderNo}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.channel === 'COUNTER_POS'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-stone-800 text-stone-400'
                      }`}>
                        {order.channel === 'COUNTER_POS' ? '吧台现场' : '手机H5'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-stone-200">
                        {order.paymentMethod === 'CASH'
                          ? '💵 现金'
                          : order.paymentMethod === 'POS_CARD'
                          ? '💳 POS刷卡'
                          : order.paymentMethod === 'COUNTER_WECHAT'
                          ? '📱 微信支付'
                          : order.paymentMethod === 'COUNTER_ALIPAY'
                          ? '📱 支付宝'
                          : '💳 在线卡付'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-300 max-w-xs truncate">
                      {order.items.map((i) => `${i.productName}x${i.quantity}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-100">
                      ¥{order.totalAmount}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : order.status === 'READY'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {order.status === 'COMPLETED' ? '已核销交付' : order.status === 'READY' ? '待取餐' : '制作中'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setReprintOrder(order)}
                        className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-bold inline-flex items-center gap-1 transition"
                      >
                        <Printer className="w-3 h-3" />
                        <span>补打小票</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reprint Slip Modal */}
      {reprintOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="text-center">
              <h3 className="font-black text-base text-stone-100">
                收银小票补打预览
              </h3>
              <p className="text-xs text-stone-400">
                流水码: <strong className="text-amber-400 font-mono">{reprintOrder.pickupCode}</strong>
              </p>
            </div>

            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2 font-mono text-xs text-stone-300">
              <div className="text-center font-bold text-stone-200 pb-2 border-b border-stone-800 border-dashed">
                === 茶野集 (补打存根) ===
              </div>
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>单号:</span>
                <span>{reprintOrder.orderNo}</span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>支付方式:</span>
                <span>{reprintOrder.paymentMethod}</span>
              </div>
              <div className="py-2 border-t border-stone-800 border-dashed space-y-1">
                {reprintOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.productName} x{it.quantity}</span>
                    <span>¥{it.totalPrice}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-stone-800 flex justify-between font-bold text-amber-400">
                <span>合计:</span>
                <span>¥{reprintOrder.totalAmount}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReprintOrder(null)}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`已成功发送打印指令至吧台热敏小票机 [${reprintOrder.pickupCode}]`);
                  setReprintOrder(null);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-xl"
              >
                发送打印
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
