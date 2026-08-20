import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MenuCategory, ProductSKU } from '../../types';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Package,
  Layers,
  ArrowUpDown,
  Sparkles,
  Flame,
  CupSoda,
  Beef,
  Sandwich,
  Coffee,
  Leaf,
  Citrus,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const { categories, products, createCategory, updateCategory, deleteCategory, toggleSkuSoldOut, t, theme } = useApp();

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('CupSoda');
  const [newCatSortOrder, setNewCatSortOrder] = useState<number>(categories.length + 1);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(1);
  const [editIcon, setEditIcon] = useState('CupSoda');

  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(categories[0]?.name || '招牌鲜奶茶');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    try {
      await createCategory(newCatName.trim(), newCatIcon, Number(newCatSortOrder));
      setNewCatName('');
      setIsAddingCategory(false);
      showMsg(t('addCategory') + '成功！');
    } catch (err: any) {
      showMsg(err.message || '操作失败', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat: MenuCategory) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditSortOrder(cat.sortOrder);
    setEditIcon(cat.icon || 'CupSoda');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setIsSubmitting(true);
    try {
      await updateCategory(id, {
        name: editName.trim(),
        sortOrder: Number(editSortOrder),
        icon: editIcon,
      });
      setEditingCatId(null);
      showMsg('分类已更新');
    } catch (err: any) {
      showMsg(err.message || '更新失败', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: MenuCategory) => {
    const attachedCount = products.filter(p => p.category === cat.name).length;
    if (attachedCount > 0) {
      if (!confirm(`分类【${cat.name}】下还有 ${attachedCount} 个关联商品，确定删除分类吗？`)) {
        return;
      }
    } else {
      if (!confirm(`确定删除分类【${cat.name}】吗？`)) return;
    }

    try {
      await deleteCategory(cat.id);
      showMsg('分类已删除');
      if (selectedCategoryName === cat.name) {
        setSelectedCategoryName(categories[0]?.name || '');
      }
    } catch (err: any) {
      showMsg(err.message || '删除失败', 'error');
    }
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'Beef': return <Beef className="w-4 h-4 text-red-500" />;
      case 'Sandwich': return <Sandwich className="w-4 h-4 text-amber-500" />;
      case 'Coffee': return <Coffee className="w-4 h-4 text-amber-700" />;
      case 'Leaf': return <Leaf className="w-4 h-4 text-emerald-500" />;
      case 'Citrus': return <Citrus className="w-4 h-4 text-yellow-500" />;
      default: return <CupSoda className="w-4 h-4 text-sky-500" />;
    }
  };

  const currentCategoryProducts = products.filter(p => p.category === selectedCategoryName);

  return (
    <div className={`h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden ${theme === 'light' ? 'bg-stone-50 text-stone-800' : 'bg-stone-950 text-stone-100'}`}>
      
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xl border animate-bounce ${
          feedbackMsg.type === 'success' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600'
        }`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Left Column: Categories List & Manager */}
      <div className={`w-full md:w-80 shrink-0 flex flex-col rounded-2xl border p-4 shadow-xs ${
        theme === 'light' ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-sm">{t('categoryList')}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-semibold">
              {categories.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingCategory(!isAddingCategory)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addCategory')}</span>
          </button>
        </div>

        {/* Add Category Form */}
        {isAddingCategory && (
          <form onSubmit={handleAddCategory} className={`mt-3 p-3 rounded-xl border flex flex-col gap-2.5 ${
            theme === 'light' ? 'bg-amber-50/50 border-amber-200' : 'bg-stone-950 border-amber-500/30'
          }`}>
            <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{t('addCategory')}</div>
            <input
              type="text"
              placeholder="分类名称 (如 鲜果芝士茶)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 outline-hidden focus:border-amber-500"
              required
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="排序序号"
                value={newCatSortOrder}
                onChange={(e) => setNewCatSortOrder(Number(e.target.value))}
                className="w-24 text-xs px-2 py-1.5 rounded-lg border bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
              />
              <select
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 rounded-lg border bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700"
              >
                <option value="CupSoda">🥤 茶饮杯 (CupSoda)</option>
                <option value="Citrus">🍋 鲜果 (Citrus)</option>
                <option value="Leaf">🍃 原叶 (Leaf)</option>
                <option value="Coffee">☕ 咖啡 (Coffee)</option>
                <option value="Flame">🔥 炸鸡 (Flame)</option>
                <option value="Beef">🥩 汉堡 (Beef)</option>
                <option value="Sandwich">🥪 帕尼尼 (Sandwich)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1 text-xs rounded-lg bg-amber-500 text-stone-950 font-bold hover:bg-amber-600 transition"
              >
                {t('confirm')}
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1">
          {categories.map((cat) => {
            const isSelected = selectedCategoryName === cat.name;
            const isEditing = editingCatId === cat.id;
            const prodCount = products.filter(p => p.category === cat.name).length;

            if (isEditing) {
              return (
                <div key={cat.id} className="p-2.5 rounded-xl border border-amber-400 bg-amber-50 dark:bg-stone-800 flex flex-col gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xs font-bold px-2 py-1 rounded border bg-white dark:bg-stone-900"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(Number(e.target.value))}
                      className="w-16 text-xs px-2 py-1 rounded border bg-white dark:bg-stone-900"
                    />
                    <select
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="flex-1 text-xs px-2 py-1 rounded border bg-white dark:bg-stone-900"
                    >
                      <option value="CupSoda">🥤 茶饮</option>
                      <option value="Citrus">🍋 鲜果</option>
                      <option value="Leaf">🍃 原叶</option>
                      <option value="Coffee">☕ 咖啡</option>
                      <option value="Flame">🔥 炸鸡</option>
                      <option value="Beef">🥩 汉堡</option>
                      <option value="Sandwich">🥪 帕尼尼</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingCatId(null)}
                      className="p-1 text-stone-500 hover:text-stone-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cat.id)}
                      className="px-2 py-1 bg-amber-500 text-stone-950 font-bold rounded text-xs"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryName(cat.name)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 font-bold'
                    : theme === 'light'
                    ? 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-700'
                    : 'border-stone-800/80 bg-stone-950/40 hover:bg-stone-800/50 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-stone-400 text-[10px] w-4 text-center font-mono">
                    {cat.sortOrder}
                  </span>
                  {getCategoryIcon(cat.icon)}
                  <span className="text-xs">{cat.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-200/60 dark:bg-stone-800 text-stone-500 font-mono">
                    {prodCount}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(cat);
                    }}
                    className="p-1 text-stone-400 hover:text-amber-500 rounded opacity-0 group-hover:opacity-100 transition"
                    title={t('editCategory')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                    className="p-1 text-stone-400 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition"
                    title={t('deleteCategory')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Products inside Selected Category */}
      <div className={`flex-1 flex flex-col rounded-2xl border p-4 shadow-xs overflow-hidden ${
        theme === 'light' ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm sm:text-base">
                【{selectedCategoryName}】{t('productCatalog')}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold">
                {currentCategoryProducts.length} 款商品
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              店长直接管理各分类下单品的售价、工位分流、估清状态与标准用时
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {currentCategoryProducts.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-stone-400 gap-2">
              <Package className="w-8 h-8 stroke-1" />
              <p className="text-xs">该分类下暂无商品，可在右侧或商品管理中添加</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentCategoryProducts.map((sku) => {
                const isSoldOut = Boolean(sku.isSoldOut);

                return (
                  <div
                    key={sku.id}
                    className={`relative flex flex-col justify-between p-3 rounded-2xl border transition ${
                      isSoldOut
                        ? 'opacity-60 bg-stone-100 dark:bg-stone-950/60 border-dashed border-stone-300 dark:border-stone-800'
                        : theme === 'light'
                        ? 'bg-stone-50/70 border-stone-200 hover:border-amber-400'
                        : 'bg-stone-950/60 border-stone-800 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={sku.image}
                        alt={sku.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xs truncate" title={sku.name}>
                            {sku.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                          {sku.description || '无特殊描述'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                            ¥{sku.basePrice}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-500">
                            {sku.targetStationId === 'station_bar' ? '水吧台' : sku.targetStationId === 'station_fryer' ? '炸台' : '烤台'}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {sku.prepTimeSeconds}s
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Status Switch */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-200/80 dark:border-stone-800/80 text-xs">
                      <span className="text-[11px] text-stone-500 font-medium">
                        {isSoldOut ? '❌ 已估清售罄' : '✅ 正常在售'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSkuSoldOut(sku.id, !isSoldOut)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          isSoldOut
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                        }`}
                      >
                        {isSoldOut ? '恢复供应' : '快速估清'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
