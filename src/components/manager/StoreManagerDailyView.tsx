import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem } from '../../types';
import {
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  RefreshCw,
  Sliders,
  Search,
  Layers,
  History,
  Store,
  CreditCard,
  Banknote,
  Clock,
  X,
} from 'lucide-react';

type ManagerTab = 'TODAY_SALES' | 'INVENTORY_STOCK';

export const StoreManagerDailyView: React.FC = () => {
  const {
    stores,
    currentStore,
    setCurrentStore,
    currentMerchant,
    currentStaffUser,
    orders,
    inventoryItems,
    inventoryLogs,
    adjustInventory,
    createInventoryItem,
    formatPrice,
    t,
  } = useApp();

  const isMerchant = currentStaffUser?.role === 'MERCHANT';
  const isSuperAdmin = currentStaffUser?.role === 'SUPER_ADMIN';

  // Filter accessible stores
  const accessibleStores = useMemo(() => {
    if (isSuperAdmin) return stores || [];
    if (isMerchant && currentMerchant) {
      return (stores || []).filter((s) => currentMerchant.assignedStoreIds?.includes(s.id));
    }
    return stores || [];
  }, [stores, isSuperAdmin, isMerchant, currentMerchant]);

  const [activeTab, setActiveTab] = useState<ManagerTab>('TODAY_SALES');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('ALL');

  // Modal State for Inventory Action (Restock / Waste / Calibrate)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
    type: 'RESTOCK' | 'CONSUME' | 'WASTE' | 'CALIBRATE';
  }>({
    isOpen: false,
    item: null,
    type: 'RESTOCK',
  });

  const [adjustAmount, setAdjustAmount] = useState<string>('5');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Ingredient Modal State
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: '',
    category: 'TEA',
    categoryName: '茶底原叶',
    currentStock: 10,
    unit: 'kg',
    minThreshold: 3,
    costPerUnit: 15,
  });

  // Calculate Today's Sales from orders
  const todayOrders = useMemo(() => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    return (orders || []).filter((o) => o.createdAt >= startOfToday && o.paymentStatus === 'PAID');
  }, [orders]);

  const todayRevenue = useMemo(() => {
    return todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [todayOrders]);

  const todayCashRevenue = useMemo(() => {
    return todayOrders
      .filter((o) => o.paymentMethod === 'CASH')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [todayOrders]);

  const todayCardRevenue = useMemo(() => {
    return todayOrders
      .filter((o) => o.paymentMethod !== 'CASH')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [todayOrders]);

  const todayCompletedCount = useMemo(() => {
    return todayOrders.filter((o) => o.status === 'COMPLETED').length;
  }, [todayOrders]);

  // Filter Inventory
  const filteredInventory = useMemo(() => {
    return (inventoryItems || []).filter((item) => {
      const matchCat = inventoryCategory === 'ALL' || item.category === inventoryCategory;
      const matchSearch =
        !inventorySearch ||
        item.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.categoryName?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.category?.toLowerCase().includes(inventorySearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [inventoryItems, inventoryCategory, inventorySearch]);

  // Low stock alert items count
  const lowStockCount = useMemo(() => {
    return (inventoryItems || []).filter((i) => i.status === 'LOW' || i.status === 'CRITICAL').length;
  }, [inventoryItems]);

  const handleOpenAdjust = (item: InventoryItem, type: 'RESTOCK' | 'WASTE' | 'CALIBRATE') => {
    setActionModal({
      isOpen: true,
      item,
      type,
    });
    setAdjustAmount(type === 'CALIBRATE' ? item.currentStock.toString() : '5');
    setAdjustNotes('');
  };

  const handleExecuteAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.item) return;

    setIsSubmitting(true);
    try {
      const numVal = parseFloat(adjustAmount);
      if (isNaN(numVal) || numVal < 0) {
        alert('请输入有效的数量数值');
        return;
      }

      await adjustInventory({
        itemId: actionModal.item.id,
        type: actionModal.type,
        delta: actionModal.type === 'CALIBRATE' ? undefined : numVal,
        targetBalance: actionModal.type === 'CALIBRATE' ? numVal : undefined,
        notes: adjustNotes.trim(),
      });

      setActionModal({ isOpen: false, item: null, type: 'RESTOCK' });
    } catch (err: any) {
      alert(err.message || '调整失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name.trim()) {
      alert('请填写物料名称');
      return;
    }

    setIsSubmitting(true);
    try {
      await createInventoryItem({
        ...newItemData,
        storeId: currentStore.id,
      });
      setIsCreateItemModalOpen(false);
      setNewItemData({
        name: '',
        category: 'TEA',
        categoryName: '茶底原叶',
        currentStock: 10,
        unit: 'kg',
        minThreshold: 3,
        costPerUnit: 15,
      });
    } catch (err: any) {
      alert(err.message || '添加失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden select-none">
      {/* 顶部标题与导航栏 */}
      <div className="p-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-stone-900">
                {isMerchant ? '连锁门店库存与销售台账' : t('storeManagerDaily')}
              </h2>
              {/* Store Switcher for Multi-store merchant or super admin */}
              {accessibleStores.length > 1 ? (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <span className="text-[10px] font-bold text-amber-800">当前门店:</span>
                  <select
                    value={currentStore.id}
                    onChange={(e) => {
                      const found = accessibleStores.find((s) => s.id === e.target.value);
                      if (found) setCurrentStore(found);
                    }}
                    className="bg-transparent text-[11px] font-bold text-amber-900 focus:outline-none cursor-pointer"
                  >
                    {accessibleStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.storeName} ({s.currency})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                  {currentStore.storeName} ({currentStore.currency})
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400">
              {isMerchant
                ? '商家全店库存工作台：支持全门店原材料库存查看、快速采购入库、实物盘点校准与流水审计'
                : '店长核心工作台：实时掌控当日营业销售实况与后厨食材物料库存台账'}
            </p>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('TODAY_SALES')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'TODAY_SALES'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('todaySalesData')}</span>
            <span className="text-[10px] px-1.5 rounded bg-black/10">
              {todayOrders.length}单
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INVENTORY_STOCK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'INVENTORY_STOCK'
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isMerchant ? '食材物料库存 (查看·入库·盘点)' : t('ingredientInventory')}</span>
            {lowStockCount > 0 && (
              <span className="text-[10px] px-1.5 rounded bg-rose-500 text-white font-mono">
                {lowStockCount}告急
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 视图内容切换 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'TODAY_SALES' ? (
          <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto space-y-6">
            {/* 当日销售数据指标卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
                <span className="text-xs font-bold text-stone-500 block mb-1">今日实时营业额</span>
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {formatPrice(todayRevenue)}
                </div>
                <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                  <span>共成交 {todayOrders.length} 笔订单</span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
                <span className="text-xs font-bold text-stone-500 block mb-1">已交付核销单量</span>
                <div className="text-2xl font-black text-amber-600 font-mono">
                  {todayCompletedCount} / {todayOrders.length}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  核销完成率: {todayOrders.length > 0 ? ((todayCompletedCount / todayOrders.length) * 100).toFixed(0) : 100}%
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
                <span className="text-xs font-bold text-stone-500 block mb-1">POS刷卡 / 移动支付</span>
                <div className="text-2xl font-black text-blue-600 font-mono">
                  {formatPrice(todayCardRevenue)}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  占比: {todayRevenue > 0 ? ((todayCardRevenue / todayRevenue) * 100).toFixed(0) : 0}%
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
                <span className="text-xs font-bold text-stone-500 block mb-1">现金实收结余</span>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  {formatPrice(todayCashRevenue)}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">
                  钱箱现钞对账参考
                </div>
              </div>
            </div>

            {/* 当日订单流水明细 */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>今日实时订单流水清单 ({todayOrders.length} 单)</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 font-bold text-[11px]">
                      <th className="py-2.5 px-3">取餐码</th>
                      <th className="py-2.5 px-3">流水号</th>
                      <th className="py-2.5 px-3">渠道</th>
                      <th className="py-2.5 px-3">点餐品项</th>
                      <th className="py-2.5 px-3 text-right">金额</th>
                      <th className="py-2.5 px-3">支付方式</th>
                      <th className="py-2.5 px-3">时间</th>
                      <th className="py-2.5 px-3 text-right">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {todayOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-stone-400 italic">
                          今日暂无订单记录
                        </td>
                      </tr>
                    ) : (
                      todayOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-stone-50 transition">
                          <td className="py-3 px-3 font-black text-amber-600 font-mono text-sm">
                            {ord.pickupCode}
                          </td>
                          <td className="py-3 px-3 font-mono text-stone-500">{ord.orderNo}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold">
                              {ord.channel === 'COUNTER_POS' ? '吧台收银' : '手机扫码'}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-[200px] truncate text-stone-800 font-medium">
                            {ord.items.map((i) => `${i.productName}x${i.quantity}`).join(', ')}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-stone-900 font-mono">
                            {formatPrice(ord.totalAmount)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                ord.paymentMethod === 'CASH'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {ord.paymentMethod === 'CASH' ? '现金' : 'POS刷卡'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-stone-400 font-mono">
                            {new Date(ord.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ord.status === 'COMPLETED'
                                  ? 'bg-stone-100 text-stone-600'
                                  : ord.status === 'READY'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {ord.status === 'COMPLETED' ? '已核销' : ord.status === 'READY' ? '待取餐' : '制作中'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* 食材库存管理视图 */
          <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto space-y-6">
            {/* 库存顶部控制与搜索 */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative w-56">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="搜索食材/包材名称..."
                    className="w-full pl-8 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {['ALL', 'TEA', 'DAIRY', 'MEAT', 'PACKAGING'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setInventoryCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        inventoryCategory === cat
                          ? 'bg-amber-500 text-stone-950 shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat === 'ALL'
                        ? '全部'
                        : cat === 'TEA'
                        ? '茶底'
                        : cat === 'DAIRY'
                        ? '乳品'
                        : cat === 'MEAT'
                        ? '肉禽'
                        : '包材'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateItemModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs active:scale-98 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addInventoryItem')}</span>
              </button>
            </div>

            {/* 食材库存网格清单 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const isCritical = item.status === 'CRITICAL';
                const isLow = item.status === 'LOW';

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-3xl bg-white border transition flex flex-col justify-between ${
                      isCritical
                        ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-400/20'
                        : isLow
                        ? 'border-amber-400 bg-amber-50/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-black text-sm text-stone-900">{item.name}</h4>
                          <span className="text-[10px] font-bold text-stone-400">
                            {item.categoryName}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCritical ? '紧缺告急' : isLow ? '库存偏低' : '库存充足'}
                        </span>
                      </div>

                      {/* 当前库存大字 */}
                      <div className="py-2 flex items-baseline justify-between border-y border-stone-100 my-2">
                        <span className="text-xs text-stone-500">当前在库余量:</span>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-2xl font-black font-mono ${
                              isCritical ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-stone-900'
                            }`}
                          >
                            {item.currentStock}
                          </span>
                          <span className="text-xs font-bold text-stone-400">{item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-400 mb-3">
                        <span>预警阈值: {item.minThreshold} {item.unit}</span>
                        <span>成本价: {formatPrice(item.costPerUnit)}/{item.unit}</span>
                      </div>
                    </div>

                    {/* 操作按钮组 (补货入库 / 损耗 / 盘点校准) */}
                    <div className="pt-2 border-t border-stone-100 grid grid-cols-3 gap-1.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(item, 'RESTOCK')}
                        className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-800 border border-emerald-200 transition text-center"
                      >
                        {t('restock')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(item, 'WASTE')}
                        className="py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-800 border border-rose-200 transition text-center"
                      >
                        {t('waste')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(item, 'CALIBRATE')}
                        className="py-1.5 px-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition text-center"
                      >
                        {t('calibrate')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 变动台账日志 */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>食材出入库与盘点流水台账</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 font-bold text-[11px]">
                      <th className="py-2 px-3">变动时间</th>
                      <th className="py-2 px-3">食材名称</th>
                      <th className="py-2 px-3">变动类型</th>
                      <th className="py-2 px-3 text-right">变动量</th>
                      <th className="py-2 px-3 text-right">变动后结余</th>
                      <th className="py-2 px-3">操作人</th>
                      <th className="py-2 px-3">备注</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {inventoryLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50 transition">
                        <td className="py-2.5 px-3 text-stone-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-stone-900">{log.itemName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === 'RESTOCK'
                                ? 'bg-emerald-50 text-emerald-700'
                                : log.type === 'WASTE'
                                ? 'bg-rose-50 text-rose-700'
                                : log.type === 'CONSUME'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {log.type === 'RESTOCK'
                              ? '采购入库'
                              : log.type === 'WASTE'
                              ? '损耗报废'
                              : log.type === 'CONSUME'
                              ? '出杯消耗'
                              : '盘点校准'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black font-mono text-stone-900">
                          {log.quantityDelta > 0 ? `+${log.quantityDelta}` : log.quantityDelta}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-stone-600">
                          {log.balance}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">{log.operator}</td>
                        <td className="py-2.5 px-3 text-stone-400 italic">{log.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 调整库存模态框 (入库/损耗/盘点) */}
      {actionModal.isOpen && actionModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-stone-200 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setActionModal({ isOpen: false, item: null, type: 'RESTOCK' })}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-stone-900 mb-1">
              {actionModal.type === 'RESTOCK'
                ? '原料补货入库'
                : actionModal.type === 'WASTE'
                ? '原料损耗报废'
                : '实物盘点校准'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              物料: <strong className="text-stone-900">{actionModal.item.name}</strong> (当前结余:{' '}
              {actionModal.item.currentStock} {actionModal.item.unit})
            </p>

            <form onSubmit={handleExecuteAdjust} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  {actionModal.type === 'CALIBRATE' ? '盘点实际在库数量' : '变动数量'} ({actionModal.item.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-base font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">操作原因 / 批次备注</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="例如: 供货商到货入库 / 晚间盘点..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, item: null, type: 'RESTOCK' })}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-xs active:scale-98 transition"
                >
                  {isSubmitting ? '执行中...' : '确认执行'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新建食材物料模态框 */}
      {isCreateItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setIsCreateItemModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-stone-900 mb-1">{t('addInventoryItem')}</h3>
            <p className="text-xs text-stone-500 mb-4">录入后厨原料、茶叶、奶品、肉类或外带包材</p>

            <form onSubmit={handleCreateNewItem} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">食材物料名称 *</label>
                <input
                  type="text"
                  required
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                  placeholder="例如: 锡兰红茶原叶 / 鲜牛奶"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">物料类别</label>
                  <select
                    value={newItemData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const nameMap: Record<string, string> = {
                        TEA: '茶底原叶',
                        DAIRY: '乳品配料',
                        MEAT: '生鲜肉禽',
                        PACKAGING: '包材耗材',
                        SYRUP: '糖浆风味',
                      };
                      setNewItemData({
                        ...newItemData,
                        category: cat,
                        categoryName: nameMap[cat] || '其他原料',
                      });
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="TEA">茶底原叶</option>
                    <option value="DAIRY">乳品配料</option>
                    <option value="MEAT">生鲜肉禽</option>
                    <option value="PACKAGING">包材耗材</option>
                    <option value="SYRUP">糖浆风味</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">计量单位</label>
                  <input
                    type="text"
                    required
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                    placeholder="kg / 升 / 箱 / 个"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">初始库存</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemData.currentStock}
                    onChange={(e) => setNewItemData({ ...newItemData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">预警阈值</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemData.minThreshold}
                    onChange={(e) => setNewItemData({ ...newItemData, minThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">单价成本 ({currentStore.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemData.costPerUnit}
                    onChange={(e) => setNewItemData({ ...newItemData, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-xs active:scale-98 transition"
                >
                  {isSubmitting ? '保存中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
