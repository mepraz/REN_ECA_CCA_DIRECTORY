"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Key,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Mail,
  User,
  Building,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface OrgAdmin {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface OrganizationData {
  _id: string;
  name: string;
  address: string;
  email?: string;
  isActive: boolean;
  adminId: OrgAdmin | null;
  totalEvents: number;
  totalImages: number;
}

export default function OrganizationsManager() {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationData | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    address: "",
    email: "",
    adminName: "",
    adminEmail: "",
    password: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    password: "",
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refreshOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizations");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch organizations");
      }
      const data = await res.json();
      setOrganizations(data);
      setError(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMsg || "Something went wrong while loading organizations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/organizations");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch organizations");
        }
        const data = await res.json();
        if (active) {
          setOrganizations(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) {
          const errorMsg = err instanceof Error ? err.message : "Something went wrong";
          setError(errorMsg || "Something went wrong while loading organizations.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create organization");
      }

      setSuccess("Organization and Admin created successfully!");
      setCreateModalOpen(false);
      setCreateForm({
        name: "",
        address: "",
        email: "",
        adminName: "",
        adminEmail: "",
        password: "",
      });
      refreshOrganizations();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setFormError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/organizations/${selectedOrg._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update organization");
      }

      setSuccess("Organization details updated successfully!");
      setEditModalOpen(false);
      setSelectedOrg(null);
      refreshOrganizations();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setFormError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/organizations/${selectedOrg._id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(`Password for ${selectedOrg.adminId?.name || "Admin"} has been reset successfully!`);
      setPasswordModalOpen(false);
      setPasswordForm({ password: "" });
      setSelectedOrg(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setFormError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (org: OrganizationData) => {
    try {
      const res = await fetch(`/api/organizations/${org._id}/status`, {
        method: "PATCH",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setSuccess(`Organization "${org.name}" status updated successfully!`);
      refreshOrganizations();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMsg || "Failed to update status.");
      setTimeout(() => setError(null), 4000);
    }
  };

  const openEditModal = (org: OrganizationData) => {
    setSelectedOrg(org);
    setEditForm({
      name: org.name,
      address: org.address,
      email: org.email || "",
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const openPasswordModal = (org: OrganizationData) => {
    setSelectedOrg(org);
    setPasswordForm({ password: "" });
    setFormError(null);
    setPasswordModalOpen(true);
  };

  // Filter organizations
  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.adminId?.name && org.adminId.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search and Add Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <Input
            placeholder="Search by college name, address, or admin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-blue-500 rounded-xl"
          />
        </div>
        <Button
          onClick={() => {
            setFormError(null);
            setCreateModalOpen(true);
          }}
          className="w-full sm:w-auto h-11 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Organization
        </Button>
      </div>

      {/* Message Alerts */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl shadow-sm animate-pulse">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Main Grid / Data Table (BankDash Style) */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-500">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm">Loading organizations data...</p>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="p-20 text-center text-slate-400">
            <Building className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium">No organizations found</p>
            <p className="text-xs mt-1">Try refining your search query or add a new organization.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Organization Details</th>
                  <th className="py-4 px-6">College Admin</th>
                  <th className="py-4 px-6 text-center">Events</th>
                  <th className="py-4 px-6 text-center">Images</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrgs.map((org) => (
                  <tr
                    key={org._id}
                    className="hover:bg-slate-50/50 transition-colors duration-150"
                  >
                    {/* Organization details */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{org.name}</div>
                      <div className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {org.address}
                      </div>
                      {org.email && (
                        <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {org.email}
                        </div>
                      )}
                    </td>

                    {/* Admin details */}
                    <td className="py-4 px-6">
                      {org.adminId ? (
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {org.adminId.name}
                          </div>
                          <div className="text-slate-400 text-xs mt-0.5 pl-5">
                            {org.adminId.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs font-semibold">
                          No Admin Assigned
                        </span>
                      )}
                    </td>

                    {/* Total Events */}
                    <td className="py-4 px-6 text-center font-semibold text-slate-700">
                      {org.totalEvents}
                    </td>

                    {/* Total Images */}
                    <td className="py-4 px-6 text-center font-semibold text-slate-700">
                      {org.totalImages}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          org.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {org.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit details */}
                        <button
                          onClick={() => openEditModal(org)}
                          title="Edit Organization"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => openPasswordModal(org)}
                          title="Reset Admin Password"
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Key className="h-4 w-4" />
                        </button>

                        {/* Toggle Active status */}
                        <button
                          onClick={() => handleToggleStatus(org)}
                          title={org.isActive ? "Deactivate Organization" : "Activate Organization"}
                          className={`p-2 rounded-lg transition-colors ${
                            org.isActive
                              ? "text-emerald-500 hover:text-red-600 hover:bg-red-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {org.isActive ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
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

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Create Organization</h3>
              <p className="text-sm text-slate-400 mt-1">
                Enter details to register the organization and simultaneously create its primary college admin.
              </p>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                    Organization Info
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="orgName">Organization Name *</Label>
                      <Input
                        id="orgName"
                        required
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="Reliance College"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="orgAddress">Address *</Label>
                      <Input
                        id="orgAddress"
                        required
                        value={createForm.address}
                        onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                        placeholder="Chabahil, Kathmandu"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="orgEmail">Email (Optional)</Label>
                      <Input
                        id="orgEmail"
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="contact@reliance.edu.np"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                    College Admin Account
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="adminName">Admin Name *</Label>
                      <Input
                        id="adminName"
                        required
                        value={createForm.adminName}
                        onChange={(e) => setCreateForm({ ...createForm, adminName: e.target.value })}
                        placeholder="Jane Doe"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="adminEmail">Admin Email *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        required
                        value={createForm.adminEmail}
                        onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                        placeholder="jane.doe@reliance.edu.np"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="adminPassword">Password *</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="bg-white border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Edit Organization</h3>
              <p className="text-sm text-slate-400 mt-1">
                Modify details for {selectedOrg.name}.
              </p>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="editName">Organization Name *</Label>
                  <Input
                    id="editName"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editAddress">Address *</Label>
                  <Input
                    id="editAddress"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editEmail">Email (Optional)</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedOrg(null);
                  }}
                  className="bg-white border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {passwordModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Reset Admin Password</h3>
              <p className="text-sm text-slate-400 mt-1">
                Enter a new password for the administrator account of <strong>{selectedOrg.name}</strong> ({selectedOrg.adminId?.email}).
              </p>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="resetPassword">New Password *</Label>
                  <Input
                    id="resetPassword"
                    type="password"
                    required
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setSelectedOrg(null);
                  }}
                  className="bg-white border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
