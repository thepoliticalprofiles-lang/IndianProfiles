import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, FileText, MessageSquare, UserPlus, Calendar, TrendingUp, Clock, ArrowRight } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api } from "../../App";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [pendingGrievances, setPendingGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, articlesRes, grievancesRes] = await Promise.all([
        api.get("/stats"),
        api.get("/articles?status=published"),
        api.get("/grievances?status=pending"),
      ]);
      setStats(statsRes.data);
      setRecentArticles(articlesRes.data.slice(0, 5));
      setPendingGrievances(grievancesRes.data.slice(0, 5));
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: "Constituencies", value: stats.constituencies, icon: MapPin, color: "orange", link: "/admin/geography" },
    { label: "Sub-Regions", value: stats.sub_regions, icon: MapPin, color: "green", link: "/admin/geography" },
    { label: "Leaders", value: stats.leaders, icon: Users, color: "blue", link: "/admin/leaders" },
    { label: "Articles", value: stats.articles, icon: FileText, color: "purple", link: "/admin/articles" },
    { label: "Pending Grievances", value: stats.grievances_pending, icon: MessageSquare, color: "red", link: "/admin/grievances" },
    { label: "Pending Volunteers", value: stats.volunteers_pending, icon: UserPlus, color: "teal", link: "/admin/volunteers" },
    { label: "Events", value: stats.events, icon: Calendar, color: "amber", link: "/admin/events" },
  ] : [];

  const colorClasses = {
    orange: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    red: "bg-red-50 text-red-600 border-red-200",
    teal: "bg-teal-50 text-teal-600 border-teal-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar />
      
      <main className="admin-content p-6 lg:p-8" data-testid="admin-dashboard">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-500">Overview of your Indian Profiles platform</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((stat, index) => (
                <Link
                  key={index}
                  to={stat.link}
                  className={`card-hover rounded-xl p-5 border ${colorClasses[stat.color]}`}
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="w-6 h-6" />
                    <TrendingUp className="w-4 h-4 opacity-50" />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm opacity-75 mt-1">{stat.label}</p>
                </Link>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Articles */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                  <h2 className="font-semibold text-stone-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Recent Articles
                  </h2>
                  <Link to="/admin/articles" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-stone-100">
                  {recentArticles.length > 0 ? (
                    recentArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/admin/articles/${article.id}`}
                        className="block p-4 hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {article.featured_image && (
                            <img src={article.featured_image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-900 truncate">{article.title}</p>
                            <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(article.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-6 text-center text-stone-500">
                      No articles yet. <Link to="/admin/articles" className="text-blue-600 hover:underline">Create one</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Grievances */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                  <h2 className="font-semibold text-stone-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                    Pending Grievances
                  </h2>
                  <Link to="/admin/grievances" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="divide-y divide-stone-100">
                  {pendingGrievances.length > 0 ? (
                    pendingGrievances.map((grievance) => (
                      <div key={grievance.id} className="p-4 hover:bg-stone-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-900">{grievance.name}</p>
                            <p className="text-sm text-stone-600 truncate mt-1">{grievance.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="badge-pill bg-red-100 text-red-700">{grievance.category}</span>
                              {grievance.constituency_name && (
                                <span className="badge-pill bg-stone-100 text-stone-700">{grievance.constituency_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-stone-500">
                      No pending grievances
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin/geography" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors">
                  <MapPin className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">Add Constituency</p>
                </Link>
                <Link to="/admin/leaders" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">Add Leader</p>
                </Link>
                <Link to="/admin/articles" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">New Article</p>
                </Link>
                <Link to="/admin/events" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors">
                  <Calendar className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">Add Event</p>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
