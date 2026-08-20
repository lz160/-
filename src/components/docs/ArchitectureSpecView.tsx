import React, { useState, useEffect } from 'react';
import {
  Database,
  Code,
  Copy,
  Check,
  Cpu,
  Layers,
  Network,
  ShieldAlert,
  Sparkles,
  Zap,
  Terminal,
  FileText,
  Server,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ArchitectureSpecView: React.FC = () => {
  const { simulateTraffic } = useApp();
  const [activeTab, setActiveTab] = useState<'ARCHITECTURE' | 'DDL' | 'API_WS' | 'FSM' | 'MASTER_PROMPT'>('ARCHITECTURE');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [specData, setSpecData] = useState<{ ddl: string; apiContract: any[]; wsTopics: any[] } | null>(null);
  const [simCount, setSimCount] = useState(5);
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
  - C端顾客：Web端移动H5响应式快速扫码点餐（接入Stripe聚合先付与Webhook实时回调）。
  - B端KDS后厨端：Web/Android 平板自适应大屏看板（支持触屏消单 Bump 与同品项批处理聚类）。
  - B端叫号取餐屏：大字号动态翻牌、语音合成（TTS）播报广播。
  - 硬件对接：云打印机（ESC/POS、TSPL 标签纸协议）进行杯贴/小票即时打印。

3. Core Functional Modules & Business Rules
A. 菜单与深度规格定制引擎: 支持单选组、多选组（加料变价：最终价格 = SKU基准价 + ∑(选中加料项价格)）。
B. 极速交易与取餐码生成引擎: 仅支持先付模式（下单 -> Stripe支付 -> Webhook回调 -> 原子生成当日取餐流水号如 A001~A999）。
C. 智能KDS工作站路由与总控打包系统: 商品明细按站台属性自动拆分流转至水吧/炸台/煎台，分站单项消单，全单完成后汇总至Expo总控打包台并触发翻牌叫号及TTS语音播报。`;

  return (
    <div id="architecture-spec-view" className="w-full h-full flex flex-col bg-stone-950 text-stone-100 p-4 sm:p-6 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-stone-900 border border-stone-800 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-stone-950 flex items-center justify-center font-black shadow-lg">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-100">
              无座餐饮SaaS系统架构与即用型AI工程提示词中心
            </h2>
            <p className="text-xs text-stone-400">
              端到端数字化状态机、多租户物理DDL、高并发容灾与KDS智能路由规范
            </p>
          </div>
        </div>

        {/* Traffic Simulator Bar */}
        <div className="flex items-center gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
          <span className="text-xs text-stone-400 pl-2">瞬时高峰压力测试:</span>
          <button
            type="button"
            onClick={() => handleSimulate(3)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition"
          >
            +3单
          </button>
          <button
            type="button"
            onClick={() => handleSimulate(10)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition"
          >
            +10单爆单
          </button>
        </div>
      </div>

      {simMsg && (
        <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl animate-in fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {simMsg}
        </div>
      )}

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('ARCHITECTURE')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'ARCHITECTURE'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Network className="w-4 h-4" />
          系统架构拓扑与数据闭环
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DDL')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'DDL'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Database className="w-4 h-4" />
          MySQL 8.0 DDL 物理建表
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('API_WS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'API_WS'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          REST API 与 WebSocket 协议
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FSM')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'FSM'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          订单有限状态机 (FSM)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MASTER_PROMPT')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'MASTER_PROMPT'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          即用型 AI Master Prompt (一键复制)
        </button>
      </div>

      {/* Tab 1: Architecture Topology */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <Network className="w-5 h-5 text-amber-400" />
              无座轻餐饮 SaaS 端到端事件驱动架构模型
            </h3>

            {/* Architecture Node Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  01. C端触点与先付
                </div>
                <h4 className="font-bold text-sm text-stone-100">手机Web H5 / 扫码点餐</h4>
                <ul className="text-xs text-stone-400 space-y-1 list-disc list-inside">
                  <li>树状规格多层加料变价计算</li>
                  <li>动态SLA预估与排队杯数展示</li>
                  <li>Stripe 聚合支付安全先付扣款</li>
                </ul>
              </div>

              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  02. 交易与路由中枢
                </div>
                <h4 className="font-bold text-sm text-stone-100">Webhook 异步解耦 & 路由</h4>
                <ul className="text-xs text-stone-400 space-y-1 list-disc list-inside">
                  <li>Redis Lua 脚本原子生成当日取餐码 (A001)</li>
                  <li>SKU站台属性解析 (Station 1/2)</li>
                  <li>分拆 StationTask 写入任务队列</li>
                </ul>
              </div>

              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  03. 后厨协同中心
                </div>
                <h4 className="font-bold text-sm text-stone-100">分布式 KDS 制作与聚类</h4>
                <ul className="text-xs text-stone-400 space-y-1 list-disc list-inside">
                  <li>水吧 / 炸台 / 煎台独立制作消单 (Bump)</li>
                  <li>同品项智能聚类批量出餐 (Batch)</li>
                  <li>SLA 倒计时预警 (绿/黄/红高亮)</li>
                </ul>
              </div>

              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  04. 交付与外设联动
                </div>
                <h4 className="font-bold text-sm text-stone-100">Expo总控打包 & 叫号核销</h4>
                <ul className="text-xs text-stone-400 space-y-1 list-disc list-inside">
                  <li>整单齐套自动拉起总控屏</li>
                  <li>TV大屏动态翻牌 + TTS语音广播</li>
                  <li>云打印机即时打印 TSPL 杯贴</li>
                  <li>扫码枪秒级核销归档</li>
                </ul>
              </div>

            </div>

            {/* Comparison Table */}
            <div className="pt-4 border-t border-stone-800">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-3">
                业务流转对比：传统正餐 vs 无座轻餐饮SaaS
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-stone-300 border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800 bg-stone-950/60 text-stone-400">
                      <th className="py-2.5 px-3">业务维度</th>
                      <th className="py-2.5 px-3">传统正餐模式 (Heavy Seat-based)</th>
                      <th className="py-2.5 px-3 text-amber-400">无座茶饮/快餐模式 (Seatless Agile)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-200">空间与履约载体</td>
                      <td className="py-2.5 px-3 text-stone-400">强绑定物理桌号，管理开台/换桌/并台</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">彻底解耦桌台，基于每日动态自增流水码 (如 A001, B002)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-200">交易结算时机</td>
                      <td className="py-2.5 px-3 text-stone-400">就餐完毕后对账与结算 (后付模式)</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">在线预先聚合支付，支付成功方触发后厨工单 (先付模式)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-200">SKU定制复杂度</td>
                      <td className="py-2.5 px-3 text-stone-400">侧重大/中/小份规格及单一口味备注</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">树状多层级结构化规格 (冰度、糖度、多选加料加价、变价快照)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-200">后厨协作机制</td>
                      <td className="py-2.5 px-3 text-stone-400">整单按桌台依序出菜，总厨划单传菜</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">多工作站并行解耦 (水吧/炸台/煎台/Expo)，支持同品项批处理聚类</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-stone-200">交付通知机制</td>
                      <td className="py-2.5 px-3 text-stone-400">服务员依据桌号定向送餐至台位</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">叫号大屏翻牌高亮、TTS语音播报、扫码核销交付</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: MySQL 8.0 DDL */}
      {activeTab === 'DDL' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                生产级 MySQL 8.0 物理建表 DDL (多租户隔离与高性能索引优化)
              </h3>
              <p className="text-xs text-stone-400">包含租户隔离、树状加料快照、原子流水排队与KDS工单分发索引</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(specData?.ddl || '', 'ddl')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition"
            >
              {copiedKey === 'ddl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'ddl' ? '已复制建表脚本' : '一键复制 DDL'}</span>
            </button>
          </div>

          <pre className="p-4 bg-stone-950 rounded-2xl border border-stone-800 font-mono text-xs text-amber-300/90 overflow-x-auto max-h-[60vh] leading-relaxed">
            {specData?.ddl}
          </pre>
        </div>
      )}

      {/* Tab 3: API & WebSocket Specifications */}
      {activeTab === 'API_WS' && (
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              RESTful 核心交易与调度 API 接口契约
            </h3>
            <div className="divide-y divide-stone-800">
              {specData?.apiContract.map((api, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      api.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {api.method}
                    </span>
                    <span className="font-mono text-stone-200 font-semibold">{api.path}</span>
                  </div>
                  <span className="text-stone-400">{api.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              WebSocket 全双工事件 Topic 广播规范
            </h3>
            <div className="divide-y divide-stone-800">
              {specData?.wsTopics.map((ws, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {ws.topic}
                  </span>
                  <span className="text-stone-300">{ws.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: FSM Lifecycle */}
      {activeTab === 'FSM' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-5">
          <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            订单与制作工单有限状态机 (Finite State Machine)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            
            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 text-center space-y-1">
              <div className="text-xs font-bold text-stone-500">INIT</div>
              <div className="text-sm font-bold text-stone-300">UNPAID (未支付)</div>
              <p className="text-[11px] text-stone-500">C端创建预选单，锁定加料树总价，等待Stripe支付凭证</p>
            </div>

            <div className="bg-stone-950 p-3.5 rounded-2xl border border-amber-500/40 text-center space-y-1">
              <div className="text-xs font-bold text-amber-400">STAGE 1</div>
              <div className="text-sm font-bold text-amber-300">PENDING (待制作)</div>
              <p className="text-[11px] text-stone-400">Webhook支付回调成功，原子生成取餐码(A001)，拆单下发KDS</p>
            </div>

            <div className="bg-stone-950 p-3.5 rounded-2xl border border-blue-500/40 text-center space-y-1">
              <div className="text-xs font-bold text-blue-400">STAGE 2</div>
              <div className="text-sm font-bold text-blue-300">MAKING (制作中)</div>
              <p className="text-[11px] text-stone-400">水吧/炸台员工认领或开始制作，SLA工时计时器启动</p>
            </div>

            <div className="bg-stone-950 p-3.5 rounded-2xl border border-emerald-500/50 text-center space-y-1">
              <div className="text-xs font-bold text-emerald-400">STAGE 3</div>
              <div className="text-sm font-bold text-emerald-300">READY (请取餐)</div>
              <p className="text-[11px] text-stone-400">所有分站单品均消单(Bump)，总控打包齐套，触发叫号与TTS播报</p>
            </div>

            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-700 text-center space-y-1">
              <div className="text-xs font-bold text-stone-400">STAGE 4</div>
              <div className="text-sm font-bold text-stone-100">COMPLETED (已完成)</div>
              <p className="text-[11px] text-stone-500">顾客出示取餐码或扫码枪扫码核销，归档并统计工时SLA</p>
            </div>

          </div>
        </div>
      )}

      {/* Tab 5: Master Prompt */}
      {activeTab === 'MASTER_PROMPT' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                工业级无座餐饮SaaS系统 AI Master Prompt (即用型工程提示词)
              </h3>
              <p className="text-xs text-stone-400">
                可直接复制并输入至大语言模型中，生成完整的生产级后端、前端及硬件驱动代码
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(masterPromptText, 'prompt')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              {copiedKey === 'prompt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'prompt' ? '已复制提示词' : '一键复制 Master Prompt'}</span>
            </button>
          </div>

          <pre className="p-4 bg-stone-950 rounded-2xl border border-stone-800 font-mono text-xs text-stone-300 overflow-x-auto max-h-[60vh] leading-relaxed whitespace-pre-wrap">
            {masterPromptText}
          </pre>
        </div>
      )}

    </div>
  );
};
