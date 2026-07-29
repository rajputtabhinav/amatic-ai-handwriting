import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard by default - auth will be handled by middleware
  redirect("/dashboard");
}
