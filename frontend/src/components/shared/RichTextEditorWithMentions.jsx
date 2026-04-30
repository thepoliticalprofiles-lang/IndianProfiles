import { useState, useRef, useEffect, useCallback } from "react";
import { Bold, Italic, List, ListOrdered, Link, Heading1, Heading2, AtSign, Hash, Users, MapPin } from "lucide-react";

const RichTextEditorWithMentions = ({ 
  value, 
  onChange, 
  placeholder = "Write content...",
  leaders = [],
  constituencies = [],
  subRegions = [],
  onMention
}) => {
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Mention state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionType, setMentionType] = useState(null); // 'leader' (@) or 'area' (#)
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(null);

  // Get filtered items based on mention type and query
  const getFilteredItems = useCallback(() => {
    const query = mentionQuery.toLowerCase();
    if (mentionType === 'leader') {
      return leaders.filter(l => 
        l.name.toLowerCase().includes(query) || 
        (l.designation && l.designation.toLowerCase().includes(query))
      ).slice(0, 8);
    } else if (mentionType === 'area') {
      const constMatches = constituencies.filter(c => 
        c.name.toLowerCase().includes(query)
      ).map(c => ({ ...c, type: 'constituency' }));
      const subRegionMatches = subRegions.filter(sr => 
        sr.name.toLowerCase().includes(query)
      ).map(sr => ({ ...sr, type: 'division' }));
      return [...constMatches, ...subRegionMatches].slice(0, 8);
    }
    return [];
  }, [mentionType, mentionQuery, leaders, constituencies, subRegions]);

  const filteredItems = getFilteredItems();

  // Calculate dropdown position based on caret
  const calculateDropdownPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Create a mirror div to measure text
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    mirror.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      width: ${textarea.clientWidth}px;
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      line-height: ${style.lineHeight};
      padding: ${style.padding};
    `;
    
    const textBeforeCaret = value.substring(0, textarea.selectionStart);
    mirror.textContent = textBeforeCaret;
    
    const span = document.createElement('span');
    span.textContent = '|';
    mirror.appendChild(span);
    
    document.body.appendChild(mirror);
    
    const rect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    
    // Calculate position relative to textarea
    const top = spanRect.top - mirrorRect.top + 24; // Add some offset
    const left = Math.min(spanRect.left - mirrorRect.left, textarea.clientWidth - 300);
    
    document.body.removeChild(mirror);
    
    setMentionPosition({ top: Math.min(top, 150), left: Math.max(left, 0) });
  };

  // Handle text input
  const handleChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    
    // Check for @ or # trigger
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    // Determine which trigger is more recent
    if (lastAtIndex > lastHashIndex && lastAtIndex >= 0) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space before @ (or it's at the start)
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) && !textAfterAt.includes(' ')) {
        setMentionType('leader');
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setShowMentionDropdown(true);
        setHighlightedIndex(0);
        calculateDropdownPosition();
        return;
      }
    }
    
    if (lastHashIndex > lastAtIndex && lastHashIndex >= 0) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
      const charBeforeHash = lastHashIndex > 0 ? textBeforeCursor[lastHashIndex - 1] : ' ';
      if ((charBeforeHash === ' ' || charBeforeHash === '\n' || lastHashIndex === 0) && !textAfterHash.includes(' ')) {
        setMentionType('area');
        setMentionQuery(textAfterHash);
        setMentionStartIndex(lastHashIndex);
        setShowMentionDropdown(true);
        setHighlightedIndex(0);
        calculateDropdownPosition();
        return;
      }
    }
    
    // Close dropdown if no valid trigger
    setShowMentionDropdown(false);
  };

  // Select a mention
  const selectMention = (item) => {
    if (!textareaRef.current || mentionStartIndex === null) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    
    // Format the mention based on type
    let mentionText;
    if (mentionType === 'leader') {
      mentionText = `@${item.name}`;
    } else {
      mentionText = `#${item.name}`;
    }
    
    // Replace the trigger + query with the mention
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(cursorPos);
    const newValue = beforeMention + mentionText + ' ' + afterMention;
    
    onChange(newValue);
    
    // Notify parent about the mention
    if (onMention) {
      onMention(mentionType, item);
    }
    
    // Close dropdown and reset
    setShowMentionDropdown(false);
    setMentionQuery("");
    setMentionStartIndex(null);
    
    // Set cursor position after mention
    setTimeout(() => {
      const newPos = mentionStartIndex + mentionText.length + 1;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showMentionDropdown) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredItems[highlightedIndex]) {
      e.preventDefault();
      selectMention(filteredItems[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowMentionDropdown(false);
    } else if (e.key === 'Tab' && filteredItems[highlightedIndex]) {
      e.preventDefault();
      selectMention(filteredItems[highlightedIndex]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          textareaRef.current && !textareaRef.current.contains(e.target)) {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatting functions
  const insertTag = (openTag, closeTag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + openTag.length;
      textarea.selectionEnd = start + openTag.length + selectedText.length;
    }, 0);
  };

  const formatBold = () => insertTag("<strong>", "</strong>");
  const formatItalic = () => insertTag("<em>", "</em>");
  const formatH1 = () => insertTag("<h1>", "</h1>");
  const formatH2 = () => insertTag("<h2>", "</h2>");
  const formatList = () => insertTag("<ul>\n<li>", "</li>\n</ul>");
  const formatOrderedList = () => insertTag("<ol>\n<li>", "</li>\n</ol>");
  const formatLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      insertTag(`<a href="${url}">`, "</a>");
    }
  };

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden relative">
      {/* Toolbar */}
      <div className="bg-stone-50 border-b border-stone-200 p-2 flex items-center gap-1 flex-wrap">
        <button type="button" onClick={formatBold} className="p-2 hover:bg-stone-200 rounded transition-colors" title="Bold">
          <Bold className="w-4 h-4 text-stone-600" />
        </button>
        <button type="button" onClick={formatItalic} className="p-2 hover:bg-stone-200 rounded transition-colors" title="Italic">
          <Italic className="w-4 h-4 text-stone-600" />
        </button>
        <div className="w-px h-6 bg-stone-300 mx-1" />
        <button type="button" onClick={formatH1} className="p-2 hover:bg-stone-200 rounded transition-colors" title="Heading 1">
          <Heading1 className="w-4 h-4 text-stone-600" />
        </button>
        <button type="button" onClick={formatH2} className="p-2 hover:bg-stone-200 rounded transition-colors" title="Heading 2">
          <Heading2 className="w-4 h-4 text-stone-600" />
        </button>
        <div className="w-px h-6 bg-stone-300 mx-1" />
        <button type="button" onClick={formatList} className="p-2 hover:bg-stone-200 rounded transition-colors" title="Bullet List">
          <List className="w-4 h-4 text-stone-600" />
        </button>
        <button type="button" onClick={formatOrderedList} className="p-2 hover:bg-stone-200 rounded transition-colors" title="Numbered List">
          <ListOrdered className="w-4 h-4 text-stone-600" />
        </button>
        <div className="w-px h-6 bg-stone-300 mx-1" />
        <button type="button" onClick={formatLink} className="p-2 hover:bg-stone-200 rounded transition-colors" title="Insert Link">
          <Link className="w-4 h-4 text-stone-600" />
        </button>
      </div>
      
      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full min-h-[200px] p-4 resize-y focus:outline-none text-stone-700"
          style={{ fontFamily: "'Work Sans', sans-serif" }}
        />
        
        {/* Mention Dropdown */}
        {showMentionDropdown && filteredItems.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto w-72"
            style={{ 
              top: `${mentionPosition.top}px`, 
              left: `${mentionPosition.left}px` 
            }}
          >
            <div className="px-3 py-2 bg-stone-50 border-b border-stone-100">
              <p className="text-xs font-medium text-stone-500 flex items-center gap-1">
                {mentionType === 'leader' ? (
                  <><AtSign className="w-3 h-3" /> Mention a Leader</>
                ) : (
                  <><Hash className="w-3 h-3" /> Tag an Area</>
                )}
              </p>
            </div>
            {filteredItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectMention(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-stone-50'
                }`}
              >
                {mentionType === 'leader' ? (
                  <>
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-stone-500 truncate">{item.designation}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-stone-500 capitalize">{item.type || 'Area'}</p>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
        
        {/* No results message */}
        {showMentionDropdown && filteredItems.length === 0 && mentionQuery && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 bg-white border border-stone-200 rounded-lg shadow-lg w-72"
            style={{ 
              top: `${mentionPosition.top}px`, 
              left: `${mentionPosition.left}px` 
            }}
          >
            <div className="px-4 py-3 text-sm text-stone-500 text-center">
              No {mentionType === 'leader' ? 'leaders' : 'areas'} found matching "{mentionQuery}"
            </div>
          </div>
        )}
      </div>
      
      {/* Hints */}
      <div className="bg-stone-50 border-t border-stone-200 px-4 py-2 text-xs text-stone-500 flex flex-wrap items-center gap-4">
        <span>Supports HTML tags: &lt;strong&gt;, &lt;em&gt;, &lt;h1&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;a&gt;</span>
        <span className="flex items-center gap-1">
          <AtSign className="w-3 h-3" /> Mention leaders
        </span>
        <span className="flex items-center gap-1">
          <Hash className="w-3 h-3" /> Tag areas
        </span>
      </div>
    </div>
  );
};

export default RichTextEditorWithMentions;
