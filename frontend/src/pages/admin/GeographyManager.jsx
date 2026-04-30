import { useState, useEffect } from "react";
import { MapPin, Plus, Edit, Trash2, Search, Building, Globe, Youtube } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import VideoLinksInput from "../../components/shared/VideoLinksInput";

const GeographyManager = () => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [subRegions, setSubRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showConstModal, setShowConstModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  
  const [editingState, setEditingState] = useState(null);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [editingConst, setEditingConst] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [stateForm, setStateForm] = useState({ name: "", code: "", description: "", image_url: "", video_links: [] });
  const [districtForm, setDistrictForm] = useState({ name: "", parent_state_id: "", description: "", image_url: "", video_links: [] });
  const [constForm, setConstForm] = useState({ name: "", type: "Assembly", parent_district_id: "", description: "", image_url: "", video_links: [] });
  const [subForm, setSubForm] = useState({ name: "", type: "Division", parent_constituency_id: "", description: "", video_links: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statesRes, distRes, constRes, subRes] = await Promise.all([
        api.get("/states"),
        api.get("/districts"),
        api.get("/constituencies"),
        api.get("/sub-regions"),
      ]);
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

  // State CRUD
  const openStateModal = (state = null) => {
    setError("");
    if (state) {
      setEditingState(state);
      setStateForm({ name: state.name, code: state.code || "", description: state.description || "", image_url: state.image_url || "", video_links: state.video_links || [] });
    } else {
      setEditingState(null);
      setStateForm({ name: "", code: "", description: "", image_url: "", video_links: [] });
    }
    setShowStateModal(true);
  };

  const handleStateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Convert video_links array to JSON string for video_url
      const payload = {
        name: stateForm.name,
        code: stateForm.code,
        description: stateForm.description,
        image_url: stateForm.image_url,
        video_url: stateForm.video_links.length > 0 ? JSON.stringify(stateForm.video_links) : null
      };
      if (editingState) {
        await api.put(`/states/${editingState.id}`, payload);
      } else {
        await api.post("/states", payload);
      }
      setShowStateModal(false);
      fetchData();
    } catch (err) {
      console.error("State submit error:", err.response?.data || err);
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStateDelete = async (id) => {
    if (!window.confirm("Delete this state? This will delete all districts, constituencies and sub-regions.")) return;
    try {
      await api.delete(`/states/${id}`);
      fetchData();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  // District CRUD
  const openDistrictModal = (district = null) => {
    setError("");
    if (district) {
      setEditingDistrict(district);
      setDistrictForm({ name: district.name, parent_state_id: district.parent_state_id || "", description: district.description || "", image_url: district.image_url || "", video_links: district.video_links || [] });
    } else {
      setEditingDistrict(null);
      setDistrictForm({ name: "", parent_state_id: "", description: "", image_url: "", video_links: [] });
    }
    setShowDistrictModal(true);
  };

  const handleDistrictSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Convert video_links array to JSON string for video_url
      const payload = {
        name: districtForm.name,
        parent_state_id: districtForm.parent_state_id,
        description: districtForm.description,
        image_url: districtForm.image_url,
        video_url: districtForm.video_links.length > 0 ? JSON.stringify(districtForm.video_links) : null
      };
      if (editingDistrict) {
        await api.put(`/districts/${editingDistrict.id}`, payload);
      } else {
        await api.post("/districts", payload);
      }
      setShowDistrictModal(false);
      fetchData();
    } catch (err) {
      console.error("District submit error:", err.response?.data || err);
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDistrictDelete = async (id) => {
    if (!window.confirm("Delete this district? This will delete all constituencies and sub-regions.")) return;
    try {
      await api.delete(`/districts/${id}`);
      fetchData();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  // Constituency CRUD
  const openConstModal = (constituency = null) => {
    setError("");
    if (constituency) {
      setEditingConst(constituency);
      setConstForm({ name: constituency.name, type: constituency.type, parent_district_id: constituency.parent_district_id || "", description: constituency.description || "", image_url: constituency.image_url || "", video_links: constituency.video_links || [] });
    } else {
      setEditingConst(null);
      setConstForm({ name: "", type: "Assembly", parent_district_id: "", description: "", image_url: "", video_links: [] });
    }
    setShowConstModal(true);
  };

  const handleConstSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Convert video_links array to JSON string for video_url
      const payload = {
        name: constForm.name,
        type: constForm.type,
        parent_district_id: constForm.parent_district_id,
        description: constForm.description,
        image_url: constForm.image_url,
        video_url: constForm.video_links.length > 0 ? JSON.stringify(constForm.video_links) : null
      };
      if (editingConst) {
        await api.put(`/constituencies/${editingConst.id}`, payload);
      } else {
        await api.post("/constituencies", payload);
      }
      setShowConstModal(false);
      fetchData();
    } catch (err) {
      console.error("Constituency submit error:", err.response?.data || err);
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConstDelete = async (id) => {
    if (!window.confirm("Delete this constituency? This will delete all sub-regions.")) return;
    try {
      await api.delete(`/constituencies/${id}`);
      fetchData();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  // Sub-Region CRUD
  const openSubModal = (subRegion = null) => {
    setError("");
    if (subRegion) {
      setEditingSub(subRegion);
      setSubForm({ name: subRegion.name, type: subRegion.type, parent_constituency_id: subRegion.parent_constituency_id, description: subRegion.description || "", video_links: subRegion.video_links || [] });
    } else {
      setEditingSub(null);
      setSubForm({ name: "", type: "Division", parent_constituency_id: "", description: "", video_links: [] });
    }
    setShowSubModal(true);
  };

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      // Convert video_links array to JSON string for video_url
      const payload = {
        name: subForm.name,
        type: subForm.type,
        parent_constituency_id: subForm.parent_constituency_id,
        description: subForm.description,
        video_url: subForm.video_links.length > 0 ? JSON.stringify(subForm.video_links) : null
      };
      if (editingSub) {
        await api.put(`/sub-regions/${editingSub.id}`, payload);
      } else {
        await api.post("/sub-regions", payload);
      }
      setShowSubModal(false);
      fetchData();
    } catch (err) {
      console.error("Sub-region submit error:", err.response?.data || err);
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubDelete = async (id) => {
    if (!window.confirm("Delete this sub-region?")) return;
    try {
      await api.delete(`/sub-regions/${id}`);
      fetchData();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  // Filtering
  const filteredStates = states.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDistricts = districts.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredConstituencies = constituencies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSubRegions = subRegions.filter(sr => sr.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar />
      
      <main className="admin-content p-6 lg:p-8" data-testid="geography-manager">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Geography Manager</h1>
            <p className="text-stone-500">State → District → Constituency → Division/Mandal/Ward</p>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" data-testid="geography-search" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Tabs defaultValue="states" className="w-full">
            <TabsList className="bg-white border border-stone-200 p-1 rounded-xl mb-6 flex flex-wrap">
              <TabsTrigger value="states" className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white">States ({states.length})</TabsTrigger>
              <TabsTrigger value="districts" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Districts ({districts.length})</TabsTrigger>
              <TabsTrigger value="constituencies" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Constituencies ({constituencies.length})</TabsTrigger>
              <TabsTrigger value="subregions" className="rounded-lg data-[state=active]:bg-green-700 data-[state=active]:text-white">Sub-Regions ({subRegions.length})</TabsTrigger>
            </TabsList>

            {/* States Tab */}
            <TabsContent value="states">
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                  <h2 className="font-semibold text-stone-900">All States</h2>
                  <button onClick={() => openStateModal()} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2" data-testid="add-state-btn">
                    <Plus className="w-5 h-5" /> Add State
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Name</th>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Code</th>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Districts</th>
                        <th className="px-5 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredStates.length > 0 ? filteredStates.map((state) => (
                        <tr key={state.id} className="hover:bg-stone-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Globe className="w-5 h-5 text-purple-600" /></div>
                              <div><p className="font-medium text-stone-900">{state.name}</p></div>
                            </div>
                          </td>
                          <td className="px-5 py-4"><span className="badge-pill bg-purple-100 text-purple-700">{state.code || "-"}</span></td>
                          <td className="px-5 py-4 text-stone-600">{districts.filter(d => d.parent_state_id === state.id).length}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openStateModal(state)} className="p-2 text-stone-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => handleStateDelete(state.id)} className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-5 py-12 text-center text-stone-500">No states found. Click "Add State" to create one.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Districts Tab */}
            <TabsContent value="districts">
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                  <h2 className="font-semibold text-stone-900">All Districts</h2>
                  <button onClick={() => openDistrictModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2" data-testid="add-district-btn">
                    <Plus className="w-5 h-5" /> Add District
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Name</th>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">State</th>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Constituencies</th>
                        <th className="px-5 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredDistricts.length > 0 ? filteredDistricts.map((district) => (
                        <tr key={district.id} className="hover:bg-stone-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Building className="w-5 h-5 text-blue-600" /></div>
                              <div><p className="font-medium text-stone-900">{district.name}</p></div>
                            </div>
                          </td>
                          <td className="px-5 py-4"><span className="badge-pill bg-purple-100 text-purple-700">{district.parent_state_name || "-"}</span></td>
                          <td className="px-5 py-4 text-stone-600">{constituencies.filter(c => c.parent_district_id === district.id).length}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openDistrictModal(district)} className="p-2 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => handleDistrictDelete(district.id)} className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-5 py-12 text-center text-stone-500">No districts found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Constituencies Tab */}
            <TabsContent value="constituencies">
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                  <h2 className="font-semibold text-stone-900">All Constituencies</h2>
                  <button onClick={() => openConstModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2" data-testid="add-constituency-btn">
                    <Plus className="w-5 h-5" /> Add Constituency
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Name</th>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Type</th>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">District</th>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Sub-Regions</th>
                        <th className="px-5 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredConstituencies.length > 0 ? filteredConstituencies.map((const_) => (
                        <tr key={const_.id} className="hover:bg-stone-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><MapPin className="w-5 h-5 text-blue-600" /></div>
                              <div><p className="font-medium text-stone-900">{const_.name}</p></div>
                            </div>
                          </td>
                          <td className="px-5 py-4"><span className="badge-pill bg-blue-100 text-blue-700">{const_.type}</span></td>
                          <td className="px-5 py-4 text-stone-600">{const_.parent_district_name || "-"}</td>
                          <td className="px-5 py-4 text-stone-600">{subRegions.filter(sr => sr.parent_constituency_id === const_.id).length}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openConstModal(const_)} className="p-2 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => handleConstDelete(const_.id)} className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="px-5 py-12 text-center text-stone-500">No constituencies found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Sub-Regions Tab */}
            <TabsContent value="subregions">
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                  <h2 className="font-semibold text-stone-900">All Sub-Regions (Division/Mandal/Ward)</h2>
                  <button onClick={() => openSubModal()} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2" data-testid="add-subregion-btn">
                    <Plus className="w-5 h-5" /> Add Sub-Region
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Name</th>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Type</th>
                        <th className="px-5 py-3 text-left text-sm font-medium text-stone-500">Constituency</th>
                        <th className="px-5 py-3 text-right text-sm font-medium text-stone-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredSubRegions.length > 0 ? filteredSubRegions.map((sr) => (
                        <tr key={sr.id} className="hover:bg-stone-50">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><MapPin className="w-5 h-5 text-green-700" /></div>
                              <div><p className="font-medium text-stone-900">{sr.name}</p></div>
                            </div>
                          </td>
                          <td className="px-5 py-4"><span className="badge-pill bg-green-100 text-green-700">{sr.type}</span></td>
                          <td className="px-5 py-4 text-stone-600">{sr.parent_constituency_name || "-"}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openSubModal(sr)} className="p-2 text-stone-500 hover:text-green-700 hover:bg-green-50 rounded-lg"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => handleSubDelete(sr.id)} className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-5 py-12 text-center text-stone-500">No sub-regions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* State Modal */}
        <Dialog open={showStateModal} onOpenChange={setShowStateModal}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingState ? "Edit State" : "Add State"}</DialogTitle></DialogHeader>
            <form onSubmit={handleStateSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Name *</label><Input required value={stateForm.name} onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })} placeholder="e.g., Telangana" data-testid="state-name-input" /></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Code</label><Input value={stateForm.code} onChange={(e) => setStateForm({ ...stateForm, code: e.target.value })} placeholder="e.g., TS" /></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Description</label><Textarea value={stateForm.description} onChange={(e) => setStateForm({ ...stateForm, description: e.target.value })} rows={3} /></div>
              <VideoLinksInput 
                value={stateForm.video_links} 
                onChange={(links) => setStateForm({ ...stateForm, video_links: links })}
                label="Featured Videos"
              />
              <DialogFooter>
                <button type="button" onClick={() => setShowStateModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50" data-testid="state-submit-btn">{submitting ? "Saving..." : (editingState ? "Update" : "Create")}</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* District Modal */}
        <Dialog open={showDistrictModal} onOpenChange={setShowDistrictModal}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingDistrict ? "Edit District" : "Add District"}</DialogTitle></DialogHeader>
            <form onSubmit={handleDistrictSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Name *</label><Input required value={districtForm.name} onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })} placeholder="e.g., Hyderabad" data-testid="district-name-input" /></div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Parent State</label>
                <Select value={districtForm.parent_state_id} onValueChange={(v) => setDistrictForm({ ...districtForm, parent_state_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                  <SelectContent>{states.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Description</label><Textarea value={districtForm.description} onChange={(e) => setDistrictForm({ ...districtForm, description: e.target.value })} rows={3} /></div>
              <VideoLinksInput 
                value={districtForm.video_links} 
                onChange={(links) => setDistrictForm({ ...districtForm, video_links: links })}
                label="Featured Videos"
              />
              <DialogFooter>
                <button type="button" onClick={() => setShowDistrictModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50" data-testid="district-submit-btn">{submitting ? "Saving..." : (editingDistrict ? "Update" : "Create")}</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Constituency Modal */}
        <Dialog open={showConstModal} onOpenChange={setShowConstModal}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingConst ? "Edit Constituency" : "Add Constituency"}</DialogTitle></DialogHeader>
            <form onSubmit={handleConstSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Name *</label><Input required value={constForm.name} onChange={(e) => setConstForm({ ...constForm, name: e.target.value })} placeholder="e.g., Malakpet" data-testid="const-name-input" /></div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
                <Select value={constForm.type} onValueChange={(v) => setConstForm({ ...constForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Assembly">Assembly</SelectItem><SelectItem value="Parliamentary">Parliamentary</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Parent District</label>
                <Select value={constForm.parent_district_id} onValueChange={(v) => setConstForm({ ...constForm, parent_district_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                  <SelectContent>{districts.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name} {d.parent_state_name ? `(${d.parent_state_name})` : ""}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Description</label><Textarea value={constForm.description} onChange={(e) => setConstForm({ ...constForm, description: e.target.value })} rows={3} /></div>
              <VideoLinksInput 
                value={constForm.video_links} 
                onChange={(links) => setConstForm({ ...constForm, video_links: links })}
                label="Featured Videos"
              />
              <DialogFooter>
                <button type="button" onClick={() => setShowConstModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50" data-testid="const-submit-btn">{submitting ? "Saving..." : (editingConst ? "Update" : "Create")}</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sub-Region Modal */}
        <Dialog open={showSubModal} onOpenChange={setShowSubModal}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingSub ? "Edit Sub-Region" : "Add Sub-Region"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Name *</label><Input required value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} placeholder="e.g., Moosarambagh" data-testid="sub-name-input" /></div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
                <Select value={subForm.type} onValueChange={(v) => setSubForm({ ...subForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Division">Division</SelectItem><SelectItem value="Mandal">Mandal</SelectItem><SelectItem value="Ward">Ward</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Parent Constituency *</label>
                <Select value={subForm.parent_constituency_id} onValueChange={(v) => setSubForm({ ...subForm, parent_constituency_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Constituency" /></SelectTrigger>
                  <SelectContent>{constituencies.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name} {c.parent_district_name ? `(${c.parent_district_name})` : ""}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Description</label><Textarea value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} rows={3} /></div>
              <VideoLinksInput 
                value={subForm.video_links} 
                onChange={(links) => setSubForm({ ...subForm, video_links: links })}
                label="Featured Videos"
              />
              <DialogFooter>
                <button type="button" onClick={() => setShowSubModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium disabled:opacity-50" data-testid="sub-submit-btn">{submitting ? "Saving..." : (editingSub ? "Update" : "Create")}</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default GeographyManager;
