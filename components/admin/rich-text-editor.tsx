"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useRef, useState } from "react";
import { Bold, Heading2, ImagePlus, Italic, LinkIcon, List, ListOrdered, Loader2, Quote, Redo2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RichTextEditor({ name, initialValue, onDirty }: { name: string; initialValue: string; onDirty?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  /**
   * The submitted value has to live in React state. Reading editor.getHTML()
   * straight into the hidden input only sampled it at render time, and typing
   * does not re-render — so saving right after typing submitted the document as
   * it was when the editor mounted and silently discarded everything written.
   */
  const [html, setHtml] = useState(initialValue);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Link.configure({ openOnClick: false }), Image],
    content: initialValue,
    editorProps: { attributes: { class: "min-h-64 px-4 py-3 font-body-sm outline-none" } },
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
      onDirty?.();
    },
  });

  const toolbar = [
    { label: "หัวข้อ", icon: Heading2, active: editor?.isActive("heading", { level: 2 }), run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "ตัวหนา", icon: Bold, active: editor?.isActive("bold"), run: () => editor?.chain().focus().toggleBold().run() },
    { label: "ตัวเอียง", icon: Italic, active: editor?.isActive("italic"), run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "รายการ", icon: List, active: editor?.isActive("bulletList"), run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "รายการตัวเลข", icon: ListOrdered, active: editor?.isActive("orderedList"), run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: "คำอ้างอิง", icon: Quote, active: editor?.isActive("blockquote"), run: () => editor?.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div className="overflow-hidden rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/30">
      <input type="hidden" name={name} value={html} readOnly />
      <div className="flex flex-wrap gap-1 border-b bg-muted/50 p-2">
        {toolbar.map((item) => <Button key={item.label} type="button" variant={item.active ? "secondary" : "ghost"} size="icon-sm" onClick={item.run} aria-label={item.label}><item.icon className="size-4" /></Button>)}
        <Button type="button" variant="ghost" size="icon-sm" aria-label="เพิ่มลิงก์" onClick={() => { const href = window.prompt("URL ของลิงก์"); if (href) editor?.chain().focus().extendMarkRange("link").setLink({ href }).run(); }}><LinkIcon className="size-4" /></Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { toast.error("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10 MB"); return; }
            setUploading(true);
            try {
              const body = new FormData();
              body.set("file", file);
              const response = await fetch("/api/admin/media", { method: "POST", body });
              const data = await response.json().catch(() => ({}));
              if (!response.ok) { toast.error(data.message || "อัปโหลดไม่สำเร็จ"); return; }
              editor?.chain().focus().setImage({ src: data.asset.url, alt: file.name }).run();
              onDirty?.();
            } catch {
              toast.error("อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
            } finally {
              setUploading(false);
              if (fileRef.current) fileRef.current.value = "";
            }
          }}
        />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="แทรกรูปภาพ" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        </Button>
        <span className="mx-1 w-px bg-border" />
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor?.chain().focus().undo().run()} aria-label="ย้อนกลับ"><Undo2 className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor?.chain().focus().redo().run()} aria-label="ทำซ้ำ"><Redo2 className="size-4" /></Button>
      </div>
      <EditorContent editor={editor} className={cn("[&_.tiptap_h2]:font-headline-md [&_.tiptap_h3]:font-headline-sm [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-primary [&_.tiptap_blockquote]:pl-4")} />
    </div>
  );
}
