import { useState, useEffect } from "react";
import { UserPlus, Search, CheckCircle, Clock, X } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const VolunteerManager = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/volunteers");
      setVolunteers(res.data);
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (volunteerId, status) => {
    try {
      await api.put(`/volunteers/${volunteerId}?status=${status}`);
      fetchData();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: volunteers.length,
    pending: volunteers.filter(v => v.status === "pending").length,
    approved: volunteers.filter(v => v.status === "approved").length,
    rejected: volunteers.filter(v => v.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar />

      <main className="admin-content p-6 lg:p-8" data-testid="volunteer-manager">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Volunteer Manager</h1>
            <p className="text-stone-500">Manage volunteer (karyakarta) registrations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder="Search volunteers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="volunteer-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-stone-200">
            <p className="text-3xl font-bold text-stone-900">{stats.total}</p>
            <p className="text-sm text-stone-500">Total</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-sm text-amber-600">Pending</p>
          </div>
          <div className="bg-green-50 rounded-xl p-5 border border-green-200">
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-green-600">Approved</p>
          </div>
          <div className="bg-red-50 rounded-xl p-5 border border-red-200">
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-sm text-red-600">Rejected</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Volunteer</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Contact</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Skills</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Location</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Status</th>
                    <th className="px-5 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredVolunteers.length > 0 ? (
                    filteredVolunteers.map((volunteer) => (
                      <tr key={volunteer.id} className="hover:bg-stone-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <UserPlus className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                              <p className="font-medium text-stone-900">{volunteer.name}</p>
                              <p className="text-xs text-stone-500">{volunteer.availability || "Not specified"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-stone-600">{volunteer.phone}</p>
                          {volunteer.email && (
                            <p className="text-sm text-stone-500">{volunteer.email}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {volunteer.skills?.slice(0, 2).map((skill, i) => (
                              <span key={i} className="badge-pill bg-stone-100 text-stone-700 text-xs">{skill}</span>
                            ))}
                            {volunteer.skills?.length > 2 && (
                              <span className="badge-pill bg-stone-100 text-stone-700 text-xs">+{volunteer.skills.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-stone-600 text-sm">
                          {volunteer.constituency_name || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`badge-pill ${
                            volunteer.status === 'approved' ? 'bg-green-100 text-green-700' :
                            volunteer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {volunteer.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {volunteer.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateStatus(volunteer.id, "approved")}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Approve"
                                  data-testid={`approve-volunteer-${volunteer.id}`}
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => updateStatus(volunteer.id, "rejected")}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Reject"
                                  data-testid={`reject-volunteer-${volunteer.id}`}
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-stone-500">
                        No volunteer registrations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VolunteerManager;
