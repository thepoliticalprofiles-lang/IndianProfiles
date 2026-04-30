import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Calendar, ChevronRight, Home, Users, Tag } from "lucide-react";
import PublicNavbar from "../../components/shared/PublicNavbar";
import PublicFooter from "../../components/shared/PublicFooter";
import { api } from "../../App";

const ArticlePage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/articles/${id}`);
      setArticle(res.data);
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

  if (!article) {
    return (
      <div className="min-h-screen bg-stone-50">
        <PublicNavbar />
        <div className="pt-24 text-center py-16">
          <p className="text-stone-500">Article not found</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNavbar />

      {/* Breadcrumb */}
      <div className="pt-20 bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm flex-wrap" data-testid="breadcrumb">
            <Link to="/" className="text-stone-500 hover:text-blue-600 flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            {article.constituency_name && (
              <>
                <ChevronRight className="w-4 h-4 text-stone-400" />
                <Link to={`/constituency/${article.constituency_id}`} className="text-stone-500 hover:text-blue-600">
                  {article.constituency_name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-stone-400" />
            <span className="text-stone-900 font-medium line-clamp-1">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Content */}
      <article className="py-8" data-testid="article-content">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="badge-pill bg-blue-100 text-blue-700">{article.article_type}</span>
              {article.constituency_name && (
                <Link 
                  to={`/constituency/${article.constituency_id}`}
                  className="badge-pill bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {article.constituency_name}
                </Link>
              )}
              {article.sub_region_name && (
                <Link 
                  to={`/division/${article.sub_region_id}`}
                  className="badge-pill bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  {article.sub_region_name}
                </Link>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">{article.title}</h1>
            
            {article.event_date && (
              <p className="text-stone-500 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {new Date(article.event_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="mb-8 rounded-2xl overflow-hidden">
              <img 
                src={article.featured_image} 
                alt={article.title} 
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 mb-8">
            <div 
              className="article-content prose max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          {/* Tagged Leaders */}
          {article.tagged_leaders && article.tagged_leaders.length > 0 && (
            <div className="bg-white rounded-2xl p-8 border border-stone-200" data-testid="tagged-leaders">
              <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Leaders Involved
              </h3>
              <div className="flex flex-wrap gap-4">
                {article.tagged_leaders.map((leader) => (
                  <Link
                    key={leader.id}
                    to={`/leader/${leader.id}`}
                    className="flex items-center gap-3 bg-stone-50 rounded-xl p-3 border border-stone-200 hover:border-blue-200 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100">
                      {leader.image_url ? (
                        <img src={leader.image_url} alt={leader.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">{leader.name}</p>
                      <p className="text-sm text-stone-500">{leader.designation}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      <PublicFooter />
    </div>
  );
};

export default ArticlePage;
