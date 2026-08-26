import { Resend } from "resend";
import { prisma } from "./prisma";

export interface SendEmailOptions {
  to: string;
  subject: string;
  template:
    | "INVITATION"
    | "TASK_ASSIGNED"
    | "TASK_UPDATED"
    | "MENTION"
    | "COMMENT"
    | "DUE_SOON"
    | "OVERDUE"
    | "PASSWORD_RESET";
  data: Record<string, any>;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || "http://localhost:3000";
const BRAND_NAME = "Domain Expansion";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Domain Expansion <notifications@domainexpansion.in>";

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function getEmailBaseTemplate(title: string, contentHtml: string, actionButton?: { text: string; url: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0D0D0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F3F4F6; }
    .container { max-width: 600px; margin: 30px auto; background-color: #141414; border: 1px solid #2E2E2E; border-radius: 12px; overflow: hidden; }
    .header { padding: 24px 32px; background: linear-gradient(180deg, #1A1A1A 0%, #141414 100%); border-bottom: 1px solid #2E2E2E; display: flex; align-items: center; }
    .logo-text { font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; text-decoration: none; }
    .logo-badge { color: #FF6200; font-weight: 900; }
    .content { padding: 32px; }
    .title { font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0; }
    .text { font-size: 15px; line-height: 1.6; color: #ACACB8; margin: 0 0 20px 0; }
    .card { background-color: #1A1A1A; border: 1px solid #2E2E2E; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .card-title { font-size: 16px; font-weight: 600; color: #FFFFFF; margin: 0 0 8px 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-right: 8px; }
    .badge-orange { background: rgba(255, 98, 0, 0.15); color: #FF8C42; border: 1px solid rgba(255, 98, 0, 0.3); }
    .badge-purple { background: rgba(109, 40, 217, 0.15); color: #A78BFA; border: 1px solid rgba(109, 40, 217, 0.3); }
    .button-container { text-align: center; margin: 32px 0 20px 0; }
    .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #FF6200 0%, #FF8C42 100%); color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(255, 98, 0, 0.3); }
    .footer { padding: 20px 32px; background-color: #0D0D0D; border-top: 1px solid #2E2E2E; text-align: center; font-size: 12px; color: #888898; }
    .footer-link { color: #FF8C42; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">DOMAIN <span class="logo-badge">EXPANSION</span></div>
    </div>
    <div class="content">
      <h1 class="title">${title}</h1>
      ${contentHtml}
      ${
        actionButton
          ? `
      <div class="button-container">
        <a href="${actionButton.url}" class="btn">${actionButton.text}</a>
      </div>
      `
          : ""
      }
    </div>
    <div class="footer">
      <p style="margin:0 0 6px 0;">This email was sent by <strong>${BRAND_NAME}</strong> Internal Management Platform.</p>
      <p style="margin:0;">Think Outside The Box &bull; <a href="${APP_URL}" class="footer-link">Go to Dashboard</a></p>
    </div>
  </div>
</body>
</html>
`;
}

export async function sendEmail({ to, subject, template, data }: SendEmailOptions): Promise<{ success: boolean; id?: string }> {
  let contentHtml = "";
  let actionButton: { text: string; url: string } | undefined;

  switch (template) {
    case "INVITATION":
      contentHtml = `
        <p class="text">Hello <strong>${data.name}</strong>,</p>
        <p class="text">You have been invited to join the <strong>${BRAND_NAME}</strong> Team Project & Task Management Platform as <strong>${data.role}</strong>.</p>
        <div class="card">
          <div class="card-title">Setup Your Account</div>
          <p class="text" style="margin: 0;">Click the button below to accept your invitation, create your password, and access assigned projects.</p>
        </div>
      `;
      actionButton = {
        text: "Accept Invitation & Set Password",
        url: `${APP_URL}/invite/${data.token}`,
      };
      break;

    case "TASK_ASSIGNED":
      contentHtml = `
        <p class="text">Hello <strong>${data.assigneeName}</strong>,</p>
        <p class="text"><strong>${data.assignerName}</strong> has assigned a task to you.</p>
        <div class="card">
          <div class="card-title"><span class="badge badge-orange">${data.taskKey}</span> ${data.taskTitle}</div>
          <p class="text" style="margin: 8px 0;">Project: <strong>${data.projectName}</strong> | Priority: <strong>${data.priority}</strong> | Due: <strong>${data.dueDate || "No due date"}</strong></p>
          ${data.description ? `<p class="text" style="font-size: 13px; color: #888898; margin: 8px 0 0 0;">${data.description}</p>` : ""}
        </div>
      `;
      actionButton = {
        text: `View ${data.taskKey}`,
        url: `${APP_URL}/tasks/${data.taskKey}`,
      };
      break;

    case "TASK_UPDATED":
      contentHtml = `
        <p class="text">Hello,</p>
        <p class="text"><strong>${data.updaterName}</strong> updated task <strong>${data.taskKey}: ${data.taskTitle}</strong>.</p>
        <div class="card">
          <div class="card-title">Change: ${data.changeDescription}</div>
        </div>
      `;
      actionButton = {
        text: `Open Task ${data.taskKey}`,
        url: `${APP_URL}/tasks/${data.taskKey}`,
      };
      break;

    case "MENTION":
      contentHtml = `
        <p class="text">Hello <strong>${data.userName}</strong>,</p>
        <p class="text"><strong>${data.authorName}</strong> mentioned you in a comment on <strong>${data.taskKey}: ${data.taskTitle}</strong>:</p>
        <div class="card" style="border-left: 3px solid #FF6200;">
          <p class="text" style="color: #FFFFFF; font-style: italic; margin: 0;">"${data.commentContent}"</p>
        </div>
      `;
      actionButton = {
        text: `Reply to ${data.taskKey}`,
        url: `${APP_URL}/tasks/${data.taskKey}`,
      };
      break;

    case "COMMENT":
      contentHtml = `
        <p class="text">Hello,</p>
        <p class="text"><strong>${data.authorName}</strong> left a new comment on <strong>${data.taskKey}: ${data.taskTitle}</strong>:</p>
        <div class="card">
          <p class="text" style="color: #FFFFFF; margin: 0;">"${data.commentContent}"</p>
        </div>
      `;
      actionButton = {
        text: `View Comments`,
        url: `${APP_URL}/tasks/${data.taskKey}`,
      };
      break;

    case "DUE_SOON":
      contentHtml = `
        <p class="text">Hello <strong>${data.assigneeName}</strong>,</p>
        <p class="text">Reminder: Your assigned task is due tomorrow.</p>
        <div class="card" style="border-left: 3px solid #F59E0B;">
          <div class="card-title"><span class="badge badge-orange">${data.taskKey}</span> ${data.taskTitle}</div>
          <p class="text" style="margin: 8px 0 0 0;">Due Date: <strong>${data.dueDate}</strong> | Status: <strong>${data.status}</strong></p>
        </div>
      `;
      actionButton = {
        text: `Work on Task`,
        url: `${APP_URL}/tasks/${data.taskKey}`,
      };
      break;

    case "OVERDUE":
      contentHtml = `
        <p class="text">Hello <strong>${data.assigneeName}</strong>,</p>
        <p class="text"><span style="color: #EF4444; font-weight: 700;">Action Required:</span> The following task is overdue.</p>
        <div class="card" style="border-left: 3px solid #EF4444;">
          <div class="card-title"><span class="badge badge-orange">${data.taskKey}</span> ${data.taskTitle}</div>
          <p class="text" style="margin: 8px 0 0 0;">Was Due: <strong>${data.dueDate}</strong> | Priority: <strong>${data.priority}</strong></p>
        </div>
      `;
      actionButton = {
        text: `Update Status Now`,
        url: `${APP_URL}/tasks/${data.taskKey}`,
      };
      break;

    case "PASSWORD_RESET":
      contentHtml = `
        <p class="text">Hello <strong>${data.name}</strong>,</p>
        <p class="text">We received a request to reset your password for your Domain Expansion account.</p>
        <div class="card">
          <p class="text" style="margin: 0;">If you requested this change, click the button below to set a new password. This link will expire in 1 hour.</p>
        </div>
      `;
      actionButton = {
        text: "Reset Password",
        url: `${APP_URL}/reset-password?token=${data.token}`,
      };
      break;
  }

  const finalHtml = getEmailBaseTemplate(subject, contentHtml, actionButton);

  try {
    // 1. Dispatch live email via Resend API if configured
    if (resendClient) {
      try {
        await resendClient.emails.send({
          from: EMAIL_FROM,
          to: [to],
          subject,
          html: finalHtml,
        });
      } catch (resendErr: any) {
        console.error("⚠️ [Resend API] Error dispatching live email:", resendErr.message);
      }
    }

    // 2. Always record in SentEmailLog for Dev Mailbox Viewer & Audit trail
    const log = await prisma.sentEmailLog.create({
      data: {
        toEmail: to,
        subject,
        template,
        htmlBody: finalHtml,
        status: "SENT",
      },
    });

    return { success: true, id: log.id };
  } catch (error: any) {
    console.error("❌ [EmailService] Failed to record email:", error);
    return { success: false };
  }
}
