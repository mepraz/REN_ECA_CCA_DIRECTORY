import EventPageShell from "../events/EventPageShell";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-dynamic";

export default function GalleryPage() {
  return (
    <EventPageShell title="Gallery">
      <GalleryClient />
    </EventPageShell>
  );
}
