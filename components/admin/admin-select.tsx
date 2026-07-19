"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminSelect({ name, value, defaultValue, onValueChange, placeholder = "ไม่ระบุ", options, className }: { name: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; placeholder?: string; options: { value: string; label: string }[]; className?: string }) {
  return <Select name={name} value={value} defaultValue={defaultValue} onValueChange={onValueChange}><SelectTrigger className={className}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}
