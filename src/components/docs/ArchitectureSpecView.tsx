import React, { useState, useEffect } from 'react';
import {
  Database,
  Code,
  Copy,
  Check,
  Cpu,
  Layers,
  Network,
  Sparkles,
  Zap,
  Terminal,
  FileText,
  Server,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * SaaS 系统架构规范与即用型 AI 工程提示词中心
 * 展示多租户数据库设计 (DDL)、REST/WebSocket 契约规范与状态机定义
 */
export const ArchitectureSpecView: React.FC = () => {
  const { simulateTraffic, theme } = useApp();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<
    'ARCHITECTURE' | 'DDL' | 'API_WS' | 'FSM' | 'MASTER_PROMPT'
  >('ARCHITECTURE');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [specData, setSpecData] = useState<{
    ddl: string;
    apiContract: any[];
    wsTopics: any[];
  } | null>(null);
  const [simMsg, setSimMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/architecture/spec')
      .then((r) => r.json())
      .then((data) => setSpecData(data))
      .catch((e) => console.error(e));
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulate = async (count: number) => {
    setSimMsg('正在瞬时压测注入订单...');
    await simulateTraffic(count);
    setSimMsg(`✓ 已成功注入 ${count} 笔高并发随机定制订单，KDS及聚类看板已实时刷新！`);
    setTimeout(() => setSimMsg(null), 4000);
  };

  const masterPromptText = `Role: 资深餐饮SaaS架构师与全栈技术专家 (Staff Software Engineer & Solution Architect)
1. Project Overview & Target Domain
你正在构建一套专为“无座茶饮店与快餐外带店”（如奶茶店、咖啡外带窗口、炸鸡汉堡快餐店）设计的多租户扫码点餐与出餐管理SaaS系统。
核心业务特征：摒弃传统正餐的桌台管理（开台/转台/合台/后付账单），全面采用“无桌台极简点餐、先付聚合、动态流水取餐码（Pickup Code）、多工作站KDS（厨房显示系统）分单制作、叫号交付”闭环流程。高峰期极高并发，支持复杂的单品树状规格定制（冰度、糖度、加料加价、备料组合）、多工作站解耦拆单（如水吧台、炸台、汉堡台、打包总控台）、超时预警与出餐批处理。

2. Tech Stack Requirements
Backend: Node.js (Express/NestJS) / Java (Spring Boot 3) / Golang (Gin)，基于 RESTful API + WebSocket 全双工长连接。
Persistence: MySQL 8.0 (InnoDB, 多租户物理/逻辑隔离) + Redis 7.0 (分布式锁、库存原子扣减、实时排队计数器)。
Frontend:
  - C端顾客：Web端移动H5响应式快速扫码点餐（接入Stripe/微信/支付宝聚合先付与Webhook实时回调）。
  - B端KDS后厨端：Web/Android 平板自适应大屏看板（支持触屏消单 Bump 与同品项批处理聚类）。
  - B端叫号取餐屏：大字号动态翻牌、多语种语音合成（TTS）播报广播。
  - 硬件对接：云打印机（ESC/POS、TSPL 标签纸协议）进行杯贴/小票即时打印。`;

  return (
    <div
      id="architecture-spec-view"
      className={`w-full h-full flex flex-col p-4 sm:p-6 overflow-y-auto transition-colors ${
        isLight ? 'bg-stone-100 text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* 顶部标题与快速压测栏 */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-3xl border shadow-sm transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xs">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              无座餐饮SaaS系统架构与即用型AI工程提示词中心
            </h2>
            <p className="text-xs text-stone-500">
              端到端数字化状态机、多租户物理DDL、高并发容灾与KDS智能路由规范
            </p>
          </div>
        </div>

        {/* 流量模拟压测 */}
        <div
          className={`flex items-center gap-2 p-1.5 rounded-2xl border text-xs ${
            isLight ? 'bg-stone-50 border-stone-200' : 'bg-stone-950 border-stone-800'
          }`}
        >
          <span className="text-stone-500 pl-2 font-medium">瞬时高峰压力测试:</span>
          <button
            type="button"
            onClick={() => handleSimulate(3)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition"
          >
            +3单
          </button>
          <button
            type="button"
            onClick={() => handleSimulate(10)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-xs transition"
          >
            +10单并发
          </button>
        </div>
      </div>

      {simMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{simMsg}</span>
        </div>
      )}

      {/* 标签栏导航 */}
      <div
        className={`flex items-center gap-1.5 p-1 rounded-2xl border mb-6 overflow-x-auto shrink-0 text-xs ${
          isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
        }`}
      >
        {[
          { id: 'ARCHITECTURE', label: '系统全景架构 & 流程设计', icon: Layers },
          { id: 'DDL', label: 'MySQL 8.0 物理表结构 (DDL)', icon: Database },
          { id: 'API_WS', label: 'REST API & WebSocket 协议契约', icon: Network },
          { id: 'FSM', label: '双轨有限状态机 (FSM)', icon: Zap },
          { id: 'MASTER_PROMPT', label: '即用型 Master System Prompt', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 标签内容展示区 */}
      <div className="space-y-6">
        {/* 标签 1: 架构全景 */}
        {activeTab === 'ARCHITECTURE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`rounded-3xl p-5 border shadow-xs space-y-3 ${
                isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
              }`}
            >
              <div className="flex items-center gap-2 text-amber-600 font-black text-sm">
                <Layers className="w-4 h-4" />
                <span>1. 无桌台极简点餐与出餐闭环 (Core Workflow)</span>
              </div>
              <ul className="text-xs text-stone-600 space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>顾客端 (C端扫码H5)</strong>：顾客手机微信/支付宝/浏览器扫码进入H5，实时拉取云端动态菜单，完成树状规格定制后直接调用在线支付。
                </li>
                <li>
                  <strong>取餐码引擎 (Atomic Sequence)</strong>：支付成功Webhook回调瞬间，触发原子递增流水号（如 A001~A999），杜绝重单与跳号。
                </li>
                <li>
                  <strong>KDS智能分单路由</strong>：根据SKU的工位路由属性，毫秒级分发至水吧台、炸台、烤台等各分工位大屏。
                </li>
                <li>
                  <strong>Expo总控打包与叫号</strong>：各分工位触屏消单 (Bump)，全单各品项全部齐套后推送至Expo总控台，一键触发大屏翻牌与多语种TTS语音播报。
                </li>
              </ul>
            </div>

            <div
              className={`rounded-3xl p-5 border shadow-xs space-y-3 ${
                isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
              }`}
            >
              <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                <Server className="w-4 h-4" />
                <span>2. 高并发与多租户架构设计 (SaaS Topology)</span>
              </div>
              <ul className="text-xs text-stone-600 space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>多租户数据隔离</strong>：支持 `tenant_id` 逻辑行级隔离与物理分库分表，保证不同品牌连锁店数据安全独立。
                </li>
                <li>
                  <strong>全双工广播通信</strong>：基于 WebSocket 频道广播机制，实现 KDS 厨显、TV 大屏、吧台 POS 与手机 C 端的双向秒级状态同步。
                </li>
                <li>
                  <strong>离线容灾与热敏打印</strong>：支持本地 ESC/POS 和 TSPL 打印机指令集，断网排队本地缓存出票。
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 标签 2: 数据库 DDL */}
        {activeTab === 'DDL' && (
          <div
            className={`rounded-3xl p-5 border shadow-xs space-y-3 ${
              isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-stone-900">
                <Database className="w-4 h-4 text-amber-500" />
                <span>MySQL 8.0 核心表结构 DDL (支持多租户、规格加价、工位路由)</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(specData?.ddl || '', 'ddl')}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                {copiedKey === 'ddl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'ddl' ? '已复制' : '复制代码'}</span>
              </button>
            </div>

            <pre className="p-4 bg-stone-950 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto max-h-[500px]">
              {specData?.ddl || '-- 正在加载 DDL 架构结构定义...'}
            </pre>
          </div>
        )}

        {/* 标签 3: API & WS */}
        {activeTab === 'API_WS' && (
          <div className="space-y-4">
            <div
              className={`rounded-3xl p-5 border shadow-xs space-y-3 ${
                isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
              }`}
            >
              <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-500" />
                <span>RESTful API 核心接口契约</span>
              </h3>
              <div className="space-y-2">
                {specData?.apiContract?.map((api, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-stone-200 text-stone-800 font-mono font-bold text-[10px]">
                        {api.method}
                      </span>
                      <span className="font-mono font-bold text-stone-900">{api.path}</span>
                    </div>
                    <span className="text-stone-500">{api.desc}</span>
                  </div>
                )) || <div className="text-xs text-stone-400">加载 API 契约中...</div>}
              </div>
            </div>

            <div
              className={`rounded-3xl p-5 border shadow-xs space-y-3 ${
                isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
              }`}
            >
              <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>WebSocket 全双工事件 Topic 契约</span>
              </h3>
              <div className="space-y-2">
                {specData?.wsTopics?.map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs flex items-center justify-between"
                  >
                    <span className="font-mono font-bold text-amber-700">{topic.topic}</span>
                    <span className="text-stone-500">{topic.desc}</span>
                  </div>
                )) || <div className="text-xs text-stone-400">加载 WebSocket 契约中...</div>}
              </div>
            </div>
          </div>
        )}

        {/* 标签 4: 状态机 */}
        {activeTab === 'FSM' && (
          <div
            className={`rounded-3xl p-5 border shadow-xs space-y-4 ${
              isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
            }`}
          >
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>双轨状态机 (主订单流与工位单品流解耦)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-xs text-stone-900">主订单状态 (Order Level)</h4>
                <div className="space-y-1 text-xs text-stone-600 font-mono">
                  <div>1. CREATED (已生成未支付)</div>
                  <div>2. PENDING (已支付进入KDS制作队列)</div>
                  <div>3. MAKING (后厨分工位正在制作)</div>
                  <div>4. READY (全部品项齐套，Expo已叫号)</div>
                  <div>5. COMPLETED (吧台已扫码核销交付)</div>
                  <div>6. CANCELLED / REFUNDED (已取消/已退款)</div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-xs text-stone-900">工位单品状态 (Item Level)</h4>
                <div className="space-y-1 text-xs text-stone-600 font-mono">
                  <div>1. PENDING (待制作，等待厨师操作)</div>
                  <div>2. MAKING (厨师接单制作中)</div>
                  <div>3. DONE (工位消单完成，推至Expo打包台)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 标签 5: Master Prompt */}
        {activeTab === 'MASTER_PROMPT' && (
          <div
            className={`rounded-3xl p-5 border shadow-xs space-y-3 ${
              isLight ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-stone-900">
                <Terminal className="w-4 h-4 text-indigo-500" />
                <span>全栈工程级 Master System Prompt</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(masterPromptText, 'prompt')}
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                {copiedKey === 'prompt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'prompt' ? '已复制' : '复制Prompt'}</span>
              </button>
            </div>

            <pre className="p-4 bg-stone-950 text-amber-300 rounded-2xl font-mono text-xs overflow-x-auto max-h-[500px] whitespace-pre-wrap">
              {masterPromptText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
