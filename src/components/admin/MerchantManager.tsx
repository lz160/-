import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MerchantAccount } from '../../types';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Store,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  ShieldCheck,
  Search,
  X,
  ExternalLink,
  Globe,
} from 'lucide-react';

export const MerchantManager: React.FC = () => {
  const {
    merchants,
    stores,
    createMerchantAccount,
    updateMerchantAccount,
    deleteMerchantAccount,
    assignStoreToMerchant,
    formatPrice,
    hasPermission,
    theme,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantAccount | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    plan: 'STANDARD' as 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE',
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'EXPIRED',
    customDomain: '',
    notes: '',
    assignedStoreIds: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageMerchants = hasPermission('perm_merchant_manage');

  const filteredMerchants = merchants.filter((m) => {
    const matchSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.customDomain && m.customDomain.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  const openCreateModal = () => {
    setEditingMerchant(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      plan: 'STANDARD',
      status: 'ACTIVE',
      customDomain: '',
      notes: '',
      assignedStoreIds: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (merchant: MerchantAccount) => {
    setEditingMerchant(merchant);
    setFormData({
      name: merchant.name,
      contactPerson: merchant.contactPerson,
      email: merchant.email,
      phone: merchant.phone || '',
      plan: merchant.plan,
      status: merchant.status,
      customDomain: merchant.customDomain || '',
      notes: merchant.notes || '',
      assignedStoreIds: [...merchant.assignedStoreIds],
    });
    setIsModalOpen(true);
  };

  const handleToggleStoreAssignment = (storeId: string) => {
    setFormData((prev) => {
      const exists = prev.assignedStoreIds.includes(storeId);
      if (exists) {
        return { ...prev, assignedStoreIds: prev.assignedStoreIds.filter((id) => id !== storeId) };
      } else {
        return { ...prev, assignedStoreIds: [...prev.assignedStoreIds, storeId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contactPerson.trim() || !formData.email.trim()) {
      alert('请填写完整商家名称、联系人与登录邮箱');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMerchant) {
        await updateMerchantAccount(editingMerchant.id, formData);
      } else {
        await createMerchantAccount(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除商家账户【${name}】吗？此操作不可逆！`)) return;
    try {
      await deleteMerchantAccount(id);
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden select-none">
      {/* 顶部控制栏 */}
      <div className="p-4 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-stone-900">{t('merchantAccounts')}</h2>
            <p className="text-[11px] text-stone-400">
              SaaS服务商超级管理员专属：创建商家账户、分配门店并管理商家订阅与权限
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
              placeholder="搜索商家名称、联系人..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          {canManageMerchants && (
            <button
              type="button"
              onClick={openCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs active:scale-98 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createMerchant')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 商家卡片列表 */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMerchants.map((merchant) => {
          const assignedStores = stores.filter((s) => merchant.assignedStoreIds.includes(s.id));
          return (
            <div
              key={merchant.id}
              className="p-5 rounded-3xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* 商家头部 */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-stone-900">{merchant.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          merchant.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {merchant.status === 'ACTIVE' ? t('active') : t('suspended')}
                      </span>
                    </div>
                    <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                      {merchant.plan === 'ENTERPRISE'
                        ? '旗舰企业版'
                        : merchant.plan === 'PROFESSIONAL'
                        ? '专业连锁版'
                        : '标准单店版'}
                    </span>
                  </div>

                  {canManageMerchants && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(merchant)}
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
                        title="编辑商家"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(merchant.id, merchant.name)}
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 flex items-center justify-center transition"
                        title="删除商家"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 商家联系与域名信息 */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 space-y-1.5 text-xs text-stone-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>联系人: <strong className="text-stone-800">{merchant.contactPerson}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>邮箱: {merchant.email}</span>
                  </div>
                  {merchant.customDomain && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50/70 px-2 py-1 rounded-lg border border-amber-100">
                      <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-mono text-[11px] truncate flex-1">{merchant.customDomain}</span>
                      <span className="text-[9px] px-1 bg-amber-200/80 rounded font-bold">前端独立域名</span>
                    </div>
                  )}
                  {merchant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>电话: {merchant.phone}</span>
                    </div>
                  )}
                </div>

                {/* 分配的门店列表 */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('assignedStores')} ({assignedStores.length})</span>
                    </span>
                  </div>

                  {assignedStores.length === 0 ? (
                    <p className="text-[11px] text-stone-400 italic bg-stone-50 p-2 rounded-xl">
                      暂无分配店铺，请在编辑中分配
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedStores.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-1 bg-stone-100 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-800 flex items-center gap-1"
                        >
                          <span>{s.storeName}</span>
                          <span className="text-[9px] px-1 rounded bg-stone-200 text-stone-600">
                            {s.currency}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 商家底部数据 */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-stone-400">
                  创建于: {new Date(merchant.createdAt).toLocaleDateString()}
                </span>
                <span className="font-bold text-emerald-600">
                  营业额: {formatPrice(merchant.totalRevenue || (merchant as any).calculatedRevenue || 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 创建 / 编辑商家模态框 */}
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
              {editingMerchant ? t('editMerchant') : t('createMerchant')}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              设置商家账户名称、管理员登录信息及关联的欧洲各国门店
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">商家名称 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如: 欧洲轻饮餐饮集团"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">主要负责人姓名 *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="例如: 王浩 (总负责人)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">联系/登录邮箱 *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="merchant@seatless.eu"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">联系电话</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+421 905 123 456"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">SaaS 订阅版本</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                  >
                    <option value="STANDARD">标准单店版</option>
                    <option value="PROFESSIONAL">专业连锁版</option>
                    <option value="ENTERPRISE">旗舰企业版</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">账户状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                  >
                    <option value="ACTIVE">正常运营 (ACTIVE)</option>
                    <option value="SUSPENDED">暂停服务 (SUSPENDED)</option>
                    <option value="EXPIRED">订阅已到期 (EXPIRED)</option>
                  </select>
                </div>
              </div>

              {/* 商家前端独立域名绑定 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    <span>商家前端专属独立域名 (White-Label Domain)</span>
                  </label>
                  <span className="text-[10px] text-stone-400">支持独立二级域名或自有主域名</span>
                </div>
                <input
                  type="text"
                  value={formData.customDomain}
                  onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                  placeholder="例如: order.danubefoods.sk 或 vienna-tea.seatless.eu"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900 font-mono text-xs"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  当客户/员工访问此域名时，系统将自动识别商家身份并呈现该商家定制的主题与名下门店矩阵。
                </p>
              </div>

              {/* 分配门店勾选 */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5">
                  分配归属店铺 (多选)
                </label>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 max-h-40 overflow-y-auto">
                  {stores.length === 0 ? (
                    <p className="text-stone-400">暂无可分配的店铺，请先创建店铺</p>
                  ) : (
                    stores.map((s) => {
                      const isChecked = formData.assignedStoreIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 hover:border-amber-400 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleStoreAssignment(s.id)}
                              className="rounded text-amber-500 focus:ring-amber-400"
                            />
                            <span className="font-bold text-stone-900">{s.storeName}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                            {s.currency} ({s.currencySymbol})
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">备注说明</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="如：布拉迪斯拉发直营旗舰店管理方..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 text-stone-900"
                />
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
