import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, UserPlus, Calendar, Send, CheckCircle, MapPin, ChevronRight, Home } from "lucide-react";
import PublicNavbar from "../../components/shared/PublicNavbar";
import PublicFooter from "../../components/shared/PublicFooter";
import { api, formatApiError } from "../../App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const crowdImage = "https://images.unsplash.com/photo-1699112220879-ca9ad696633a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjBjcm93ZCUyMHBvbGl0aWNhbCUyMHJhbGx5fGVufDB8fHx8MTc3NTExNDMzNnww&ixlib=rb-4.1.0&q=85";

const grievanceCategories = [
  "Infrastructure",
  "Water Supply",
  "Electricity",
  "Roads & Transport",
  "Healthcare",
  "Education",
  "Sanitation",
  "Housing",
  "Employment",
  "Other"
];

const skillOptions = [
  "Event Management",
  "Social Media",
  "Door-to-Door Campaign",
  "Public Speaking",
  "Data Entry",
  "Photography/Videography",
  "Content Writing",
  "Translation",
  "Logistics",
  "Other"
];

const GetInvolvedPage = () => {
  const [constituencies, setConstituencies] = useState([]);
  const [subRegions, setSubRegions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Grievance form
  const [grievanceForm, setGrievanceForm] = useState({
    name: "", phone: "", email: "", constituency_id: "", sub_region_id: "", category: "", description: ""
  });
  const [grievanceSubmitting, setGrievanceSubmitting] = useState(false);
  const [grievanceSuccess, setGrievanceSuccess] = useState(false);
  const [grievanceError, setGrievanceError] = useState("");

  // Volunteer form
  const [volunteerForm, setVolunteerForm] = useState({
    name: "", phone: "", email: "", constituency_id: "", sub_region_id: "", skills: [], availability: ""
  });
  const [volunteerSubmitting, setVolunteerSubmitting] = useState(false);
  const [volunteerSuccess, setVolunteerSuccess] = useState(false);
  const [volunteerError, setVolunteerError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [constRes, eventsRes] = await Promise.all([
        api.get("/constituencies"),
        api.get("/events?upcoming=true"),
      ]);
      setConstituencies(constRes.data);
      setEvents(eventsRes.data);
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubRegions = async (constituencyId) => {
    try {
      const res = await api.get(`/sub-regions?constituency_id=${constituencyId}`);
      setSubRegions(res.data);
    } catch (e) {
      console.error("Failed to fetch sub-regions:", e);
    }
  };

  const handleGrievanceSubmit = async (e) => {
    e.preventDefault();
    setGrievanceSubmitting(true);
    setGrievanceError("");
    
    try {
      await api.post("/grievances", grievanceForm);
      setGrievanceSuccess(true);
      setGrievanceForm({
        name: "", phone: "", email: "", constituency_id: "", sub_region_id: "", category: "", description: ""
      });
    } catch (err) {
      setGrievanceError(formatApiError(err));
    } finally {
      setGrievanceSubmitting(false);
    }
  };

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    setVolunteerSubmitting(true);
    setVolunteerError("");
    
    try {
      await api.post("/volunteers", volunteerForm);
      setVolunteerSuccess(true);
      setVolunteerForm({
        name: "", phone: "", email: "", constituency_id: "", sub_region_id: "", skills: [], availability: ""
      });
    } catch (err) {
      setVolunteerError(formatApiError(err));
    } finally {
      setVolunteerSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-16 relative" data-testid="get-involved-hero">
        <div className="h-64 md:h-80 overflow-hidden">
          <img src={crowdImage} alt="Rally" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/50 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 pb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Get Involved</h1>
          <p className="text-stone-300 max-w-2xl">
            Your voice matters. Submit your grievances, register as a volunteer, or attend upcoming events.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm" data-testid="breadcrumb">
            <Link to="/" className="text-stone-500 hover:text-blue-600 flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-stone-400" />
            <span className="text-stone-900 font-medium">Get Involved</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-12" data-testid="get-involved-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="grievance" className="w-full">
            <TabsList className="bg-white border border-stone-200 p-1 rounded-xl mb-8 flex flex-wrap">
              <TabsTrigger value="grievance" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Submit Grievance
              </TabsTrigger>
              <TabsTrigger value="volunteer" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Register as Volunteer
              </TabsTrigger>
              <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Events
              </TabsTrigger>
            </TabsList>

            {/* Grievance Tab */}
            <TabsContent value="grievance" data-testid="grievance-tab">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl p-8 border border-stone-200">
                    <h2 className="text-xl font-bold text-stone-900 mb-6">Submit Your Grievance</h2>
                    
                    {grievanceSuccess ? (
                      <div className="text-center py-12" data-testid="grievance-success">
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-stone-900 mb-2">Grievance Submitted!</h3>
                        <p className="text-stone-500 mb-6">We have received your grievance. Our team will look into it.</p>
                        <button 
                          onClick={() => setGrievanceSuccess(false)}
                          className="text-blue-600 hover:underline"
                        >
                          Submit Another
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleGrievanceSubmit} className="space-y-6">
                        {grievanceError && (
                          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{grievanceError}</div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Full Name *</label>
                            <Input
                              required
                              value={grievanceForm.name}
                              onChange={(e) => setGrievanceForm({ ...grievanceForm, name: e.target.value })}
                              placeholder="Enter your name"
                              data-testid="grievance-name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Phone Number *</label>
                            <Input
                              required
                              value={grievanceForm.phone}
                              onChange={(e) => setGrievanceForm({ ...grievanceForm, phone: e.target.value })}
                              placeholder="+91 XXXXXXXXXX"
                              data-testid="grievance-phone"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">Email (Optional)</label>
                          <Input
                            type="email"
                            value={grievanceForm.email}
                            onChange={(e) => setGrievanceForm({ ...grievanceForm, email: e.target.value })}
                            placeholder="your@email.com"
                            data-testid="grievance-email"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Constituency</label>
                            <Select 
                              value={grievanceForm.constituency_id} 
                              onValueChange={(value) => {
                                setGrievanceForm({ ...grievanceForm, constituency_id: value, sub_region_id: "" });
                                fetchSubRegions(value);
                              }}
                            >
                              <SelectTrigger data-testid="grievance-constituency">
                                <SelectValue placeholder="Select Constituency" />
                              </SelectTrigger>
                              <SelectContent>
                                {constituencies.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Division/Mandal</label>
                            <Select 
                              value={grievanceForm.sub_region_id} 
                              onValueChange={(value) => setGrievanceForm({ ...grievanceForm, sub_region_id: value })}
                              disabled={!grievanceForm.constituency_id}
                            >
                              <SelectTrigger data-testid="grievance-subregion">
                                <SelectValue placeholder="Select Division" />
                              </SelectTrigger>
                              <SelectContent>
                                {subRegions.map((sr) => (
                                  <SelectItem key={sr.id} value={sr.id}>{sr.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">Category *</label>
                          <Select 
                            value={grievanceForm.category} 
                            onValueChange={(value) => setGrievanceForm({ ...grievanceForm, category: value })}
                          >
                            <SelectTrigger data-testid="grievance-category">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {grievanceCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">Describe Your Issue *</label>
                          <Textarea
                            required
                            rows={5}
                            value={grievanceForm.description}
                            onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                            placeholder="Please describe your grievance in detail..."
                            data-testid="grievance-description"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={grievanceSubmitting}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                          data-testid="grievance-submit"
                        >
                          {grievanceSubmitting ? "Submitting..." : (
                            <>
                              <Send className="w-5 h-5" />
                              Submit Grievance
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="font-semibold text-stone-900 mb-3">Why Submit a Grievance?</h3>
                    <ul className="space-y-2 text-sm text-stone-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        Direct communication with local leaders
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        Track status of your complaint
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        Get timely resolution
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Volunteer Tab */}
            <TabsContent value="volunteer" data-testid="volunteer-tab">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl p-8 border border-stone-200">
                    <h2 className="text-xl font-bold text-stone-900 mb-6">Register as a Volunteer (Karyakarta)</h2>
                    
                    {volunteerSuccess ? (
                      <div className="text-center py-12" data-testid="volunteer-success">
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-stone-900 mb-2">Registration Successful!</h3>
                        <p className="text-stone-500 mb-6">Thank you for joining. Our team will contact you soon.</p>
                        <button 
                          onClick={() => setVolunteerSuccess(false)}
                          className="text-blue-600 hover:underline"
                        >
                          Register Another
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleVolunteerSubmit} className="space-y-6">
                        {volunteerError && (
                          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{volunteerError}</div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Full Name *</label>
                            <Input
                              required
                              value={volunteerForm.name}
                              onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                              placeholder="Enter your name"
                              data-testid="volunteer-name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Phone Number *</label>
                            <Input
                              required
                              value={volunteerForm.phone}
                              onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                              placeholder="+91 XXXXXXXXXX"
                              data-testid="volunteer-phone"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">Email (Optional)</label>
                          <Input
                            type="email"
                            value={volunteerForm.email}
                            onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                            placeholder="your@email.com"
                            data-testid="volunteer-email"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Constituency</label>
                            <Select 
                              value={volunteerForm.constituency_id} 
                              onValueChange={(value) => {
                                setVolunteerForm({ ...volunteerForm, constituency_id: value, sub_region_id: "" });
                                fetchSubRegions(value);
                              }}
                            >
                              <SelectTrigger data-testid="volunteer-constituency">
                                <SelectValue placeholder="Select Constituency" />
                              </SelectTrigger>
                              <SelectContent>
                                {constituencies.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Division/Mandal</label>
                            <Select 
                              value={volunteerForm.sub_region_id} 
                              onValueChange={(value) => setVolunteerForm({ ...volunteerForm, sub_region_id: value })}
                              disabled={!volunteerForm.constituency_id}
                            >
                              <SelectTrigger data-testid="volunteer-subregion">
                                <SelectValue placeholder="Select Division" />
                              </SelectTrigger>
                              <SelectContent>
                                {subRegions.map((sr) => (
                                  <SelectItem key={sr.id} value={sr.id}>{sr.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">Skills</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {skillOptions.map((skill) => (
                              <label key={skill} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={volunteerForm.skills.includes(skill)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setVolunteerForm({ ...volunteerForm, skills: [...volunteerForm.skills, skill] });
                                    } else {
                                      setVolunteerForm({ ...volunteerForm, skills: volunteerForm.skills.filter(s => s !== skill) });
                                    }
                                  }}
                                  className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-stone-700">{skill}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">Availability</label>
                          <Select 
                            value={volunteerForm.availability} 
                            onValueChange={(value) => setVolunteerForm({ ...volunteerForm, availability: value })}
                          >
                            <SelectTrigger data-testid="volunteer-availability">
                              <SelectValue placeholder="Select Availability" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekdays">Weekdays</SelectItem>
                              <SelectItem value="weekends">Weekends</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                              <SelectItem value="flexible">Flexible</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <button
                          type="submit"
                          disabled={volunteerSubmitting}
                          className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                          data-testid="volunteer-submit"
                        >
                          {volunteerSubmitting ? "Submitting..." : (
                            <>
                              <UserPlus className="w-5 h-5" />
                              Register as Volunteer
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <h3 className="font-semibold text-stone-900 mb-3">Why Become a Volunteer?</h3>
                    <ul className="space-y-2 text-sm text-stone-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                        Be part of the grassroots movement
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                        Connect with local leaders
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                        Contribute to nation-building
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" data-testid="events-tab">
              <div className="bg-white rounded-xl p-8 border border-stone-200">
                <h2 className="text-xl font-bold text-stone-900 mb-6">Upcoming Events</h2>
                
                {events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="card-hover bg-stone-50 rounded-xl p-6 border border-stone-200"
                        data-testid={`event-card-${event.id}`}
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white">
                            <span className="text-xl font-bold">{new Date(event.event_date).getDate()}</span>
                            <span className="text-xs uppercase">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          </div>
                          <div className="flex-1">
                            <span className="badge-pill bg-blue-100 text-blue-700 mb-2">{event.event_type}</span>
                            <h3 className="font-semibold text-stone-900">{event.title}</h3>
                            {event.description && (
                              <p className="text-sm text-stone-500 mt-1 line-clamp-2">{event.description}</p>
                            )}
                            {event.location && (
                              <p className="text-sm text-stone-600 mt-2 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </p>
                            )}
                            {event.event_time && (
                              <p className="text-sm text-blue-600 mt-1">{event.event_time}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500">No upcoming events scheduled.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default GetInvolvedPage;
