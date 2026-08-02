"use client";

import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Only these schemes survive sanitizeRichHtml, so reject the rest before insert. */
const SAFE_LINK = /^(https?:\/\/|mailto:|\/)/i;

function normalizeHref(raw: string): string | null {
  const href = raw.trim();
  if (!href) return null;
  if (SAFE_LINK.test(href)) return href;
  // Bare domains typed without a scheme are the common case — assume https.
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(href)) return `https://${href}`;
  return null;
}

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
    extensions: [
      // StarterKit v3 already ships link, underline and strike — registering
      // them again produces duplicate-extension warnings and breaks commands,
      // so configure them here instead of adding separate extensions.
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
        // Sanitising on save strips <pre>/<code>, so do not let editors write
        // content that silently disappears.
        code: false,
        codeBlock: false,
      }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "เริ่มพิมพ์เนื้อหาที่นี่..." }),
    ],
    content: initialValue,
    editorProps: { attributes: { class: "min-h-64 px-4 py-3 font-body-sm outline-none" } },
    onUpdate: ({ editor }) => {
      // An "empty" editor still serialises to <p></p>, which passes the
      // required-field check on publish. Submit a truly empty string instead.
      setHtml(editor.isEmpty ? "" : editor.getHTML());
      onDirty?.();
    },
  });

  /**
   * useEditor does not re-render on every transaction in Tiptap v3, so reading
   * editor.isActive() during render left the toolbar highlighting stale state
   * whenever the caret moved. useEditorState subscribes properly.
   */
  const active = useEditorState({
    editor,
    selector: ({ editor }) => editor && {
      paragraph: editor.isActive("paragraph") && !editor.isActive("bulletList") && !editor.isActive("orderedList"),
      heading2: editor.isActive("heading", { level: 2 }),
      heading3: editor.isActive("heading", { level: 3 }),
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
      link: editor.isActive("link"),
      alignLeft: editor.isActive({ textAlign: "left" }),
      alignCenter: editor.isActive({ textAlign: "center" }),
      alignRight: editor.isActive({ textAlign: "right" }),
      alignJustify: editor.isActive({ textAlign: "justify" }),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
      currentLink: (editor.getAttributes("link").href as string | undefined) || "",
    },
  });

  const insertImage = async (file: File) => {
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
    }
  };

  const groups: { label: string; icon: typeof Bold; isActive?: boolean; disabled?: boolean; run: () => void }[][] = [
    [
      { label: "ข้อความปกติ", icon: Pilcrow, isActive: active?.paragraph, run: () => editor?.chain().focus().setParagraph().run() },
      { label: "หัวข้อใหญ่ (H2)", icon: Heading2, isActive: active?.heading2, run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: "หัวข้อย่อย (H3)", icon: Heading3, isActive: active?.heading3, run: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    ],
    [
      { label: "ตัวหนา", icon: Bold, isActive: active?.bold, run: () => editor?.chain().focus().toggleBold().run() },
      { label: "ตัวเอียง", icon: Italic, isActive: active?.italic, run: () => editor?.chain().focus().toggleItalic().run() },
      { label: "ขีดเส้นใต้", icon: UnderlineIcon, isActive: active?.underline, run: () => editor?.chain().focus().toggleUnderline().run() },
      { label: "ขีดฆ่า", icon: Strikethrough, isActive: active?.strike, run: () => editor?.chain().focus().toggleStrike().run() },
    ],
    [
      { label: "รายการ", icon: List, isActive: active?.bulletList, run: () => editor?.chain().focus().toggleBulletList().run() },
      { label: "รายการตัวเลข", icon: ListOrdered, isActive: active?.orderedList, run: () => editor?.chain().focus().toggleOrderedList().run() },
      { label: "คำอ้างอิง", icon: Quote, isActive: active?.blockquote, run: () => editor?.chain().focus().toggleBlockquote().run() },
      { label: "เส้นคั่น", icon: Minus, run: () => editor?.chain().focus().setHorizontalRule().run() },
    ],
    [
      { label: "ชิดซ้าย", icon: AlignLeft, isActive: active?.alignLeft, run: () => editor?.chain().focus().setTextAlign("left").run() },
      { label: "กึ่งกลาง", icon: AlignCenter, isActive: active?.alignCenter, run: () => editor?.chain().focus().setTextAlign("center").run() },
      { label: "ชิดขวา", icon: AlignRight, isActive: active?.alignRight, run: () => editor?.chain().focus().setTextAlign("right").run() },
      { label: "เต็มบรรทัด", icon: AlignJustify, isActive: active?.alignJustify, run: () => editor?.chain().focus().setTextAlign("justify").run() },
    ],
  ];

  return (
    <div className="overflow-hidden rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/30">
      <input type="hidden" name={name} value={html} readOnly />
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/50 p-2">
        {groups.map((group, index) => (
          <div key={index} className="flex items-center gap-0.5">
            {index > 0 ? <Separator orientation="vertical" className="mx-1 !h-5" /> : null}
            {group.map((item) => (
              <Button
                key={item.label}
                type="button"
                variant={item.isActive ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={item.run}
                aria-label={item.label}
                aria-pressed={item.isActive}
                title={item.label}
              >
                <item.icon className="size-4" />
              </Button>
            ))}
          </div>
        ))}

        <Separator orientation="vertical" className="mx-1 !h-5" />
        <LinkButton editor={editor} isActive={active?.link} currentHref={active?.currentLink || ""} onDirty={onDirty} />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="ลบลิงก์"
          title="ลบลิงก์"
          disabled={!active?.link}
          onClick={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}
        >
          <Unlink className="size-4" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) await insertImage(file);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="แทรกรูปภาพ" title="แทรกรูปภาพ" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        </Button>

        <Separator orientation="vertical" className="mx-1 !h-5" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="ล้างรูปแบบ"
          title="ล้างรูปแบบ"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <RemoveFormatting className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" disabled={!active?.canUndo} onClick={() => editor?.chain().focus().undo().run()} aria-label="ย้อนกลับ" title="ย้อนกลับ"><Undo2 className="size-4" /></Button>
        <Button type="button" variant="ghost" size="icon-sm" disabled={!active?.canRedo} onClick={() => editor?.chain().focus().redo().run()} aria-label="ทำซ้ำ" title="ทำซ้ำ"><Redo2 className="size-4" /></Button>
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          "[&_.tiptap]:min-h-64",
          "[&_.tiptap_h2]:font-headline-md [&_.tiptap_h2]:mt-4 [&_.tiptap_h2]:mb-2",
          "[&_.tiptap_h3]:font-headline-sm [&_.tiptap_h3]:mt-3 [&_.tiptap_h3]:mb-2",
          "[&_.tiptap_p]:my-2",
          "[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6",
          "[&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-primary [&_.tiptap_blockquote]:pl-4",
          "[&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-t [&_.tiptap_hr]:border-border",
          "[&_.tiptap_a]:text-primary [&_.tiptap_a]:underline [&_.tiptap_a]:underline-offset-2",
          "[&_.tiptap_img]:my-3 [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-md",
          // Placeholder text for the empty document.
          "[&_.tiptap_p.is-editor-empty:first-child]:before:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child]:before:float-left [&_.tiptap_p.is-editor-empty:first-child]:before:h-0 [&_.tiptap_p.is-editor-empty:first-child]:before:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        )}
      />
    </div>
  );
}

function LinkButton({ editor, isActive, currentHref, onDirty }: { editor: Editor | null; isActive?: boolean; currentHref: string; onDirty?: () => void }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");

  const apply = () => {
    const normalized = normalizeHref(href);
    if (!normalized) { toast.error("กรุณากรอกลิงก์ที่ถูกต้อง (ขึ้นต้นด้วย https:// หรือ mailto:)"); return; }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
    onDirty?.();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Seed the field from the link under the caret so editing an existing
        // link does not force the editor to retype the whole URL.
        if (next) setHref(currentHref);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant={isActive ? "secondary" : "ghost"} size="icon-sm" aria-label="เพิ่มลิงก์" title="เพิ่มลิงก์"><LinkIcon className="size-4" /></Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="rich-text-link" className="font-label-md">URL ของลิงก์</Label>
          <Input
            id="rich-text-link"
            value={href}
            autoFocus
            placeholder="https://example.com"
            className="font-body-sm"
            onChange={(event) => setHref(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); apply(); } }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button type="button" size="sm" onClick={apply}>ใส่ลิงก์</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
