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
  Check,
} from 'lucide-react';
import { ExpoPackView } from './ExpoPackView';

/**
 * 后厨 KDS 分工位屏幕 (水吧、炸台、烤台、Expo 打包)
 * 支持工单单品卡片视图与同品项合并制作 (Batch Aggregation) 模式
 */
export const KDSView: React.FC = () => {
  const { orders, bumpKdsTask, simulateTraffic, theme, t } = useApp();
  const isLight = theme === 'light';

  const [selectedStationId, setSelectedStationId] = useState<string>('station_bar');
  const [viewMode, setViewMode] = useState<'TICKETS' | 'BATCH'>('TICKETS');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isSimulating, setIsSimulating] = useState(false);

  // 1秒计时器，用于刷新 SLA 超时警报
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 过滤活跃状态订单 (待制作、制作中、待取餐)
  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'PENDING' || o.status === 'MAKING' || o.status === 'READY'
    );
  }, [orders]);

  // 过滤属于当前工位的工单
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

  // 计算同品项聚合 (Batch) 列表
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
              modifierSummary: modSummary || '标准规格',
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

  // 单品消单 (Bump item)
  const handleItemBump = async (orderId: string, itemId: string) => {
    await bumpKdsTask(orderId, itemId, selectedStationId, 'BUMP_ITEM');
  };

  // 本工位整单全消 (Bump station all)
  const handleStationBumpAll = async (orderId: string) => {
    await bumpKdsTask(orderId, undefined, selectedStationId, 'BUMP_ALL_STATION');
  };

  // 批量消单 (Batch bump)
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

  // 高峰流量模拟触发
  const handleTriggerSimTraffic = async (count = 3) => {
    setIsSimulating(true);
    try {
      await simulateTraffic(count);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div
      id="kds-view"
      className={`w-full h-full flex flex-col overflow-hidden transition-colors ${
        isLight ? 'bg-stone-100 text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* 顶部工位选择与操作栏 */}
      <div
        className={`px-4 py-3 shrink-0 shadow-xs border-b transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 工位选项卡 */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div
              className={`flex p-1 rounded-2xl border ${
                isLight ? 'bg-stone-100 border-stone-200' : 'bg-stone-950 border-stone-800'
              }`}
            >
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
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
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

          {/* 视图模式切换与压测注入 */}
          <div className="flex items-center gap-2">
            <div
              className={`flex p-1 rounded-xl border text-xs ${
                isLight ? 'bg-stone-100 border-stone-200' : 'bg-stone-950 border-stone-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('TICKETS')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  viewMode === 'TICKETS'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t('ticketsView')} ({stationOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('BATCH')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                  viewMode === 'BATCH'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {t('batchView')} ({batchAggregationItems.length})
              </button>
            </div>

            {/* 高峰注入 */}
            <button
              id="kds-simulate-traffic-btn"
              type="button"
              onClick={() => handleTriggerSimTraffic(3)}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+3笔高峰压测单</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主体工作区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedStationId === 'station_expo' ? (
          <ExpoPackView />
        ) : (
          <>
            {/* 模式一：标准工单卡片模式 */}
            {viewMode === 'TICKETS' && (
              <div>
                {stationOrders.length === 0 ? (
                  <div className="h-96 flex flex-col items-center justify-center text-stone-400 space-y-3">
                    <CheckCircle2 className="w-16 h-16 text-stone-300" />
                    <div className="text-sm font-bold text-stone-600">本工位当前无待制作工单</div>
                    <p className="text-xs text-stone-400">
                      顾客下单或吧台出票后，工单将毫秒级自动推送至此屏幕
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
                          className={`rounded-2xl flex flex-col overflow-hidden shadow-sm transition-all border-2 ${
                            order.allStationItemsDone
                              ? 'bg-stone-50 border-emerald-400/80 opacity-70'
                              : isOverdue
                              ? 'bg-white border-rose-400 shadow-rose-100'
                              : isWarning
                              ? 'bg-white border-amber-400 shadow-amber-100'
                              : 'bg-white border-stone-200'
                          }`}
                        >
                          {/* 卡片头部 */}
                          <div
                            className={`px-4 py-2.5 flex items-center justify-between border-b ${
                              isOverdue
                                ? 'bg-rose-50 border-rose-200 text-rose-900'
                                : isWarning
                                ? 'bg-amber-50 border-amber-200 text-amber-900'
                                : 'bg-stone-50 border-stone-200 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-black font-mono tracking-wider text-stone-900">
                                {order.pickupCode}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-stone-600 border border-stone-300 uppercase font-bold">
                                {order.channel === 'QR_H5' ? '手机H5' : '吧台POS'}
                              </span>
                            </div>

                            {/* 耗时计时器 */}
                            <div className="flex items-center gap-1 font-mono text-xs font-bold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {Math.floor(elapsedSec / 60)}:
                                {(elapsedSec % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          </div>

                          {/* 本工位商品细项 */}
                          <div className="p-3.5 flex-1 space-y-2.5 divide-y divide-stone-100">
                            {order.stationItems.map((item) => {
                              const isItemDone = item.stationStatus === 'DONE';

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
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {isItemDone ? <Check className="w-3 h-3" /> : item.quantity}
                                      </span>
                                      <span
                                        className={`text-xs font-bold ${
                                          isItemDone
                                            ? 'line-through text-stone-400'
                                            : 'text-stone-900 group-hover:text-amber-700'
                                        }`}
                                      >
                                        {item.productName}
                                      </span>
                                    </div>

                                    {item.selectedModifiers.length > 0 && (
                                      <div className="text-[11px] text-stone-500 pl-7 space-y-0.5">
                                        {item.selectedModifiers.map((m, idx) => (
                                          <div key={idx} className="flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                                            <span>{m.itemName}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {item.notes && (
                                      <div className="text-[10px] text-rose-700 pl-7 font-bold">
                                        备注: {item.notes}
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleItemBump(order.id, item.itemId);
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ${
                                      isItemDone
                                        ? 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                                        : 'bg-amber-500 text-stone-950 hover:bg-amber-400 active:scale-95 shadow-xs'
                                    }`}
                                  >
                                    {isItemDone ? '已完成' : t('bumpTask')}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* 底部一键整单全消 */}
                          <div className="p-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-stone-500">
                              #{order.orderNo.slice(-6)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStationBumpAll(order.id)}
                              disabled={order.allStationItemsDone}
                              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{t('bumpAll')}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 模式二：同品项聚合制作 (Batch View) */}
            {viewMode === 'BATCH' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>同品项聚类模式</strong>：自动汇总多个流水单中配方完全一致的饮品/餐品，支持大锅同时出餐消单。
                    </span>
                  </div>
                </div>

                {batchAggregationItems.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-stone-400 space-y-2">
                    <Layers className="w-12 h-12 text-stone-300" />
                    <p className="text-xs font-bold text-stone-600">当前没有需要聚合制作的工单</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batchAggregationItems.map((batch, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-base font-black text-stone-900">
                                {batch.productName}
                              </h4>
                              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                                配方: {batch.modifierSummary}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-2xl font-black text-amber-600">
                                x{batch.totalQuantity}
                              </span>
                              <div className="text-[10px] text-stone-500 font-medium">总需求量</div>
                            </div>
                          </div>

                          {/* 关联的订单取餐码列表 */}
                          <div className="mt-3 pt-3 border-t border-stone-100">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                              {t('associatedOrders')} ({batch.orderRefs.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {batch.orderRefs.map((r, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded-lg text-xs font-mono font-bold text-stone-800"
                                >
                                  {r.pickupCode} (x{r.quantity})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBatchBump(batch)}
                          className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>一键批量完成消单 (x{batch.totalQuantity})</span>
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
