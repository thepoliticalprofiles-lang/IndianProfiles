import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  MapPin, Mail, Phone, Calendar, ChevronRight, Home, 
  Twitter, Facebook, Play, Image, FileText, Users, 
  Download, Share2, ExternalLink, Briefcase, Award,
  Building, Clock, Youtube
} from "lucide-react";
import PublicNavbar from "../../components/shared/PublicNavbar";
import PublicFooter from "../../components/shared/PublicFooter";
import { api } from "../../App";

const leaderBg = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80";

// Helper to extract YouTube video ID
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper to get YouTube thumbnail
const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return null;
};

const LeaderProfilePage = () => {
  const { id } = useParams();
  const [leader, setLeader] = useState(null);
  const [articles, setArticles] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoTitles, setVideoTitles] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  // Fetch YouTube video title using oEmbed API
  const fetchYouTubeTitle = async (videoUrl) => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
      if (response.ok) {
        const data = await response.json();
        return data.title;
      }
    } catch (e) {
      console.error("Failed to fetch video title:", e);
    }
    return null;
  };

  // Fetch all video titles when leader data is loaded
  useEffect(() => {
    const fetchAllTitles = async () => {
      if (!leader) return;
      
      const allVideos = [
        ...(leader.featured_video ? [leader.featured_video] : []),
        ...(leader.video_links || [])
      ].filter((v, i, arr) => arr.indexOf(v) === i);

      const titles = {};
      for (const video of allVideos) {
        const title = await fetchYouTubeTitle(video);
        if (title) {
          titles[video] = title;
        }
      }
      setVideoTitles(titles);
    };

    fetchAllTitles();
  }, [leader]);

  const fetchData = async () => {
    try {
      const [leaderRes, articlesRes, eventsRes] = await Promise.all([
        api.get(`/leaders/${id}`),
        api.get(`/articles?leader_id=${id}&status=published`),
        api.get(`/events?upcoming=true`),
      ]);
      setLeader(leaderRes.data);
      setArticles(articlesRes.data);
      setEvents(eventsRes.data.slice(0, 4));
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate years of experience from career timeline
  const getExperience = () => {
    if (leader?.career_timeline && leader.career_timeline.length > 0) {
      const years = leader.career_timeline.map(e => parseInt(e.year)).filter(y => !isNaN(y));
      if (years.length > 0) {
        const earliest = Math.min(...years);
        const experience = new Date().getFullYear() - earliest;
        return experience > 0 ? experience : null;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100">
        <PublicNavbar />
        <div className="pt-24 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="min-h-screen bg-stone-100">
        <PublicNavbar />
        <div className="pt-24 text-center py-16">
          <p className="text-stone-500">Leader not found</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Go back home</Link>
        </div>
      </div>
    );
  }

  const experience = getExperience();
  const allVideos = [
    ...(leader.featured_video ? [leader.featured_video] : []),
    ...(leader.video_links || [])
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  // Section counter
  let sectionNum = 0;
  const getNextSection = () => {
    sectionNum++;
    return sectionNum.toString().padStart(2, '0');
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <PublicNavbar />

      {/* Header Background */}
      <div className="pt-16 relative">
        <div className="h-32 md:h-48 lg:h-56 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ 
              backgroundImage: `url(${leaderBg})`,
              filter: 'grayscale(100%)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" style={{ mixBlendMode: 'multiply' }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-20 relative z-10 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-4 md:mb-6 text-stone-600" data-testid="breadcrumb">
          <Link to="/" className="hover:text-blue-600 flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-stone-400" />
          <span className="text-stone-900 font-medium truncate">{leader.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Content Sections */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8 order-2 lg:order-1">
            
            {/* Section: Featured Videos */}
            <section data-testid="videos-section">
              <div className="flex items-baseline gap-2 md:gap-3 mb-4 md:mb-6">
                <span className="text-xs md:text-sm font-medium text-stone-400">{getNextSection()}</span>
                <h2 className="text-xl md:text-2xl font-bold text-stone-900">Featured Videos</h2>
              </div>

              {allVideos.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {allVideos.map((video, index) => {
                    const youtubeId = getYouTubeId(video);
                    const thumbnail = getYouTubeThumbnail(video) || leader.image_url;
                    const isFeatured = leader.featured_video && video === leader.featured_video;
                    
                    return (
                      <a
                        key={index}
                        href={video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-stone-900 rounded-xl overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all"
                      >
                        <div className="flex items-center">
                          <div className="relative w-28 h-20 sm:w-36 sm:h-24 md:w-44 md:h-28 flex-shrink-0">
                            <img 
                              src={thumbnail || leader.image_url}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 md:w-6 md:h-6 text-stone-900 ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                            {youtubeId && (
                              <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Youtube className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 p-3 md:p-4 text-white">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                {isFeatured && (
                                  <span className="inline-block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                                    Featured
                                  </span>
                                )}
                                <h3 className="font-semibold text-sm md:text-base line-clamp-2">
                                  {videoTitles[video] || `Video ${index + 1}`}
                                </h3>
                                {!videoTitles[video] && (
                                  <p className="text-stone-400 text-xs md:text-sm mt-0.5 line-clamp-1">
                                    Loading title...
                                  </p>
                                )}
                              </div>
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">JL</span>
                              </div>
                            </div>
                            <p className="text-blue-400 text-[10px] md:text-xs mt-2 font-medium">
                              Click to watch →
                            </p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 md:p-8 border border-stone-200 text-center">
                  <Youtube className="w-8 h-8 md:w-10 md:h-10 text-stone-300 mx-auto mb-2 md:mb-3" />
                  <p className="text-stone-500 text-sm md:text-base">No videos available</p>
                </div>
              )}
            </section>

            {/* Section: Developments */}
            <section data-testid="developments-section">
              <div className="flex items-baseline gap-2 md:gap-3 mb-4 md:mb-6">
                <span className="text-xs md:text-sm font-medium text-stone-400">{getNextSection()}</span>
                <h2 className="text-xl md:text-2xl font-bold text-stone-900">Developments</h2>
              </div>

              {articles.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {articles[0] && (
                    <Link
                      to={`/article/${articles[0].id}`}
                      className="block relative rounded-xl md:rounded-2xl overflow-hidden group"
                    >
                      <div className="h-48 sm:h-56 md:h-64">
                        {articles[0].featured_image ? (
                          <img 
                            src={articles[0].featured_image} 
                            alt={articles[0].title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                        <h3 className="text-lg md:text-xl font-bold mb-1 line-clamp-2">{articles[0].title}</h3>
                        <p className="text-stone-300 text-xs md:text-sm">
                          {articles[0].article_type} | {articles[0].constituency_name || 'General'}
                        </p>
                      </div>
                    </Link>
                  )}

                  {articles.length > 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {articles.slice(1, 5).map((article) => (
                        <Link
                          key={article.id}
                          to={`/article/${article.id}`}
                          className="bg-white rounded-xl p-4 md:p-5 border border-stone-200 hover:shadow-lg transition-shadow group"
                        >
                          <h3 className="font-semibold text-stone-900 group-hover:text-blue-600 transition-colors mb-2 text-sm md:text-base line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-stone-600 text-xs md:text-sm line-clamp-2 mb-2">
                            {article.summary || article.content?.substring(0, 100)}
                          </p>
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] md:text-xs rounded-full">
                            {article.article_type}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 md:p-8 border border-stone-200 text-center">
                  <Building className="w-8 h-8 md:w-10 md:h-10 text-stone-300 mx-auto mb-2 md:mb-3" />
                  <p className="text-stone-500 text-sm md:text-base">No development works available</p>
                </div>
              )}
            </section>

            {/* Section: Activities and Events */}
            <section data-testid="events-section">
              <div className="flex items-baseline gap-2 md:gap-3 mb-4 md:mb-6">
                <span className="text-xs md:text-sm font-medium text-stone-400">{getNextSection()}</span>
                <h2 className="text-xl md:text-2xl font-bold text-stone-900">Activities and Events</h2>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                {events.length > 0 ? (
                  events.map((event) => {
                    const eventDate = new Date(event.event_date);
                    return (
                      <div 
                        key={event.id}
                        className="flex items-center gap-4 md:gap-6 p-4 md:p-5 hover:bg-stone-50 transition-colors cursor-pointer group"
                      >
                        <div className="text-center flex-shrink-0 w-12 md:w-14">
                          <p className="text-xl md:text-2xl font-bold text-blue-600">{eventDate.getDate()}</p>
                          <p className="text-[10px] md:text-xs font-medium text-stone-400 uppercase">
                            {eventDate.toLocaleString('default', { month: 'short' })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-stone-900 group-hover:text-blue-600 transition-colors text-sm md:text-base line-clamp-1">
                            {event.title}
                          </h3>
                          <p className="text-xs md:text-sm text-stone-500 truncate">{event.location}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-stone-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 md:p-8 text-center">
                    <Calendar className="w-8 h-8 md:w-10 md:h-10 text-stone-300 mx-auto mb-2 md:mb-3" />
                    <p className="text-stone-500 text-sm md:text-base">No upcoming events</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section: Full Biography */}
            {leader.biography && (
              <section data-testid="biography-section">
                <div className="flex items-baseline gap-2 md:gap-3 mb-4 md:mb-6">
                  <span className="text-xs md:text-sm font-medium text-stone-400">{getNextSection()}</span>
                  <h2 className="text-xl md:text-2xl font-bold text-stone-900">Full Biography</h2>
                </div>

                <div className="bg-white rounded-xl p-6 md:p-8 border border-stone-200">
                  <div 
                    className="prose prose-stone max-w-none prose-headings:text-stone-900 prose-p:text-stone-600 prose-a:text-blue-600"
                    dangerouslySetInnerHTML={{ __html: leader.biography }}
                  />
                </div>
              </section>
            )}

            {/* Section: Photo Gallery */}
            {leader.gallery_photos && leader.gallery_photos.length > 0 && (
              <section data-testid="gallery-section">
                <div className="flex items-baseline gap-2 md:gap-3 mb-4 md:mb-6">
                  <span className="text-xs md:text-sm font-medium text-stone-400">{getNextSection()}</span>
                  <h2 className="text-xl md:text-2xl font-bold text-stone-900">Photo Gallery</h2>
                </div>

                <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                    {leader.gallery_photos.slice(0, 8).map((photo, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden">
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Profile Card (Sticky) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-lg" data-testid="profile-card">
                {/* Profile Image */}
                <div className="relative">
                  <div className="aspect-square bg-stone-800">
                    {leader.image_url ? (
                      <img 
                        src={leader.image_url} 
                        alt={leader.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center">
                        <Users className="w-24 h-24 text-stone-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Experience Badge */}
                  {experience && (
                    <div className="absolute bottom-4 right-4 bg-stone-800/90 backdrop-blur text-white px-4 py-2 rounded-lg">
                      <p className="text-2xl font-bold">{experience}+</p>
                      <p className="text-xs text-stone-300 uppercase tracking-wider">Years Experience</p>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-stone-900">{leader.name}</h1>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mt-1">
                    {leader.designation}
                  </p>

                  {/* Bio Summary */}
                  {leader.bio_summary && (
                    <p className="text-stone-600 mt-4 text-sm leading-relaxed">
                      {leader.bio_summary}
                    </p>
                  )}

                  {/* Career Timeline - Inside Profile Card */}
                  {leader.career_timeline && leader.career_timeline.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-stone-100">
                      <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        Career Timeline
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {leader.career_timeline.map((event, index) => (
                          <div 
                            key={index}
                            className="flex items-start gap-3 pb-3 border-b border-stone-100 last:border-0 last:pb-0"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-medium text-stone-900 line-clamp-1">{event.role}</h4>
                                <span className="text-xs font-semibold text-blue-600 flex-shrink-0">{event.year}</span>
                              </div>
                              {event.description && (
                                <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{event.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Focus & Location */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-stone-100">
                    {leader.focus_area && (
                      <div>
                        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Focus</p>
                        <p className="text-sm font-medium text-stone-900">{leader.focus_area}</p>
                      </div>
                    )}
                    {leader.location_name && (
                      <div>
                        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Location</p>
                        <p className="text-sm font-medium text-stone-900">{leader.location_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Contact Button */}
                  {(leader.phone || leader.email) && (
                    <a 
                      href={leader.email ? `mailto:${leader.email}` : `tel:${leader.phone}`}
                      className="w-full mt-6 bg-stone-900 hover:bg-stone-800 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Leader
                    </a>
                  )}

                  {/* Social Links */}
                  <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-stone-100">
                    {leader.email && (
                      <a 
                        href={`mailto:${leader.email}`}
                        className="w-10 h-10 bg-stone-100 hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors"
                        title="Email"
                      >
                        <Mail className="w-4 h-4 text-stone-600" />
                      </a>
                    )}
                    {leader.twitter && (
                      <a 
                        href={leader.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-stone-100 hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors"
                        title="Twitter"
                      >
                        <Twitter className="w-4 h-4 text-stone-600" />
                      </a>
                    )}
                    {leader.facebook && (
                      <a 
                        href={leader.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-stone-100 hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors"
                        title="Facebook"
                      >
                        <Facebook className="w-4 h-4 text-stone-600" />
                      </a>
                    )}
                    <button 
                      className="w-10 h-10 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center transition-colors"
                      title="Share"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: leader.name,
                            text: leader.bio_summary,
                            url: window.location.href,
                          });
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4 text-stone-600" />
                    </button>
                  </div>

                  {/* Available for Public Service */}
                  <p className="text-center text-xs text-stone-400 mt-4">
                    Available for Public Service
                  </p>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-white rounded-xl border border-stone-200 p-5">
                <h3 className="font-semibold text-stone-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">Development Works</span>
                    <span className="font-semibold text-blue-600">{articles.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">Career Milestones</span>
                    <span className="font-semibold text-blue-600">{leader.career_timeline?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">Videos</span>
                    <span className="font-semibold text-blue-600">{allVideos.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">Photos</span>
                    <span className="font-semibold text-blue-600">{leader.gallery_photos?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default LeaderProfilePage;
