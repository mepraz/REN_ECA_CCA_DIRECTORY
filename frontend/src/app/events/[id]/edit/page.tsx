import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import EventPageShell from "../../EventPageShell";
import EventForm from "../../EventForm";

export const dynamic = "force-dynamic";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/login");
  const payload = verifyToken(token);
  if (!payload) redirect("/login");
  const { id } = await params;

  return (
    <EventPageShell title="Edit Event">
      <EventForm mode="edit" role={payload.role} eventId={id} />
    </EventPageShell>
  );
}
