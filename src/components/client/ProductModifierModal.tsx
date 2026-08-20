import React, { useState, useMemo } from 'react';
import { ProductSKU, ModifierGroup, SelectedModifier } from '../../types';
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

export const ProductModifierModal: React.FC<Props> = ({ sku, modifierGroups, onClose, onAddToCart }) => {
  const relevantGroups = useMemo(() => {
    return modifierGroups.filter((g) => sku.modifierGroupIds.includes(g.id));
  }, [sku, modifierGroups]);

  // Initial selection map: groupId -> Set of selected itemIds
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

  // Toggle modifier item
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

  // Calculate Unit Price
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
    <div id="product-modifier-modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[90vh] bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl text-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        
        {/* Header with Product Preview */}
        <div className="relative p-5 pb-4 border-b border-stone-800/80 bg-stone-950/60 flex items-start gap-4">
          <img
            src={sku.image}
            alt={sku.name}
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-2xl object-cover border border-stone-800 shadow-md shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">
                {sku.category}
              </span>
              <span className="text-xs text-stone-400">
                出餐耗时 ~{sku.prepTimeSeconds}s
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-100 truncate">{sku.name}</h3>
            <p className="text-xs text-stone-400 line-clamp-2 mt-0.5">{sku.description}</p>
          </div>
          <button
            id="close-modifier-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modifier Tree Options */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {relevantGroups.map((group) => {
            const selectedIds = selections[group.id] || [];
            return (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                    {group.name}
                    {group.required && <span className="text-amber-500 text-xs">*必选</span>}
                  </span>
                  <span className="text-xs text-stone-400">
                    {group.type === 'SINGLE' ? '单选' : `多选 (最多${group.maxSelections}项)`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.items.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggle(group, item.id)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition duration-150 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-medium shadow-xs shadow-amber-500/10'
                            : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800 hover:border-stone-600'
                        }`}
                      >
                        <span className="truncate text-xs">{item.name}</span>
                        {item.price > 0 && (
                          <span className={`text-[11px] shrink-0 ml-1.5 ${isSelected ? 'text-amber-400 font-bold' : 'text-stone-400'}`}>
                            +{item.price}元
                          </span>
                        )}
                        {isSelected && group.type === 'SINGLE' && (
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Notes input */}
          <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
            <label className="text-xs font-semibold text-stone-300">特殊定制备注 (选填)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="如：分装打包、多给一根粗吸管、少放冰块..."
              className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/80"
            />
          </div>
        </div>

        {/* Bottom Pricing & Add to Cart Action */}
        <div className="p-5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-stone-400">单品小计</div>
            <div className="text-2xl font-black text-amber-400 flex items-baseline">
              <span className="text-sm mr-0.5">¥</span>
              {(unitPrice * quantity).toFixed(1)}
              {quantity > 1 && (
                <span className="text-xs text-stone-400 font-normal ml-2">
                  (¥{unitPrice}/份)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stepper */}
            <div className="flex items-center bg-stone-800 rounded-xl border border-stone-700/80 p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-300 hover:bg-stone-700 hover:text-white transition disabled:opacity-30"
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-stone-100">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-300 hover:bg-stone-700 hover:text-white transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Submit Button */}
            <button
              id="confirm-add-to-cart-btn"
              type="button"
              onClick={handleConfirm}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              加入待点单
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
