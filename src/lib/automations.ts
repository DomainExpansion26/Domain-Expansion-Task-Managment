import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { eventHub } from "./events";

export interface TriggerContext {
  triggerType: "TASK_ASSIGNED" | "STATUS_CHANGED" | "TASK_OVERDUE" | "USER_MENTIONED" | "COMMENT_ADDED";
  taskId?: string;
  projectId?: string;
  userId?: string; // Target or acting user
  metadata?: Record<string, any>;
}

export async function processAutomations(ctx: TriggerContext) {
  try {
    const rules = await prisma.automationRule.findMany({
      where: {
        triggerType: ctx.triggerType,
        isEnabled: true,
      },
    });

    if (ctx.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: ctx.taskId },
        include: {
          project: { include: { lead: true } },
          assignees: { include: { user: { include: { notificationPref: true } } } },
          reporter: true,
        },
      });

      if (!task) return;

      for (const rule of rules) {
        if (ctx.triggerType === "TASK_ASSIGNED" && ctx.metadata?.assigneeId) {
          const assignee = task.assignees.find((a) => a.userId === ctx.metadata?.assigneeId)?.user;
          if (assignee) {
            // Create in-app notification
            if (assignee.notificationPref?.inAppTaskAssigned !== false) {
              await prisma.notification.create({
                data: {
                  userId: assignee.id,
                  title: "Task Assigned",
                  message: `${ctx.metadata?.assignerName || "Someone"} assigned ${task.taskKey}: ${task.title} to you`,
                  type: "TASK_ASSIGNED",
                  link: `/tasks/${task.taskKey}`,
                },
              });
              eventHub.emit("notification", { userId: assignee.id });
            }

            // Send transactional email
            if (assignee.notificationPref?.emailTaskAssigned !== false) {
              await sendEmail({
                to: assignee.email,
                subject: `You have been assigned ${task.taskKey}: ${task.title}`,
                template: "TASK_ASSIGNED",
                data: {
                  assigneeName: assignee.name,
                  assignerName: ctx.metadata?.assignerName || "Manager",
                  taskKey: task.taskKey,
                  taskTitle: task.title,
                  projectName: task.project.name,
                  priority: task.priority,
                  dueDate: task.dueDate ? new Date(task.dueDate).toDateString() : undefined,
                  description: task.description,
                },
              });
            }
          }
        }

        if (ctx.triggerType === "STATUS_CHANGED" && ctx.metadata?.toStatus === "DONE") {
          const lead = task.project.lead;
          if (lead && lead.id !== ctx.metadata?.actorId) {
            await prisma.notification.create({
              data: {
                userId: lead.id,
                title: "Task Completed",
                message: `${ctx.metadata?.actorName || "A team member"} completed ${task.taskKey}: ${task.title}`,
                type: "TASK_UPDATED",
                link: `/tasks/${task.taskKey}`,
              },
            });
            eventHub.emit("notification", { userId: lead.id });
          }
        }
      }
    }
  } catch (error) {
    console.error("Automation error:", error);
  }
}
