import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, Search, ChevronRight, MapPin, X as XIcon } from "lucide-react";
import PublicNavbar from "../../components/shared/PublicNavbar";
import PublicFooter from "../../components/shared/PublicFooter";
import { api } from "../../App";

const LeadersPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all"); // all | State | District | Constituency | Sub-Region
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadersRes, statesRes] = await Promise.all([
          api.get("/leaders"),
          api.get("/states"),
        ]);
        setLeaders(leadersRes.data || []);
        setStates(statesRes.data || []);
      } catch (e) {
        console.error("Failed to fetch leaders:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLeaders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaders.filter((l) => {
      if (levelFilter !== "all" && l.level !== levelFilter) return false;
      if (stateFilter !== "all" && l.state_id !== stateFilter) return false;
      if (q) {
        const hay = `${l.name || ""} ${l.designation || ""} ${l.focus_area || ""} ${l.location_name || ""} ${l.state_name || ""} ${l.district_name || ""} ${l.constituency_name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leaders, search, levelFilter, stateFilter]);

  // Group by level for organized display
  const grouped = useMemo(() => {
    const groups = { State: [], District: [], Constituency: [], "Sub-Region": [] };
    filteredLeaders.forEach((l) => {
      const key = groups[l.level] ? l.level : "Constituency";
      groups[key].push(l);
    });
    return groups;
  }, [filteredLeaders]);

  const hasActiveFilters = search || levelFilter !== "all" || stateFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setLevelFilter("all");
    setStateFilter("all");
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative pt-24 pb-12 bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy text-white overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-orange/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-magenta/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-orange-light mb-3">Our Representatives</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4" data-testid="leaders-page-title">All Leaders</h1>
          <p className="text-blue-100/80 max-w-2xl mx-auto">
            Browse the complete directory of our representatives at every level — State, District, Constituency and Division.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leaders by name, role, constituency…"
                className="w-full pl-12 pr-10 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
                data-testid="leaders-search-input"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                  aria-label="Clear search"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Level filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="py-3 px-4 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
              data-testid="leaders-level-filter"
            >
              <option value="all">All Levels</option>
              <option value="State">State</option>
              <option value="District">District</option>
              <option value="Constituency">Constituency</option>
              <option value="Sub-Region">Sub-Region</option>
            </select>
            {/* State filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="py-3 px-4 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
              data-testid="leaders-state-filter"
            >
              <option value="all">All States</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="py-3 px-5 rounded-xl font-medium border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700"
                data-testid="leaders-clear-filters"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-3 text-sm text-stone-500">
            Showing <span className="font-semibold text-brand-navy">{filteredLeaders.length}</span> of {leaders.length} leaders
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="w-24 h-24 mx-auto bg-stone-200 rounded-full mb-4" />
                <div className="h-4 bg-stone-200 rounded w-3/4 mx-auto mb-2" />
                <div className="h-3 bg-stone-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : filteredLeaders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-stone-200">
            <Users className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 text-lg font-medium">
              {leaders.length === 0 ? "No leaders added yet. Check back later." : "No leaders match your filters."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-5 py-2 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-orange-dark"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(grouped).map(([level, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={level}>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-brand-navy" data-testid={`leaders-group-${level}`}>
                      {level === "Sub-Region" ? "Division" : level} Leaders
                    </h2>
                    <span className="px-3 py-1 bg-brand-orange/15 text-brand-orange rounded-full text-xs font-semibold">
                      {items.length}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-brand-orange/30 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((leader, idx) => (
                      <Link
                        key={leader.id}
                        to={`/leader/${leader.id}`}
                        className="card-hover bg-white rounded-2xl p-6 border border-stone-200 text-center group"
                        data-testid={`leaders-card-${leader.id}`}
                      >
                        <div className="relative w-24 h-24 mx-auto mb-4">
                          {leader.image_url ? (
                            <img
                              src={leader.image_url}
                              alt={leader.name}
                              className="w-24 h-24 rounded-full object-cover border-4 border-brand-orange/20 group-hover:border-brand-orange transition-colors"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-orange to-brand-magenta flex items-center justify-center border-4 border-brand-orange/20">
                              <span className="text-2xl font-bold text-white">{leader.name?.charAt(0) || "?"}</span>
                            </div>
                          )}
                          <span className="absolute -bottom-1 right-0 px-2 py-0.5 bg-brand-navy text-white rounded-full text-[10px] font-semibold uppercase tracking-wider">
                            {leader.level === "Sub-Region" ? "Division" : leader.level}
                          </span>
                        </div>
                        <h3 className="font-bold text-stone-900 group-hover:text-brand-navy transition-colors truncate">
                          {leader.name}
                        </h3>
                        <p className="text-sm text-brand-orange font-medium mt-0.5 truncate">{leader.designation}</p>
                        {(leader.constituency_name || leader.district_name || leader.state_name) && (
                          <p className="text-xs text-stone-500 mt-2 flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {leader.constituency_name || leader.district_name || leader.state_name}
                            </span>
                          </p>
                        )}
                        {leader.bio_summary && (
                          <p className="text-xs text-stone-500 mt-2 line-clamp-2">{leader.bio_summary}</p>
                        )}
                        <div className="mt-4 pt-4 border-t border-stone-100">
                          <span className="text-xs font-semibold text-brand-magenta inline-flex items-center gap-1">
                            View Profile
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  );
};

export default LeadersPage;
