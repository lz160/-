import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductSKU } from '../../types';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  Check,
  X,
  CupSoda,
  Flame,
  Beef,
  AlertCircle,
  Filter,
} from 'lucide-react';

export const ProductManager: React.FC = () => {
  const { categories, products, createProduct, updateProduct, deleteProduct, toggleSkuSoldOut, t, theme } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSKU | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    category: categories[0]?.name || '招牌鲜奶茶',
    basePrice: 18,
    targetStationId: 'station_bar',
    prepTimeSeconds: 45,
    image: '',
    description: '',
    isRecommended: false,
  });

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: categories[0]?.name || '招牌鲜奶茶',
      basePrice: 18,
      targetStationId: 'station_bar',
      prepTimeSeconds: 45,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
      description: '',
      isRecommended: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sku: ProductSKU) => {
    setEditingProduct(sku);
    setFormData({
      name: sku.name,
      category: sku.category,
      basePrice: sku.basePrice,
      targetStationId: sku.targetStationId,
      prepTimeSeconds: sku.prepTimeSeconds,
      image: sku.image,
      description: sku.description || '',
      isRecommended: Boolean(sku.isRecommended),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.basePrice <= 0) return;

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        showToast('商品信息更新成功');
      } else {
        await createProduct(formData);
        showToast('新增商品 SKU 成功');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || '保存失败', 'error');
    }
  };

  const handleDelete = async (sku: ProductSKU) => {
    if (!confirm(`确定下架删除商品【${sku.name}】吗？`)) return;
    try {
      await deleteProduct(sku.id);
      showToast('商品已删除');
    } catch (err: any) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  const filteredList = products.filter((p) => {
    const matchCat = filterCategory === 'ALL' || p.category === filterCategory;
    const matchQuery =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className={`h-full flex flex-col p-4 overflow-hidden ${theme === 'light' ? 'bg-stone-50 text-stone-800' : 'bg-stone-950 text-stone-100'}`}>
      
      {/* Toast Alert */}
      {feedback && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xl border animate-bounce ${
          feedback.type === 'success' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Header Controls */}
      <div className={`p-4 rounded-2xl border mb-4 flex flex-wrap items-center justify-between gap-3 ${
        theme === 'light' ? 'bg-white border-stone-200 shadow-xs' : 'bg-stone-900 border-stone-800'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700 w-56 sm:w-72 outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700 font-medium"
            >
              <option value="ALL">全部分类 ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({products.filter((p) => p.category === c.name).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addProduct')}</span>
        </button>
      </div>

      {/* Product List Table / Grid */}
      <div className={`flex-1 rounded-2xl border overflow-hidden flex flex-col ${
        theme === 'light' ? 'bg-white border-stone-200 shadow-xs' : 'bg-stone-900 border-stone-800'
      }`}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className={`border-b sticky top-0 z-10 ${
              theme === 'light' ? 'bg-stone-100/80 border-stone-200 text-stone-600' : 'bg-stone-950 border-stone-800 text-stone-400'
            }`}>
              <tr>
                <th className="px-4 py-3">商品 / SKU</th>
                <th className="px-4 py-3">所属分类</th>
                <th className="px-4 py-3">售价</th>
                <th className="px-4 py-3">出餐工位</th>
                <th className="px-4 py-3">制作标时</th>
                <th className="px-4 py-3">估清状态</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {filteredList.map((sku) => {
                const isSoldOut = Boolean(sku.isSoldOut);
                return (
                  <tr
                    key={sku.id}
                    className={`transition hover:bg-amber-50/40 dark:hover:bg-stone-800/40 ${
                      isSoldOut ? 'opacity-60 bg-stone-50 dark:bg-stone-950/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={sku.image}
                          alt={sku.name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 dark:border-stone-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{sku.name}</span>
                            {sku.isRecommended && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                                招牌推荐
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {sku.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium">
                      <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {sku.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400 text-sm">
                      ¥{sku.basePrice.toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800">
                        {sku.targetStationId === 'station_bar' ? '水吧制作台' : sku.targetStationId === 'station_fryer' ? '炸台小食区' : '汉堡烤台'}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-stone-500">
                      {sku.prepTimeSeconds}s
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSkuSoldOut(sku.id, !isSoldOut)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition ${
                          isSoldOut
                            ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20'
                        }`}
                      >
                        {isSoldOut ? '❌ 已估清 (点击上架)' : '✅ 在售供应中'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sku)}
                          className="p-1.5 text-stone-500 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition"
                          title="编辑商品"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sku)}
                          className="p-1.5 text-stone-500 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition"
                          title="删除单品"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${
            theme === 'light' ? 'bg-white border-stone-200 text-stone-800' : 'bg-stone-900 border-stone-800 text-stone-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-sm sm:text-base">
                {editingProduct ? t('editProduct') : t('addProduct')}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">商品名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">所属分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">{t('price')} (元)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700 font-bold text-amber-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">{t('targetStation')}</label>
                  <select
                    value={formData.targetStationId}
                    onChange={(e) => setFormData({ ...formData, targetStationId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700"
                  >
                    <option value="station_bar">水吧茶饮台 (station_bar)</option>
                    <option value="station_fryer">炸台小食区 (station_fryer)</option>
                    <option value="station_grill">铁板汉堡烤台 (station_grill)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">{t('prepTime')}</label>
                  <input
                    type="number"
                    value={formData.prepTimeSeconds}
                    onChange={(e) => setFormData({ ...formData, prepTimeSeconds: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">图片 URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">单品卖点简介</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRecommendedCheckbox"
                  checked={formData.isRecommended}
                  onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <label htmlFor="isRecommendedCheckbox" className="text-xs font-medium cursor-pointer">
                  设为招牌必点推荐单品 (高亮展示)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold transition shadow-xs"
                >
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
