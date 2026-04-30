import { useState, useEffect } from "react";
import { Share2, Image as ImageIcon, Twitter, Facebook, Check, Clock, Send, Trash2, ChevronRight } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Textarea } from "../../components/ui/textarea";

const SocialHub = () => {
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [postToTwitter, setPostToTwitter] = useState(true);
  const [postToFacebook, setPostToFacebook] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get("/social-posts?limit=10");
      setPosts(response.data.posts);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMediaUrl(response.data.url);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      setError("Please enter post content");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.post("/social-posts", {
        content: content.trim(),
        media_url: mediaUrl || null,
        post_to_twitter: postToTwitter,
        post_to_facebook: postToFacebook
      });
      
      // Now publish the post
      setPublishing(true);
      const publishResponse = await api.post(`/social-posts/${response.data.id}/publish`);
      
      setSuccess(`Published to ${publishResponse.data.published_to.join(", ")}!`);
      setContent("");
      setMediaUrl("");
      fetchPosts();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
      setPublishing(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/social-posts/${postId}`);
      fetchPosts();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const charCount = content.length;
  const charLimit = 280;

  return (
    <div className="min-h-screen bg-stone-100">
      <AdminSidebar />
      
      <main className="admin-content p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
            <span>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-stone-900">Social Media Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Social Media Hub</h1>
          <p className="text-stone-500 mt-1">Draft, preview and publish posts to social media</p>
        </div>

        {/* Connection Status Banner */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <Twitter className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-stone-600">Twitter: <span className="text-emerald-600 font-medium">Connected</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <Facebook className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-stone-600">Facebook: <span className="text-emerald-600 font-medium">Connected</span></span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-6 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Composer - Left Column (60%) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">Compose Post</h2>
              
              {/* Text Area */}
              <div className="relative mb-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
                  placeholder="What's happening? Share updates with your followers..."
                  className="min-h-[150px] resize-none"
                  maxLength={charLimit}
                />
                <div className={`absolute bottom-3 right-3 text-sm ${charCount > charLimit - 20 ? 'text-orange-500' : 'text-stone-400'}`}>
                  {charCount}/{charLimit}
                </div>
              </div>

              {/* Media Preview */}
              {mediaUrl && (
                <div className="relative mb-4 inline-block">
                  <img src={mediaUrl} alt="Media" className="max-h-48 rounded-lg border border-stone-200" />
                  <button
                    onClick={() => setMediaUrl("")}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Media Upload */}
              <div className="flex items-center gap-4 mb-6">
                <label className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors">
                  <ImageIcon className="w-5 h-5 text-stone-500" />
                  <span className="text-sm text-stone-600">Add Media</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Platform Selection */}
              <div className="border-t border-stone-200 pt-4 mb-6">
                <p className="text-sm font-medium text-stone-700 mb-3">Post to:</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postToTwitter}
                      onChange={(e) => setPostToTwitter(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Twitter className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-stone-600">Twitter</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postToFacebook}
                      onChange={(e) => setPostToFacebook(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-stone-600">Facebook</span>
                  </label>
                </div>
              </div>

              {/* Publish Button */}
              <button
                onClick={handleCreatePost}
                disabled={loading || publishing || !content.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
              >
                {publishing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Publish Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview - Right Column (40%) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-stone-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">Live Preview</h2>
              
              {/* Twitter-style Preview */}
              <div className="border border-stone-200 rounded-xl p-4">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-brand-orange/15 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-orange font-bold">IP</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-stone-900">Indian Profiles</span>
                      <span className="text-stone-400">@indianprofiles</span>
                    </div>
                    
                    <p className="text-stone-800 whitespace-pre-wrap break-words mb-3">
                      {content || "Your post preview will appear here..."}
                    </p>
                    
                    {mediaUrl && (
                      <img src={mediaUrl} alt="Preview" className="rounded-xl border border-stone-200 max-h-48 w-full object-cover mb-3" />
                    )}
                    
                    <div className="flex items-center gap-1 text-stone-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Badges */}
              <div className="mt-4 flex gap-2">
                {postToTwitter && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium flex items-center gap-1">
                    <Twitter className="w-3 h-3" /> Twitter
                  </span>
                )}
                {postToFacebook && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <Facebook className="w-3 h-3" /> Facebook
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Broadcasts */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-stone-900 mb-4">Recent Broadcasts</h2>
          
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Post</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Platforms</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-stone-50">
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-900 line-clamp-2 max-w-md">{post.content}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {post.post_to_twitter && <Twitter className="w-4 h-4 text-blue-400" />}
                          {post.post_to_facebook && <Facebook className="w-4 h-4 text-blue-600" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.status === 'published' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500">
                        {new Date(post.published_at || post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                      No posts yet. Create your first broadcast above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SocialHub;
