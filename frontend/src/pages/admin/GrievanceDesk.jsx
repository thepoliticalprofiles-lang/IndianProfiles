import { useState, useEffect } from "react";
import { MessageSquare, Search, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";

const GrievanceDesk = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Update modal
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: "", admin_notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/grievances");
      setGrievances(res.data);
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (grievance) => {
    setSelectedGrievance(grievance);
    setUpdateForm({
      status: grievance.status,
      admin_notes: grievance.admin_notes || "",
    });
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/grievances/${selectedGrievance.id}`, updateForm);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-red-100 text-red-700";
    }
  };

  const filteredGrievances = grievances.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: grievances.length,
    pending: grievances.filter(g => g.status === "pending").length,
    in_progress: grievances.filter(g => g.status === "in_progress").length,
    resolved: grievances.filter(g => g.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar />

      <main className="admin-content p-6 lg:p-8" data-testid="grievance-desk">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Grievance Desk</h1>
            <p className="text-stone-500">Manage citizen grievances</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder="Search grievances..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="grievance-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
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
          <div className="bg-red-50 rounded-xl p-5 border border-red-200">
            <p className="text-3xl font-bold text-red-600">{stats.pending}</p>
            <p className="text-sm text-red-600">Pending</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <p className="text-3xl font-bold text-amber-600">{stats.in_progress}</p>
            <p className="text-sm text-amber-600">In Progress</p>
          </div>
          <div className="bg-green-50 rounded-xl p-5 border border-green-200">
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-sm text-green-600">Resolved</p>
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
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Citizen</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Category</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Description</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Location</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Status</th>
                    <th className="px-5 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredGrievances.length > 0 ? (
                    filteredGrievances.map((grievance) => (
                      <tr key={grievance.id} className="hover:bg-stone-50">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-stone-900">{grievance.name}</p>
                            <p className="text-sm text-stone-500">{grievance.phone}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="badge-pill bg-blue-100 text-blue-700">{grievance.category}</span>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-stone-600 truncate">{grievance.description}</p>
                        </td>
                        <td className="px-5 py-4 text-stone-600 text-sm">
                          {grievance.constituency_name || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`badge-pill flex items-center gap-1 ${getStatusBadge(grievance.status)}`}>
                            {getStatusIcon(grievance.status)}
                            {grievance.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => openUpdateModal(grievance)}
                            className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm transition-colors"
                            data-testid={`update-grievance-${grievance.id}`}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-stone-500">
                        No grievances found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Update Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Update Grievance Status</DialogTitle>
            </DialogHeader>
            {selectedGrievance && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="font-medium text-stone-900">{selectedGrievance.name}</p>
                  <p className="text-sm text-stone-500 mt-1">{selectedGrievance.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
                  <Select value={updateForm.status} onValueChange={(v) => setUpdateForm({ ...updateForm, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Admin Notes</label>
                  <Textarea
                    value={updateForm.admin_notes}
                    onChange={(e) => setUpdateForm({ ...updateForm, admin_notes: e.target.value })}
                    placeholder="Add notes about the resolution..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                    data-testid="grievance-update-submit"
                  >
                    {submitting ? "Updating..." : "Update Status"}
                  </button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default GrievanceDesk;
