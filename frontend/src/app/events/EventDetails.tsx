"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Edit, Image as ImageIcon, Loader2, Trophy, Users } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import type { EventRecord } from "./types";

interface EventDetailsProps {
  eventId: string;
}

export default function EventDetails({ eventId }: EventDetailsProps) {
  const router = useRouter();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load event");
        setEvent(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl text-center">
        <p className="font-semibold text-slate-700">Event not found</p>
        <Button onClick={() => router.push("/events")} className="mt-4 rounded-xl">Back to Events</Button>
      </div>
    );
  }

  const banner = event.images?.find((image) => image.category === "banner") || event.images?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push("/events")} className="rounded-xl border-slate-200 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Link href={`/events/${event._id}/edit`}>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {banner ? (
          <Image
            src={banner.url}
            alt={event.programName}
            width={1200}
            height={420}
            className="h-72 w-full object-cover bg-slate-100"
          />
        ) : (
          <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        <div className="p-6">
          <p className="text-sm font-semibold text-blue-600">{event.organizationId?.name}</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{event.programName}</h2>
          <p className="text-slate-500 mt-2">{event.programNature}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="border border-slate-200 rounded-xl p-4">
              <CalendarDays className="h-5 w-5 text-blue-600 mb-2" />
              <p className="text-xs uppercase font-bold text-slate-400">Program Date</p>
              <p className="font-semibold text-slate-800 mt-1">{new Date(event.programDate).toLocaleDateString()}</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <Users className="h-5 w-5 text-emerald-600 mb-2" />
              <p className="text-xs uppercase font-bold text-slate-400">Participants</p>
              <p className="font-semibold text-slate-800 mt-1">{event.participantsCount}</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <Trophy className="h-5 w-5 text-amber-600 mb-2" />
              <p className="text-xs uppercase font-bold text-slate-400">Winners</p>
              <p className="font-semibold text-slate-800 mt-1">{event.winners?.length || 0}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Description</h3>
          <p className="text-sm leading-6 text-slate-600 whitespace-pre-wrap">{event.description || "No description added."}</p>
          {event.guestDetails && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Guest Details</h3>
              <p className="text-sm leading-6 text-slate-600 mt-2">{event.guestDetails}</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900">Winners</h3>
          {event.winners?.length ? (
            <ul className="mt-4 space-y-2">
              {event.winners.map((winner, index) => (
                <li key={`${winner}-${index}`} className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  {winner}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 mt-3">No winners recorded.</p>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Images</h3>
        {event.images?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {event.images.map((image) => (
              <div key={image._id} className="border border-slate-200 rounded-xl overflow-hidden">
                <Image
                  src={image.url}
                  alt={image.label || image.originalName}
                  width={480}
                  height={260}
                  className="h-44 w-full object-cover bg-slate-100"
                />
                <div className="p-3">
                  <p className="text-xs uppercase font-bold text-blue-600">{image.category}</p>
                  <p className="text-sm text-slate-600 truncate mt-1">{image.label || image.originalName}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No images uploaded.</p>
        )}
      </section>
    </div>
  );
}
