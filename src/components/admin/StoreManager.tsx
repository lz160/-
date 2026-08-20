import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StoreEntity, CurrencyCode } from '../../types';
import { SUPPORTED_CURRENCIES } from '../../data/currencies';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  Clock,
  Phone,
  Coins,
  Search,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
  Globe,
} from 'lucide-react';

export const StoreManager: React.FC = () => {
  const {
    stores,
    merchants,
    currentStore,
    setCurrentStore,
    createStoreEntity,
    updateStoreEntity,
    assignStoreToMerchant,
    formatPrice,
    hasPermission,
    currentStaffUser,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreEntity | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    storeName: '',
    currency: 'EUR' as CurrencyCode,
    address: '',
    phone: '',
    operatingHours: '09:00 - 22:30',
    status: 'OPEN' as 'OPEN' | 'CLOSED' | 'MAINTENANCE',
    merchantId: '',
    customDomain: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current staff can create stores (Only SUPER_ADMIN can create, Merchant CANNOT)
  const canCreateStore = hasPermission('perm_store_create');
  const canManageStore = hasPermission('perm_store_manage');

  const filteredStores = stores.filter((s) => {
    const matchSearch =
      !searchQuery ||
      s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.merchantName && s.merchantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customDomain && s.customDomain.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  const openCreateModal = () => {
    setEditingStore(null);
    setFormData({
      storeName: '',
      currency: 'EUR',
      address: '',
      phone: '',
      operatingHours: '09:00 - 22:30',
      status: 'OPEN',
      merchantId: merchants[0]?.id || '',
      customDomain: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (store: StoreEntity) => {
    setEditingStore(store);
    setFormData({
      storeName: store.storeName,
      currency: store.currency,
      address: store.address,
      phone: store.phone || '',
      operatingHours: store.operatingHours || '09:00 - 22:30',
      status: store.status,
      merchantId: store.merchantId || '',
      customDomain: store.customDomain || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storeName.trim() || !formData.address.trim()) {
      alert('请填写店铺名称与物理地址');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStore) {
        await updateStoreEntity(editingStore.id, formData);
      } else {
        await createStoreEntity(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden select-none">
      {/* 顶部控制栏 */}
      <div className="p-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-stone-900">{t('storeManagement')}</h2>
            <p className="text-[11px] text-stone-400">
              欧洲多国门店架构管理：创建门店实体、绑定本国货币 (EUR / CZK / HUF / PLN) 并分配给所属商家
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索店铺名称、国家地址..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          {canCreateStore ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs active:scale-98 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createStore')}</span>
            </button>
          ) : (
            <div className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>商家角色仅可管理已有店铺，无权新建门店</span>
            </div>
          )}
        </div>
      </div>

      {/* 店铺网格列表 */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStores.map((store) => {
          const currInfo = SUPPORTED_CURRENCIES[store.currency] || SUPPORTED_CURRENCIES.EUR;
          const isCurrentlyActive = currentStore.id === store.id;

          return (
            <div
              key={store.id}
              className={`p-5 rounded-3xl bg-white border transition flex flex-col justify-between ${
                isCurrentlyActive
                  ? 'border-amber-500 shadow-md ring-2 ring-amber-400/20'
                  : 'border-stone-200 hover:border-stone-300 hover:shadow-xs'
              }`}
            >
              <div>
                {/* 门店头部 */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-stone-900">{store.storeName}</h3>
                      {isCurrentlyActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          当前激活
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 flex items-center gap-1">
                        <span>{currInfo.flag}</span>
                        <span>{currInfo.name}</span>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          store.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {store.status === 'OPEN' ? '正常营业' : '已打烊'}
                      </span>
                    </div>
                  </div>

                  {canManageStore && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(store)}
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
                        title="编辑店铺"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 归属商家 */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1.5 text-xs text-stone-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      归属商家: <strong className="text-stone-900">{store.merchantName || '未分配商家'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span className="line-clamp-1">{store.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>营业时间: {store.operatingHours}</span>
                  </div>
                  {store.customDomain && (
                    <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50/70 px-2 py-1 rounded-lg border border-indigo-100">
                      <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-mono text-[11px] truncate flex-1">{store.customDomain}</span>
                      <span className="text-[9px] px-1 bg-indigo-200/80 rounded font-bold">门店点餐域名</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>服务电话: {store.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 底部操作与激活 */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-stone-400">
                  {store.currencySymbol} 结算机制
                </span>

                {!isCurrentlyActive ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStore(store)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-500 hover:text-stone-950 text-stone-700 text-xs font-bold transition"
                  >
                    切换为此店上下文
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>当前主控门店</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 创建 / 编辑店铺模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-stone-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-stone-900 mb-1">
              {editingStore ? t('editStore') : t('createStore')}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              设置门店名称、物理地址、所属国家法定货币及分配商家
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">店铺名称 *</label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="例如: 布拉迪斯拉发老城总店"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                />
              </div>

              {/* 货币选择 (EUR / CZK / HUF / PLN) */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  门店结算币种 * (系统支持欧洲主要币种)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => {
                    const curr = SUPPORTED_CURRENCIES[code];
                    const isSelected = formData.currency === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setFormData({ ...formData, currency: code })}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/20'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{curr.flag}</span>
                          <div>
                            <div className="font-bold text-xs">{curr.code} ({curr.symbol})</div>
                            <div className="text-[10px] text-stone-400">{curr.nativeName}</div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 分配归属商家 */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  分配给所属商家账户 (Vendor权限)
                </label>
                <select
                  value={formData.merchantId}
                  onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                >
                  <option value="">暂不分配 (未分配商家)</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">店铺物理地址 *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="例如: Hlavné námestie 12, 811 01 Bratislava, Slovakia"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                />
              </div>

              {/* 门店独立专属域名 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    <span>门店点餐独立专属域名 (Custom Domain / Host)</span>
                  </label>
                  <span className="text-[10px] text-stone-400">用于客户直达该门店</span>
                </div>
                <input
                  type="text"
                  value={formData.customDomain}
                  onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                  placeholder="例如: bts-obchodna.danubefoods.sk"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900 font-mono text-xs"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  顾客在浏览器通过该域名扫码或点餐时，系统将直接锁定本门店菜单与币种，无需手动选择。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">营业时间</label>
                  <input
                    type="text"
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                    placeholder="09:00 - 22:30"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">服务电话</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+421 2 5443 1234"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">营业状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                >
                  <option value="OPEN">正常营业 (OPEN)</option>
                  <option value="CLOSED">暂停打烊 (CLOSED)</option>
                  <option value="MAINTENANCE">装修维护 (MAINTENANCE)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-xs active:scale-98 transition"
                >
                  {isSubmitting ? '保存中...' : '确认保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
