import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Globe,
  Store,
  Building2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Server,
  ArrowRight,
  Info,
  RefreshCw,
  Sliders,
  Laptop,
  Smartphone,
} from 'lucide-react';

export const DomainRouterManager: React.FC = () => {
  const {
    merchants,
    stores,
    currentStore,
    currentMerchant,
    setCurrentStore,
    updateMerchantAccount,
    updateStoreEntity,
    t,
  } = useApp();

  const [testDomainInput, setTestDomainInput] = useState('');
  const [resolveResult, setResolveResult] = useState<any>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  // Selected quick tester
  const handleTestDomain = async (domainToTest?: string) => {
    const domain = domainToTest !== undefined ? domainToTest : testDomainInput;
    if (!domain.trim()) return;

    setIsResolving(true);
    try {
      const res = await fetch(`/api/tenant/resolve?host=${encodeURIComponent(domain.trim())}`);
      const data = await res.json();
      setResolveResult(data);
    } catch (err: any) {
      setResolveResult({ error: err.message });
    } finally {
      setIsResolving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto p-6 bg-stone-100 text-stone-800 space-y-6">
      {/* 头部说明 */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-stone-900">多租户独立域名与子域名路由系统</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                品牌独立白标定制
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
              支持为每个合作商家（连锁品牌）及旗下分店绑定独立的公网域名或二级子域名。客户端打开不同域名时，系统自动化解析租户、锁定专属币种（EUR/CZK/HUF/PLN）、菜单与主题。
            </p>
          </div>
        </div>
      </div>

      {/* 域名在线实时模拟解析与测试 */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-sm text-stone-900">域名动态路由测试与仿真器</h3>
          </div>
          <span className="text-[11px] text-stone-400">检测当前请求 Host header 的解析归属</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={testDomainInput}
              onChange={(e) => setTestDomainInput(e.target.value)}
              placeholder="输入待测试域名，例如: bts-obchodna.danubefoods.sk 或 order.praguegourmet.cz"
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-mono text-stone-900 focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleTestDomain()}
            />
          </div>
          <button
            type="button"
            onClick={() => handleTestDomain()}
            disabled={isResolving}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs active:scale-98 transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResolving ? 'animate-spin' : ''}`} />
            <span>模拟域名解析</span>
          </button>
        </div>

        {/* 快捷点击测试预设 */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-stone-400 font-bold">快捷测试预设域名:</span>
          {(stores || [])
            .filter((s) => s.customDomain)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setTestDomainInput(s.customDomain!);
                  handleTestDomain(s.customDomain!);
                }}
                className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 border border-stone-200 text-[11px] font-mono font-bold transition flex items-center gap-1"
              >
                <span>{s.customDomain}</span>
                <span className="text-[9px] px-1 bg-stone-200 rounded text-stone-600">
                  {s.currency}
                </span>
              </button>
            ))}
          {(merchants || [])
            .filter((m) => m.customDomain)
            .map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setTestDomainInput(m.customDomain!);
                  handleTestDomain(m.customDomain!);
                }}
                className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-amber-50 hover:text-amber-700 border border-stone-200 text-[11px] font-mono font-bold transition flex items-center gap-1"
              >
                <span>{m.customDomain}</span>
                <span className="text-[9px] px-1 bg-amber-100 rounded text-amber-800">商家总控</span>
              </button>
            ))}
        </div>

        {/* 解析结果卡片 */}
        {resolveResult && (
          <div
            className={`p-4 rounded-2xl border ${
              resolveResult.matched
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-stone-50 border-stone-200 text-stone-800'
            } transition animate-fade-in`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {resolveResult.matched ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-xs">
                    {resolveResult.matched
                      ? `解析匹配成功：[${resolveResult.type === 'STORE' ? '门店专属域名' : '商家独立域名'}]`
                      : '未匹配到专属域名 (已回退至平台默认主控上下文)'}
                  </h4>
                  <p className="text-[11px] font-mono text-stone-500">
                    Host: {resolveResult.host}
                  </p>
                </div>
              </div>

              {resolveResult.store && (
                <button
                  type="button"
                  onClick={() => setCurrentStore(resolveResult.store)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
                >
                  <span>立即切换至该门店点餐</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {resolveResult.store && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-emerald-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px]">关联门店名称</span>
                  <strong className="text-stone-900">{resolveResult.store.storeName}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">结算货币体制</span>
                  <strong className="text-emerald-700 font-bold font-mono">
                    {resolveResult.store.currency} ({resolveResult.store.currencySymbol})
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">所属集团/商家</span>
                  <strong className="text-stone-900">
                    {resolveResult.merchant?.name || resolveResult.store.merchantName || '未分配'}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">门店营业状态</span>
                  <strong
                    className={
                      resolveResult.store.status === 'OPEN' ? 'text-emerald-600' : 'text-stone-500'
                    }
                  >
                    {resolveResult.store.status === 'OPEN' ? '● 正常营业中' : '已打烊'}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 域名配置总览矩阵 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 商家企业域名列表 */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-sm text-stone-900">商家集团总入口独立域名</h3>
              </div>
              <span className="text-xs text-stone-400">{merchants.length} 家品牌</span>
            </div>

            <div className="space-y-3">
              {merchants.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-400 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">{m.name}</h4>
                      <p className="text-[11px] text-stone-500">
                        负责人: {m.contactPerson} · {m.email}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">
                      {m.plan}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-stone-700 truncate">
                      <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-bold">{m.customDomain || '未绑定独立域名'}</span>
                    </div>

                    {m.customDomain && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`https://${m.customDomain}`)}
                          className="px-2 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold transition flex items-center gap-1"
                        >
                          {copiedDomain === `https://${m.customDomain}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>复制网址</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. 各门店点餐专属独立域名列表 */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-500" />
                <h3 className="font-black text-sm text-stone-900">门店点餐端专属域名列表</h3>
              </div>
              <span className="text-xs text-stone-400">{stores.length} 处分店</span>
            </div>

            <div className="space-y-3">
              {stores.map((s) => {
                const isActive = currentStore.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      isActive
                        ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200'
                        : 'bg-stone-50 border-stone-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-stone-900">{s.storeName}</h4>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-bold">
                              当前主控
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-1">{s.address}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-bold font-mono">
                        {s.currency} ({s.currencySymbol})
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-700 truncate">
                        <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-bold">{s.customDomain || '未设置专属域名'}</span>
                      </div>

                      {s.customDomain && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`https://${s.customDomain}`)}
                            className="px-2 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold transition flex items-center gap-1"
                          >
                            {copiedDomain === `https://${s.customDomain}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>复制</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DNS 域名解析与 Nginx / CDN 接入指引 */}
      <div className="p-6 rounded-3xl bg-stone-900 text-stone-100 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-5 h-5 text-amber-400" />
          <h3 className="font-black text-sm text-white">生产环境多租户域名 DNS 解析与配置规范</h3>
        </div>
        <p className="text-xs text-stone-400 mb-4 leading-relaxed">
          在 Cloudflare / 阿里云 / 腾讯云 等 DNS 控制台中，为商家或门店配置 CNAME 指向系统集群网关即可生效：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700 font-mono">
            <span className="text-[10px] text-amber-400 font-bold block mb-1">1. 通配符子域名 (推荐)</span>
            <div className="text-stone-300 text-[11px]">*.order-app.eu CNAME proxy.seatless.eu</div>
            <p className="text-[10px] text-stone-500 font-sans mt-1">自动支持所有门店分发二级子域名，无需逐个配置 DNS</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700 font-mono">
            <span className="text-[10px] text-emerald-400 font-bold block mb-1">2. 商家顶级/二级域名</span>
            <div className="text-stone-300 text-[11px]">order.danubefoods.sk CNAME cname.seatless.eu</div>
            <p className="text-[10px] text-stone-500 font-sans mt-1">支持商家品牌自有专属顶级域或二级域绑定</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700 font-mono">
            <span className="text-[10px] text-indigo-400 font-bold block mb-1">3. SSL 证书与反向代理</span>
            <div className="text-stone-300 text-[11px]">Let's Encrypt / SNI Proxy (Port 443/3000)</div>
            <p className="text-[10px] text-stone-500 font-sans mt-1">Nginx 自动捕获 Host 请求头转发给后端 resolve 中间件</p>
          </div>
        </div>
      </div>
    </div>
  );
};
