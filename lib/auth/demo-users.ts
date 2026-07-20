import type { SessionUser } from "@/lib/domain/types";

export const demoUsers: SessionUser[] = [
  { id: "user-platform", name: "Admin Plataforma", email: "superadmin@demo.local", role: "platform_superadmin" },
  { id: "user-owner", name: "Martina Ríos", email: "owner@demo.local", role: "owner", workspaceId: "ws-fusion", academyId: "academy-fusion", branchId: "branch-centro" },
  { id: "user-reception", name: "Carla Méndez", email: "recepcion@demo.local", role: "receptionist", workspaceId: "ws-fusion", academyId: "academy-fusion", branchId: "branch-centro" },
  { id: "user-instructor", name: "Tomás Herrera", email: "profesor@demo.local", role: "instructor", workspaceId: "ws-fusion", academyId: "academy-fusion", branchId: "branch-centro" }
];

export const homeForRole = (role: SessionUser["role"]) => role === "platform_superadmin" ? "/platform" : role === "instructor" ? "/instructor/dashboard" : "/app/dashboard";
