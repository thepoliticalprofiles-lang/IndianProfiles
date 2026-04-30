import { useState, useEffect } from "react";
import { Shield, Plus, Edit, Trash2, Search, ChevronRight, X, Check, User, MapPin } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "user",
    leader_profile_id: "",
    assigned_location_id: "",
    location_level: "",
    can_access_voter_hub: false,
    can_access_social_hub: false,
    is_super_admin: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, leadersRes, constRes] = await Promise.all([
        api.get("/system-users"),
        api.get("/leaders"),
        api.get("/constituencies")
      ]);
      setUsers(usersRes.data);
      setLeaders(leadersRes.data);
      setConstituencies(constRes.data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      email: "",
      password: "",
      name: "",
      role: "user",
      leader_profile_id: "",
      assigned_location_id: "",
      location_level: "",
      can_access_voter_hub: false,
      can_access_social_hub: false,
      is_super_admin: false
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingUser(null);
    setShowModal(true);
    setError("");
  };

  const openEditModal = (user) => {
    setForm({
      email: user.email,
      password: "",
      name: user.name,
      role: user.role || "user",
      leader_profile_id: user.leader_profile_id || "",
      assigned_location_id: user.assigned_location_id || "",
      location_level: user.location_level || "",
      can_access_voter_hub: user.can_access_voter_hub || false,
      can_access_social_hub: user.can_access_social_hub || false,
      is_super_admin: user.is_super_admin || false
    });
    setEditingUser(user);
    setShowModal(true);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingUser) {
        // Update existing user
        const updateData = { ...form };
        delete updateData.email; // Can't change email
        delete updateData.password; // Don't send empty password
        
        await api.put(`/system-users/${editingUser.id}`, updateData);
        setSuccess("User updated successfully!");
      } else {
        // Create new user
        if (!form.password) {
          setError("Password is required for new users");
          return;
        }
        await api.post("/system-users", form);
        setSuccess("User created successfully!");
      }
      
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await api.delete(`/system-users/${userId}`);
      setSuccess("User deleted successfully!");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-100">
      <AdminSidebar />
      
      <main className="admin-content p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
            <span>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-stone-900">User Management</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-900">User Management</h1>
              <p className="text-stone-500 mt-1">Manage system users and their access permissions</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
        )}
        {success && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-6 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Permissions</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Location</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">{user.name}</p>
                          <p className="text-sm text-stone-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_super_admin 
                          ? 'bg-purple-100 text-purple-700' 
                          : user.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-stone-100 text-stone-600'
                      }`}>
                        {user.is_super_admin ? 'Super Admin' : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.can_access_voter_hub && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Voter Hub</span>
                        )}
                        {user.can_access_social_hub && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Social Hub</span>
                        )}
                        {!user.can_access_voter_hub && !user.can_access_social_hub && (
                          <span className="text-stone-400 text-xs">No special access</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.location_level ? (
                        <div className="flex items-center gap-1 text-sm text-stone-600">
                          <MapPin className="w-4 h-4" />
                          {user.location_level}
                        </div>
                      ) : (
                        <span className="text-stone-400 text-sm">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-stone-200">
                <h2 className="text-xl font-semibold text-stone-900">
                  {editingUser ? "Edit User" : "Add New User"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                    placeholder="user@example.com"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required={!editingUser}
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Link to Leader Profile</label>
                  <Select value={form.leader_profile_id || "none"} onValueChange={(v) => setForm({ ...form, leader_profile_id: v === "none" ? "" : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leader (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {leaders.map((leader) => (
                        <SelectItem key={leader.id} value={leader.id}>{leader.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Assigned Location</label>
                    <Select value={form.assigned_location_id || "none"} onValueChange={(v) => setForm({ ...form, assigned_location_id: v === "none" ? "" : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (All Access)</SelectItem>
                        {constituencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Location Level</label>
                    <Select value={form.location_level || "none"} onValueChange={(v) => setForm({ ...form, location_level: v === "none" ? "" : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="State">State</SelectItem>
                        <SelectItem value="District">District</SelectItem>
                        <SelectItem value="Constituency">Constituency</SelectItem>
                        <SelectItem value="Division">Division</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-4">
                  <p className="text-sm font-medium text-stone-700 mb-3">Access Permissions</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.can_access_voter_hub}
                        onChange={(e) => setForm({ ...form, can_access_voter_hub: e.target.checked })}
                        className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-stone-900">Enable Voter Analytics Hub</span>
                        <p className="text-xs text-stone-500">Access to voter data and search</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.can_access_social_hub}
                        onChange={(e) => setForm({ ...form, can_access_social_hub: e.target.checked })}
                        className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-stone-900">Enable Social Media Hub</span>
                        <p className="text-xs text-stone-500">Access to social media posting</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_super_admin}
                        onChange={(e) => setForm({ ...form, is_super_admin: e.target.checked })}
                        className="w-4 h-4 rounded border-stone-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-stone-900">Super Admin</span>
                        <p className="text-xs text-stone-500">Full system access including user management</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingUser ? "Update User" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
