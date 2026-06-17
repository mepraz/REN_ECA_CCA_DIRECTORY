import EventPageShell from "../EventPageShell";
import EventDetails from "../EventDetails";

export const dynamic = "force-dynamic";

interface EventDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params;

  return (
    <EventPageShell title="Event Details">
      <EventDetails eventId={id} />
    </EventPageShell>
  );
}
