import { useState, useEffect } from "react";
import { Calendar, Plus, Edit, Trash2, Search, MapPin } from "lucide-react";
import AdminSidebar from "../../components/shared/AdminSidebar";
import { api, formatApiError } from "../../App";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";

const EventManager = () => {
  const [events, setEvents] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [subRegions, setSubRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    constituency_id: "",
    sub_region_id: "",
    event_type: "public",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, constRes, subRes] = await Promise.all([
        api.get("/events"),
        api.get("/constituencies"),
        api.get("/sub-regions"),
      ]);
      setEvents(eventsRes.data);
      setConstituencies(constRes.data);
      setSubRegions(subRes.data);
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (event = null) => {
    setError("");
    if (event) {
      setEditingEvent(event);
      setForm({
        title: event.title || "",
        description: event.description || "",
        event_date: event.event_date || "",
        event_time: event.event_time || "",
        location: event.location || "",
        constituency_id: event.constituency_id || "",
        sub_region_id: event.sub_region_id || "",
        event_type: event.event_type || "public",
      });
    } else {
      setEditingEvent(null);
      setForm({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        location: "",
        constituency_id: "",
        sub_region_id: "",
        event_type: "public",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, form);
      } else {
        await api.post("/events", form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;

    try {
      await api.delete(`/events/${eventId}`);
      fetchData();
    } catch (err) {
      alert(formatApiError(err));
    }
  };

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableSubRegions = form.constituency_id 
    ? subRegions.filter(sr => sr.parent_constituency_id === form.constituency_id)
    : [];

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar />

      <main className="admin-content p-6 lg:p-8" data-testid="event-manager">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Event Manager</h1>
            <p className="text-stone-500">Manage events and programs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="event-search"
              />
            </div>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              data-testid="add-event-btn"
            >
              <Plus className="w-5 h-5" />
              Add Event
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden card-hover"
                  data-testid={`event-card-${event.id}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white">
                        <span className="text-lg font-bold">{new Date(event.event_date).getDate()}</span>
                        <span className="text-xs uppercase">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </div>
                      <span className={`badge-pill ${
                        event.event_type === 'public' ? 'bg-green-100 text-green-700' :
                        event.event_type === 'internal' ? 'bg-blue-100 text-blue-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {event.event_type}
                      </span>
                    </div>

                    <h3 className="font-semibold text-stone-900 mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-stone-600 mb-3 line-clamp-2">{event.description}</p>
                    )}

                    <div className="space-y-2 text-sm">
                      {event.event_time && (
                        <p className="text-blue-600 font-medium">{event.event_time}</p>
                      )}
                      {event.location && (
                        <p className="text-stone-500 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </p>
                      )}
                      {event.constituency_name && (
                        <p className="text-stone-500">{event.constituency_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-2">
                    <button
                      onClick={() => openModal(event)}
                      className="p-2 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      data-testid={`edit-event-${event.id}`}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      data-testid={`delete-event-${event.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-stone-200">
                <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">No events found. Click "Add Event" to create one.</p>
              </div>
            )}
          </div>
        )}

        {/* Event Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Event Title *</label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter event title"
                  data-testid="event-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Event description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Date *</label>
                  <Input
                    type="date"
                    required
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    data-testid="event-date-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Time</label>
                  <Input
                    value={form.event_time}
                    onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                    placeholder="e.g., 10:00 AM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Event venue address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Constituency</label>
                  <Select 
                    value={form.constituency_id} 
                    onValueChange={(v) => setForm({ ...form, constituency_id: v, sub_region_id: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {constituencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Event Type</label>
                  <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="rally">Rally</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                  data-testid="event-submit-btn"
                >
                  {submitting ? "Saving..." : (editingEvent ? "Update" : "Create")}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default EventManager;
