import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Users, FileText, ChevronRight, Home, Calendar } from "lucide-react";
import PublicNavbar from "../../components/shared/PublicNavbar";
import PublicFooter from "../../components/shared/PublicFooter";
import FeaturedVideosSection from "../../components/shared/FeaturedVideosSection";
import { api } from "../../App";

const ConstituencyPage = () => {
  const { id } = useParams();
  const [constituency, setConstituency] = useState(null);
  const [subRegions, setSubRegions] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [constRes, subRes, leadersRes, articlesRes] = await Promise.all([
        api.get(`/constituencies/${id}`),
        api.get(`/sub-regions?constituency_id=${id}`),
        api.get(`/leaders?constituency_id=${id}`),
        api.get(`/articles?constituency_id=${id}&status=published`),
      ]);
      setConstituency(constRes.data);
      setSubRegions(subRes.data);
      setLeaders(leadersRes.data);
      setArticles(articlesRes.data);
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PublicNavbar />
        <div className="pt-24 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!constituency) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PublicNavbar />
        <div className="pt-24 text-center py-16">
          <p className="text-stone-500">Constituency not found</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-blue-600 to-blue-700" data-testid="constituency-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-blue-200 text-sm mb-6" data-testid="breadcrumb">
            <Link to="/" className="hover:text-white flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{constituency.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200 mb-2">{constituency.type}</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{constituency.name}</h1>
              {constituency.description && (
                <p className="text-blue-100 mt-4 max-w-2xl">{constituency.description}</p>
              )}
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{subRegions.length}</p>
                <p className="text-xs text-blue-200">Sub-Regions</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{leaders.length}</p>
                <p className="text-xs text-blue-200">Leaders</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{articles.length}</p>
                <p className="text-xs text-blue-200">Works</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Videos */}
      <FeaturedVideosSection 
        videos={constituency.video_links || []}
        title="Featured Videos"
        subtitle={`Explore ${constituency.name} digitally`}
        areaName={constituency.name}
        themeColor="blue"
      />

      {/* Leaders */}
      {leaders.length > 0 && (
        <section className="py-12 bg-white border-b border-stone-200" data-testid="constituency-leaders">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-stone-900 mb-6">Key Leaders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {leaders.map((leader) => (
                <Link
                  key={leader.id}
                  to={`/leader/${leader.id}`}
                  className="card-hover flex items-center gap-4 bg-stone-50 rounded-xl p-4 border border-stone-200"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 flex-shrink-0">
                    {leader.image_url ? (
                      <img src={leader.image_url} alt={leader.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">{leader.name}</h3>
                    <p className="text-sm text-stone-500">{leader.designation}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sub-Regions Grid */}
      <section className="py-12" data-testid="sub-regions-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-stone-900 mb-6">Divisions / Mandals</h2>
          
          {subRegions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subRegions.map((sr) => (
                <Link
                  key={sr.id}
                  to={`/division/${sr.id}`}
                  className="card-hover bg-white rounded-xl p-6 border border-stone-200 group"
                  data-testid={`sub-region-card-${sr.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-900 group-hover:text-blue-600 transition-colors">
                        {sr.name}
                      </h3>
                      <p className="text-sm text-stone-500 mt-1">{sr.type}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-700" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">Explore</span>
                    <ChevronRight className="w-4 h-4 text-green-700 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
              <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">No sub-regions added yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Activity Feed */}
      <section className="py-12 bg-white" data-testid="activity-feed">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-stone-900 mb-6">Development Works & Activities</h2>
          
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  className="card-hover bg-stone-50 rounded-xl overflow-hidden border border-stone-200 group"
                >
                  {article.featured_image && (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={article.featured_image} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="badge-pill bg-blue-100 text-blue-700">{article.article_type}</span>
                    </div>
                    <h3 className="font-semibold text-stone-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {article.event_date && (
                      <p className="text-sm text-stone-500 mt-2 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(article.event_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">No development works posted yet.</p>
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default ConstituencyPage;
