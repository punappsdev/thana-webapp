import { PopupForm } from "@/components/admin/popup-form";
import { requireAdminPage } from "@/lib/admin/auth";

export default async function NewPopupPage() {
  // Renders no stored data, but an empty admin form should still be behind the
  // session rather than served to anyone holding a stale cookie.
  await requireAdminPage();
  return <PopupForm record={null} />;
}
