// ============================================================
// USERS PAGE - Admin user management
// Features: List, Search, Filter, Edit role/status, Delete
// ============================================================

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Shield, User, Search, Loader2, X } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function UsersPage() {
  // ============================================================
  // STATE
  // ============================================================
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  
  // For edit modal
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: "", isActive: true });
  const [saving, setSaving] = useState(false);
  
  // For delete confirmation
  const [deletingId, setDeletingId] = useState(null);
  
  // Current logged-in user (to prevent self-actions)
  const { user: currentUser } = useAuth();

  // ============================================================
  // FETCH USERS
  // ============================================================
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (search.trim()) params.append("search", search.trim());
      if (roleFilter) params.append("role", roleFilter);

      const response = await api.get(`/users?${params}`);

      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SEARCH HANDLER
  // ============================================================
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  // ============================================================
  // EDIT USER
  // ============================================================
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      isActive: user.isActive
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({ role: "", isActive: true });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);

      await api.put(`/users/${editingUser.id}`, {
        role: editForm.role,
        isActive: editForm.isActive
      });

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === editingUser.id
            ? { ...u, role: editForm.role, isActive: editForm.isActive }
            : u
        )
      );

      closeEditModal();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE USER
  // ============================================================
  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.name}"?\n\nThis will remove their account. Their posts will remain but without an author.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(user.id);

      await api.delete(`/users/${user.id}`);

      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // HELPER: Format date
  // ============================================================
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>

            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Users
            {pagination.total > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            /* Error State */
            <div className="text-center py-12 text-destructive">
              <p>{error}</p>
              <Button variant="outline" onClick={fetchUsers} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 text-muted-foreground">
              <p>No users found</p>
            </div>
          ) : (
            /* Users Table */
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Posts</th>
                    <th className="text-left py-3 px-4 font-medium">Joined</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            ) : user.role === "ADMIN" ? (
                              <Shield className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.name}
                              {user.id === currentUser?.id && (
                                <span className="text-xs text-muted-foreground ml-2">(you)</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Post Count */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.postCount || 0}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user)}
                            disabled={deletingId === user.id || user.id === currentUser?.id}
                          >
                            {deletingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit User</h2>
              <Button variant="ghost" size="icon" onClick={closeEditModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* User Info (read-only) */}
              <div>
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-medium">{editingUser.name}</p>
                <p className="text-sm text-muted-foreground">{editingUser.email}</p>
              </div>

              {/* Role Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  disabled={editingUser.id === currentUser?.id}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {editingUser.id === currentUser?.id && (
                  <p className="text-xs text-muted-foreground">
                    You cannot change your own role
                  </p>
                )}
              </div>

              {/* Status Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, isActive: true })}
                    disabled={editingUser.id === currentUser?.id}
                    className={`px-4 py-2 rounded-md text-sm ${
                      editForm.isActive
                        ? "bg-green-100 text-green-800 border-2 border-green-500"
                        : "bg-secondary"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, isActive: false })}
                    disabled={editingUser.id === currentUser?.id}
                    className={`px-4 py-2 rounded-md text-sm ${
                      !editForm.isActive
                        ? "bg-gray-100 text-gray-800 border-2 border-gray-500"
                        : "bg-secondary"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
                {editingUser.id === currentUser?.id && (
                  <p className="text-xs text-muted-foreground">
                    You cannot deactivate your own account
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeEditModal}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateUser}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}