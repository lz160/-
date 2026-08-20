import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderMaster } from '../../types';
import { CounterPOSOrderView } from './CounterPOSOrderView';
import { CounterRegisterAuditView } from './CounterRegisterAuditView';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  Check,
  ShoppingBag,
  Receipt,
  Banknote,
  CreditCard,
  Layers,
} from 'lucide-react';

type CounterSubTab = 'POS_ORDER' | 'CODE_VERIFY' | 'REGISTER_AUDIT';

export const CounterScanView: React.FC = () => {
  const { orders, completeOrder } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<CounterSubTab>('POS_ORDER');

  // Code Verification State
  const [inputCode, setInputCode] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<OrderMaster | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = (codeToSearch: string) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const found = orders.find(
      (o) =>
        o.pickupCode.toUpperCase() === codeToSearch.toUpperCase() ||
        o.orderNo.toLowerCase().includes(codeToSearch.toLowerCase())
    );

    if (found) {
      setMatchedOrder(found);
    } else {
      setMatchedOrder(null);
      setErrorMessage(`未查询到取餐码为 [${codeToSearch}] 的订单，请核对后重试`);
    }
  };

  const handleVerifyComplete = async () => {
    if (!matchedOrder) return;
    try {
      await completeOrder(matchedOrder.pickupCode);
      setSuccessMessage(`✓ 取餐码 [${matchedOrder.pickupCode}] 已成功核销出餐！`);
      setMatchedOrder(null);
      setInputCode('');
    } catch (err: any) {
      setErrorMessage('核销失败: ' + err.message);
    }
  };

  return (
    <div id="counter-scan-view" className="w-full h-full flex flex-col bg-stone-950 text-stone-100 overflow-hidden">
      
      {/* Top Sub-Navigation for Counter Terminal */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs shadow">
            POS
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-stone-100">
              吧台现场点单・收银结算与核销终端
            </h2>
            <p className="text-[10px] text-stone-400">
              支持现金找零、POS刷卡、聚合扫码与取餐码秒级出餐核销
            </p>
          </div>
        </div>

        {/* Tab Toggle Group */}
        <div className="flex items-center bg-stone-950 p-1 rounded-2xl border border-stone-800 text-xs">
          <button
            type="button"
            id="tab-counter-pos-order"
            onClick={() => setActiveSubTab('POS_ORDER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'POS_ORDER'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>🛒 现场点单收银</span>
          </button>

          <button
            type="button"
            id="tab-counter-code-verify"
            onClick={() => setActiveSubTab('CODE_VERIFY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'CODE_VERIFY'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>🔍 取餐码核销出餐</span>
          </button>

          <button
            type="button"
            id="tab-counter-register-audit"
            onClick={() => setActiveSubTab('REGISTER_AUDIT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'REGISTER_AUDIT'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>📊 当日收银流水对账</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        
        {/* SUBTAB 1: POS Cashier & Order Placement */}
        {activeSubTab === 'POS_ORDER' && (
          <CounterPOSOrderView />
        )}

        {/* SUBTAB 2: Code Verification & Order Redemption */}
        {activeSubTab === 'CODE_VERIFY' && (
          <div className="w-full h-full p-4 sm:p-6 overflow-y-auto max-w-2xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 text-center space-y-2 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black mx-auto shadow-md">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-100">
                吧台扫码核销与极速交付终端
              </h3>
              <p className="text-xs text-stone-400">
                支持红外扫码枪、物理条码扫描或手动输入流水号秒级交付
              </p>
            </div>

            {/* Input / Scanner Simulation Bar */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="text-xs font-bold text-stone-300">
                输入取餐码或扫描顾客手机条码
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    if (e.target.value.length >= 4) {
                      handleSearch(e.target.value.toUpperCase());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputCode) {
                      handleSearch(inputCode);
                    }
                  }}
                  placeholder="例如: A002, A003, C001..."
                  className="flex-1 px-4 py-3 bg-stone-950 border border-stone-700 rounded-2xl text-lg font-mono font-bold text-amber-400 placeholder-stone-600 focus:outline-none focus:border-amber-500 uppercase text-center"
                />
                <button
                  type="button"
                  onClick={() => handleSearch(inputCode)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-2xl shadow transition"
                >
                  查询核对
                </button>
              </div>

              {/* Quick Click helper badges from recent ready orders */}
              <div className="pt-2 border-t border-stone-800 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-stone-500">快捷待取单:</span>
                {orders
                  .filter((o) => o.status === 'READY')
                  .map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setInputCode(o.pickupCode);
                        handleSearch(o.pickupCode);
                      }}
                      className="px-2.5 py-1 bg-stone-800 hover:bg-amber-500 hover:text-stone-950 rounded-lg text-amber-400 font-mono font-bold transition"
                    >
                      {o.pickupCode}
                    </button>
                  ))}
              </div>
            </div>

            {/* Alerts */}
            {successMessage && (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Matched Order Card */}
            {matchedOrder && (
              <div className="bg-stone-900 border-2 border-amber-500 rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div>
                    <div className="text-xs text-stone-400">核对取餐流水码</div>
                    <div className="text-4xl font-black font-mono text-amber-400 tracking-wider">
                      {matchedOrder.pickupCode}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${
                        matchedOrder.status === 'READY'
                          ? 'bg-emerald-500 text-stone-950'
                          : matchedOrder.status === 'COMPLETED'
                          ? 'bg-stone-800 text-stone-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {matchedOrder.status === 'READY'
                        ? '已就绪待领取'
                        : matchedOrder.status === 'COMPLETED'
                        ? '此前已核销'
                        : '制作中'}
                    </span>
                    <div className="text-[11px] text-stone-500 mt-1">
                      订单号: {matchedOrder.orderNo}
                    </div>
                  </div>
                </div>

                {/* Items checklist */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-stone-300">商品与杯装核对清单:</div>
                  <div className="divide-y divide-stone-800 bg-stone-950 p-3 rounded-2xl border border-stone-800">
                    {matchedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 flex justify-between text-xs">
                        <div>
                          <span className="font-bold text-stone-100">{item.productName}</span>
                          <span className="text-amber-400 ml-1">x{item.quantity}</span>
                          <div className="text-[11px] text-stone-400">
                            {item.selectedModifiers.map((m) => m.itemName).join(' / ')}
                          </div>
                        </div>
                        <span className="text-stone-300 font-bold">¥{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Redemption Button */}
                <button
                  id="confirm-pickup-redemption-btn"
                  type="button"
                  onClick={handleVerifyComplete}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  确认餐品交付并核销 (Complete Delivery)
                </button>
              </div>
            )}

          </div>
        )}

        {/* SUBTAB 3: Cashier Audit & Shift Register */}
        {activeSubTab === 'REGISTER_AUDIT' && (
          <CounterRegisterAuditView />
        )}

      </div>
    </div>
  );
};

