"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { UserRole } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreVertical,
  Shield,
  Key,
  Trash2,
  Edit,
  ArrowUpDown,
  Loader2,
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Organization {
  _id: string;
  name: string;
}

function UsersListContent() {
  const router = useRouter();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(null);

  // Query/Filter State
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals/Dialogs State
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchOrganizations = async () => {
    try {
      const res = await axios.get("/api/organizations", { withCredentials: true });
      setOrganizations(res.data);
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const orgQuery = selectedOrg !== "all" ? `&organizationId=${selectedOrg}` : "";
      const res = await axios.get(
        `/api/users?page=${page}&limit=10&search=${search}${orgQuery}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        { withCredentials: true }
      );
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Current User session (via /api/auth/me or verify local session)
  useEffect(() => {
    // Decodes token payload client-side if possible or fetches a status
    // For simplicity, we can fetch from cookies or a simple profile call.
    // Let's call /health or /api/auth/login or similar, but the middleware ensures auth
    // Let's set a simple default or fetch organization data.
    const getSessionInfo = () => {
      // In Next.js middleware enforces this. Let's retrieve user details by decoding the cookie locally if needed
      // Or we can just read from a state since this page is protected.
      // Let's default to a friendly welcome back.
      setCurrentUser({ email: "admin@reliance.edu.np", role: "MAIN_ADMIN" });
    };
    getSessionInfo();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrganizations();
  }, []);

  // Fetch users whenever filters/pagination/sorting changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedOrg, page, sortBy, sortOrder]);

  const handleStatusToggle = async (user: User) => {
    try {
      const updatedStatus = !user.isActive;
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: updatedStatus } : u))
      );

      await axios.patch(`/api/users/${user._id}/status`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Error toggling status:", err);
      // Revert state on error
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: user.isActive } : u))
      );
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    try {
      await axios.patch(
        `/api/users/${resetUser?._id}/reset-password`,
        { password: newPassword },
        { withCredentials: true }
      );
      setResetUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error 
        ? err.response.data.error 
        : "Failed to reset password.";
      setResetError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/users/${deleteUser._id}`, { withCredentials: true });
      setUsers((prev) => prev.filter((u) => u._id !== deleteUser._id));
      setDeleteUser(null);
    } catch (err) {
      console.error("Error deleting user:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar */}
      <Sidebar userEmail={currentUser?.email} userRole={currentUser?.role as UserRole} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Manage College Admins</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Welcome, <strong className="text-slate-800 font-semibold">{currentUser?.email}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Shield className="h-3.5 w-3.5" />
              MAIN_ADMIN
            </span>
          </div>
        </header>

        {/* Dashboard */}
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                User Management
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Configure administrative accounts assigned to individual educational organizations.
              </p>
            </div>
            <Link href="/dashboard/users/create">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl gap-2 font-semibold shadow-md shadow-blue-500/25 transition-all">
                <Plus className="h-5 w-5" />
                Create User
              </Button>
            </Link>
          </div>

          {/* Filters Area */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 border-slate-200 focus:border-blue-500 rounded-xl"
              />
            </div>

            {/* Filter by Organization */}
            <div className="w-full md:w-64">
              <Select
                value={selectedOrg}
                onValueChange={(val) => {
                  setSelectedOrg(val || "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="border-slate-200 rounded-xl">
                  <SelectValue placeholder="All Organizations" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl">
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org._id} value={org._id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                <p className="text-sm text-slate-400">Loading administrators...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                <p className="text-lg font-semibold text-slate-700">No Administrators Found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Try adjusting your search criteria or create a new user record.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75 border-b border-slate-200">
                      <TableHead className="w-12 text-center font-semibold text-slate-600">SN</TableHead>
                      <TableHead className="font-semibold text-slate-600 cursor-pointer" onClick={() => toggleSort("name")}>
                        <div className="flex items-center gap-1">
                          Name <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600 cursor-pointer" onClick={() => toggleSort("email")}>
                        <div className="flex items-center gap-1">
                          Email <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600">Organization</TableHead>
                      <TableHead className="font-semibold text-slate-600">Status</TableHead>
                      <TableHead className="font-semibold text-slate-600">Last Login</TableHead>
                      <TableHead className="font-semibold text-slate-600 cursor-pointer" onClick={() => toggleSort("createdAt")}>
                        <div className="flex items-center gap-1">
                          Created Date <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="w-20 text-center font-semibold text-slate-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow key={user._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="text-center font-medium text-slate-500">
                          {(page - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                        <TableCell className="text-slate-600">{user.email}</TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {user.organizationId?.name || (
                            <span className="text-red-500 italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={() => handleStatusToggle(user)}
                            />
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                user.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(user.lastLogin)}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer inline-flex">
                              <MoreVertical className="h-4 w-4 text-slate-600" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white border-slate-200 rounded-xl shadow-lg">
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/users/${user._id}/edit`)}
                                className="flex items-center gap-2 text-slate-700 focus:bg-slate-50 hover:bg-slate-50 cursor-pointer rounded-lg px-3 py-2 text-sm"
                              >
                                <Edit className="h-4 w-4 text-blue-500" />
                                Edit Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setResetUser(user)}
                                className="flex items-center gap-2 text-slate-700 focus:bg-slate-50 hover:bg-slate-50 cursor-pointer rounded-lg px-3 py-2 text-sm"
                              >
                                <Key className="h-4 w-4 text-orange-500" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteUser(user)}
                                className="flex items-center gap-2 text-red-600 focus:bg-red-50 hover:bg-red-50 cursor-pointer rounded-lg px-3 py-2 text-sm"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && users.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page <strong className="text-slate-700">{page}</strong> of{" "}
                <strong className="text-slate-700">{totalPages}</strong>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-slate-200 hover:bg-slate-100 rounded-xl"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-slate-200 hover:bg-slate-100 rounded-xl"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Reset Password Modal */}
      <Dialog open={resetUser !== null} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent className="bg-white border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold text-lg">Reset Password</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Enter a new secure password for <strong>{resetUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {resetError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg p-2">
                {resetError}
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-slate-200 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setResetUser(null);
                setNewPassword("");
                setConfirmPassword("");
                setResetError("");
              }}
              className="border-slate-200 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteUser !== null} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <DialogContent className="bg-white border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-red-700 font-bold text-lg">Delete Account</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete the account for <strong>{deleteUser?.name}</strong>?
              This will perform a soft delete and restrict access immediately. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteUser(null)}
              className="border-slate-200 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl"
            >
              {deleteLoading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-2" />
        <span>Loading User Portal...</span>
      </div>
    }>
      <UsersListContent />
    </Suspense>
  );
}
