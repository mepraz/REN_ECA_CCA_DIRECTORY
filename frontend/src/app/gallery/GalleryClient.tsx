"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Image as ImageIcon, Loader2, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import type { EventImageCategory, OrganizationOption } from "../events/types";

interface GalleryImage {
  _id: string;
  category: EventImageCategory;
  label?: string;
  url: string;
  originalName: string;
  eventId: string;
  programName: string;
  programDate: string;
  organization?: OrganizationOption;
}

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "banner", label: "Banner" },
  { value: "audience", label: "Audience" },
  { value: "other", label: "Other" },
];

export default function GalleryClient() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState("all");
  const [category, setCategory] = useState("all");
  const [date, setDate] = useState("");

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const res = await fetch("/api/events/organizations");
        if (!res.ok) throw new Error("Failed to load institutions");
        setOrganizations(await res.json());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load institutions");
      }
    };
    loadOrganizations();
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (organizationId !== "all") params.set("organizationId", organizationId);
        if (category !== "all") params.set("category", category);
        const res = await fetch(`/api/events/gallery?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load gallery");
        setImages(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load gallery");
      } finally {
        setLoading(false);
      }
    };
    const timer = window.setTimeout(loadImages, 250);
    return () => window.clearTimeout(timer);
  }, [category, organizationId, search]);

  const filteredImages = useMemo(() => {
    if (!date) return images;
    return images.filter((image) => image.programDate?.slice(0, 10) === date);
  }, [date, images]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Event Gallery</h2>
        <p className="mt-2 text-sm text-slate-500">Review uploaded ECA/CCA images across institutions and event categories.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by event name..."
            className="pl-10 rounded-xl border-slate-200"
          />
        </div>
        <select
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
        >
          <option value="all">All Institutions</option>
          {organizations.map((organization) => (
            <option key={organization._id} value={organization._id}>{organization.name}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="rounded-xl border-slate-200"
        />
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading gallery...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl text-center">
          <ImageIcon className="h-10 w-10 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No images found</p>
          <p className="text-sm text-slate-400 mt-1">Try changing the filters or upload images to an event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredImages.map((image) => (
            <Link
              key={image._id}
              href={`/events/${image.eventId}`}
              className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <Image
                src={image.url}
                alt={image.label || image.originalName}
                width={520}
                height={300}
                className="h-48 w-full object-cover bg-slate-100"
              />
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase font-bold text-blue-600">{image.category}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(image.programDate).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mt-2 truncate">{image.programName}</h3>
                <p className="text-sm text-slate-500 truncate mt-1">{image.organization?.name || "Institution"}</p>
                {image.label && <p className="text-xs text-slate-400 truncate mt-2">{image.label}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
