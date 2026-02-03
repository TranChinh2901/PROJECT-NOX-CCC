'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, RoleType } from '@/types';

interface UserFilters {
  search?: string;
  role?: RoleType;
  verified?: boolean;
  page?: number;
  limit?: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const { authApi } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedRole, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.getAllUsers({
        sort: 'created_at',
        limit: 10,
      });
      setUsers(response);
      setTotalPages(1); // Adjust based on actual pagination from API
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setAuthLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await authApi.deleteUserById(userId);
      setUsers(users.filter(user => user.id !== userId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm(user);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const updatedUser = await authApi.updateUserById(editingUser.id, userForm);
      setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
      setEditingUser(null);
      setUserForm({});
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#FAFAF9]">Checking authentication...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#FAFAF9]">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#FAFAF9]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-[#A1A1AA]">Manage registered users, view their details, and update their information.</p>
      </div>

      {/* Filters */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleType | '')}
              className="px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value={RoleType.ADMIN}>Admin</option>
              <option value={RoleType.USER}>User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Users</h2>
            <span className="text-sm text-[#A1A1AA]">
              {users.length} users found
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Verified</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-[#A1A1AA]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 text-sm font-mono">#{user.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.fullname} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#7366ff] flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.fullname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.fullname}</p>
                        <p className="text-sm text-[#A1A1AA]">{user.email}</p>
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
                  <td className="px-6 py-4 text-[#A1A1AA]">{user.phone_number}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#A1A1AA]">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="px-3 py-1 text-sm bg-[#7366ff] text-white rounded hover:bg-[#5d54cc] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 flex items-center justify-between">
            <div className="text-sm text-[#A1A1AA]">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#292524] text-[#FAFAF9] rounded hover:bg-[#44403C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#292524] text-[#FAFAF9] rounded hover:bg-[#44403C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={userForm.fullname || ''}
                  onChange={(e) => setUserForm({ ...userForm, fullname: e.target.value })}
                  className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={userForm.email || ''}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={userForm.phone_number || ''}
                  onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                  className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={userForm.role || ''}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as RoleType })}
                  className="w-full px-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
                >
                  <option value={RoleType.USER}>User</option>
                  <option value={RoleType.ADMIN}>Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => { setEditingUser(null); setUserForm({}); }}
                className="px-4 py-2 bg-[#292524] text-[#FAFAF9] rounded hover:bg-[#44403C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-[#7366ff] text-white rounded hover:bg-[#5d54cc] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-500">Delete User</h3>
            <p className="text-[#A1A1AA] mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-[#292524] text-[#FAFAF9] rounded hover:bg-[#44403C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}