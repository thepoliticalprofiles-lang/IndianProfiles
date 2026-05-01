import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Users, FileText, Calendar, ChevronRight, ArrowRight, Building, Newspaper, CalendarDays, Globe } from "lucide-react";
import PublicNavbar from "../../components/shared/PublicNavbar";
import PublicFooter from "../../components/shared/PublicFooter";
import { api } from "../../App";

const heroImage = "/images/hero-bg.jpg";

// Debounce hook for search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Get icon for search result type
const getTypeIcon = (type) => {
  switch (type) {
    case "state":
      return <Globe className="w-5 h-5 text-blue-600" />;
    case "constituency":
      return <MapPin className="w-5 h-5 text-blue-600" />;
    case "district":
      return <Building className="w-5 h-5 text-teal-600" />;
    case "sub_region":
      return <Building className="w-5 h-5 text-green-600" />;
    case "leader":
      return <Users className="w-5 h-5 text-blue-600" />;
    case "article":
      return <Newspaper className="w-5 h-5 text-purple-600" />;
    case "event":
      return <CalendarDays className="w-5 h-5 text-red-600" />;
    default:
      return <FileText className="w-5 h-5 text-stone-500" />;
  }
};

// Get badge color for type
const getTypeBadge = (type) => {
  switch (type) {
    case "state":
      return "bg-blue-100 text-blue-700";
    case "constituency":
      return "bg-blue-100 text-blue-700";
    case "district":
      return "bg-teal-100 text-teal-700";
    case "sub_region":
      return "bg-green-100 text-green-700";
    case "leader":
      return "bg-blue-100 text-blue-700";
    case "article":
      return "bg-purple-100 text-purple-700";
    case "event":
      return "bg-red-100 text-red-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
};

// Get display name for type
const getTypeLabel = (type) => {
  switch (type) {
    case "state":
      return "State";
    case "constituency":
      return "Constituency";
    case "district":
      return "District";
    case "sub_region":
      return "Division";
    case "leader":
      return "Leader";
    case "article":
      return "Article";
    case "event":
      return "Event";
    default:
      return type;
  }
};

const HomePage = () => {
  const [states, setStates] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [articles, setArticles] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  const debouncedQuery = useDebounce(searchQuery, 150); // 150ms debounce for real-time feel

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time search API call
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 1) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}&limit=12`);
        setSearchResults(response.data);
        setShowResults(true);
        setSelectedIndex(-1);
      } catch (e) {
        console.error("Search error:", e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          navigate(searchResults[selectedIndex].url);
          setShowResults(false);
          setSearchQuery("");
        }
        break;
      case "Escape":
        setShowResults(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  }, [showResults, searchResults, selectedIndex, navigate]);

  const fetchData = async () => {
    try {
      const [statesRes, constRes, districtsRes, leadersRes, articlesRes, eventsRes] = await Promise.all([
        api.get("/states"),
        api.get("/constituencies"),
        api.get("/districts"),
        api.get("/leaders"),
        api.get("/articles?status=published"),
        api.get("/events?upcoming=true"),
      ]);
      setStates(statesRes.data);
      setConstituencies(constRes.data);
      setDistricts(districtsRes.data);
      setLeaders(leadersRes.data);
      setArticles(articlesRes.data.slice(0, 6));
      setEvents(eventsRes.data.slice(0, 4));
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    navigate(result.url);
    setShowResults(false);
    setSearchQuery("");
  };

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 text-stone-900 px-0.5 rounded">{part}</mark> : part
    );
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center" data-testid="hero-section">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Indian Profiles Rally" className="w-full h-full object-cover" />
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 animate-fade-in-up">
              Connecting Citizens & Leaders
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in-up stagger-1">
              Unite for <span className="text-blue-500">Telangana's</span> Future
            </h1>
            <p className="text-lg text-stone-300 mb-8 animate-fade-in-up stagger-2">
              Discover the leaders shaping your constituency's future. Stay informed about development works and connect with your representatives.
            </p>
            
            {/* Search Box - Wikipedia Style */}
            <div className="relative" ref={searchRef} data-testid="hero-search">
              <div className="bg-white rounded-xl p-2 shadow-2xl flex items-center gap-2 animate-fade-in-up stagger-3">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className={`w-5 h-5 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-stone-400'}`} />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search constituencies, leaders, articles..."
                    className="w-full py-3 outline-none text-stone-900 placeholder:text-stone-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    onKeyDown={handleKeyDown}
                    data-testid="search-input"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setShowResults(false);
                        inputRef.current?.focus();
                      }}
                      className="text-stone-400 hover:text-stone-600 p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors" 
                  data-testid="search-button"
                  onClick={() => {
                    if (searchResults.length > 0) {
                      navigate(searchResults[0].url);
                      setShowResults(false);
                      setSearchQuery("");
                    }
                  }}
                >
                  Search
                </button>
              </div>

              {/* Real-time Search Results Dropdown */}
              {showResults && (
                <div 
                  className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-2xl mt-2 max-h-[400px] overflow-y-auto z-50 border border-stone-200"
                  data-testid="search-results"
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="ml-3 text-stone-500">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result, index) => (
                        <div
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${
                            index === selectedIndex 
                              ? 'bg-blue-50 border-l-4 border-blue-500' 
                              : 'hover:bg-stone-50 border-l-4 border-transparent'
                          }`}
                        >
                          {/* Icon or Image */}
                          <div className="flex-shrink-0">
                            {result.image_url ? (
                              <img 
                                src={result.image_url} 
                                alt="" 
                                className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                                {getTypeIcon(result.type)}
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-stone-900 truncate">
                                {highlightMatch(result.name, searchQuery)}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadge(result.type)}`}>
                                {getTypeLabel(result.type)}
                              </span>
                            </div>
                            {result.subtitle && (
                              <p className="text-sm text-stone-500 truncate">{result.subtitle}</p>
                            )}
                          </div>
                          
                          {/* Arrow */}
                          <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.trim().length > 0 ? (
                    <div className="py-8 text-center">
                      <Search className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                      <p className="text-stone-500">No results found for "{searchQuery}"</p>
                      <p className="text-sm text-stone-400 mt-1">Try different keywords</p>
                    </div>
                  ) : null}
                  
                  {/* Keyboard hints */}
                  {searchResults.length > 0 && (
                    <div className="border-t border-stone-100 px-4 py-2 flex items-center gap-4 text-xs text-stone-400 bg-stone-50">
                      <span><kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd> Navigate</span>
                      <span><kbd className="px-1.5 py-0.5 bg-white rounded border">Enter</kbd> Select</span>
                      <span><kbd className="px-1.5 py-0.5 bg-white rounded border">Esc</kbd> Close</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-stone-200" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-blue-600">{states.length}</p>
              <p className="text-stone-500 mt-1">States</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-green-700">{districts.length}</p>
              <p className="text-stone-500 mt-1">Districts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-blue-600">{constituencies.length}</p>
              <p className="text-stone-500 mt-1">Constituencies</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-green-700">{leaders.length}</p>
              <p className="text-stone-500 mt-1">Leaders</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-blue-600">{articles.length}+</p>
              <p className="text-stone-500 mt-1">Development Works</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-green-700">{events.length}+</p>
              <p className="text-stone-500 mt-1">Upcoming Events</p>
            </div>
          </div>
        </div>
      </section>

      {/* State Leaders Section - FIRST */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white" data-testid="state-leaders-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Our Leadership</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">State Leaders</h2>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                  <div className="w-24 h-24 bg-stone-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-5 bg-stone-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : leaders.filter(l => l.level === 'State').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {leaders.filter(l => l.level === 'State').map((leader, index) => (
                <Link
                  key={leader.id}
                  to={`/leader/${leader.id}`}
                  className="card-hover bg-white rounded-xl p-6 border border-stone-200 text-center group"
                  data-testid={`state-leader-card-${index}`}
                >
                  <div className="relative mb-4">
                    {leader.image_url ? (
                      <img 
                        src={leader.image_url} 
                        alt={leader.name}
                        className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-blue-100 group-hover:border-blue-200 transition-colors"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto flex items-center justify-center border-4 border-blue-100">
                        <span className="text-2xl font-bold text-white">{leader.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 group-hover:text-blue-600 transition-colors">
                    {leader.name}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium mt-1">{leader.designation}</p>
                  {leader.bio_summary && (
                    <p className="text-sm text-stone-500 mt-2 line-clamp-2">{leader.bio_summary}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <span className="text-sm text-blue-600 font-medium inline-flex items-center gap-1">
                      View Profile <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
              <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">No state leaders found. Check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* Districts Grid - SECOND */}
      <section className="py-16" data-testid="districts-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-600 mb-2">Explore</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Districts</h2>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-stone-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : districts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {districts.map((district, index) => (
                <Link
                  key={district.id}
                  to={`/district/${district.id}`}
                  className="card-hover bg-white rounded-xl p-6 border border-stone-200 group"
                  data-testid={`district-card-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-stone-900 group-hover:text-green-600 transition-colors">
                        {district.name}
                      </h3>
                      {district.parent_state_name && (
                        <p className="text-sm text-stone-500 mt-1">{district.parent_state_name}</p>
                      )}
                      {district.description && (
                        <p className="text-sm text-stone-600 mt-3 line-clamp-2">{district.description}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <Building className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-sm text-green-600 font-medium">View Details</span>
                    <ChevronRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
              <Building className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">No districts found. Check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* Constituencies Grid - SECOND */}
      <section className="py-16 bg-white" data-testid="constituencies-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Explore</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Constituencies</h2>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-stone-50 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-stone-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : constituencies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {constituencies.map((constituency, index) => (
                <Link
                  key={constituency.id}
                  to={`/constituency/${constituency.id}`}
                  className="card-hover bg-stone-50 rounded-xl p-6 border border-stone-200 group"
                  data-testid={`constituency-card-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-stone-900 group-hover:text-blue-600 transition-colors">
                        {constituency.name}
                      </h3>
                      <p className="text-sm text-stone-500 mt-1">{constituency.type}</p>
                      {constituency.description && (
                        <p className="text-sm text-stone-600 mt-3 line-clamp-2">{constituency.description}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-sm text-blue-600 font-medium">View Details</span>
                    <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-200">
              <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">No constituencies found. Check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* Leaders Section */}
      {leaders.length > 0 && (
        <section className="py-16 bg-white" data-testid="leaders-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Our Representatives</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Leaders</h2>
              </div>
              <Link
                to="/leaders"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:text-brand-magenta transition-colors"
                data-testid="home-view-all-leaders"
              >
                View All Leaders
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {leaders.slice(0, 8).map((leader, index) => (
                <Link
                  key={leader.id}
                  to={`/leader/${leader.id}`}
                  className="card-hover bg-stone-50 rounded-xl p-6 border border-stone-200 text-center group"
                  data-testid={`leader-card-${index}`}
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-blue-100 group-hover:border-blue-200 transition-colors">
                    {leader.image_url ? (
                      <img src={leader.image_url} alt={leader.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-stone-900 group-hover:text-blue-600 transition-colors">{leader.name}</h3>
                  <p className="text-sm text-stone-500 mt-1">{leader.designation}</p>
                  {leader.location_name && (
                    <p className="text-xs text-blue-600 mt-2">{leader.location_name}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Development Works */}
      {articles.length > 0 && (
        <section className="py-16" data-testid="articles-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Latest Updates</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Development Works</h2>
              </div>
              <Link
                to="/articles"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:text-brand-magenta transition-colors"
                data-testid="home-view-all-articles"
              >
                View All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  className="card-hover bg-white rounded-xl overflow-hidden border border-stone-200 group"
                  data-testid={`article-card-${index}`}
                >
                  {article.featured_image && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={article.featured_image} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.constituency_name && (
                        <span className="badge-pill bg-blue-100 text-blue-700">{article.constituency_name}</span>
                      )}
                      <span className="badge-pill bg-green-100 text-green-700">{article.article_type}</span>
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
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="py-16 bg-white" data-testid="events-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Stay Updated</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Upcoming Events</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className="card-hover bg-stone-50 rounded-xl p-6 border border-stone-200 flex gap-6"
                  data-testid={`event-card-${index}`}
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white">
                    <span className="text-xl font-bold">{new Date(event.event_date).getDate()}</span>
                    <span className="text-xs uppercase">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900">{event.title}</h3>
                    {event.location && (
                      <p className="text-sm text-stone-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </p>
                    )}
                    {event.event_time && (
                      <p className="text-sm text-blue-600 mt-2">{event.event_time}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Want to Make a Difference?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our network of volunteers and be a part of the change. Help build a stronger community.
          </p>
          <Link
            to="/get-involved"
            className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold transition-colors"
            data-testid="cta-button"
          >
            Get Involved
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default HomePage;
