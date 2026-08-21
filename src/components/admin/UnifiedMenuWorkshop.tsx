import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductSKU, MenuCategory, RecipeBOMItem, InventoryItem } from '../../types';
import {
  FolderTree,
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  CupSoda,
  Flame,
  Beef,
  Coffee,
  Leaf,
  Layers,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Percent,
  Calculator,
  ArrowRight,
  Store,
  ChefHat,
  Clock,
  Coins,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  Info
} from 'lucide-react';

const PRESET_ICONS = [
  { name: 'CupSoda', icon: CupSoda, label: '茶饮水吧' },
  { name: 'Beef', icon: Beef, label: '汉堡肉类' },
  { name: 'Flame', icon: Flame, label: '炸物热食' },
  { name: 'Coffee', icon: Coffee, label: '咖啡烘焙' },
  { name: 'Leaf', icon: Leaf, label: '轻食原叶' },
];

const PRESET_IMAGES = [
  { label: '茉莉奶茶', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80' },
  { label: '珍珠鲜奶', url: 'https://images.unsplash.com/photo-1558857563-b37cf0e0d5aa?w=500&auto=format&fit=crop&q=80' },
  { label: '手打汉堡', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80' },
  { label: '香脆炸鸡', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80' },
  { label: '抹茶冰沙', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80' },
  { label: '鲜果气泡', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80' },
];

export const UnifiedMenuWorkshop: React.FC = () => {
  const {
    currentStore,
    stores,
    switchActiveStore,
    categories = [],
    products = [],
    inventoryItems = [],
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleSkuSoldOut,
    formatPrice,
    t,
    theme
  } = useApp();

  // Active Tab: MENU_CATALOG (分类与SKU) vs INGREDIENT_STOCK (原料库与单价)
  const [activeTab, setActiveTab] = useState<'MENU_CATALOG' | 'INGREDIENTS'>('MENU_CATALOG');

  // Filter & Search states
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'PRICE_DESC' | 'MARGIN_DESC' | 'PREP_TIME'>('DEFAULT');

  // Category Edit / Create Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catIconInput, setCatIconInput] = useState('CupSoda');
  const [catSortOrderInput, setCatSortOrderInput] = useState(1);

  // Product SKU & BOM Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSKU | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'BASIC' | 'BOM'>('BASIC');

  // Product Form Fields
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pPrice, setPPrice] = useState<number>(5.8);
  const [pStation, setPStation] = useState<'station_bar' | 'station_fryer' | 'station_grill' | 'station_bakery'>('station_bar');
  const [pPrepTime, setPPrepTime] = useState<number>(45);
  const [pImage, setPImage] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pRecommended, setPRecommended] = useState(false);
  const [pTags, setPTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Recipe BOM rows in form
  const [formBOM, setFormBOM] = useState<RecipeBOMItem[]>([]);
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState<string>('');

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filter products by current store, category, and station
  const storeProducts = useMemo(() => {
    return (products || []).filter(p => !p.storeId || p.storeId === currentStore?.id);
  }, [products, currentStore?.id]);

  const storeCategories = useMemo(() => {
    return (categories || []).filter(c => !c.storeId || c.storeId === currentStore?.id);
  }, [categories, currentStore?.id]);

  const storeIngredients = useMemo(() => {
    return (inventoryItems || []).filter(i => !i.storeId || i.storeId === currentStore?.id);
  }, [inventoryItems, currentStore?.id]);

  // Filtered & Sorted products list
  const filteredProducts = useMemo(() => {
    let list = (storeProducts || []).filter(p => {
      const matchCat = selectedCategoryName === 'ALL' || p.category === selectedCategoryName;
      const matchStation = stationFilter === 'ALL' || p.targetStationId === stationFilter;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStation && matchSearch;
    });

    if (sortBy === 'PRICE_DESC') {
      list.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'MARGIN_DESC') {
      list.sort((a, b) => (b.grossMargin || 0) - (a.grossMargin || 0));
    } else if (sortBy === 'PREP_TIME') {
      list.sort((a, b) => a.prepTimeSeconds - b.prepTimeSeconds);
    }

    return list;
  }, [storeProducts, selectedCategoryName, stationFilter, searchQuery, sortBy]);

  // Open Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setPName('');
    setPCategory(storeCategories[0]?.name || '招牌鲜奶茶');
    setPPrice(5.8);
    setPStation('station_bar');
    setPPrepTime(45);
    setPImage('https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80');
    setPDescription('');
    setPRecommended(false);
    setPTags(['手作鲜萃', '0反式脂肪']);
    setFormBOM([]);
    setModalActiveTab('BASIC');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: ProductSKU) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPCategory(prod.category);
    setPPrice(prod.basePrice);
    setPStation(prod.targetStationId as any);
    setPPrepTime(prod.prepTimeSeconds);
    setPImage(prod.image || '');
    setPDescription(prod.description || '');
    setPRecommended(Boolean(prod.isRecommended));
    setPTags(prod.tags || []);
    setFormBOM(prod.recipeBOM ? [...prod.recipeBOM] : []);
    setModalActiveTab('BASIC');
    setIsProductModalOpen(true);
  };

  // Add ingredient to BOM
  const handleAddIngredientToBOM = () => {
    if (!selectedIngredientToAdd) return;
    const invItem = storeIngredients.find(i => i.id === selectedIngredientToAdd);
    if (!invItem) return;

    if (formBOM.some(b => b.inventoryItemId === invItem.id)) {
      showToast('该原料已在配方列表中', 'error');
      return;
    }

    const defaultQty = invItem.unit === 'kg' ? 0.02 : invItem.unit === 'L' ? 0.2 : 1;
    const newItem: RecipeBOMItem = {
      inventoryItemId: invItem.id,
      inventoryItemName: invItem.name,
      quantity: defaultQty,
      unit: invItem.unit,
      unitCost: invItem.costPerUnit,
    };

    setFormBOM([...formBOM, newItem]);
    setSelectedIngredientToAdd('');
  };

  const handleUpdateBOMQuantity = (index: number, quantity: number) => {
    const next = [...formBOM];
    next[index].quantity = Math.max(0.001, quantity);
    setFormBOM(next);
  };

  const handleRemoveBOMItem = (index: number) => {
    setFormBOM(formBOM.filter((_, i) => i !== index));
  };

  // Live calculate BOM stats in modal
  const calculatedBOMCost = useMemo(() => {
    return formBOM.reduce((sum, item) => {
      const unitCost = item.unitCost || (storeIngredients.find(i => i.id === item.inventoryItemId)?.costPerUnit || 0);
      return sum + item.quantity * unitCost;
    }, 0);
  }, [formBOM, storeIngredients]);

  const calculatedGrossMargin = useMemo(() => {
    if (pPrice <= 0) return 0;
    const margin = ((pPrice - calculatedBOMCost) / pPrice) * 100;
    return Number(margin.toFixed(1));
  }, [pPrice, calculatedBOMCost]);

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) {
      showToast('请输入菜品名称', 'error');
      return;
    }
    if (!pCategory) {
      showToast('请选择所属分类', 'error');
      return;
    }

    try {
      const payload: Partial<ProductSKU> = {
        storeId: currentStore.id,
        name: pName.trim(),
        category: pCategory,
        basePrice: Number(pPrice),
        targetStationId: pStation,
        prepTimeSeconds: Number(pPrepTime),
        image: pImage,
        description: pDescription.trim(),
        isRecommended: pRecommended,
        tags: pTags,
        recipeBOM: formBOM.map(b => ({
          ...b,
          unitCost: storeIngredients.find(i => i.id === b.inventoryItemId)?.costPerUnit || b.unitCost || 0,
        })),
        estimatedCost: Number(calculatedBOMCost.toFixed(3)),
        grossMargin: calculatedGrossMargin,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        showToast(`已成功更新菜品 "${pName}"`);
      } else {
        await createProduct(payload);
        showToast(`已成功创建菜品 "${pName}"`);
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prod: ProductSKU) => {
    if (!window.confirm(`确定要彻底删除菜品 "${prod.name}" 吗？`)) return;
    try {
      await deleteProduct(prod.id);
      showToast(`已删除菜品 "${prod.name}"`);
    } catch (err: any) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  // Category Modal Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatNameInput('');
    setCatIconInput('CupSoda');
    setCatSortOrderInput(storeCategories.length + 1);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setCatIconInput(cat.icon || 'CupSoda');
    setCatSortOrderInput(cat.sortOrder);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: catNameInput.trim(),
          icon: catIconInput,
          sortOrder: Number(catSortOrderInput),
          storeId: currentStore.id,
        });
        showToast(`已更新分类 "${catNameInput}"`);
      } else {
        await createCategory(catNameInput.trim(), catIconInput, Number(catSortOrderInput), currentStore.id);
        showToast(`已创建分类 "${catNameInput}"`);
      }
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  const handleDeleteCategory = async (cat: MenuCategory) => {
    const hasProducts = storeProducts.some(p => p.category === cat.name);
    if (hasProducts) {
      if (!window.confirm(`该分类下尚有商品，删除分类将无法按类展示。确定要删除分类 "${cat.name}" 吗？`)) {
        return;
      }
    } else {
      if (!window.confirm(`确定要删除分类 "${cat.name}" 吗？`)) return;
    }

    try {
      await deleteCategory(cat.id);
      if (selectedCategoryName === cat.name) {
        setSelectedCategoryName('ALL');
      }
      showToast(`已删除分类 "${cat.name}"`);
    } catch (err: any) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  const getStationBadge = (stationId: string) => {
    switch (stationId) {
      case 'station_bar':
        return { label: '水吧饮品台', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' };
      case 'station_grill':
        return { label: '铁板汉堡台', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' };
      case 'station_fryer':
        return { label: '炸台小食区', bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' };
      case 'station_bakery':
        return { label: '烘焙甜点台', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' };
      default:
        return { label: '综合出餐台', bg: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' };
    }
  };

  return (
    <div id="unified-menu-workshop-container" className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          id="workshop-toast-alert"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-medium transition-all ${
            toastMsg.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-600'
              : 'bg-rose-500 text-white border-rose-600'
          }`}
        >
          {toastMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Banner: Store Context & Data Isolation Notice */}
      <div
        id="workshop-store-header-banner"
        className={`p-6 rounded-2xl border transition-all ${
          theme === 'dark'
            ? 'bg-zinc-900/80 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200/80 text-zinc-900 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                单店数据强隔离体系
              </span>
              <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                结算币种: {currentStore.currencySymbol} ({currentStore.currency})
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-emerald-600" />
              菜品与配方工坊 (原料到成品全流程管理)
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              统一管理当前店铺的商品类目、单品 SKU、出餐工位以及【原料 → 配方定额 (BOM) → 理论成本与毛利率测算】。
            </p>
          </div>

          {/* Store Switcher Selector */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <Store className="w-4 h-4 ml-2 text-zinc-500" />
              <span className="text-xs text-zinc-500 font-medium">当前管理门店:</span>
              <select
                id="workshop-store-switcher"
                value={currentStore.id}
                onChange={(e) => switchActiveStore(e.target.value)}
                className="text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {stores.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.storeName} ({st.currencySymbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Workshop Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            id="tab-btn-menu-catalog"
            onClick={() => setActiveTab('MENU_CATALOG')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'MENU_CATALOG'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            商品分类与单品 SKU 列表 ({storeProducts.length})
          </button>
          <button
            id="tab-btn-ingredients-bom"
            onClick={() => setActiveTab('INGREDIENTS')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'INGREDIENTS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            店铺食材原料库与采购单价 ({storeIngredients.length})
          </button>
        </div>
      </div>

      {/* Main Tab 1: Combined Categories & Product SKUs */}
      {activeTab === 'MENU_CATALOG' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Categories List & Manager (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div
              id="workshop-categories-panel"
              className={`p-5 rounded-2xl border ${
                theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">商品分类管理</h2>
                </div>
                <button
                  id="btn-add-new-category"
                  onClick={handleOpenAddCategory}
                  className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50 rounded-lg transition-all flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增分类
                </button>
              </div>

              {/* All Categories Filter Option */}
              <div className="space-y-1.5">
                <button
                  id="category-filter-all"
                  onClick={() => setSelectedCategoryName('ALL')}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border ${
                    selectedCategoryName === 'ALL'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800 font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>全部在售菜品</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                    {storeProducts.length}
                  </span>
                </button>

                {/* Categories Iteration */}
                {storeCategories.map(cat => {
                  const prodCount = storeProducts.filter(p => p.category === cat.name).length;
                  const isSelected = selectedCategoryName === cat.name;

                  return (
                    <div
                      key={cat.id}
                      id={`category-item-${cat.id}`}
                      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800 font-semibold'
                          : 'text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedCategoryName(cat.name)}
                        className="flex-1 flex items-center gap-2.5 text-left text-sm"
                      >
                        <CupSoda className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                        <span className="truncate">{cat.name}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono">
                          {prodCount}
                        </span>
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          title="编辑分类"
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          title="删除分类"
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recipe Cost Metric Summary Box */}
              <div className="mt-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>当前店铺配方成本速览</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-zinc-500 dark:text-zinc-400 pt-1">
                  <div>
                    已配方菜品: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{storeProducts.filter(p => p.recipeBOM && p.recipeBOM.length > 0).length} / {storeProducts.length}</span>
                  </div>
                  <div>
                    原料库种类: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{storeIngredients.length} 种</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Products SKU & Recipe List (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Action Bar: Search, Filters, Add Product */}
            <div
              id="workshop-products-toolbar"
              className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="search-product-input"
                    type="text"
                    placeholder="搜索菜品名称、描述或配方原料..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Station Filter */}
                <select
                  id="station-filter-select"
                  value={stationFilter}
                  onChange={e => setStationFilter(e.target.value)}
                  className="text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="ALL">全部工位</option>
                  <option value="station_bar">水吧饮品台</option>
                  <option value="station_grill">铁板汉堡台</option>
                  <option value="station_fryer">炸台小食区</option>
                  <option value="station_bakery">烘焙甜点台</option>
                </select>

                {/* Sort Filter */}
                <select
                  id="sort-products-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="DEFAULT">默认排序</option>
                  <option value="PRICE_DESC">按售价高低</option>
                  <option value="MARGIN_DESC">按毛利率高低</option>
                  <option value="PREP_TIME">按出餐时效 SLA</option>
                </select>
              </div>

              <button
                id="btn-add-new-product"
                onClick={handleOpenAddProduct}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all flex items-center gap-1.5 self-end md:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                新增单品与配方 (BOM)
              </button>
            </div>

            {/* Products List Grid / Cards */}
            {filteredProducts.length === 0 ? (
              <div
                id="no-products-placeholder"
                className={`p-12 text-center rounded-2xl border ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200/80'
                }`}
              >
                <Package className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
                <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">暂无匹配菜品</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  当前分类或筛选条件下未检索到商品。点击右上角“新增单品与配方”开始录入。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map(prod => {
                  const stationInfo = getStationBadge(prod.targetStationId);
                  const isSoldOut = Boolean(prod.isSoldOut);
                  const marginVal = prod.grossMargin !== undefined ? prod.grossMargin : 0;
                  const marginColor =
                    marginVal >= 75
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                      : marginVal >= 50
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                      : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';

                  return (
                    <div
                      key={prod.id}
                      id={`product-card-${prod.id}`}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSoldOut
                          ? 'opacity-70 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800'
                          : theme === 'dark'
                          ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                          : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Food Image */}
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200/60 dark:border-zinc-700">
                          <img
                            src={prod.image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80'}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                          {prod.isRecommended && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded shadow-sm">
                              招牌
                            </span>
                          )}
                        </div>

                        {/* Middle Info */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {prod.name}
                            </h3>
                            <span className="px-2 py-0.5 text-xs rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              {prod.category}
                            </span>
                            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-md border ${stationInfo.bg}`}>
                              {stationInfo.label}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                            {prod.description || '暂无单品图文描述'}
                          </p>

                          {/* Recipe BOM Chips Preview */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[11px] text-zinc-400 font-medium">配方构成:</span>
                            {prod.recipeBOM && prod.recipeBOM.length > 0 ? (
                              prod.recipeBOM.map((bom, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                                >
                                  {bom.inventoryItemName} {bom.quantity}{bom.unit}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-amber-500 italic">未配置原料配方</span>
                            )}
                          </div>
                        </div>

                        {/* Price & BOM Margin Stats */}
                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                          <div className="text-right">
                            <div className="text-base font-black text-zinc-900 dark:text-zinc-100 font-mono">
                              {formatPrice(prod.basePrice)}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              耗时: {prod.prepTimeSeconds}s
                            </div>
                          </div>

                          {/* BOM Cost & Margin Indicator */}
                          <div className="flex items-center gap-2">
                            {prod.estimatedCost !== undefined && (
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 text-right">
                                成本: <span className="font-mono font-medium">{formatPrice(prod.estimatedCost)}</span>
                              </div>
                            )}
                            {prod.grossMargin !== undefined && (
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${marginColor}`}>
                                毛利 {prod.grossMargin}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {/* Sold out toggle */}
                          <button
                            id={`toggle-soldout-${prod.id}`}
                            onClick={() => toggleSkuSoldOut(prod.id, !isSoldOut)}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                              isSoldOut
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                            }`}
                          >
                            {isSoldOut ? '已估清(点击上架)' : '供应中(点击估清)'}
                          </button>

                          <button
                            id={`btn-edit-product-${prod.id}`}
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-2 text-zinc-600 hover:text-emerald-600 bg-zinc-100 hover:bg-emerald-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition-all"
                            title="编辑菜品与配方"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            id={`btn-delete-product-${prod.id}`}
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-2 text-zinc-400 hover:text-rose-600 bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                            title="删除单品"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tab 2: Raw Material & Purchasing Cost Catalog */}
      {activeTab === 'INGREDIENTS' && (
        <div
          id="workshop-ingredients-panel"
          className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200/80 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                {currentStore.storeName} · 食材原料库与采购单价
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                维护当前店铺的茶底原叶、乳品、肉品、小料及包材采购单价。配方引擎将根据这里的单价自动折算每道菜品的 BOM 理论成本。
              </p>
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-y border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">原料名称</th>
                  <th className="py-3 px-4">分类</th>
                  <th className="py-3 px-4">当前库存</th>
                  <th className="py-3 px-4">单位</th>
                  <th className="py-3 px-4">采购单价 ({currentStore.currencySymbol})</th>
                  <th className="py-3 px-4">预警安全线</th>
                  <th className="py-3 px-4">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {storeIngredients.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {item.categoryName || item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">{item.unit}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(item.costPerUnit)} / {item.unit}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 font-mono">
                      {item.minThreshold} {item.unit}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        正常充足
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Category Add / Edit */}
      {isCategoryModalOpen && (
        <div id="category-modal-backdrop" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingCategory ? '编辑商品分类' : '新增商品分类'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">分类名称 *</label>
                <input
                  id="cat-name-input"
                  type="text"
                  required
                  placeholder="例如：原叶清心茶、鲜奶茶、手工汉堡"
                  value={catNameInput}
                  onChange={e => setCatNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">展示图标</label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_ICONS.map(ic => {
                    const IconComp = ic.icon;
                    const isSelected = catIconInput === ic.name;
                    return (
                      <button
                        type="button"
                        key={ic.name}
                        onClick={() => setCatIconInput(ic.name)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[10px]">{ic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">排序权重 (数字越小越靠前)</label>
                <input
                  id="cat-sort-input"
                  type="number"
                  min={1}
                  max={99}
                  value={catSortOrderInput}
                  onChange={e => setCatSortOrderInput(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  保存分类
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Product SKU & Recipe BOM Composer */}
      {isProductModalOpen && (
        <div id="product-modal-backdrop" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-3xl my-8 rounded-2xl border p-6 space-y-6 shadow-2xl ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ChefHat className="w-6 h-6 text-emerald-600" />
                  {editingProduct ? `编辑菜品: ${editingProduct.name}` : '新增单品与原料配方 (BOM)'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  门店专属数据隔离：所属店铺【{currentStore.storeName}】
                </p>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Nav Tabs: 1. 基础信息  2. 原料配方BOM */}
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <button
                type="button"
                onClick={() => setModalActiveTab('BASIC')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                  modalActiveTab === 'BASIC'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                1. 基础信息与销售配置
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('BOM')}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  modalActiveTab === 'BOM'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Calculator className="w-4 h-4" />
                2. 原料到成品配方 BOM ({formBOM.length} 种原料)
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Tab 1: Basic Information */}
              {modalActiveTab === 'BASIC' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                        菜品名称 *
                      </label>
                      <input
                        id="form-pname"
                        type="text"
                        required
                        placeholder="例如：山野茉莉鲜奶茶"
                        value={pName}
                        onChange={e => setPName(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                        所属商品分类 *
                      </label>
                      <select
                        id="form-pcategory"
                        value={pCategory}
                        onChange={e => setPCategory(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {storeCategories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                        基础售价 ({currentStore.currencySymbol}) *
                      </label>
                      <input
                        id="form-pprice"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={pPrice}
                        onChange={e => setPPrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                        目标出餐工位 *
                      </label>
                      <select
                        id="form-pstation"
                        value={pStation}
                        onChange={e => setPStation(e.target.value as any)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="station_bar">水吧饮品台 (station_bar)</option>
                        <option value="station_grill">铁板汉堡台 (station_grill)</option>
                        <option value="station_fryer">炸台小食区 (station_fryer)</option>
                        <option value="station_bakery">烘焙甜点台 (station_bakery)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                        标准制作 SLA (秒)
                      </label>
                      <input
                        id="form-ppreptime"
                        type="number"
                        min="10"
                        max="900"
                        value={pPrepTime}
                        onChange={e => setPPrepTime(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      菜品图片网址 (URL) 或快捷挑选
                    </label>
                    <input
                      id="form-pimage"
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={pImage}
                      onChange={e => setPImage(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
                    />
                    {/* Image Presets */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[11px] text-zinc-400">预设图库:</span>
                      {PRESET_IMAGES.map((img, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setPImage(img.url)}
                          className="text-[11px] px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition-colors"
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      单品口感与描述
                    </label>
                    <textarea
                      id="form-pdesc"
                      rows={2}
                      placeholder="介绍原料产地、风味层次、茶香余韵等..."
                      value={pDescription}
                      onChange={e => setPDescription(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="form-precommended"
                      type="checkbox"
                      checked={pRecommended}
                      onChange={e => setPRecommended(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700"
                    />
                    <label htmlFor="form-precommended" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      设为店铺招牌推荐菜品 (在点餐首页重点打标展示)
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 2: Recipe BOM (从原料到成品) */}
              {modalActiveTab === 'BOM' && (
                <div className="space-y-5">
                  {/* Real-time Margin Card */}
                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-center sm:text-left">
                    <div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">单品基础售价</div>
                      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatPrice(pPrice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">BOM 理论原料成本</div>
                      <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        {formatPrice(calculatedBOMCost)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">单份毛利空间</div>
                      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatPrice(Math.max(0, pPrice - calculatedBOMCost))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">预估毛利率</div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {calculatedGrossMargin}%
                      </div>
                    </div>
                  </div>

                  {/* Add Ingredient Selector */}
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center gap-3">
                    <select
                      id="select-ingredient-to-add"
                      value={selectedIngredientToAdd}
                      onChange={e => setSelectedIngredientToAdd(e.target.value)}
                      className="w-full sm:flex-1 px-3 py-2 text-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="">-- 从店铺原料库中选择食材/包材 --</option>
                      {storeIngredients.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name} (采购单价: {formatPrice(i.costPerUnit)}/{i.unit})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddIngredientToBOM}
                      disabled={!selectedIngredientToAdd}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      添加原料至配方
                    </button>
                  </div>

                  {/* BOM Table */}
                  {formBOM.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 text-xs">
                      <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      尚未为该菜品配置原料 BOM。请从上方选择食材添加，系统将自动汇总每份菜品的原料理论成本。
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">食材原料名称</th>
                            <th className="py-2.5 px-3">单份消耗定额</th>
                            <th className="py-2.5 px-3">单位</th>
                            <th className="py-2.5 px-3">单位采购单价</th>
                            <th className="py-2.5 px-3">单项折合成本</th>
                            <th className="py-2.5 px-3 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {formBOM.map((item, idx) => {
                            const subCost = item.quantity * (item.unitCost || 0);
                            return (
                              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                                  {item.inventoryItemName}
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="number"
                                    step="0.001"
                                    min="0.001"
                                    value={item.quantity}
                                    onChange={e => handleUpdateBOMQuantity(idx, Number(e.target.value))}
                                    className="w-20 px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 font-mono">{item.unit}</td>
                                <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-300 font-mono">
                                  {formatPrice(item.unitCost || 0)}/{item.unit}
                                </td>
                                <td className="py-2.5 px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                  {formatPrice(subCost)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBOMItem(idx)}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                    title="移除原料"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-xs text-zinc-400">
                  {modalActiveTab === 'BASIC' ? (
                    <span>💡 点击上方“原料到成品配方 BOM”可进一步配置食材定额</span>
                  ) : (
                    <span>💡 修改配方数量将即时更新理论成本与毛利率</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                  >
                    保存菜品与配方
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
