import { useState, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Link, Heading1, Heading2 } from "lucide-react";

const RichTextEditor = ({ value, onChange, placeholder = "Write content..." }) => {
  const textareaRef = useRef(null);

  const insertTag = (openTag, closeTag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after the operation
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
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-stone-50 border-b border-stone-200 p-2 flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={formatBold}
          className="p-2 hover:bg-stone-200 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4 text-stone-600" />
        </button>
        <button
          type="button"
          onClick={formatItalic}
          className="p-2 hover:bg-stone-200 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4 text-stone-600" />
        </button>
        <div className="w-px h-6 bg-stone-300 mx-1" />
        <button
          type="button"
          onClick={formatH1}
          className="p-2 hover:bg-stone-200 rounded transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4 text-stone-600" />
        </button>
        <button
          type="button"
          onClick={formatH2}
          className="p-2 hover:bg-stone-200 rounded transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4 text-stone-600" />
        </button>
        <div className="w-px h-6 bg-stone-300 mx-1" />
        <button
          type="button"
          onClick={formatList}
          className="p-2 hover:bg-stone-200 rounded transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4 text-stone-600" />
        </button>
        <button
          type="button"
          onClick={formatOrderedList}
          className="p-2 hover:bg-stone-200 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4 text-stone-600" />
        </button>
        <div className="w-px h-6 bg-stone-300 mx-1" />
        <button
          type="button"
          onClick={formatLink}
          className="p-2 hover:bg-stone-200 rounded transition-colors"
          title="Insert Link"
        >
          <Link className="w-4 h-4 text-stone-600" />
        </button>
      </div>
      
      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[200px] p-4 resize-y focus:outline-none text-stone-700"
        style={{ fontFamily: "'Work Sans', sans-serif" }}
      />
      
      {/* Preview Toggle Hint */}
      <div className="bg-stone-50 border-t border-stone-200 px-4 py-2 text-xs text-stone-500">
        Supports HTML tags: &lt;strong&gt;, &lt;em&gt;, &lt;h1&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;a&gt;
      </div>
    </div>
  );
};

export default RichTextEditor;
