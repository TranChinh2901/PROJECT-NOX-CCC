'use client';

import Image from 'next/image';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { AUTH_USER_UPDATED_EVENT, useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { RoleType } from '@/types/auth.types';
import { adminApi } from '@/lib/api/admin.api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const PAGE_SIZE = 10;
type EditableUserForm = Omit<Partial<User>, 'avatar'> & { avatar?: string | null };

export default function UserManagement() {
  const AUTH_STORAGE_KEYS = {
    user: 'technova_user',
    legacyUser: 'user',
  } as const;
  const [users, setUsers] = useState<User[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<EditableUserForm>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useBodyScrollLock(Boolean(editingUser || showDeleteConfirm));

  const { deleteUserById, isLoading, user: currentUser } = useAuth();

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, selectedRole]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsFetching(true);
        const response = await adminApi.getAllUsers({
          page: currentPage,
          limit: PAGE_SIZE,
          search: deferredSearchTerm || undefined,
          role: selectedRole || undefined,
          sortBy: 'created_at',
          sortOrder: 'DESC',
        });

        setUsers(response.data);
        setTotalUsers(response.pagination.total);
        setTotalPages(response.pagination.total_pages);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsFetching(false);
        setInitialLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, deferredSearchTerm, selectedRole]);

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUserById(userId);
      setShowDeleteConfirm(null);
      const isLastItemOnPage = users.length === 1 && currentPage > 1;
      setCurrentPage((page) => (isLastItemOnPage ? page - 1 : page));
      if (!isLastItemOnPage) {
        setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
        setTotalUsers((count) => {
          const nextTotal = Math.max(0, count - 1);
          setTotalPages(Math.ceil(nextTotal / PAGE_SIZE));
          return nextTotal;
        });
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm(user);
    setAvatarPreview(user.avatar || null);
    setAvatarFile(null);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setIsSavingUser(true);

      if (avatarFile) {
        const avatarUser = await adminApi.uploadUserAvatar(editingUser.id, avatarFile);
        setUserForm((currentForm) => ({ ...currentForm, avatar: avatarUser.avatar }));
      }

      const updatedUser = await adminApi.updateUser(editingUser.id, {
        fullname: userForm.fullname,
        email: userForm.email,
        phone_number: userForm.phone_number?.replace(/[\s\-\(\)\+]/g, ''),
        avatar: avatarFile ? undefined : userForm.avatar,
        role: userForm.role,
      });

      if (currentUser?.id === updatedUser.id && typeof window !== 'undefined') {
        const serializedUser = JSON.stringify(updatedUser);
        localStorage.setItem(AUTH_STORAGE_KEYS.user, serializedUser);
        localStorage.setItem(AUTH_STORAGE_KEYS.legacyUser, serializedUser);
        window.dispatchEvent(
          new CustomEvent(AUTH_USER_UPDATED_EVENT, {
            detail: updatedUser,
          }),
        );
      }

      setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
      setEditingUser(null);
      setUserForm({});
      setAvatarPreview(null);
      setAvatarFile(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleAvatarSelect = () => {
    avatarInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setUserForm((currentForm) => ({ ...currentForm, avatar: null }));
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh đại diện phải nhỏ hơn hoặc bằng 2MB.');
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ.');
      event.target.value = '';
      return;
    }

    setAvatarFile(file);
    setUserForm((currentForm) => ({ ...currentForm, avatar: undefined }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const closeEditModal = () => {
    if (isSavingUser) {
      return;
    }

    setEditingUser(null);
    setUserForm({});
    setAvatarPreview(null);
    setAvatarFile(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Đang kiểm tra xác thực...</div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Đang tải người dùng...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý người dùng</h1>
        <p className="text-slate-500">Quản lý người dùng đã đăng ký, xem thông tin chi tiết và cập nhật thông tin của họ.</p>
      </div>

      {/* Filters */}
      <div className="glass-card backdrop-blur-sm bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleType | '')}
              className="px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            >
              <option value="">Tất cả vai trò</option>
              <option value={RoleType.ADMIN}>Quản trị viên</option>
              <option value={RoleType.USER}>Người dùng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card backdrop-blur-sm bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Người dùng</h2>
            <span className="text-sm text-slate-500">
              Tìm thấy {totalUsers} người dùng
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Người dùng</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Vai trò</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Điện thoại</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Xác thực</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Ngày tham gia</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-mono">#{user.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.fullname}
                          width={40}
                          height={40}
                          unoptimized
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#7366ff] flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.fullname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.fullname}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      user.role === RoleType.ADMIN
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{user.phone_number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_verified ? 'Đã xác thực' : 'Chưa xác thực'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="px-3 py-1 text-sm bg-[#7366ff] text-white rounded hover:bg-[#5d54cc] transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    Không có người dùng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalUsers}
          pageSize={PAGE_SIZE}
          itemLabel="users"
          onPageChange={setCurrentPage}
          isFetching={isFetching}
        />
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-none bg-black/50 p-4">
          <div className="glass-card max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4">Chỉnh sửa người dùng</h3>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-slate-200 bg-slate-100">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={userForm.fullname || editingUser.fullname}
                      width={96}
                      height={96}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#7366ff]">
                      <span className="text-3xl font-semibold text-white">
                        {(userForm.fullname || editingUser.fullname).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAvatarSelect}
                    disabled={isSavingUser}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {avatarPreview ? 'Thay ảnh' : 'Tải ảnh'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isSavingUser || (!avatarPreview && !editingUser.avatar)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Xóa ảnh
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Tải ảnh mới hoặc xóa ảnh đại diện hiện tại
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Họ và tên</label>
                <input
                  type="text"
                  value={userForm.fullname || ''}
                  onChange={(e) => setUserForm({ ...userForm, fullname: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={userForm.email || ''}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Điện thoại</label>
                <input
                  type="tel"
                  value={userForm.phone_number || ''}
                  onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Vai trò</label>
                <select
                  value={userForm.role || ''}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as RoleType })}
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                >
                  <option value={RoleType.USER}>Người dùng</option>
                  <option value={RoleType.ADMIN}>Quản trị viên</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeEditModal}
                disabled={isSavingUser}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isSavingUser}
                className="px-4 py-2 bg-[#7366ff] text-white rounded hover:bg-[#5d54cc] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingUser ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-none bg-black/50 p-4">
          <div className="glass-card max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 text-red-500">Xóa người dùng</h3>
            <p className="text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
