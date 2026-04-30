import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
  Table as TableIcon, Image as ImageIcon, Link as LinkIcon,
  Heading1, Heading2, Undo, Redo, AlignLeft, Quote, Code,
  Palette, Highlighter, ChevronDown
} from 'lucide-react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// Color presets including gradients
const colorPresets = [
  { name: 'Black', color: '#000000' },
  { name: 'Dark Gray', color: '#4b5563' },
  { name: 'Red', color: '#dc2626' },
  { name: 'Orange', color: '#ea580c' },
  { name: 'Yellow', color: '#ca8a04' },
  { name: 'Green', color: '#16a34a' },
  { name: 'Teal', color: '#0d9488' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Indigo', color: '#4f46e5' },
  { name: 'Purple', color: '#9333ea' },
  { name: 'Pink', color: '#db2777' },
];

const gradientPresets = [
  { name: 'Blue Gradient', style: 'linear-gradient(90deg, #2563eb, #06b6d4)', class: 'gradient-blue' },
  { name: 'Green Gradient', style: 'linear-gradient(90deg, #16a34a, #84cc16)', class: 'gradient-green' },
  { name: 'Purple Gradient', style: 'linear-gradient(90deg, #9333ea, #ec4899)', class: 'gradient-purple' },
  { name: 'Orange Gradient', style: 'linear-gradient(90deg, #ea580c, #facc15)', class: 'gradient-orange' },
  { name: 'Red Gradient', style: 'linear-gradient(90deg, #dc2626, #f97316)', class: 'gradient-red' },
  { name: 'Teal Gradient', style: 'linear-gradient(90deg, #0d9488, #22d3ee)', class: 'gradient-teal' },
  { name: 'Indigo Gradient', style: 'linear-gradient(90deg, #4f46e5, #8b5cf6)', class: 'gradient-indigo' },
  { name: 'Gold Gradient', style: 'linear-gradient(90deg, #ca8a04, #fbbf24)', class: 'gradient-gold' },
];

// Suggestion component for @ mentions (leaders) and # mentions (areas)
const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name || item.label });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
              index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-stone-50'
            }`}
          >
            {item.image_url ? (
              <img src={item.image_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium">
                {(item.name || item.label)?.charAt(0)}
              </div>
            )}
            <span>{item.name || item.label}</span>
            {item.designation && <span className="text-stone-400 text-xs">- {item.designation}</span>}
          </button>
        ))
      ) : (
        <div className="px-4 py-2 text-sm text-stone-500">No results found</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';

// Create suggestion configuration
const createSuggestion = (items, char) => ({
  char,
  items: ({ query }) => {
    return items
      .filter(item => (item.name || item.label || '').toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
  },
  render: () => {
    let component;
    let popup;

    return {
      onStart: (props) => {
        component = document.createElement('div');
        
        const updateList = () => {
          const root = document.createElement('div');
          import('react-dom/client').then(({ createRoot }) => {
            const reactRoot = createRoot(root);
            reactRoot.render(
              <MentionList
                items={props.items}
                command={props.command}
                ref={(ref) => {
                  if (ref) component.mentionList = ref;
                }}
              />
            );
          });
          return root;
        };

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: updateList(),
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },
      onUpdate: (props) => {
        if (popup && popup[0]) {
          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        }
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }
        return component?.mentionList?.onKeyDown(props);
      },
      onExit: () => {
        popup?.[0]?.destroy();
      },
    };
  },
});

const AdvancedRichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Start writing...',
  leaders = [],
  areas = [],
  onUploadImage
}) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showGradientPicker, setShowGradientPicker] = useState(false);

  // Create leader mention extension
  const LeaderMention = Mention.configure({
    HTMLAttributes: {
      class: 'mention-leader bg-blue-100 text-blue-700 px-1 rounded',
    },
    suggestion: {
      char: '@',
      items: ({ query }) => {
        return leaders
          .filter(leader => leader.name?.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 10);
      },
      render: () => {
        let reactRenderer;
        let popup;

        return {
          onStart: (props) => {
            const div = document.createElement('div');
            div.className = 'mention-popup';
            document.body.appendChild(div);

            import('react-dom/client').then(({ createRoot }) => {
              const root = createRoot(div);
              root.render(
                <MentionList
                  items={props.items}
                  command={props.command}
                />
              );
              reactRenderer = { root, div };
            });

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: div,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            });
          },
          onUpdate: (props) => {
            if (reactRenderer) {
              reactRenderer.root.render(
                <MentionList
                  items={props.items}
                  command={props.command}
                />
              );
            }
            popup?.[0]?.setProps({
              getReferenceClientRect: props.clientRect,
            });
          },
          onKeyDown: (props) => {
            if (props.event.key === 'Escape') {
              popup?.[0]?.hide();
              return true;
            }
            return false;
          },
          onExit: () => {
            popup?.[0]?.destroy();
            if (reactRenderer) {
              reactRenderer.root.unmount();
              reactRenderer.div.remove();
            }
          },
        };
      },
    },
  });

  // Create area mention extension (using # character)
  const AreaMention = Mention.extend({
    name: 'areaMention',
  }).configure({
    HTMLAttributes: {
      class: 'mention-area bg-green-100 text-green-700 px-1 rounded',
    },
    suggestion: {
      char: '#',
      items: ({ query }) => {
        return areas
          .filter(area => (area.name || area.label)?.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 10);
      },
      render: () => {
        let reactRenderer;
        let popup;

        return {
          onStart: (props) => {
            const div = document.createElement('div');
            div.className = 'area-popup';
            document.body.appendChild(div);

            import('react-dom/client').then(({ createRoot }) => {
              const root = createRoot(div);
              root.render(
                <MentionList
                  items={props.items}
                  command={props.command}
                />
              );
              reactRenderer = { root, div };
            });

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: div,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
            });
          },
          onUpdate: (props) => {
            if (reactRenderer) {
              reactRenderer.root.render(
                <MentionList
                  items={props.items}
                  command={props.command}
                />
              );
            }
            popup?.[0]?.setProps({
              getReferenceClientRect: props.clientRect,
            });
          },
          onKeyDown: (props) => {
            if (props.event.key === 'Escape') {
              popup?.[0]?.hide();
              return true;
            }
            return false;
          },
          onExit: () => {
            popup?.[0]?.destroy();
            if (reactRenderer) {
              reactRenderer.root.unmount();
              reactRenderer.div.remove();
            }
          },
        };
      },
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      LeaderMention,
      AreaMention,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none min-h-[200px] focus:outline-none p-4',
      },
      handlePaste: (view, event) => {
        // Handle paste from Word/other applications
        const html = event.clipboardData?.getData('text/html');
        if (html) {
          // Clean up Word HTML
          const cleaned = html
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/<o:p>[\s\S]*?<\/o:p>/g, '')
            .replace(/class="Mso[^"]*"/g, '')
            .replace(/style="[^"]*mso-[^"]*"/g, '');
          
          // Let TipTap handle the cleaned HTML
          return false;
        }
        return false;
      },
    },
  });

  // Update content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        if (onUploadImage) {
          try {
            const url = await onUploadImage(file);
            editor?.chain().focus().setImage({ src: url }).run();
          } catch (error) {
            console.error('Image upload failed:', error);
            // Fallback to base64
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              editor?.chain().focus().setImage({ src: readerEvent.target?.result }).run();
            };
            reader.readAsDataURL(file);
          }
        } else {
          // Convert to base64 if no upload handler
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            editor?.chain().focus().setImage({ src: readerEvent.target?.result }).run();
          };
          reader.readAsDataURL(file);
        }
      }
    };
    input.click();
  }, [editor, onUploadImage]);

  const addLink = useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-stone-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-stone-200 bg-stone-50 p-2 flex flex-wrap gap-1">
        <div className="flex items-center gap-1 border-r border-stone-200 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('bold') ? 'bg-stone-200' : ''}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('italic') ? 'bg-stone-200' : ''}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('underline') ? 'bg-stone-200' : ''}`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-stone-200 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-stone-200' : ''}`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-stone-200' : ''}`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-stone-200 pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('bulletList') ? 'bg-stone-200' : ''}`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('orderedList') ? 'bg-stone-200' : ''}`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('blockquote') ? 'bg-stone-200' : ''}`}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-stone-200 pr-2 mr-2">
          <button
            type="button"
            onClick={addTable}
            className="p-2 rounded hover:bg-stone-200"
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={addImage}
            className="p-2 rounded hover:bg-stone-200"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className={`p-2 rounded hover:bg-stone-200 ${editor.isActive('link') ? 'bg-stone-200' : ''}`}
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            {showLinkInput && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-stone-200 rounded-lg shadow-lg z-10 flex gap-2">
                <input
                  type="url"
                  placeholder="Enter URL..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="px-2 py-1 border border-stone-300 rounded text-sm w-48"
                  onKeyDown={(e) => e.key === 'Enter' && addLink()}
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-1 border-r border-stone-200 pr-2 mr-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
                setShowGradientPicker(false);
              }}
              className="p-2 rounded hover:bg-stone-200 flex items-center gap-1"
              title="Text Color"
            >
              <Palette className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-stone-200 rounded-lg shadow-lg z-20 w-48">
                <p className="text-xs font-medium text-stone-500 mb-2">Text Color</p>
                <div className="grid grid-cols-6 gap-1">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setColor(preset.color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-stone-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setShowColorPicker(false);
                  }}
                  className="mt-2 text-xs text-stone-500 hover:text-stone-700 w-full text-left"
                >
                  Reset to default
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
                setShowGradientPicker(false);
              }}
              className="p-2 rounded hover:bg-stone-200 flex items-center gap-1"
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-stone-200 rounded-lg shadow-lg z-20 w-48">
                <p className="text-xs font-medium text-stone-500 mb-2">Highlight</p>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    '#fef08a', '#fde047', '#fca5a1', '#fed7aa', '#bbf7d0', '#a7f3d0',
                    '#bfdbfe', '#c7d2fe', '#ddd6fe', '#f5d0fe', '#fbcfe8', '#e5e7eb'
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color }).run();
                        setShowHighlightPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-stone-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightPicker(false);
                  }}
                  className="mt-2 text-xs text-stone-500 hover:text-stone-700 w-full text-left"
                >
                  Remove highlight
                </button>
              </div>
            )}
          </div>

          {/* Gradient Text */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowGradientPicker(!showGradientPicker);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
              }}
              className="p-2 rounded hover:bg-stone-200 flex items-center gap-1"
              title="Gradient Text"
            >
              <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(90deg, #2563eb, #06b6d4)' }} />
              <ChevronDown className="w-3 h-3" />
            </button>
            {showGradientPicker && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-stone-200 rounded-lg shadow-lg z-20 w-56">
                <p className="text-xs font-medium text-stone-500 mb-2">Gradient Text</p>
                <div className="space-y-2">
                  {gradientPresets.map((preset) => (
                    <button
                      key={preset.class}
                      type="button"
                      onClick={() => {
                        // Wrap selection in a span with gradient class
                        const { from, to } = editor.state.selection;
                        const selectedText = editor.state.doc.textBetween(from, to);
                        if (selectedText) {
                          editor.chain().focus().insertContent(
                            `<span class="${preset.class}" style="background: ${preset.style}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${selectedText}</span>`
                          ).run();
                        }
                        setShowGradientPicker(false);
                      }}
                      className="w-full p-2 rounded border border-stone-200 hover:border-blue-400 transition-colors text-left"
                    >
                      <span 
                        className="font-medium text-sm"
                        style={{ 
                          background: preset.style, 
                          WebkitBackgroundClip: 'text', 
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-stone-400">Select text first, then choose gradient</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-stone-200 disabled:opacity-50"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-stone-200 disabled:opacity-50"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="min-h-[200px]" />

      {/* Help text */}
      <div className="border-t border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-500">
        <span className="font-medium">Tips:</span> Use <span className="bg-blue-100 text-blue-700 px-1 rounded">@</span> to mention leaders, <span className="bg-green-100 text-green-700 px-1 rounded">#</span> to tag areas. Supports copy-paste from Word with formatting.
      </div>

      {/* Styles for the editor */}
      <style>{`
        .ProseMirror {
          min-height: 200px;
          padding: 1rem;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1rem 0;
          width: 100%;
        }
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          text-align: left;
        }
        .ProseMirror th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }
        .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
        }
        .ProseMirror h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem;
        }
        .mention-leader, .mention-area {
          padding: 0 4px;
          border-radius: 4px;
        }
        .mention-leader {
          background-color: #dbeafe;
          color: #1d4ed8;
        }
        .mention-area {
          background-color: #d1fae5;
          color: #047857;
        }
      `}</style>
    </div>
  );
};

export default AdvancedRichTextEditor;
