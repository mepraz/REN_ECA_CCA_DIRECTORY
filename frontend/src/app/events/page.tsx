import EventPageShell from "./EventPageShell";
import EventsList from "./EventsList";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  return (
    <EventPageShell title="Events">
      <EventsList />
    </EventPageShell>
  );
}
