import React, { useState, useMemo } from 'react';
import { ProductSKU, ModifierGroup, SelectedModifier } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Plus, Minus, Check, Sparkles } from 'lucide-react';

interface Props {
  sku: ProductSKU;
  modifierGroups: ModifierGroup[];
  onClose: () => void;
  onAddToCart: (item: {
    sku: ProductSKU;
    quantity: number;
    selectedModifiers: SelectedModifier[];
    unitPrice: number;
    notes?: string;
  }) => void;
}

/**
 * 商品规格与加料客制化弹窗
 * 支持单选（甜度、冰度、杯型）与多选（芝士奶盖、黑糖珍珠、椰果等）
 */
export const ProductModifierModal: React.FC<Props> = ({
  sku,
  modifierGroups,
  onClose,
  onAddToCart,
}) => {
  const { store, theme, t } = useApp();
  const isLight = theme === 'light';

  const relevantGroups = useMemo(() => {
    return (modifierGroups || []).filter((g) => sku?.modifierGroupIds?.includes(g.id));
  }, [sku, modifierGroups]);

  // 初始选项映射：groupId -> 选中的 itemIds 数组
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    relevantGroups.forEach((g) => {
      if (g.type === 'SINGLE') {
        const def = g.items.find((i) => i.isDefault) || g.items[0];
        if (def) initial[g.id] = [def.id];
      } else {
        initial[g.id] = [];
      }
    });
    return initial;
  });

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // 切换规格选项
  const handleToggle = (group: ModifierGroup, itemId: string) => {
    setSelections((prev) => {
      const current = prev[group.id] || [];
      if (group.type === 'SINGLE') {
        return { ...prev, [group.id]: [itemId] };
      } else {
        if (current.includes(itemId)) {
          return { ...prev, [group.id]: current.filter((id) => id !== itemId) };
        } else {
          if (group.maxSelections && current.length >= group.maxSelections) {
            return prev;
          }
          return { ...prev, [group.id]: [...current, itemId] };
        }
      }
    });
  };

  // 计算单价与选中配料列表
  const { unitPrice, selectedModifiersList } = useMemo(() => {
    let price = sku.basePrice;
    const modsList: SelectedModifier[] = [];

    relevantGroups.forEach((group) => {
      const selectedIds = selections[group.id] || [];
      group.items.forEach((item) => {
        if (selectedIds.includes(item.id)) {
          price += item.price;
          modsList.push({
            groupId: group.id,
            groupName: group.name,
            itemId: item.id,
            itemName: item.name,
            price: item.price,
          });
        }
      });
    });

    return { unitPrice: price, selectedModifiersList: modsList };
  }, [sku, relevantGroups, selections]);

  const handleConfirm = () => {
    onAddToCart({
      sku,
      quantity,
      selectedModifiers: selectedModifiersList,
      unitPrice,
      notes,
    });
    onClose();
  };

  return (
    <div
      id="product-modifier-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
    >
      <div
        className={`w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden transition-colors border ${
          isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-stone-900 border-stone-800 text-stone-100'
        }`}
      >
        {/* 顶部商品预览卡片 */}
        <div
          className={`relative p-5 pb-4 border-b flex items-start gap-4 ${
            isLight ? 'bg-stone-50 border-stone-200' : 'bg-stone-950/60 border-stone-800'
          }`}
        >
          <img
            src={sku.image}
            alt={sku.name}
            referrerPolicy="no-referrer"
            className="w-18 h-18 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-xs"
          />

          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-base font-bold text-stone-900">{sku.name}</h3>
            <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{sku.description}</p>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-xs text-amber-600 font-bold">{store.currency}</span>
              <span className="text-lg font-black text-amber-600">
                {unitPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 选项配置区 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {relevantGroups.map((group) => {
            const currentSelectedIds = selections[group.id] || [];
            return (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    {group.name}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {group.type === 'SINGLE'
                      ? '单选'
                      : `多选 (最多 ${group.maxSelections || '无限制'})`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.items.map((item) => {
                    const isSelected = currentSelectedIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggle(group, item.id)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-xs'
                            : isLight
                            ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                            : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-800'
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        {item.price > 0 && (
                          <span className="text-[11px] text-amber-600 shrink-0 ml-1 font-semibold">
                            +{store.currency}
                            {item.price}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 特殊要求备注 */}
          <div className="space-y-1.5 pt-2 border-t border-stone-200">
            <label className="text-xs font-bold text-stone-800">特殊要求备注</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如: 多放椰果、不要吸管、分装等"
              className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-amber-500 ${
                isLight
                  ? 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400'
                  : 'bg-stone-950 border-stone-800 text-stone-100 placeholder:text-stone-500'
              }`}
            />
          </div>
        </div>

        {/* 底部数量加减与加入购物车 */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-4 ${
            isLight ? 'bg-stone-50 border-stone-200' : 'bg-stone-950 border-stone-800'
          }`}
        >
          {/* 数量调节器 */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-30 flex items-center justify-center transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-sm text-stone-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* 确定加入购物车按钮 */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-md active:scale-98 transition flex items-center justify-between"
          >
            <span>{t('addToCart')}</span>
            <span>
              {store.currency} {(unitPrice * quantity).toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
