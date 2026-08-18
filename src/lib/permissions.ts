export type Role =
  | "SUPER_ADMIN"
  | "HR_ADMIN"
  | "MANAGER"
  | "TEAM_LEAD"
  | "MEMBER"
  | "QA"
  // Backward compatibility aliases
  | "PROJECT_MANAGER"
  | "TEAM_MEMBER";

export type Permission =
  | "superadmin.access"
  | "admin.members.manage"
  | "admin.roles.manage"
  | "admin.hierarchy.manage"
  | "admin.settings.manage"
  | "admin.audit.view"
  | "settings.manage"
  | "hrms.access"
  | "hrms.punch"
  | "hrms.leave.apply"
  | "hrms.leave.approve"
  | "hrms.attendance.view"
  | "hrms.attendance.manage"
  | "hrms.reports.view"
  | "hradmin.access"
  | "project.view"
  | "project.create"
  | "project.update"
  | "project.delete"
  | "task.view"
  | "task.create"
  | "task.update"
  | "task.delete"
  | "task.assign"
  | "task.relations.manage"
  | "comment.create"
  | "sprint.manage"
  | "qa.ticket.view"
  | "qa.ticket.create"
  | "qa.ticket.update"
  | "qa.ticket.delete"
  | "qa.bug.view"
  | "qa.bug.create"
  | "qa.bug.update"
  | "qa.bug.delete"
  | "user.invite"
  | "user.manage"
  | "ai.use"
  | "ai.manage";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    "superadmin.access",
    "admin.members.manage",
    "admin.roles.manage",
    "admin.hierarchy.manage",
    "admin.settings.manage",
    "admin.audit.view",
    "settings.manage",
    "hrms.access",
    "hrms.punch",
    "hrms.leave.apply",
    "hrms.leave.approve",
    "hrms.attendance.view",
    "hrms.attendance.manage",
    "hrms.reports.view",
    "hradmin.access",
    "project.view",
    "project.create",
    "project.update",
    "project.delete",
    "task.view",
    "task.create",
    "task.update",
    "task.delete",
    "task.assign",
    "task.relations.manage",
    "comment.create",
    "sprint.manage",
    "qa.ticket.view",
    "qa.ticket.create",
    "qa.ticket.update",
    "qa.ticket.delete",
    "qa.bug.view",
    "qa.bug.create",
    "qa.bug.update",
    "qa.bug.delete",
    "user.invite",
    "user.manage",
    "ai.use",
    "ai.manage",
  ],
  HR_ADMIN: [
    "hrms.access",
    "hrms.punch",
    "hrms.leave.apply",
    "hrms.leave.approve",
    "hrms.attendance.view",
    "hrms.attendance.manage",
    "hrms.reports.view",
    "hradmin.access",
    "project.view",
    "task.view",
    "comment.create",
    "user.invite",
    "ai.use",
  ],
  MANAGER: [
    "hrms.access",
    "hrms.punch",
    "hrms.leave.apply",
    "hrms.leave.approve",
    "hrms.attendance.view",
    "project.view",
    "project.create",
    "project.update",
    "task.view",
    "task.create",
    "task.update",
    "task.delete",
    "task.assign",
    "task.relations.manage",
    "comment.create",
    "sprint.manage",
    "qa.ticket.view",
    "qa.ticket.create",
    "qa.bug.view",
    "user.invite",
    "ai.use",
  ],
  PROJECT_MANAGER: [
    "hrms.access",
    "hrms.punch",
    "hrms.leave.apply",
    "hrms.leave.approve",
    "hrms.attendance.view",
    "project.view",
    "project.create",
    "project.update",
    "task.view",
    "task.create",
    "task.update",
    "task.delete",
    "task.assign",
    "task.relations.manage",
    "comment.create",
    "sprint.manage",
    "qa.ticket.view",
    "qa.ticket.create",
    "qa.bug.view",
    "user.invite",
    "ai.use",
  ],
  TEAM_LEAD: [
    "hrms.access",
    "hrms.punch",
    "hrms.leave.apply",
    "hrms.leave.approve",
    "hrms.attendance.view",
    "project.view",
    "task.view",
    "task.create",
    "task.update",
    "task.assign",
    "task.relations.manage",
    "comment.create",
    "sprint.manage",
    "qa.ticket.view",
    "qa.ticket.create",
    "qa.ticket.update",
    "qa.bug.view",
    "qa.bug.create",
    "ai.use",
  ],
  QA: [
    "hrms.access",
    "hrms.punch",
    "hrms.leave.apply",
    "hrms.attendance.view",
    "project.view",
    "task.view",
    "comment.create",
    "qa.ticket.view",
    "qa.ticket.create",
    "qa.ticket.update",
    "qa.bug.view",
    "qa.bug.create",
    "qa.bug.update",
    "ai.use",
  ],
  MEMBER: [
    "hrms.access",
    "hrms.punch",
    "hrms.leave.apply",
    "hrms.attendance.view",
    "project.view",
    "task.view",
    "task.create",
    "task.update",
    "comment.create",
    "qa.ticket.view",
    "qa.bug.view",
    "ai.use",
  ],
  TEAM_MEMBER: [
    "hrms.access",
    "hrms.punch",
    "hrms.leave.apply",
    "hrms.attendance.view",
    "project.view",
    "task.view",
    "task.create",
    "task.update",
    "comment.create",
    "qa.ticket.view",
    "qa.bug.view",
    "ai.use",
  ],
};

export function normalizeRole(role?: string): Role {
  if (!role) return "MEMBER";
  const r = role.toUpperCase();
  if (r === "PROJECT_MANAGER") return "MANAGER";
  if (r === "TEAM_MEMBER") return "MEMBER";
  return r as Role;
}

export function hasPermission(role: string, permission: Permission): boolean {
  const normalized = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function isSuperAdmin(roleOrUser?: string | { role?: string } | null): boolean {
  const role = typeof roleOrUser === "object" ? roleOrUser?.role : roleOrUser;
  return normalizeRole(role) === "SUPER_ADMIN";
}

export function isHRAdmin(roleOrUser?: string | { role?: string } | null): boolean {
  const role = typeof roleOrUser === "object" ? roleOrUser?.role : roleOrUser;
  const norm = normalizeRole(role);
  return norm === "HR_ADMIN" || norm === "SUPER_ADMIN";
}

export function isManager(roleOrUser?: string | { role?: string } | null): boolean {
  const role = typeof roleOrUser === "object" ? roleOrUser?.role : roleOrUser;
  const norm = normalizeRole(role);
  return norm === "MANAGER" || norm === "SUPER_ADMIN";
}

export function isTeamLead(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === "TEAM_LEAD" || norm === "MANAGER" || norm === "SUPER_ADMIN";
}

export function isQA(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === "QA" || norm === "SUPER_ADMIN";
}

export type ProjectRole =
  | "PROJECT_MANAGER"
  | "TEAM_LEAD"
  | "DEVELOPER"
  | "DESIGNER"
  | "TESTER"
  | "MEMBER"
  | "OTHER";

export const PROJECT_ROLES: ProjectRole[] = [
  "PROJECT_MANAGER",
  "TEAM_LEAD",
  "DEVELOPER",
  "DESIGNER",
  "TESTER",
  "MEMBER",
  "OTHER",
];

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  PROJECT_MANAGER: "Project Manager",
  TEAM_LEAD: "Team Lead",
  DEVELOPER: "Developer",
  DESIGNER: "Designer",
  TESTER: "Tester / QA",
  MEMBER: "Member",
  OTHER: "Contributor",
};

export function normalizeProjectRole(role?: string): ProjectRole {
  if (!role) return "MEMBER";
  const r = role.toUpperCase();
  if (r === "LEAD") return "TEAM_LEAD";
  if (PROJECT_ROLES.includes(r as ProjectRole)) return r as ProjectRole;
  return "MEMBER";
}

/**
 * Checks if a user has active HRMS access
 */
export function isHRMSActive(user: any): boolean {
  if (!user) return false;
  if (isSuperAdmin(user.role) || isHRAdmin(user.role)) return true;
  if (!user.hrProfile) return false;
  const status = user.hrProfile.status?.toUpperCase();
  return status === "ACTIVE" || status === "PROBATION";
}
