import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Plus, Edit, Trash2, Search, ArrowLeft, Calendar, Tag, X, Users, MapPin, AtSign, Hash } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import RichTextEditorWithMentions from "../../components/shared/RichTextEditorWithMentions";

// Leader Search Tag Component
const LeaderTagInput = ({ leaders, selectedIds, onChange }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredLeaders = leaders.filter(leader => 
    !selectedIds.includes(leader.id) &&
    (leader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (leader.designation && leader.designation.toLowerCase().includes(searchQuery.toLowerCase())))
  ).slice(0, 10); // Limit to 10 results

  const selectedLeaders = leaders.filter(l => selectedIds.includes(l.id));

  const addLeader = (leader) => {
    onChange([...selectedIds, leader.id]);
    setSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeLeader = (leaderId) => {
    onChange(selectedIds.filter(id => id !== leaderId));
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredLeaders.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && showDropdown && filteredLeaders[highlightedIndex]) {
      e.preventDefault();
      addLeader(filteredLeaders[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    } else if (e.key === "Backspace" && !searchQuery && selectedIds.length > 0) {
      removeLeader(selectedIds[selectedIds.length - 1]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-stone-700 mb-2">Tag Leaders Involved</label>
      
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedLeaders.map(leader => (
          <span 
            key={leader.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            <Users className="w-3.5 h-3.5" />
            {leader.name}
            <button 
              type="button"
              onClick={() => removeLeader(leader.id)}
              className="hover:bg-blue-200 rounded-full p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search leaders to tag..."
          className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && searchQuery && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredLeaders.length > 0 ? (
            filteredLeaders.map((leader, index) => (
              <button
                key={leader.id}
                type="button"
                onClick={() => addLeader(leader)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-stone-50'
                }`}
              >
                {leader.image_url ? (
                  <img src={leader.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-stone-900 text-sm">{leader.name}</p>
                  <p className="text-xs text-stone-500">{leader.designation}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-stone-500 text-center">
              No leaders found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
      
      <p className="text-xs text-stone-500 mt-1.5">
        <AtSign className="w-3 h-3 inline mr-1" />
        You can also type @ in the content to mention leaders
      </p>
    </div>
  );
};

const ArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [subRegions, setSubRegions] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit mode
  const [editingArticle, setEditingArticle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    content: "",
    event_date: "",
    featured_image: "",
    constituency_id: "",
    sub_region_id: "",
    tagged_leader_ids: [],
    article_type: "development",
    status: "published",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (id && articles.length > 0) {
      const article = articles.find(a => a.id === id);
      if (article) {
        openEditForm(article);
      }
    }
  }, [id, articles]);

  const fetchData = async () => {
    try {
      const [articlesRes, constRes, subRes, leadersRes] = await Promise.all([
        api.get("/articles"),
        api.get("/constituencies"),
        api.get("/sub-regions"),
        api.get("/leaders"),
      ]);
      setArticles(articlesRes.data);
      setConstituencies(constRes.data);
      setSubRegions(subRes.data);
      setLeaders(leadersRes.data);
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubRegionsForConst = (constId) => {
    return subRegions.filter(sr => sr.parent_constituency_id === constId);
  };

  const openEditForm = (article) => {
    setEditingArticle(article);
    setForm({
      title: article.title || "",
      content: article.content || "",
      event_date: article.event_date || "",
      featured_image: article.featured_image || "",
      constituency_id: article.constituency_id || "",
      sub_region_id: article.sub_region_id || "",
      tagged_leader_ids: article.tagged_leader_ids || [],
      article_type: article.article_type || "development",
      status: article.status || "published",
    });
    setShowForm(true);
  };

  const openNewForm = () => {
    setEditingArticle(null);
    setForm({
      title: "",
      content: "",
      event_date: "",
      featured_image: "",
      constituency_id: "",
      sub_region_id: "",
      tagged_leader_ids: [],
      article_type: "development",
      status: "published",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (editingArticle) {
        await api.put(`/articles/${editingArticle.id}`, form);
      } else {
        await api.post("/articles", form);
      }
      setShowForm(false);
      navigate("/admin/articles");
      fetchData();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm("Delete this article?")) return;

    try {
      await api.delete(`/articles/${articleId}`);
      fetchData();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  // Handle mentions from content editor
  const handleMention = useCallback((type, item) => {
    if (type === 'leader' && !form.tagged_leader_ids.includes(item.id)) {
      setForm(prev => ({
        ...prev,
        tagged_leader_ids: [...prev.tagged_leader_ids, item.id]
      }));
    } else if (type === 'area' && !form.constituency_id) {
      setForm(prev => ({
        ...prev,
        constituency_id: item.id
      }));
    }
  }, [form.tagged_leader_ids, form.constituency_id]);

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showForm) {
    const availableSubRegions = form.constituency_id ? fetchSubRegionsForConst(form.constituency_id) : [];

    return (
      <div className="min-h-screen bg-stone-50">
        <AdminSidebar />

        <main className="admin-content p-6 lg:p-8" data-testid="article-form">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => { setShowForm(false); navigate("/admin/articles"); }}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                {editingArticle ? "Edit Article" : "Create New Article"}
              </h1>
              <p className="text-stone-500">Add development work or news</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - 60% */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Article Title *</label>
                    <Input
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Enter article title"
                      className="text-lg"
                      data-testid="article-title"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Event Date</label>
                      <Input
                        type="date"
                        value={form.event_date}
                        onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                        data-testid="article-date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Featured Image URL</label>
                      <Input
                        value={form.featured_image}
                        onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                        placeholder="https://..."
                        data-testid="article-image"
                      />
                    </div>
                  </div>

                  {form.featured_image && (
                    <img src={form.featured_image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Article Content *</label>
                    <RichTextEditorWithMentions
                      value={form.content}
                      onChange={(v) => setForm({ ...form, content: v })}
                      placeholder="Write article content..."
                      leaders={leaders}
                      constituencies={constituencies}
                      subRegions={subRegions}
                      onMention={handleMention}
                    />
                  </div>
                </div>
              </div>

              {/* Tagging & Publishing - 40% */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
                  <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-600" />
                    Tagging & Relations
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Article Type</label>
                    <Select value={form.article_type} onValueChange={(v) => setForm({ ...form, article_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development Work</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Select Constituency</label>
                    <Select 
                      value={form.constituency_id} 
                      onValueChange={(v) => setForm({ ...form, constituency_id: v, sub_region_id: "" })}
                    >
                      <SelectTrigger data-testid="article-constituency">
                        <SelectValue placeholder="Select Constituency" />
                      </SelectTrigger>
                      <SelectContent>
                        {constituencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-stone-500 mt-1">
                      <Hash className="w-3 h-3 inline mr-1" />
                      Type # in content to tag areas
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Select Division/Mandal</label>
                    <Select 
                      value={form.sub_region_id} 
                      onValueChange={(v) => setForm({ ...form, sub_region_id: v })}
                      disabled={!form.constituency_id}
                    >
                      <SelectTrigger data-testid="article-subregion">
                        <SelectValue placeholder="Select Division" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubRegions.map((sr) => (
                          <SelectItem key={sr.id} value={sr.id}>{sr.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Leader Tag Input with Search */}
                  <LeaderTagInput 
                    leaders={leaders}
                    selectedIds={form.tagged_leader_ids}
                    onChange={(ids) => setForm({ ...form, tagged_leader_ids: ids })}
                  />

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Status</label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition-colors"
                  data-testid="article-submit"
                >
                  {submitting ? "Saving..." : (editingArticle ? "Update Article" : "Publish Article")}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar />

      <main className="admin-content p-6 lg:p-8" data-testid="article-editor">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Article Editor</h1>
            <p className="text-stone-500">Manage development works and news articles</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="article-search"
              />
            </div>
            <button
              onClick={openNewForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              data-testid="add-article-btn"
            >
              <Plus className="w-5 h-5" />
              New Article
            </button>
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
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Article</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Type</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Location</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Status</th>
                    <th className="px-5 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-stone-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {article.featured_image ? (
                              <img src={article.featured_image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-stone-900 line-clamp-1">{article.title}</p>
                              {article.event_date && (
                                <p className="text-sm text-stone-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(article.event_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="badge-pill bg-blue-100 text-blue-700">{article.article_type}</span>
                        </td>
                        <td className="px-5 py-4 text-stone-600">
                          {article.constituency_name || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`badge-pill ${article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-700'}`}>
                            {article.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditForm(article)}
                              className="p-2 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              data-testid={`edit-article-${article.id}`}
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(article.id)}
                              className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              data-testid={`delete-article-${article.id}`}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-stone-500">
                        No articles found. Click "New Article" to create one.
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

export default ArticleEditor;
