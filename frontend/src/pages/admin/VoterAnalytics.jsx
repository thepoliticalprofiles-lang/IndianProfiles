import { useState, useEffect } from "react";
import { Search, Download, Upload, User, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const VoterAnalytics = () => {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState("name");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchVoters();
    fetchStats();
  }, [page, search, searchBy]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        search_by: searchBy
      });
      if (search) params.append("search", search);
      
      const response = await api.get(`/voters?${params}`);
      setVoters(response.data.voters);
      setTotalPages(response.data.total_pages);
      setTotal(response.data.total);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/voters/stats/summary");
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVoters();
  };

  const handleExport = () => {
    // Create CSV from current voters
    const headers = ["EPIC No", "Name", "Age", "Gender", "Father/Husband", "House No", "Booth No", "Address"];
    const rows = voters.map(v => [
      v.epic_number, v.full_name, v.age, v.gender, v.relative_name, v.house_number, v.booth_number, v.address
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c || ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voter_list.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <AdminSidebar />
      
      <main className="admin-content p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
            <span>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-stone-900">Voter Analytics Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Voter Analytics Hub</h1>
          <p className="text-stone-500 mt-1">Search and manage voter data with EPIC card view</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-stone-200">
              <p className="text-2xl font-bold text-blue-600">{stats.total_voters.toLocaleString()}</p>
              <p className="text-sm text-stone-500">Total Voters</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-stone-200">
              <p className="text-2xl font-bold text-emerald-600">{stats.male_voters.toLocaleString()}</p>
              <p className="text-sm text-stone-500">Male Voters</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-stone-200">
              <p className="text-2xl font-bold text-pink-600">{stats.female_voters.toLocaleString()}</p>
              <p className="text-sm text-stone-500">Female Voters</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-stone-200">
              <p className="text-2xl font-bold text-stone-700">{stats.total_booths}</p>
              <p className="text-sm text-stone-500">Total Booths</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search voters..."
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select value={searchBy} onValueChange={setSearchBy}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Search by Name</SelectItem>
                <SelectItem value="epic">Search by EPIC No.</SelectItem>
                <SelectItem value="booth">Search by Booth No.</SelectItem>
                <SelectItem value="house">Search by House No.</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-stone-100">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Filtered List
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Voter EPIC Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse border border-stone-200">
                <div className="h-4 bg-stone-200 rounded w-3/4 mb-3"></div>
                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-stone-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-stone-200 rounded"></div>
                    <div className="h-3 bg-stone-200 rounded w-3/4"></div>
                    <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : voters.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {voters.map((voter) => (
                <div
                  key={voter.id}
                  className="bg-white rounded-lg border border-stone-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
                  }}
                >
                  {/* Header */}
                  <div className="bg-stone-50 px-3 py-2 border-b border-stone-200">
                    <p className="text-[10px] text-stone-500 text-center font-medium tracking-wider">
                      ELECTION COMMISSION OF INDIA
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex gap-4">
                    {/* Photo */}
                    <div className="w-20 h-24 bg-stone-100 rounded border border-stone-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {voter.photo_url ? (
                        <img src={voter.photo_url} alt={voter.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-stone-300" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase">EPIC No:</p>
                        <p className="text-sm font-bold text-blue-600 truncate">{voter.epic_number}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase">Name:</p>
                        <p className="text-sm font-semibold text-stone-900 truncate">{voter.full_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase">Father's Name:</p>
                        <p className="text-xs text-stone-600 truncate">{voter.relative_name || "-"}</p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[10px] text-stone-400 uppercase">Gender/Age:</p>
                          <p className="text-xs text-stone-600">{voter.gender || "-"} / {voter.age || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-3">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase">Address:</p>
                      <p className="text-xs text-stone-600 line-clamp-2">
                        {voter.house_number ? `H.No: ${voter.house_number}, ` : ""}
                        {voter.address || "-"}
                      </p>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-[10px] text-stone-400">Booth: {voter.booth_number || "-"}</span>
                      <span className="text-[10px] text-stone-400">{voter.location_name || ""}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-sm text-stone-500">
                Showing {((page - 1) * 12) + 1} - {Math.min(page * 12, total)} of {total} voters
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <User className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-stone-900 mb-2">No Voters Found</h3>
            <p className="text-stone-500">
              {search ? "No voters match your search criteria." : "No voter data has been imported yet."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VoterAnalytics;
