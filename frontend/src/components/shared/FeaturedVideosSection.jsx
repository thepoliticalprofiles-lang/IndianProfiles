import { Play, Youtube, ExternalLink } from "lucide-react";

// Helper to extract YouTube video ID
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper to get YouTube thumbnail
const getYouTubeThumbnail = (url, quality = 'maxresdefault') => {
  const videoId = getYouTubeId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  }
  return null;
};

const FeaturedVideosSection = ({ 
  videos = [], 
  title = "Featured Videos",
  subtitle = "Explore our area through these videos",
  areaName = "",
  themeColor = "blue" // blue, green, purple
}) => {
  if (!videos || videos.length === 0) return null;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
      hover: 'group-hover:bg-blue-50'
    },
    green: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      hover: 'group-hover:bg-emerald-50'
    },
    purple: {
      bg: 'bg-purple-600',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700',
      hover: 'group-hover:bg-purple-50'
    }
  };

  const colors = colorClasses[themeColor] || colorClasses.blue;

  return (
    <section className="py-12 bg-white border-b border-stone-200" data-testid="featured-videos-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Youtube className={`w-5 h-5 ${colors.text}`} />
            <p className={`text-xs font-bold uppercase tracking-[0.2em] ${colors.text}`}>{title}</p>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">{subtitle}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => {
            const videoId = getYouTubeId(video);
            const thumbnail = getYouTubeThumbnail(video, 'hqdefault');
            
            return (
              <a
                key={index}
                href={video}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-white rounded-xl overflow-hidden border border-stone-200 hover:shadow-lg transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-stone-900 overflow-hidden">
                  {thumbnail ? (
                    <img 
                      src={thumbnail} 
                      alt={`Video ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-900">
                      <Youtube className="w-16 h-16 text-stone-700" />
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className={`w-14 h-14 ${colors.bg} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    </div>
                  </div>
                  
                  {/* YouTube Badge */}
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Youtube className="w-3 h-3" />
                    <span className="font-medium">YouTube</span>
                  </div>
                  
                  {/* Duration Badge (optional, placeholder) */}
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Video {index + 1}
                  </div>
                </div>
                
                {/* Video Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-semibold text-stone-900 group-hover:${colors.text} transition-colors`}>
                        {areaName || 'Featured Video'}
                      </h3>
                      <p className="text-sm text-stone-500 mt-0.5">
                        Digital showcase
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full ${colors.badge} flex items-center justify-center`}>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedVideosSection;
