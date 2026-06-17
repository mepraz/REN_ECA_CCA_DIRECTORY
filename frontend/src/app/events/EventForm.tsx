"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventImage, EventImageCategory, EventRecord, OrganizationOption, UserRole } from "./types";

interface PendingImage {
  file: File;
  category: EventImageCategory;
  label: string;
  preview: string;
}

interface EventFormProps {
  mode: "create" | "edit";
  role: UserRole;
  eventId?: string;
}

const categories: Array<{ value: EventImageCategory; label: string }> = [
  { value: "banner", label: "Banner" },
  { value: "audience", label: "Audience" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  organizationId: "",
  programName: "",
  participantsCount: "0",
  winners: "",
  programDate: "",
  programNature: "",
  guestDetails: "",
  description: "",
};

const readSaveError = async (res: Response) => {
  const fallback = `Unable to save event (${res.status} ${res.statusText || "Error"})`;
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (typeof data?.error === "string" && data.error.trim()) return data.error;
      if (typeof data?.message === "string" && data.message.trim()) return data.message;
      return fallback;
    }

    const text = await res.text();
    const trimmed = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return trimmed ? `${fallback}: ${trimmed.slice(0, 300)}` : fallback;
  } catch {
    return fallback;
  }
};

export default function EventForm({ mode, role, eventId }: EventFormProps) {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [existingImages, setExistingImages] = useState<EventImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await fetch("/api/events/organizations", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load organizations");
        const data = await res.json();
        setOrganizations(data);
        if (role === "COLLEGE_ADMIN" && data[0]?._id) {
          setForm((current) => ({ ...current, organizationId: data[0]._id }));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to load organizations");
      }
    };
    loadOptions();
  }, [role]);

  useEffect(() => {
    if (mode !== "edit" || !eventId) return;
    const loadEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`, { credentials: "include" });
        const data: EventRecord | { error?: string } = await res.json();
        if (!res.ok) throw new Error("error" in data ? data.error : "Failed to load event");
        const event = data as EventRecord;
        setForm({
          organizationId: event.organizationId?._id || "",
          programName: event.programName || "",
          participantsCount: String(event.participantsCount || 0),
          winners: (event.winners || []).join("\n"),
          programDate: event.programDate ? event.programDate.slice(0, 10) : "",
          programNature: event.programNature || "",
          guestDetails: event.guestDetails || "",
          description: event.description || "",
        });
        setExistingImages(event.images || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId, mode]);

  const imageMeta = useMemo(
    () => pendingImages.map((image) => ({ category: image.category, label: image.label })),
    [pendingImages]
  );

  const updateForm = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const nextImages = Array.from(files).map((file) => ({
      file,
      category: "other" as EventImageCategory,
      label: "",
      preview: URL.createObjectURL(file),
    }));
    setPendingImages((current) => [...current, ...nextImages]);
  };

  const updatePendingImage = (index: number, values: Partial<PendingImage>) => {
    setPendingImages((current) =>
      current.map((image, imageIndex) => (imageIndex === index ? { ...image, ...values } : image))
    );
  };

  const removePendingImage = (index: number) => {
    setPendingImages((current) => {
      const target = current[index];
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return current.filter((_, imageIndex) => imageIndex !== index);
    });
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages((current) => current.filter((image) => image._id !== imageId));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      body.set("winners", JSON.stringify(form.winners.split("\n").map((item) => item.trim()).filter(Boolean)));
      body.set("imageMeta", JSON.stringify(imageMeta));
      body.set("keepImageIds", JSON.stringify(existingImages.map((image) => image._id)));
      pendingImages.forEach((image) => body.append("images", image.file));

      const res = await fetch(mode === "edit" ? `/api/events/${eventId}` : "/api/events", {
        method: mode === "edit" ? "PUT" : "POST",
        credentials: "include",
        body,
      });
      if (!res.ok) throw new Error(await readSaveError(res));
      const data = await res.json().catch(() => null);

      toast.success(mode === "edit" ? "Event updated" : "Event created");
      if (Array.isArray(data?.warnings) && data.warnings.length > 0) {
        toast.error(data.warnings.join("\n"), { duration: 7000 });
      }
      router.push(mode === "edit" ? `/events/${eventId}` : "/events");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save event";
      setError(message);
      toast.error(message);
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading event details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(mode === "edit" && eventId ? `/events/${eventId}` : "/events")}
          className="rounded-xl border-slate-200 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Event"}
        </Button>
      </div>

      {error && (
        <div
          ref={errorRef}
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex gap-3 shadow-sm"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Event was not saved</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {role === "MAIN_ADMIN" && (
            <div className="space-y-2">
              <Label>Institution *</Label>
              <select
                value={form.organizationId}
                onChange={(event) => updateForm("organizationId", event.target.value)}
                required
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                <option value="">Select institution</option>
                {organizations.map((organization) => (
                  <option key={organization._id} value={organization._id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="programName">Program Name *</Label>
            <Input
              id="programName"
              value={form.programName}
              onChange={(event) => updateForm("programName", event.target.value)}
              required
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="programDate">Program Date *</Label>
            <Input
              id="programDate"
              type="date"
              value={form.programDate}
              onChange={(event) => updateForm("programDate", event.target.value)}
              required
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="programNature">Program Nature *</Label>
            <Input
              id="programNature"
              value={form.programNature}
              onChange={(event) => updateForm("programNature", event.target.value)}
              placeholder="ECA, CCA, Sports, Arts..."
              required
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participantsCount">Participants Count</Label>
            <Input
              id="participantsCount"
              type="number"
              min="0"
              value={form.participantsCount}
              onChange={(event) => updateForm("participantsCount", event.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="guestDetails">Guest Details</Label>
            <Input
              id="guestDetails"
              value={form.guestDetails}
              onChange={(event) => updateForm("guestDetails", event.target.value)}
              className="rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="winners">Winners</Label>
          <textarea
            id="winners"
            value={form.winners}
            onChange={(event) => updateForm("winners", event.target.value)}
            rows={4}
            placeholder="One winner or winning team per line"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </section>

      <section className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Event Images</h2>
            <p className="text-sm text-slate-500">Upload banner, audience, and supporting images.</p>
          </div>
          <label className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold cursor-pointer hover:bg-slate-700">
            <ImagePlus className="h-4 w-4" />
            Add Images
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(event) => handleFiles(event.target.files)} />
          </label>
        </div>

        {existingImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {existingImages.map((image) => (
              <div key={image._id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <Image
                  src={image.url}
                  alt={image.label || image.originalName}
                  width={420}
                  height={220}
                  className="h-36 w-full object-cover"
                />
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 uppercase">{image.category}</p>
                    <p className="text-sm text-slate-500 truncate">{image.label || image.originalName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingImage(image._id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                    title="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pendingImages.length > 0 && (
          <div className="space-y-3">
            {pendingImages.map((image, index) => (
              <div key={`${image.file.name}-${index}`} className="grid grid-cols-1 md:grid-cols-[64px_1fr_160px_1fr_auto] gap-3 items-center border border-slate-200 rounded-xl p-3">
                <div className="h-12 w-16 relative rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium text-slate-700 truncate">{image.file.name}</p>
                <select
                  value={image.category}
                  onChange={(event) => updatePendingImage(index, { category: event.target.value as EventImageCategory })}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm animate-none"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
                <Input
                  value={image.label}
                  onChange={(event) => updatePendingImage(index, { label: event.target.value })}
                  placeholder="Optional label"
                  className="rounded-xl border-slate-200"
                />
                <button type="button" onClick={() => removePendingImage(index)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </form>
  );
}
