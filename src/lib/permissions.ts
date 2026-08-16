export type Role = "SUPER_ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";

export type Permission =
  | "project.view"
  | "project.create"
  | "project.update"
  | "project.delete"
  | "task.view"
  | "task.create"
  | "task.update"
  | "task.delete"
  | "task.assign"
  | "comment.create"
  | "sprint.manage"
  | "user.invite"
  | "user.manage"
  | "ai.use"
  | "ai.manage"
  | "settings.manage";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "project.view",
    "project.create",
    "project.update",
    "project.delete",
    "task.view",
    "task.create",
    "task.update",
    "task.delete",
    "task.assign",
    "comment.create",
    "sprint.manage",
    "user.invite",
    "user.manage",
    "ai.use",
    "ai.manage",
    "settings.manage",
  ],
  PROJECT_MANAGER: [
    "project.view",
    "project.create",
    "project.update",
    "task.view",
    "task.create",
    "task.update",
    "task.delete",
    "task.assign",
    "comment.create",
    "sprint.manage",
    "user.invite",
    "ai.use",
  ],
  TEAM_MEMBER: [
    "project.view",
    "task.view",
    "task.create",
    "task.update",
    "comment.create",
    "ai.use",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role as Role];
  if (!allowed) return false;
  return allowed.includes(permission);
}
