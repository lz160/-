import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffUser, StaffRole } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  X,
} from 'lucide-react';

export const RolePermissionManager: React.FC = () => {
  const {
    staffUsers,
    permissionsList,
    currentStaffUser,
    setCurrentStaffUser,
    createStaffUser,
    updateStaffUser,
    deleteStaffUser,
    t,
    theme,
  } = useApp();

  const [selectedStaff, setSelectedStaff] = useState<StaffUser>(staffUsers[0] || currentStaffUser);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // New staff form
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    username: '',
    role: 'CASHIER' as StaffRole,
    pinCode: '1234',
  });

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleTogglePermission = async (permId: string) => {
    if (!selectedStaff) return;
    if (selectedStaff.role === 'SUPER_ADMIN') {
      showToast('超级管理员拥有全部不可撤销权限', 'error');
      return;
    }

    const hasIt = selectedStaff.permissions.includes(permId);
    const newPerms = hasIt
      ? selectedStaff.permissions.filter((p) => p !== permId)
      : [...selectedStaff.permissions, permId];

    try {
      await updateStaffUser(selectedStaff.id, { permissions: newPerms });
      setSelectedStaff({ ...selectedStaff, permissions: newPerms });
      showToast('权限配置已更新');
    } catch (err: any) {
      showToast(err.message || '更新权限失败', 'error');
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name || !newStaffForm.username) return;

    try {
      // Give initial default role perms
      let initialPerms: string[] = ['perm_menu_view'];
      if (newStaffForm.role === 'STORE_MANAGER') {
        initialPerms = permissionsList.map((p) => p.id);
      } else if (newStaffForm.role === 'CASHIER') {
        initialPerms = ['perm_menu_view', 'perm_order_create', 'perm_order_verify', 'perm_sku_soldout', 'perm_finance_view'];
      } else if (newStaffForm.role === 'CHEF') {
        initialPerms = ['perm_menu_view', 'perm_kds_bump', 'perm_sku_soldout'];
      } else if (newStaffForm.role === 'EXPO_PACKER') {
        initialPerms = ['perm_menu_view', 'perm_kds_bump', 'perm_expo_call', 'perm_order_verify'];
      }

      const res = await createStaffUser({
        name: newStaffForm.name,
        username: newStaffForm.username,
        role: newStaffForm.role,
        pinCode: newStaffForm.pinCode,
        permissions: initialPerms,
      });

      setIsAddStaffOpen(false);
      setNewStaffForm({ name: '', username: '', role: 'CASHIER', pinCode: '1234' });
      if (res.staff) setSelectedStaff(res.staff);
      showToast('新增员工账号成功');
    } catch (err: any) {
      showToast(err.message || '添加员工失败', 'error');
    }
  };

  const handleDeleteStaff = async (staff: StaffUser) => {
    if (staff.role === 'SUPER_ADMIN') {
      showToast('禁止删除超级管理员账号', 'error');
      return;
    }
    if (!confirm(`确定注销/删除员工【${staff.name}】吗？`)) return;

    try {
      await deleteStaffUser(staff.id);
      showToast('员工账号已注销');
      setSelectedStaff(staffUsers[0]);
    } catch (err: any) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  // Group permissions by category
  const permissionCategories = [
    { key: 'MENU', label: '菜单与商品权限 (Menu)' },
    { key: 'ORDERS', label: '收银与工位调度 (Orders & KDS)' },
    { key: 'STAFF', label: '员工与权限控制 (Staff RBAC)' },
    { key: 'FINANCE', label: '财务与流水审计 (Finance)' },
    { key: 'SYSTEM', label: '系统与集团配置 (System)' },
  ];

  return (
    <div className={`h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden ${theme === 'light' ? 'bg-stone-50 text-stone-800' : 'bg-stone-950 text-stone-100'}`}>
      
      {/* Toast Alert */}
      {feedback && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xl border animate-bounce ${
          feedback.type === 'success' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Left Column: Staff Users List & Switcher */}
      <div className={`w-full md:w-80 shrink-0 flex flex-col rounded-2xl border p-4 shadow-xs ${
        theme === 'light' ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-sm">{t('activeUsers')}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 font-semibold">
              {staffUsers.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('addStaff')}</span>
          </button>
        </div>

        {/* Staff User Cards */}
        <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
          {staffUsers.map((user) => {
            const isSelected = selectedStaff?.id === user.id;
            const isCurrentLoggedIn = currentStaffUser?.id === user.id;

            return (
              <div
                key={user.id}
                onClick={() => setSelectedStaff(user)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20'
                    : theme === 'light'
                    ? 'border-stone-200 bg-stone-50/60 hover:bg-stone-100'
                    : 'border-stone-800 bg-stone-950/40 hover:bg-stone-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-stone-300 dark:border-stone-700"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{user.name}</span>
                        {isCurrentLoggedIn && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                            当前身份
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        @{user.username} (PIN: {user.pinCode})
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    user.role === 'SUPER_ADMIN'
                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                      : user.role === 'STORE_MANAGER'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}>
                    {user.role === 'SUPER_ADMIN' ? '超级管理员' : user.role === 'STORE_MANAGER' ? '店长' : user.role === 'CASHIER' ? '吧台收银' : user.role === 'CHEF' ? '后厨厨师' : 'Expo打包'}
                  </span>
                </div>

                {/* Quick action: Switch active operator simulator */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-800/60 text-[11px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentStaffUser(user);
                      showToast(`已切换当前操作身份为：${user.name}`);
                    }}
                    className={`font-semibold transition ${
                      isCurrentLoggedIn ? 'text-emerald-600 font-bold' : 'text-stone-400 hover:text-amber-500'
                    }`}
                  >
                    {isCurrentLoggedIn ? '● 当前登入账号' : '⚡ 切换为此账号登录'}
                  </button>

                  {user.role !== 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStaff(user);
                      }}
                      className="text-stone-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Permission Matrix for Selected Staff */}
      <div className={`flex-1 flex flex-col rounded-2xl border p-4 shadow-xs overflow-hidden ${
        theme === 'light' ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-sm sm:text-base">
                【{selectedStaff?.name}】细粒度权限矩阵配置 (RBAC)
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                {selectedStaff?.role}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              点击下方开关即可实时授权/撤销该员工的各模块控制权，无需重启即时生效
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-stone-400">已授权权限点：</span>
            <strong className="text-amber-500 ml-1">
              {selectedStaff?.role === 'SUPER_ADMIN' ? permissionsList.length : selectedStaff?.permissions.length}
            </strong> / {permissionsList.length}
          </div>
        </div>

        {/* Permissions Grid Grouped by Category */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-1">
          {permissionCategories.map((group) => {
            const groupPerms = permissionsList.filter((p) => p.category === group.key);
            if (groupPerms.length === 0) return null;

            return (
              <div key={group.key} className="space-y-2">
                <h3 className="font-bold text-xs text-stone-500 uppercase tracking-wider">
                  {group.label}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {groupPerms.map((perm) => {
                    const isGranted =
                      selectedStaff?.role === 'SUPER_ADMIN' ||
                      selectedStaff?.permissions.includes(perm.id);

                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`flex items-start justify-between p-3 rounded-xl border transition cursor-pointer ${
                          isGranted
                            ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10'
                            : theme === 'light'
                            ? 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 text-stone-500'
                            : 'border-stone-800 bg-stone-950/40 hover:bg-stone-800/40 text-stone-400'
                        }`}
                      >
                        <div className="pr-3">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <span className={isGranted ? 'text-stone-900 dark:text-stone-100' : ''}>
                              {perm.name}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400 font-normal">
                              ({perm.id})
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                            {perm.description}
                          </p>
                        </div>

                        <div className="pt-0.5">
                          {isGranted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-stone-300 dark:text-stone-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
            theme === 'light' ? 'bg-white border-stone-200 text-stone-800' : 'bg-stone-900 border-stone-800 text-stone-100'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-sm sm:text-base">{t('addStaff')}</h3>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">员工姓名</label>
                <input
                  type="text"
                  placeholder="如 赵小宇"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">登录账号 / 工号</label>
                <input
                  type="text"
                  placeholder="如 cashier_zhao"
                  value={newStaffForm.username}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, username: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">岗位角色</label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as StaffRole })}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700 font-medium"
                  >
                    <option value="STORE_MANAGER">{t('roleStoreManager')}</option>
                    <option value="CASHIER">{t('roleCashier')}</option>
                    <option value="CHEF">{t('roleChef')}</option>
                    <option value="EXPO_PACKER">{t('roleExpo')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1">快速登录 PIN 码</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newStaffForm.pinCode}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, pinCode: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-stone-50 dark:bg-stone-950 border-stone-300 dark:border-stone-700 font-mono tracking-widest text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold transition shadow-xs"
                >
                  {t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
