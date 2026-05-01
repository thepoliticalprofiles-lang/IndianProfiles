import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Newspaper, Search, Calendar, MapPin, ChevronRight, X as XIcon, Filter } from "lucide-react";
import PublicNavbar from "../../components/shared/PublicNavbar";
import PublicFooter from "../../components/shared/PublicFooter";
import { api } from "../../App";

const ArticlesPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await api.get("/articles?status=published");
        setArticles(res.data || []);
      } catch (e) {
        console.error("Failed to fetch articles:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const articleTypes = useMemo(() => {
    const set = new Set();
    articles.forEach((a) => a.article_type && set.add(a.article_type));
    return Array.from(set);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (typeFilter !== "all" && a.article_type !== typeFilter) return false;
      if (q) {
        const hay = `${a.title || ""} ${a.content || ""} ${a.constituency_name || ""} ${a.sub_region_name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, search, typeFilter]);

  const featured = filteredArticles[0];
  const rest = filteredArticles.slice(1);

  const hasActiveFilters = search || typeFilter !== "all";
  const clearFilters = () => { setSearch(""); setTypeFilter("all"); };

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  };

  const articleTypeColors = {
    development: "bg-brand-orange/10 text-brand-orange",
    announcement: "bg-brand-magenta/10 text-brand-magenta",
    news: "bg-brand-navy/10 text-brand-navy",
    event: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative pt-24 pb-12 bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy text-white overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-orange/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-magenta/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-orange-light mb-3">Latest Updates</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4" data-testid="articles-page-title">All Articles</h1>
          <p className="text-blue-100/80 max-w-2xl mx-auto">
            Stay up to date with the latest development works, announcements and news from our representatives across constituencies.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles by title or constituency…"
                className="w-full pl-12 pr-10 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
                data-testid="articles-search-input"
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-stone-500 flex items-center gap-1"><Filter className="w-3 h-3" /> Type:</span>
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  typeFilter === "all"
                    ? "bg-brand-navy text-white shadow-md"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
                data-testid="articles-type-all"
              >
                All
              </button>
              {articleTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all ${
                    typeFilter === t
                      ? "bg-brand-orange text-white shadow-md"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                  data-testid={`articles-type-${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="py-3 px-5 rounded-xl font-medium border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm"
                data-testid="articles-clear-filters"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-3 text-sm text-stone-500">
            Showing <span className="font-semibold text-brand-navy">{filteredArticles.length}</span> of {articles.length} articles
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-stone-200" />
                <div className="p-6">
                  <div className="h-4 bg-stone-200 rounded w-1/3 mb-3" />
                  <div className="h-5 bg-stone-200 rounded w-full mb-2" />
                  <div className="h-4 bg-stone-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-stone-200">
            <Newspaper className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 text-lg font-medium">
              {articles.length === 0 ? "No articles published yet. Check back later." : "No articles match your filters."}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-orange-dark">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featured && (
              <Link
                to={`/article/${featured.id}`}
                className="block card-hover bg-white rounded-3xl overflow-hidden border border-stone-200 mb-10 group"
                data-testid="articles-featured"
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative h-64 md:h-auto overflow-hidden bg-stone-100">
                    {featured.featured_image ? (
                      <img
                        src={featured.featured_image}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-orange/20 to-brand-magenta/20">
                        <Newspaper className="w-16 h-16 text-brand-orange" />
                      </div>
                    )}
                    <span className="absolute top-4 left-4 px-3 py-1 bg-brand-magenta text-white text-xs font-bold uppercase rounded-full tracking-wider">Featured</span>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {featured.article_type && (
                        <span className={`badge-pill capitalize ${articleTypeColors[featured.article_type] || "bg-stone-100 text-stone-700"}`}>
                          {featured.article_type}
                        </span>
                      )}
                      {featured.constituency_name && (
                        <span className="badge-pill bg-brand-navy/10 text-brand-navy">
                          <MapPin className="w-3 h-3 mr-1" />
                          {featured.constituency_name}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-brand-navy group-hover:text-brand-orange transition-colors line-clamp-3">
                      {featured.title}
                    </h2>
                    <p className="text-stone-600 mt-4 line-clamp-3">
                      {stripHtml(featured.content)}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      {(featured.event_date || featured.created_at) && (
                        <span className="text-sm text-stone-500 inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(featured.event_date || featured.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className="text-sm text-brand-magenta font-semibold inline-flex items-center gap-1">
                        Read article
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((article) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.id}`}
                    className="card-hover bg-white rounded-2xl overflow-hidden border border-stone-200 group flex flex-col"
                    data-testid={`articles-card-${article.id}`}
                  >
                    <div className="h-48 overflow-hidden bg-stone-100 relative">
                      {article.featured_image ? (
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-orange/15 to-brand-magenta/15">
                          <Newspaper className="w-12 h-12 text-brand-orange" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {article.article_type && (
                          <span className={`badge-pill capitalize ${articleTypeColors[article.article_type] || "bg-stone-100 text-stone-700"}`}>
                            {article.article_type}
                          </span>
                        )}
                        {article.constituency_name && (
                          <span className="badge-pill bg-brand-navy/10 text-brand-navy">{article.constituency_name}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-stone-900 group-hover:text-brand-orange transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-stone-500 mt-2 line-clamp-2 flex-1">
                        {stripHtml(article.content)}
                      </p>
                      {(article.event_date || article.created_at) && (
                        <p className="text-xs text-stone-400 mt-4 inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.event_date || article.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <PublicFooter />
    </div>
  );
};

export default ArticlesPage;
