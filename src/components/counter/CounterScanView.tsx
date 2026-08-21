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
  ShoppingBag,
  Receipt,
  Check,
} from 'lucide-react';

type CounterSubTab = 'POS_ORDER' | 'CODE_VERIFY' | 'REGISTER_AUDIT';

/**
 * 吧台现场终端总控入口
 * 包含：现场点单收银、取餐码极速核销出餐、当日收银流水对账
 */
export const CounterScanView: React.FC = () => {
  const { orders, completeOrder, theme, t } = useApp();
  const isLight = theme === 'light';

  const [activeSubTab, setActiveSubTab] = useState<CounterSubTab>('POS_ORDER');

  // 取餐码核销状态
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
    <div
      id="counter-scan-view"
      className={`w-full h-full flex flex-col overflow-hidden transition-colors ${
        isLight ? 'bg-stone-100 text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* 顶部二级导航 */}
      <div
        className={`px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs border-b transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs shadow-xs">
            POS
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-stone-900">
              {t('counterTerminal')}
            </h2>
            <p className="text-[11px] text-stone-500">
              {t('counterTerminalSub')}
            </p>
          </div>
        </div>

        {/* 标签切换组 */}
        <div
          className={`flex items-center p-1 rounded-2xl border text-xs ${
            isLight ? 'bg-stone-100 border-stone-200' : 'bg-stone-950 border-stone-800'
          }`}
        >
          <button
            type="button"
            id="tab-counter-pos-order"
            onClick={() => setActiveSubTab('POS_ORDER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'POS_ORDER'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>🛒 {t('posOrderTab')}</span>
          </button>

          <button
            type="button"
            id="tab-counter-code-verify"
            onClick={() => setActiveSubTab('CODE_VERIFY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'CODE_VERIFY'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>🔍 {t('codeVerifyTab')}</span>
          </button>

          <button
            type="button"
            id="tab-counter-register-audit"
            onClick={() => setActiveSubTab('REGISTER_AUDIT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'REGISTER_AUDIT'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>📊 {t('registerAuditTab')}</span>
          </button>
        </div>
      </div>

      {/* 主体内容区 */}
      <div className="flex-1 overflow-hidden">
        {/* 子标签 1: 现场收银与点单 */}
        {activeSubTab === 'POS_ORDER' && <CounterPOSOrderView />}

        {/* 子标签 2: 取餐码核销 */}
        {activeSubTab === 'CODE_VERIFY' && (
          <div className="w-full h-full p-4 sm:p-6 overflow-y-auto max-w-2xl mx-auto space-y-6">
            {/* 说明卡片 */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 text-center space-y-2 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black mx-auto shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900">
                吧台扫码核销与极速交付终端
              </h3>
              <p className="text-xs text-stone-500">
                支持红外扫码枪、物理条码扫描或手动输入流水号秒级交付
              </p>
            </div>

            {/* 输入搜索栏 */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="text-xs font-bold text-stone-800">
                输入取餐码或扫描顾客手机条码
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(inputCode)}
                  placeholder={t('enterPickupCode')}
                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl font-mono text-base font-bold text-stone-900 uppercase focus:outline-none focus:border-amber-500"
                />

                <button
                  type="button"
                  onClick={() => handleSearch(inputCode)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl text-xs transition shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('searchOrder')}</span>
                </button>
              </div>

              {/* 快捷取餐码备选 */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                <span className="text-[11px] text-stone-400 font-medium">当前活跃取餐单快捷填入:</span>
                {(orders || [])
                  .filter((o) => o.status === 'READY' || o.status === 'MAKING')
                  .slice(0, 5)
                  .map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setInputCode(o.pickupCode);
                        handleSearch(o.pickupCode);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono font-bold border border-stone-200"
                    >
                      {o.pickupCode}
                    </button>
                  ))}
              </div>
            </div>

            {/* 成功或失败提示 */}
            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 匹配到的订单详情 */}
            {matchedOrder && (
              <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <div className="text-[11px] text-stone-500 font-bold uppercase">
                      已匹配订单 (MATCHED ORDER)
                    </div>
                    <div className="text-3xl font-black font-mono text-amber-600">
                      {matchedOrder.pickupCode}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        matchedOrder.status === 'COMPLETED'
                          ? 'bg-stone-100 text-stone-600'
                          : matchedOrder.status === 'READY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {matchedOrder.status === 'COMPLETED'
                        ? '已核销完成'
                        : matchedOrder.status === 'READY'
                        ? '已制作完成'
                        : '制作中'}
                    </span>
                  </div>
                </div>

                {/* 商品清单 */}
                <div className="space-y-2 divide-y divide-stone-100">
                  {matchedOrder.items.map((item, idx) => (
                    <div key={item.itemId || `scan-item-${idx}`} className="pt-2 first:pt-0 flex justify-between text-xs">
                      <div>
                        <div className="font-bold text-stone-900">
                          {item.productName} <span className="text-amber-600">x{item.quantity}</span>
                        </div>
                        {item.selectedModifiers.length > 0 && (
                          <div className="text-[11px] text-stone-500">
                            {item.selectedModifiers.map((m) => m.itemName).join(' / ')}
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-stone-800 font-mono">
                        ¥{item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 底部核销交付按钮 */}
                <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                  <div className="text-xs text-stone-500">
                    实付金额: <strong className="text-base text-stone-900 font-mono">¥{matchedOrder.totalAmount.toFixed(2)}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyComplete}
                    disabled={matchedOrder.status === 'COMPLETED'}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-sm shadow-md transition flex items-center gap-2 active:scale-95"
                  >
                    <Check className="w-5 h-5" />
                    <span>{matchedOrder.status === 'COMPLETED' ? '已核销完成' : t('scanToVerify')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 子标签 3: 收银流水对账 */}
        {activeSubTab === 'REGISTER_AUDIT' && <CounterRegisterAuditView />}
      </div>
    </div>
  );
};
