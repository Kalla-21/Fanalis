"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import CharacterCount from "@tiptap/extension-character-count";
import { createBlogPost } from "@/app/blog/action";

type CreateBlogFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
};

// Moved outside the component to prevent "Duplicate extension" warnings during React Strict Mode re-renders
const TIPTAP_EXTENSIONS = [
  StarterKit, 
  Underline, 
  Link.configure({ openOnClick: false }), 
  CharacterCount.configure({ limit: null })
];

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const btnClass = (isActive: boolean) => `p-2 text-sm rounded transition-colors flex-shrink-0 ${isActive ? "bg-[#ff66aa] text-white" : "text-gray-300 hover:bg-[#2a2238] hover:text-white"}`;

  return (
    <div className="flex flex-wrap gap-1 border-b border-[#2a2238] p-2 bg-[#1a1721] rounded-t-md">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}><b>B</b></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}><i>I</i></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive("underline"))}><u>U</u></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))}><s>S</s></button>
      
      <div className="w-px h-6 bg-[#2a2238] mx-1 self-center"></div>
      
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive("heading", { level: 1 }))}>H1</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))}>H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive("heading", { level: 3 }))}>H3</button>
      
      <div className="w-px h-6 bg-[#2a2238] mx-1 self-center"></div>
      
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>• List</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>1. List</button>
      
      <div className="w-px h-6 bg-[#2a2238] mx-1 self-center"></div>
      
      <button type="button" onClick={setLink} className={btnClass(editor.isActive("link"))}>
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/><path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive("codeBlock"))}>&lt;/&gt;</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))}>&quot;</button>
      
      <div className="w-px h-6 bg-[#2a2238] mx-1 self-center"></div>
      
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)}>↩</button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)}>↪</button>
    </div>
  );
};

export default function CreateBlogForm({ onSuccess, onCancel, isModal = false }: CreateBlogFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const wordLimit = 2500;
  const charLimit = 15000;

  const editor = useEditor({
    extensions: TIPTAP_EXTENSIONS,
    content: '',
    immediatelyRender: false, // Suppresses the hydration mismatch warning
    onUpdate: ({ editor }) => { 
      setWordCount(editor.storage.characterCount.words()); 
      setCharCount(editor.storage.characterCount.characters());
    },
    editorProps: {
      attributes: { class: 'max-w-none min-h-[500px] p-6 focus:outline-none custom-scrollbar text-gray-200 [&>ul]:list-disc [&>ol]:list-decimal [&>ul]:ml-6 [&>ol]:ml-6 [&>ul]:my-2 [&>ol]:my-2 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:my-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:my-3 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:my-2 [&_a]:text-[#ff66aa] [&_a]:underline' },
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "image/gif" || file.name.toLowerCase().endsWith('.gif')) {
        setMsg({ text: "GIFs are not allowed.", type: "error" }); e.target.value = ""; return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setMsg({ text: "File must be under 2MB.", type: "error" }); e.target.value = ""; return;
      }
      setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); setMsg({ text: "", type: "" });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.trim().split(/\s+/).filter(Boolean).length <= 50 || text.length < title.length) setTitle(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    if (wordCount > wordLimit) return setMsg({ text: `Content exceeds ${wordLimit} words.`, type: "error" });
    if (charCount > charLimit) return setMsg({ text: `Content exceeds ${charLimit} characters.`, type: "error" });
    if (wordCount === 0) return setMsg({ text: "Content cannot be empty.", type: "error" });
    
    setIsSubmitting(true);
    setMsg({ text: "Publishing blog...", type: "info" });

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", editor.getHTML()); 
    if (coverFile) formData.append("cover_file", coverFile);

    const res = await createBlogPost(formData);
    setIsSubmitting(false);

    if (res.error) setMsg({ text: res.error, type: "error" });
    else { if (onSuccess) onSuccess(); else router.push("/"); }
  };

  const isOverLimit = wordCount > wordLimit || charCount > charLimit;

  return (
    <div className={`w-full ${!isModal ? "bg-[#1a1721] p-8 rounded-lg shadow-xl border border-[#2a2238]" : ""}`}>
      {!isModal && (
        <div className="border-b border-[#2a2238] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-white">Create a New Blog</h1>
        </div>
      )}

      {msg.text && (
        <div className={`mb-4 p-4 border rounded-md text-sm font-medium ${msg.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-green-500/20 border-green-500/50 text-green-200'}`}>{msg.text}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Title (max 50 words) <span className="text-[#ff66aa]">*</span></label>
          <input
            type="text" required value={title} onChange={handleTitleChange}
            className="w-full bg-[#231d2e] border border-[#3b304c] text-gray-100 rounded-md px-4 py-3 focus:outline-none focus:border-[#ff66aa] transition-colors text-lg shadow-inner"
            placeholder="Give your post a catchy title..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Cover Image (Optional)</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {coverPreview && <img src={coverPreview} alt="Preview" className="w-40 h-28 object-cover rounded-md border border-[#2a2238] shadow-md" />}
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#735ab0] file:text-white hover:file:bg-[#856ec4] cursor-pointer transition-colors" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-semibold text-gray-300">Content</label>
            <div className="flex gap-4">
              <span className={`text-xs font-medium ${charCount > charLimit ? "text-red-400 font-bold" : "text-gray-400"}`}>
                {charCount.toLocaleString()} / {charLimit.toLocaleString()} chars
              </span>
              <span className={`text-xs font-medium ${wordCount > wordLimit ? "text-red-400 font-bold" : "text-gray-400"}`}>
                {wordCount.toLocaleString()} / {wordLimit.toLocaleString()} words
              </span>
            </div>
          </div>
          <div className={`border rounded-md overflow-hidden bg-[#231d2e] shadow-inner transition-colors ${isOverLimit ? "border-red-500" : "border-[#3b304c] focus-within:border-[#ff66aa]"}`}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2238]">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-6 py-2 rounded-md font-medium text-gray-400 hover:text-white hover:bg-[#2a2238] transition-colors">Cancel</button>
          )}
          <button type="submit" disabled={isSubmitting || isOverLimit || wordCount === 0 || title.length === 0} className="bg-[#ff66aa] hover:bg-[#ff4499] text-white font-bold py-2.5 px-8 rounded-md transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-lg">
            {isSubmitting ? "Publishing..." : "Publish Blog"}
          </button>
        </div>
      </form>
    </div>
  );
}