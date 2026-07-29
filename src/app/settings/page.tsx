import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsContent />
    </div>
  );
}
