"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { UserRole } from "@/lib/auth";

interface Organization {
  _id: string;
  name: string;
}

// Zod Validation Schema
const createUserSchema = z
  .object({
    name: z.string().min(2, "Full Name must be at least 2 characters long"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Confirm Password must be at least 6 characters long"),
    organizationId: z.string().min(1, "Please select an organization"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type CreateUserValues = z.infer<typeof createUserSchema>;

export default function CreateUserPage() {
  const router = useRouter();
  
  // State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      organizationId: "",
    },
  });

  // Fetch organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await axios.get("/api/organizations", { withCredentials: true });
        setOrganizations(res.data);
      } catch (err) {
        console.error("Failed to load organizations:", err);
        setError("Could not load organizations. Please try again.");
      } finally {
        setOrgsLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const onSubmit = async (values: CreateUserValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(
        "/api/users",
        {
          name: values.name,
          email: values.email,
          password: values.password,
          organizationId: values.organizationId,
        },
        { withCredentials: true }
      );

      setSuccess("College Admin created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard/users");
      }, 1500);
    } catch (err) {
      console.error(err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error 
        ? err.response.data.error 
        : "Failed to create College Admin.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar */}
      <Sidebar userEmail="admin@reliance.edu.np" userRole={UserRole.MAIN_ADMIN} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/users")}
              className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900">Create College Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Welcome, <strong className="text-slate-800 font-semibold">admin@reliance.edu.np</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Shield className="h-3.5 w-3.5" />
              MAIN_ADMIN
            </span>
          </div>
        </header>

        {/* Form Container */}
        <main className="flex-1 p-8 max-w-2xl mx-auto w-full">
          <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-slate-900">Create Admin Account</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Add a new administrator to manage ECA/CCA events for a specific college or school.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4 pt-4">
                {/* Status Messages */}
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-semibold">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    {...register("name")}
                    className={`border-slate-200 rounded-xl ${errors.name ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@college.edu"
                    {...register("email")}
                    className={`border-slate-200 rounded-xl ${errors.email ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                {/* Organization Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="organization" className="text-slate-700 font-semibold">Assigned Organization</Label>
                  {orgsLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      Loading organizations...
                    </div>
                  ) : (
                    <Select
                      onValueChange={(value) => setValue("organizationId", value as string, { shouldValidate: true })}
                      disabled={loading}
                    >
                      <SelectTrigger className={`border-slate-200 rounded-xl ${errors.organizationId ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select an educational institution" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 rounded-xl">
                        {organizations.map((org) => (
                          <SelectItem key={org._id} value={org._id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.organizationId && <p className="text-xs text-red-500">{errors.organizationId.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={`border-slate-200 rounded-xl ${errors.password ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                  {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className={`border-slate-200 rounded-xl ${errors.confirmPassword ? "border-red-500" : ""}`}
                    disabled={loading}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>
              </CardContent>
              <CardFooter className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/users")}
                  className="border-slate-200 hover:bg-slate-100 rounded-xl"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md shadow-blue-500/25"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
}
