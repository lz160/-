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
    currentStore,
    currentMerchant,
    currentStaffUser,
    formatPrice,
    categories,
    t,
  } = useApp();

  // Selected Store filter (Default to ALL for multi-store merchant, or specific store)
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'volume' | 'revenue'>('volume');

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

  // Stores accessible by this merchant
  const availableStores = useMemo(() => {
    if (currentStaffUser.role === 'SUPER_ADMIN') {
      return stores;
    }
    if (currentMerchant) {
      return stores.filter((s) => currentMerchant.assignedStoreIds.includes(s.id));
    }
    return [currentStore];
  }, [stores, currentMerchant, currentStaffUser, currentStore]);

  // Fetch sales analytics with filters
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStoreId !== 'ALL') params.append('storeId', selectedStoreId);
      if (selectedTimeRange) params.append('timeRange', selectedTimeRange);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);

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
  }, [selectedStoreId, selectedTimeRange, selectedCategory]);

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
              <h2 className="text-sm font-black text-stone-900">{t('salesTurnover')} & {t('productSalesVolume')}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                {currentMerchant ? currentMerchant.name : '全部商家'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              商家专属多维营业报表：营业额、历史数据、各商品销量排行及支付渠道构成
            </p>
          </div>
        </div>

        {/* 筛选器组合 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 店铺筛选 */}
          <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl px-2.5 py-1.5 border border-stone-200">
            <Store className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">全部店铺汇总 ({availableStores.length}家)</option>
              {availableStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeName} ({s.currency})
                </option>
              ))}
            </select>
          </div>

          {/* 时间范围筛选 */}
          <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl px-2.5 py-1.5 border border-stone-200">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="all">全部历史数据</option>
              <option value="today">{t('today')}</option>
              <option value="yesterday">{t('yesterday')}</option>
              <option value="last7">{t('last7Days')}</option>
              <option value="last30">{t('last30Days')}</option>
            </select>
          </div>

          {/* 品类筛选 */}
          <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl px-2.5 py-1.5 border border-stone-200">
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">全商品分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
