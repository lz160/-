import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KDS_STATIONS } from '../../data/menuData';
import { OrderItem, OrderMaster, BatchAggregationItem } from '../../types';
import {
  CupSoda,
  Flame,
  Beef,
  PackageCheck,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Volume2,
  Maximize2,
  Check,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ExpoPackView } from './ExpoPackView';

export const KDSView: React.FC = () => {
  const { orders, bumpKdsTask, simulateTraffic, refreshOrders } = useApp();

  const [selectedStationId, setSelectedStationId] = useState<string>('station_bar');
  const [viewMode, setViewMode] = useState<'TICKETS' | 'BATCH'>('TICKETS');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isSimulating, setIsSimulating] = useState(false);

  // Tick clock for SLA timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders by active kitchen status
  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'PENDING' || o.status === 'MAKING' || o.status === 'READY'
    );
  }, [orders]);

  // Filter orders that have items for this specific station
  const stationOrders = useMemo(() => {
    if (selectedStationId === 'station_expo') return [];
    return activeOrders
      .map((order) => {
        const stationItems = order.items.filter(
          (i) => i.targetStationId === selectedStationId
        );
        if (stationItems.length === 0) return null;
        const allStationItemsDone = stationItems.every((i) => i.stationStatus === 'DONE');
        return {
          ...order,
          stationItems,
          allStationItemsDone,
        };
      })
      .filter(Boolean) as (OrderMaster & { stationItems: OrderItem[]; allStationItemsDone: boolean })[];
  }, [activeOrders, selectedStationId]);

  // Compute Batch Aggregations
  const batchAggregationItems = useMemo(() => {
    if (selectedStationId === 'station_expo') return [];
    const batchMap = new Map<string, BatchAggregationItem>();

    activeOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.targetStationId === selectedStationId && item.stationStatus !== 'DONE') {
          const modSummary = item.selectedModifiers
            .map((m) => m.itemName)
            .sort()
            .join(', ');
          const signature = `${item.skuId}___${modSummary}`;

          const elapsedSec = Math.floor((currentTime - (order.paidAt || order.createdAt)) / 1000);
          const existing = batchMap.get(signature);

          if (existing) {
            existing.totalQuantity += item.quantity;
            existing.orderRefs.push({
              orderId: order.id,
              pickupCode: order.pickupCode,
              quantity: item.quantity,
              elapsedSeconds: elapsedSec,
            });
            if (order.createdAt < existing.earliestCreatedAt) {
              existing.earliestCreatedAt = order.createdAt;
            }
          } else {
            batchMap.set(signature, {
              skuId: item.skuId,
              productName: item.productName,
              targetStationId: selectedStationId,
              modifierSignature: signature,
              modifierSummary: modSummary || '标准原味',
              totalQuantity: item.quantity,
              orderRefs: [
                {
                  orderId: order.id,
                  pickupCode: order.pickupCode,
                  quantity: item.quantity,
                  elapsedSeconds: elapsedSec,
                },
              ],
              earliestCreatedAt: order.createdAt,
            });
          }
        }
      });
    });

    return Array.from(batchMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [activeOrders, selectedStationId, currentTime]);

  // Handle single item bump
  const handleItemBump = async (orderId: string, itemId: string) => {
    await bumpKdsTask(orderId, itemId, selectedStationId, 'BUMP_ITEM');
  };

  // Handle station bump all
  const handleStationBumpAll = async (orderId: string) => {
    await bumpKdsTask(orderId, undefined, selectedStationId, 'BUMP_ALL_STATION');
  };

  // Batch bump all orders matching a signature
  const handleBatchBump = async (batch: BatchAggregationItem) => {
    for (const ref of batch.orderRefs) {
      const order = orders.find((o) => o.id === ref.orderId);
      if (order) {
        const item = order.items.find(
          (i) => i.skuId === batch.skuId && i.stationStatus !== 'DONE'
        );
        if (item) {
          await bumpKdsTask(order.id, item.itemId, selectedStationId, 'BUMP_ITEM');
        }
      }
    }
  };

  // Traffic test simulation
  const handleTriggerSimTraffic = async (count = 3) => {
    setIsSimulating(true);
    try {
      await simulateTraffic(count);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div id="kds-view" className="w-full h-full flex flex-col bg-stone-950 text-stone-100 overflow-hidden">
      
      {/* Top Station Selector & Action Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-3 shrink-0 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Station Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex bg-stone-950 p-1 rounded-2xl border border-stone-800">
              {KDS_STATIONS.map((st) => {
                const isSelected = selectedStationId === st.id;
                return (
                  <button
                    key={st.id}
                    id={`kds-station-tab-${st.id}`}
                    type="button"
                    onClick={() => setSelectedStationId(st.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 shadow-md'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                    }`}
                  >
                    {st.id === 'station_bar' && <CupSoda className="w-4 h-4" />}
                    {st.id === 'station_fryer' && <Flame className="w-4 h-4" />}
                    {st.id === 'station_grill' && <Beef className="w-4 h-4" />}
                    {st.id === 'station_expo' && <PackageCheck className="w-4 h-4" />}
                    <span>{st.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Mode Toggle & Peak Simulator */}
          <div className="flex items-center gap-2">
            
            {/* View Mode */}
            <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('TICKETS')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  viewMode === 'TICKETS'
                    ? 'bg-stone-800 text-amber-300'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                工单卡片模式 ({stationOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('BATCH')}
                className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
                  viewMode === 'BATCH'
                    ? 'bg-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                同品项聚类看板 ({batchAggregationItems.length})
              </button>
            </div>

            {/* Quick Concurrency Simulator */}
            <button
              id="kds-simulate-traffic-btn"
              type="button"
              onClick={() => handleTriggerSimTraffic(3)}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+3笔高峰压测单</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main KDS Workspace */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedStationId === 'station_expo' ? (
          <ExpoPackView />
        ) : (
          <>
            {/* Mode 1: Standard Ticket Cards */}
            {viewMode === 'TICKETS' && (
              <div>
            {stationOrders.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-stone-500 space-y-3">
                <CheckCircle2 className="w-16 h-16 text-stone-700" />
                <div className="text-sm font-semibold">本工作站当前无积压待制作工单</div>
                <p className="text-xs text-stone-600">
                  新订单支付完成后将通过 WebSocket 毫秒级自动刷入
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stationOrders.map((order) => {
                  const elapsedSec = Math.floor(
                    (currentTime - (order.paidAt || order.createdAt)) / 1000
                  );
                  const isOverdue = elapsedSec > 120;
                  const isWarning = elapsedSec > 60 && !isOverdue;

                  return (
                    <div
                      key={order.id}
                      className={`bg-stone-900 border-2 rounded-2xl flex flex-col overflow-hidden shadow-xl transition-all duration-200 ${
                        order.allStationItemsDone
                          ? 'border-emerald-500/40 opacity-60'
                          : isOverdue
                          ? 'border-rose-500 shadow-rose-500/10'
                          : isWarning
                          ? 'border-amber-500 shadow-amber-500/10'
                          : 'border-stone-700'
                      }`}
                    >
                      {/* Ticket Header */}
                      <div
                        className={`px-4 py-2.5 flex items-center justify-between border-b ${
                          isOverdue
                            ? 'bg-rose-950/80 border-rose-800 text-rose-200'
                            : isWarning
                            ? 'bg-amber-950/80 border-amber-800 text-amber-200'
                            : 'bg-stone-950 border-stone-800 text-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black font-mono tracking-wider">
                            {order.pickupCode}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 uppercase">
                            {order.channel === 'QR_H5' ? '扫码' : '外卖'}
                          </span>
                        </div>

                        {/* Elapsed Timer with SLA Colors */}
                        <div className="flex items-center gap-1 font-mono text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {Math.floor(elapsedSec / 60)}:
                            {(elapsedSec % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      {/* Items assigned to this station */}
                      <div className="p-3.5 flex-1 space-y-2.5 divide-y divide-stone-800/80">
                        {order.stationItems.map((item) => {
                          const isItemDone = item.stationStatus === 'DONE';
                          const isItemMaking = item.stationStatus === 'MAKING';

                          return (
                            <div
                              key={item.itemId}
                              className={`pt-2 first:pt-0 flex items-start justify-between gap-2 group cursor-pointer ${
                                isItemDone ? 'opacity-40' : ''
                              }`}
                              onClick={() => handleItemBump(order.id, item.itemId)}
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                      isItemDone
                                        ? 'bg-emerald-500 text-stone-950'
                                        : isItemMaking
                                        ? 'bg-amber-500 text-stone-950'
                                        : 'bg-stone-800 text-stone-300'
                                    }`}
                                  >
                                    {isItemDone ? <Check className="w-3.5 h-3.5" /> : item.quantity}
                                  </span>
                                  <span
                                    className={`text-sm font-bold ${
                                      isItemDone ? 'line-through text-stone-500' : 'text-stone-100'
                                    }`}
                                  >
                                    {item.productName}
                                  </span>
                                </div>

                                {/* Modifiers Tree Badges */}
                                {item.selectedModifiers.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pl-7">
                                    {item.selectedModifiers.map((m, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[11px] px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-amber-300 font-medium"
                                      >
                                        {m.itemName}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {item.notes && (
                                  <div className="text-[11px] text-rose-400 italic pl-7">
                                    ★ 备注: {item.notes}
                                  </div>
                                )}
                              </div>

                              {/* Single Bump Toggle Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemBump(order.id, item.itemId);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                                  isItemDone
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : isItemMaking
                                    ? 'bg-amber-500 text-stone-950'
                                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                                }`}
                              >
                                {isItemDone ? '已完成' : isItemMaking ? '制作中' : '开始'}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Ticket Footer Action: Bump All at Station */}
                      <div className="p-3 bg-stone-950/60 border-t border-stone-800 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-stone-400">
                          {order.stationItems.filter((i) => i.stationStatus === 'DONE').length} /{' '}
                          {order.stationItems.length} 项已出
                        </span>

                        <button
                          type="button"
                          onClick={() => handleStationBumpAll(order.id)}
                          disabled={order.allStationItemsDone}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                            order.allStationItemsDone
                              ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md active:scale-95'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{order.allStationItemsDone ? '已全消单' : '本站一键消单'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

            {/* Mode 2: Peak Batch Aggregation View (同品项聚类制作看板) */}
            {viewMode === 'BATCH' && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-100">
                        同品项规格智能聚类看板 (Batch Production Engine)
                      </h4>
                      <p className="text-xs text-stone-400">
                        高峰期将相同SKU及加料项合并，支持一锅出料 / 一桶萃茶，大幅降低重复动作损耗
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-bold bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                    当前聚类: {batchAggregationItems.length} 组
                  </span>
                </div>

                {batchAggregationItems.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-stone-500 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-stone-700" />
                    <div className="text-sm font-semibold">当前没有待聚类的批处理任务</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batchAggregationItems.map((batch, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xl hover:border-amber-500/50 transition"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-base text-stone-100">
                              {batch.productName}
                            </h4>
                            <span className="text-xl font-black text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-xl font-mono">
                              x{batch.totalQuantity} 份
                            </span>
                          </div>

                          <div className="mt-2 text-xs bg-stone-950 p-2 rounded-xl border border-stone-800 text-stone-300">
                            <span className="text-stone-400 font-medium">定制组合: </span>
                            <span className="text-amber-300 font-semibold">{batch.modifierSummary}</span>
                          </div>

                          {/* Associated Order Codes */}
                          <div className="mt-3">
                            <div className="text-[11px] text-stone-400 mb-1">
                              涉及取餐码 ({batch.orderRefs.length} 个订单):
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {batch.orderRefs.map((ref, ri) => (
                                <span
                                  key={ri}
                                  className="px-2 py-0.5 bg-stone-800 rounded-md text-xs font-mono font-bold text-stone-200 border border-stone-700"
                                >
                                  {ref.pickupCode} (x{ref.quantity})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBatchBump(batch)}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition active:scale-98"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>一锅出料・一键批量消单 ({batch.totalQuantity}份)</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
