import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StoreEntity } from '../../types';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Banknote,
  Calendar,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  Search,
  Sparkles,
  Store,
  BarChart3,
  PieChart,
} from 'lucide-react';

export const MerchantSalesAnalytics: React.FC = () => {
  const {
    stores,
    merchants,
    currentStore,
    currentMerchant,
    currentStaffUser,
    formatPrice,
    categories,
    t,
  } = useApp();

  const isSuperAdmin = currentStaffUser?.role === 'SUPER_ADMIN';

  // Calculate default current month start and end dates (YYYY-MM-DD)
  const defaultCurrentMonthRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      start: `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`,
      end: `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`,
      monthLabel: `${year}年${month + 1}月`,
    };
  }, []);

  // Filter states
  // 1. Merchant / Chain Brand Filter (for Super Admin: 'ALL' or specific merchantId; for Merchant: their own merchantId)
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(
    currentMerchant ? currentMerchant.id : 'ALL'
  );

  // 2. Store Filter: 'ALL' or specific storeId
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');

  // 3. Date Range mode: 'current_month' | 'today' | 'yesterday' | 'last7' | 'last30' | 'custom' | 'all'
  const [datePreset, setDatePreset] = useState<string>('current_month');
  const [startDate, setStartDate] = useState<string>(defaultCurrentMonthRange.start);
  const [endDate, setEndDate] = useState<string>(defaultCurrentMonthRange.end);

  // 4. Category & Product filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'volume' | 'revenue'>('volume');

  // Available stores filtered by selected brand/merchant
  const availableStores = useMemo(() => {
    let list = stores || [];
    if (selectedMerchantId !== 'ALL') {
      const merchant = (merchants || []).find((m) => m.id === selectedMerchantId);
      if (merchant && Array.isArray(merchant.assignedStoreIds)) {
        list = list.filter((s) => merchant.assignedStoreIds.includes(s.id));
      } else {
        list = list.filter((s) => s.merchantId === selectedMerchantId);
      }
    } else if (!isSuperAdmin && currentMerchant) {
      list = list.filter((s) => currentMerchant.assignedStoreIds?.includes(s.id));
    }
    return list;
  }, [stores, merchants, selectedMerchantId, isSuperAdmin, currentMerchant]);

  // If selected store is no longer in availableStores, reset to ALL
  useEffect(() => {
    if (selectedStoreId !== 'ALL') {
      const exists = availableStores.some((s) => s.id === selectedStoreId);
      if (!exists) setSelectedStoreId('ALL');
    }
  }, [availableStores, selectedStoreId]);

  // Handle Preset changes
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (preset === 'current_month') {
      setStartDate(defaultCurrentMonthRange.start);
      setEndDate(defaultCurrentMonthRange.end);
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'last7') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setStartDate(`${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`);
      setEndDate(todayStr);
    } else if (preset === 'last30') {
      const past = new Date();
      past.setDate(past.getDate() - 29);
      setStartDate(`${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Analytics API state
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{
    metrics: {
      totalRevenue: number;
      totalOrders: number;
      avgOrderValue: number;
      cashIncome: number;
      cardIncome: number;
      totalItemsSold: number;
    };
    hourlyTrend: { hour: string; count: number; revenue: number }[];
    productRankings: {
      skuId: string;
      productName: string;
      category: string;
      volume: number;
      revenue: number;
    }[];
  }>({
    metrics: {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      cashIncome: 0,
      cardIncome: 0,
      totalItemsSold: 0,
    },
    hourlyTrend: [],
    productRankings: [],
  });

  // Fetch sales analytics with filters
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMerchantId && selectedMerchantId !== 'ALL') {
        params.append('merchantId', selectedMerchantId);
      }
      if (selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId);
      }
      if (datePreset === 'all') {
        params.append('timeRange', 'all');
      } else if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else if (datePreset) {
        params.append('timeRange', datePreset);
      }
      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }

      const res = await fetch(`/api/admin/analytics/sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch sales analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMerchantId, selectedStoreId, datePreset, startDate, endDate, selectedCategory]);

  // Filtered and sorted products
  const displayedProductRankings = useMemo(() => {
    let list = [...(analyticsData.productRankings || [])];
    if (productSearchQuery.trim()) {
      const q = productSearchQuery.toLowerCase();
      list = list.filter(
        (p) => p.productName.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (sortBy === 'volume' ? b.volume - a.volume : b.revenue - a.revenue));
    return list;
  }, [analyticsData.productRankings, productSearchQuery, sortBy]);

  // Max hourly revenue for chart scaling
  const maxHourlyRev = useMemo(() => {
    const max = Math.max(...(analyticsData.hourlyTrend?.map((h) => h.revenue) || [1]), 1);
    return max;
  }, [analyticsData.hourlyTrend]);

  // Selected Brand Label
  const selectedBrandLabel = useMemo(() => {
    if (selectedMerchantId === 'ALL') return '全部连锁品牌大盘';
    const found = (merchants || []).find((m) => m.id === selectedMerchantId);
    return found ? found.name : '指定连锁品牌';
  }, [selectedMerchantId, merchants]);

  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // CSV Report Exporter (UTF-8 BOM formatted for Excel & Sheets)
  const handleExportReport = () => {
    const storeLabel =
      selectedStoreId === 'ALL'
        ? `全部门店汇总 (${availableStores.length}家)`
        : availableStores.find((s) => s.id === selectedStoreId)?.storeName || selectedStoreId;

    const dateLabel =
      datePreset === 'current_month'
        ? `当月 (${defaultCurrentMonthRange.monthLabel})`
        : datePreset === 'custom'
        ? `${startDate} 至 ${endDate}`
        : datePreset === 'today'
        ? '今日'
        : datePreset === 'yesterday'
        ? '昨日'
        : datePreset === 'last7'
        ? '近7天'
        : datePreset === 'last30'
        ? '近30天'
        : '全部历史';

    let csv = '\uFEFF'; // Excel UTF-8 BOM
    csv += `连锁品牌,${selectedBrandLabel}\n`;
    csv += `查询门店,${storeLabel}\n`;
    csv += `统计周期,${dateLabel}\n`;
    csv += `导出时间,${new Date().toLocaleString()}\n`;
    csv += `数据权限,只读财务与销量分析\n\n`;

    csv += `【核心经营指标汇总】\n`;
    csv += `总营业额,成交订单数,客单价,餐品总销量(件),POS与移动支付,现金收银\n`;
    csv += `${analyticsData.metrics.totalRevenue},${analyticsData.metrics.totalOrders},${analyticsData.metrics.avgOrderValue},${analyticsData.metrics.totalItemsSold},${analyticsData.metrics.cardRevenue},${analyticsData.metrics.cashRevenue}\n\n`;

    csv += `【商品销量与销售额明细排行】\n`;
    csv += `排名,商品名称,所属品类,单价,总销量(件),销售额,销量占比\n`;
    displayedProductRankings.forEach((p, idx) => {
      csv += `${idx + 1},"${p.productName.replace(/"/g, '""')}","${p.category}",${p.price},${p.volume},${p.revenue},${p.percentage}%\n`;
    });

    csv += `\n【24小时营业高峰走势】\n`;
    csv += `时段,成交单数,营业额\n`;
    (analyticsData.hourlyTrend || []).forEach((h) => {
      csv += `${h.hour},${h.orders},${h.revenue}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${selectedBrandLabel.replace(/[\s/\\:]+/g, '_')}_多店营收报表_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`已成功导出「${filename}」`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden select-none">
      {/* 顶部筛选与控制栏 */}
      <div className="p-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-stone-900">
                {isSuperAdmin ? '商户多店营收大盘分析' : `${t('salesTurnover')} & ${t('productSalesVolume')}`}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                {selectedBrandLabel}
              </span>
              {datePreset === 'current_month' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                  当月 ({defaultCurrentMonthRange.monthLabel})
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400">
              多维度营收与单品分析：支持按连锁品牌划拨、多门店汇总与自定义日期范围 (默认当月)
            </p>
          </div>
        </div>

        {/* 筛选器组合 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. 连锁品牌/商家筛选 (超管可切换全部或指定品牌，商家锁定自己) */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl px-2.5 py-1.5 border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500">连锁品牌:</span>
              <select
                id="analytics-merchant-filter"
                value={selectedMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">全平台所有连锁品牌汇总 ({(merchants || []).length}个)</option>
                {(merchants || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.assignedStoreIds?.length || 0}家店)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. 门店筛选 */}
          <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl px-2.5 py-1.5 border border-stone-200">
            <Store className="w-3.5 h-3.5 text-stone-500" />
            <select
              id="analytics-store-filter"
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部门店汇总 ({availableStores.length}家)</option>
              {availableStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeName} ({s.currency})
                </option>
              ))}
            </select>
          </div>

          {/* 3. 日期范围预设 (默认当月) */}
          <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl px-2.5 py-1.5 border border-stone-200">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <select
              id="analytics-date-preset"
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="current_month">📅 当月 ({defaultCurrentMonthRange.monthLabel})</option>
              <option value="today">今日 ({t('today')})</option>
              <option value="yesterday">昨日 ({t('yesterday')})</option>
              <option value="last7">近 7 天</option>
              <option value="last30">近 30 天</option>
              <option value="custom">🛠️ 自定义起止日期范围</option>
              <option value="all">全部历史数据</option>
            </select>
          </div>

          {/* 自定义起止日期选择器 */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl px-2.5 py-1 border border-stone-200 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent font-mono text-stone-800 focus:outline-none cursor-pointer"
              />
              <span className="text-stone-400 font-bold">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent font-mono text-stone-800 focus:outline-none cursor-pointer"
              />
            </div>
          )}

          {/* 4. 品类筛选 */}
          <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl px-2.5 py-1.5 border border-stone-200">
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            <select
              id="analytics-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">全商品分类</option>
              {(categories || []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. 一键导出报表 (只读+导出) */}
          <button
            id="export-sales-report-btn"
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs active:scale-98 transition ml-auto"
            title="导出当前筛选维度下的营收与销量 CSV 报表"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出经营报表 (CSV)</span>
          </button>
        </div>
      </div>

      {/* 导出成功通知 */}
      {exportNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-white/80 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 主体分析内容区 */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* KPI 核心营业指标卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500 font-bold">{t('totalRevenue')} (营业额)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {formatPrice(analyticsData.metrics.totalRevenue)}
            </div>
            <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
              <span>共成交 </span>
              <strong className="text-stone-700">{analyticsData.metrics.totalOrders}</strong>
              <span> 笔订单</span>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500 font-bold">{t('averageOrderValue')} (客单价)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 font-mono">
              {formatPrice(analyticsData.metrics.avgOrderValue)}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              单均包含 {analyticsData.metrics.totalOrders > 0 ? (analyticsData.metrics.totalItemsSold / analyticsData.metrics.totalOrders).toFixed(1) : 0} 件餐品
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500 font-bold">POS刷卡 / 线上收款</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-600 font-mono">
              {formatPrice(analyticsData.metrics.cardIncome)}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              占比: {analyticsData.metrics.totalRevenue > 0 ? ((analyticsData.metrics.cardIncome / analyticsData.metrics.totalRevenue) * 100).toFixed(0) : 0}%
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500 font-bold">现金收银收入</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {formatPrice(analyticsData.metrics.cashIncome)}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              占比: {analyticsData.metrics.totalRevenue > 0 ? ((analyticsData.metrics.cashIncome / analyticsData.metrics.totalRevenue) * 100).toFixed(0) : 0}%
            </div>
          </div>
        </div>

        {/* 今日/周期内 营业额时段走势分布 */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs text-stone-900">营业额各时段走势分布图</h3>
            </div>
            <span className="text-[11px] text-stone-400 font-medium">按小时统计 (08:00 - 23:00)</span>
          </div>

          <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 overflow-x-auto">
            {analyticsData.hourlyTrend.map((hourData, idx) => {
              const heightPercent = maxHourlyRev > 0 ? Math.max((hourData.revenue / maxHourlyRev) * 100, 4) : 4;
              return (
                <div key={idx} className="flex-1 min-w-[28px] flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-8 bg-stone-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 font-mono">
                    {hourData.hour}: {formatPrice(hourData.revenue)} ({hourData.count}单)
                  </div>

                  <div className="w-full bg-stone-100 rounded-t-lg h-32 flex items-end p-0.5">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        hourData.revenue > 0 ? 'bg-amber-500 group-hover:bg-amber-400' : 'bg-stone-200'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] text-stone-400 font-mono scale-90">{hourData.hour.slice(0, 2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 商品销量排行榜与明细表 (含筛选与排序) */}
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs text-stone-900">
                商品销量与销售额明细清单 ({displayedProductRankings.length}项)
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* 商品搜索 */}
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="搜索商品名..."
                  className="w-full pl-8 pr-3 py-1 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 排序方式 */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSortBy('volume')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    sortBy === 'volume' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  按销量 (份)
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('revenue')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    sortBy === 'revenue' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  按销售额 ({currentStore.currencySymbol})
                </button>
              </div>
            </div>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold text-[11px] pb-2">
                  <th className="py-2.5 px-3">排名</th>
                  <th className="py-2.5 px-3">商品名称</th>
                  <th className="py-2.5 px-3">所属品类</th>
                  <th className="py-2.5 px-3 text-right">已售份数 (份)</th>
                  <th className="py-2.5 px-3 text-right">累计销售额</th>
                  <th className="py-2.5 px-3 text-right">销售额占比</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {displayedProductRankings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400 italic">
                      当前筛选条件下暂无销售数据
                    </td>
                  </tr>
                ) : (
                  displayedProductRankings.map((item, index) => {
                    const revShare =
                      analyticsData.metrics.totalRevenue > 0
                        ? ((item.revenue / analyticsData.metrics.totalRevenue) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={item.skuId} className="hover:bg-stone-50 transition">
                        <td className="py-3 px-3">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                              index === 0
                                ? 'bg-amber-500 text-stone-950'
                                : index === 1
                                ? 'bg-stone-300 text-stone-800'
                                : index === 2
                                ? 'bg-amber-700/20 text-amber-900'
                                : 'text-stone-400'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-stone-900">{item.productName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-stone-800 font-mono">
                          {item.volume} 份
                        </td>
                        <td className="py-3 px-3 text-right font-black text-amber-600 font-mono">
                          {formatPrice(item.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono text-stone-500">{revShare}%</span>
                            <div className="w-12 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(parseFloat(revShare) * 2, 100)}%` }}
                                className="bg-amber-500 h-full rounded-full"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
