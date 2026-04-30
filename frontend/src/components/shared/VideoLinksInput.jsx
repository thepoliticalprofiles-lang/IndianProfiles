import { useState } from "react";
import { Plus, Trash2, Youtube, Play, Link, GripVertical } from "lucide-react";
import { Input } from "../ui/input";

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
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return null;
};

const VideoLinksInput = ({ value = [], onChange, label = "YouTube Video Links", maxVideos = 10 }) => {
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");

  const addVideo = () => {
    if (!newUrl.trim()) {
      setError("Please enter a URL");
      return;
    }
    
    // Validate YouTube URL
    if (!getYouTubeId(newUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }
    
    if (value.includes(newUrl)) {
      setError("This video is already added");
      return;
    }
    
    if (value.length >= maxVideos) {
      setError(`Maximum ${maxVideos} videos allowed`);
      return;
    }
    
    onChange([...value, newUrl]);
    setNewUrl("");
    setError("");
  };

  const removeVideo = (index) => {
    const newVideos = value.filter((_, i) => i !== index);
    onChange(newVideos);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addVideo();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      
      {/* Added Videos */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((url, index) => {
            const thumbnail = getYouTubeThumbnail(url);
            const videoId = getYouTubeId(url);
            
            return (
              <div 
                key={index}
                className="flex items-center gap-3 bg-stone-50 rounded-lg p-2 border border-stone-200 group"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-14 rounded overflow-hidden flex-shrink-0 bg-stone-200">
                  {thumbnail ? (
                    <img src={thumbnail} alt={`Video ${index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-stone-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" fill="white" />
                  </div>
                </div>
                
                {/* URL */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-700 truncate">{url}</p>
                  <p className="text-xs text-stone-400">Video {index + 1}</p>
                </div>
                
                {/* Actions */}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Open in new tab"
                >
                  <Link className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Add New Video */}
      {value.length < maxVideos && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Youtube className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
            <Input
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://youtube.com/watch?v=..."
              className="pl-10"
            />
          </div>
          <button
            type="button"
            onClick={addVideo}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Help Text */}
      <p className="text-xs text-stone-500">
        Add YouTube video links to showcase this area digitally. Max {maxVideos} videos.
      </p>
    </div>
  );
};

export default VideoLinksInput;
