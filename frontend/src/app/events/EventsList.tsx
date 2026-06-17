"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Eye, Image as ImageIcon, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EventRecord } from "./types";

export default function EventsList() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/events${query}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load events");
      setEvents(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(loadEvents, 250);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  const deleteEvent = async (eventId: string) => {
    if (!window.confirm("Delete this event from the directory?")) return;
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete event");
      toast.success("Event deleted");
      setEvents((current) => current.filter((event) => event._id !== eventId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Event Directory</h2>
          <p className="mt-2 text-sm text-slate-500">Browse ECA/CCA programs, winners, guests, and event media.</p>
        </div>
        <Link href="/events/create">
          <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2">
            <Plus className="h-5 w-5" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by program or nature..."
            className="pl-10 rounded-xl border-slate-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No events found</p>
            <p className="text-sm text-slate-400 mt-1">Create the first ECA/CCA event record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Program</th>
                  <th className="py-4 px-6">Institution</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-center">Participants</th>
                  <th className="py-4 px-6 text-center">Images</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-slate-50/60">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">{event.programName}</p>
                      <p className="text-xs text-slate-500 mt-1">{event.programNature}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-700">{event.organizationId?.name || "Unassigned"}</td>
                    <td className="py-4 px-6 text-slate-600">{new Date(event.programDate).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-center font-semibold text-slate-700">{event.participantsCount}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <ImageIcon className="h-4 w-4" />
                        {event.images?.length || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/events/${event._id}`} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600" title="View">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => deleteEvent(event._id)} className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
