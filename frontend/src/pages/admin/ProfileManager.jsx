import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, Plus, Edit, Trash2, Search, ArrowLeft, X, Upload, Loader2 } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import AdvancedRichTextEditor from "../../components/shared/AdvancedRichTextEditor";

const ProfileManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [leaders, setLeaders] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [subRegions, setSubRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingLeader, setEditingLeader] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    designation: "",
    level: "Constituency",
    state_id: "",
    district_id: "",
    constituency_id: "",
    sub_region_id: "",
    bio_summary: "",
    biography: "",
    image_url: "",
    phone: "",
    email: "",
    twitter: "",
    facebook: "",
    focus_area: "",
    location_name: "",
    featured_video: "",
    career_timeline: [],
    gallery_photos: [],
    video_links: [],
  });

  const [newEvent, setNewEvent] = useState({ year: "", role: "", description: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Handle image file upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm({ ...form, image_url: response.data.url });
    } catch (err) {
      console.error("Upload failed:", err);
      setError(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (id && leaders.length > 0) {
      const leader = leaders.find(l => l.id === id);
      if (leader) openEditForm(leader);
    }
  }, [id, leaders]);

  const fetchData = async () => {
    try {
      const [leadersRes, statesRes, distRes, constRes, subRes] = await Promise.all([
        api.get("/leaders"),
        api.get("/states"),
        api.get("/districts"),
        api.get("/constituencies"),
        api.get("/sub-regions"),
      ]);
      setLeaders(leadersRes.data);
      setStates(statesRes.data);
      setDistricts(distRes.data);
      setConstituencies(constRes.data);
      setSubRegions(subRes.data);
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (leader) => {
    setEditingLeader(leader);
    setForm({
      name: leader.name || "",
      designation: leader.designation || "",
      level: leader.level || "Constituency",
      state_id: leader.state_id || "",
      district_id: leader.district_id || "",
      constituency_id: leader.constituency_id || "",
      sub_region_id: leader.sub_region_id || "",
      bio_summary: leader.bio_summary || "",
      biography: leader.biography || "",
      image_url: leader.image_url || "",
      phone: leader.phone || "",
      email: leader.email || "",
      twitter: leader.twitter || "",
      facebook: leader.facebook || "",
      career_timeline: leader.career_timeline || [],
      gallery_photos: leader.gallery_photos || [],
      video_links: leader.video_links || [],
      focus_area: leader.focus_area || "",
      location_name: leader.location_name || "",
      featured_video: leader.featured_video || "",
    });
    setShowForm(true);
  };

  const openNewForm = () => {
    setEditingLeader(null);
    setForm({
      name: "", designation: "", level: "Constituency",
      state_id: "", district_id: "", constituency_id: "", sub_region_id: "",
      bio_summary: "", biography: "", image_url: "",
      phone: "", email: "", twitter: "", facebook: "",
      focus_area: "", location_name: "", featured_video: "",
      career_timeline: [], gallery_photos: [], video_links: [],
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingLeader) {
        await api.put(`/leaders/${editingLeader.id}`, form);
      } else {
        await api.post("/leaders", form);
      }
      setShowForm(false);
      navigate("/admin/leaders");
      fetchData();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (leaderId) => {
    if (!window.confirm("Delete this leader profile?")) return;
    try {
      await api.delete(`/leaders/${leaderId}`);
      fetchData();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  const addTimelineEvent = () => {
    if (!newEvent.year || !newEvent.role) return;
    setForm({ ...form, career_timeline: [...form.career_timeline, newEvent] });
    setNewEvent({ year: "", role: "", description: "" });
  };

  const removeTimelineEvent = (index) => {
    setForm({ ...form, career_timeline: form.career_timeline.filter((_, i) => i !== index) });
  };

  const addVideoLink = () => {
    const url = prompt("Enter video URL:");
    if (url) setForm({ ...form, video_links: [...form.video_links, url] });
  };

  const removeVideoLink = (index) => {
    setForm({ ...form, video_links: form.video_links.filter((_, i) => i !== index) });
  };

  // Get filtered lists based on hierarchy
  const filteredDistricts = form.state_id ? districts.filter(d => d.parent_state_id === form.state_id) : districts;
  const filteredConstituencies = form.district_id ? constituencies.filter(c => c.parent_district_id === form.district_id) : constituencies;
  const filteredSubRegions = form.constituency_id ? subRegions.filter(sr => sr.parent_constituency_id === form.constituency_id) : subRegions;

  const filteredLeaders = leaders.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get location display for leader
  const getLocationDisplay = (leader) => {
    const parts = [];
    if (leader.sub_region_name) parts.push(leader.sub_region_name);
    if (leader.constituency_name) parts.push(leader.constituency_name);
    if (leader.district_name) parts.push(leader.district_name);
    if (leader.state_name) parts.push(leader.state_name);
    return parts.join(", ") || "-";
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-stone-50">
        <AdminSidebar />
        <main className="admin-content p-6 lg:p-8" data-testid="profile-form">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => { setShowForm(false); navigate("/admin/leaders"); }} className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{editingLeader ? "Edit Leader Profile" : "Add New Leader"}</h1>
              <p className="text-stone-500">Complete the profile information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="bg-white border border-stone-200 p-1 rounded-xl mb-6">
                <TabsTrigger value="basic" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Basic Info</TabsTrigger>
                <TabsTrigger value="location" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Location</TabsTrigger>
                <TabsTrigger value="biography" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Biography & Timeline</TabsTrigger>
                <TabsTrigger value="media" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Media</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic">
                <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Full Name *</label>
                      <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" data-testid="leader-name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Designation *</label>
                      <Input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g., MLA, Corporator" data-testid="leader-designation" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Level</label>
                    <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="State">State</SelectItem>
                        <SelectItem value="District">District</SelectItem>
                        <SelectItem value="Constituency">Constituency</SelectItem>
                        <SelectItem value="SubRegion">Sub-Region (Division/Mandal/Ward)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Profile Photo</label>
                    <div className="space-y-3">
                      {/* File Upload Area */}
                      <div 
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                          uploading ? 'border-blue-300 bg-blue-50' : 'border-stone-300 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          data-testid="leader-image-upload"
                        />
                        {uploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-sm text-blue-600 font-medium">Uploading...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-stone-400" />
                            <p className="text-sm text-stone-600">
                              <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-stone-400">JPEG, PNG, GIF or WebP (max 5MB)</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Image Preview */}
                      {form.image_url && (
                        <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
                          <img src={form.image_url} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-stone-200" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-700 truncate">Profile Photo</p>
                            <p className="text-xs text-stone-500 truncate">{form.image_url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, image_url: "" })}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Bio Summary</label>
                    <Textarea value={form.bio_summary} onChange={(e) => setForm({ ...form, bio_summary: e.target.value })} placeholder="A brief one-line summary..." rows={2} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-stone-700 mb-2">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXXXXXXX" /></div>
                    <div><label className="block text-sm font-medium text-stone-700 mb-2">Email</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-stone-700 mb-2">Twitter URL</label><Input value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="https://twitter.com/..." /></div>
                    <div><label className="block text-sm font-medium text-stone-700 mb-2">Facebook URL</label><Input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://facebook.com/..." /></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-stone-700 mb-2">Focus Area</label><Input value={form.focus_area} onChange={(e) => setForm({ ...form, focus_area: e.target.value })} placeholder="e.g., Urban Development, Healthcare" /></div>
                    <div><label className="block text-sm font-medium text-stone-700 mb-2">Location Name</label><Input value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} placeholder="e.g., Hyderabad, Telangana" /></div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Featured Video URL (YouTube)</label>
                    <Input value={form.featured_video} onChange={(e) => setForm({ ...form, featured_video: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                    <p className="text-xs text-stone-500 mt-1">This video will be highlighted at the top of the videos section</p>
                  </div>
                </div>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location">
                <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
                  <h3 className="font-semibold text-stone-900">Assign Location (Hierarchy: State → District → Constituency → Sub-Region)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">State</label>
                      <Select value={form.state_id} onValueChange={(v) => setForm({ ...form, state_id: v, district_id: "", constituency_id: "", sub_region_id: "" })}>
                        <SelectTrigger data-testid="leader-state"><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent>{states.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">District</label>
                      <Select value={form.district_id} onValueChange={(v) => setForm({ ...form, district_id: v, constituency_id: "", sub_region_id: "" })} disabled={!form.state_id && filteredDistricts.length === 0}>
                        <SelectTrigger data-testid="leader-district"><SelectValue placeholder="Select District" /></SelectTrigger>
                        <SelectContent>{filteredDistricts.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Constituency</label>
                      <Select value={form.constituency_id} onValueChange={(v) => setForm({ ...form, constituency_id: v, sub_region_id: "" })} disabled={!form.district_id && filteredConstituencies.length === 0}>
                        <SelectTrigger data-testid="leader-constituency"><SelectValue placeholder="Select Constituency" /></SelectTrigger>
                        <SelectContent>{filteredConstituencies.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Sub-Region (Division/Mandal/Ward)</label>
                      <Select value={form.sub_region_id} onValueChange={(v) => setForm({ ...form, sub_region_id: v })} disabled={!form.constituency_id && filteredSubRegions.length === 0}>
                        <SelectTrigger data-testid="leader-subregion"><SelectValue placeholder="Select Sub-Region" /></SelectTrigger>
                        <SelectContent>{filteredSubRegions.map((sr) => (<SelectItem key={sr.id} value={sr.id}>{sr.name} ({sr.type})</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Biography & Timeline Tab */}
              <TabsContent value="biography">
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h3 className="font-semibold text-stone-900 mb-4">Full Biography</h3>
                    <AdvancedRichTextEditor 
                      value={form.biography} 
                      onChange={(v) => setForm({ ...form, biography: v })} 
                      placeholder="Write detailed biography... Use @ to mention leaders and # to tag areas"
                      leaders={leaders}
                      areas={[
                        ...states.map(s => ({ id: s.id, name: s.name, label: s.name, type: 'State' })),
                        ...districts.map(d => ({ id: d.id, name: d.name, label: d.name, type: 'District' })),
                        ...constituencies.map(c => ({ id: c.id, name: c.name, label: c.name, type: 'Constituency' })),
                        ...subRegions.map(sr => ({ id: sr.id, name: sr.name, label: sr.name, type: 'Sub-Region' }))
                      ]}
                      onUploadImage={async (file) => {
                        const formData = new FormData();
                        formData.append("file", file);
                        const response = await api.post("/upload/image", formData, {
                          headers: { "Content-Type": "multipart/form-data" },
                        });
                        return response.data.url;
                      }}
                    />
                  </div>

                  <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h3 className="font-semibold text-stone-900 mb-4">Career Timeline</h3>
                    {form.career_timeline.length > 0 && (
                      <div className="space-y-3 mb-6">
                        {form.career_timeline.map((event, index) => (
                          <div key={index} className="flex items-start gap-3 bg-stone-50 rounded-lg p-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-blue-600">{event.year}</span>
                                <span className="font-medium text-stone-900">{event.role}</span>
                              </div>
                              {event.description && <p className="text-sm text-stone-600 mt-1">{event.description}</p>}
                            </div>
                            <button type="button" onClick={() => removeTimelineEvent(index)} className="p-1 text-stone-400 hover:text-red-600"><X className="w-5 h-5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input value={newEvent.year} onChange={(e) => setNewEvent({ ...newEvent, year: e.target.value })} placeholder="Year (e.g., 2020)" />
                      <Input value={newEvent.role} onChange={(e) => setNewEvent({ ...newEvent, role: e.target.value })} placeholder="Role/Position" />
                      <Input value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Description (optional)" />
                      <button type="button" onClick={addTimelineEvent} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Add Event</button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media">
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                  <h3 className="font-semibold text-stone-900 mb-4">Video Links</h3>
                  {form.video_links.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {form.video_links.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 bg-stone-50 rounded-lg p-3">
                          <span className="flex-1 truncate text-sm text-stone-600">{url}</span>
                          <button type="button" onClick={() => removeVideoLink(index)} className="p-1 text-stone-400 hover:text-red-600"><X className="w-5 h-5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={addVideoLink} className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Video Link
                  </button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); navigate("/admin/leaders"); }} className="px-6 py-3 text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={submitting} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50" data-testid="leader-submit">
                {submitting ? "Saving..." : (editingLeader ? "Update Profile" : "Create Profile")}
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="admin-content p-6 lg:p-8" data-testid="profile-manager">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Profile Manager</h1>
            <p className="text-stone-500">Manage leader profiles</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input placeholder="Search leaders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" data-testid="leader-search" />
            </div>
            <button onClick={openNewForm} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2" data-testid="add-leader-btn">
              <Plus className="w-5 h-5" /> Add Leader
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
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Leader</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Designation</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Location</th>
                    <th className="px-5 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLeaders.length > 0 ? filteredLeaders.map((leader) => (
                    <tr key={leader.id} className="hover:bg-stone-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 flex-shrink-0">
                            {leader.image_url ? <img src={leader.image_url} alt={leader.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>}
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{leader.name}</p>
                            <p className="text-sm text-stone-500">{leader.level}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-600">{leader.designation}</td>
                      <td className="px-5 py-4 text-stone-600 text-sm">{getLocationDisplay(leader)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditForm(leader)} className="p-2 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" data-testid={`edit-leader-${leader.id}`}><Edit className="w-5 h-5" /></button>
                          <button onClick={() => handleDelete(leader.id)} className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg" data-testid={`delete-leader-${leader.id}`}><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-stone-500">No leaders found. Click "Add Leader" to create one.</td></tr>
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

export default ProfileManager;
