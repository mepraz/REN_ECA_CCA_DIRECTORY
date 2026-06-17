import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import EventPageShell from "../EventPageShell";
import EventForm from "../EventForm";

export const dynamic = "force-dynamic";

export default async function CreateEventPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/login");
  const payload = verifyToken(token);
  if (!payload) redirect("/login");

  return (
    <EventPageShell title="Create Event">
      <EventForm mode="create" role={payload.role} />
    </EventPageShell>
  );
}
