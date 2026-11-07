import type { Role } from "@/types";

export function homeForRole(role: Role) {
  if (role === "farmer") return "/app/home";
  if (role === "buyer") return "/app/market";
  if (role === "industry") return "/portal/overview";
  return "/portal/overview";
}

export function isFieldRole(role: Role) {
  return role === "farmer" || role === "buyer";
}

export function isPortalRole(role: Role) {
  return role === "industry" || role === "admin";
}
