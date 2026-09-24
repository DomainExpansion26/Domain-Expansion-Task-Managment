import { NextRequest, NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const activeTemplate = await withDbRetry(() =>
      prisma.nDATemplate.findFirst({
        where: { isActive: true },
        orderBy: { publishedAt: "desc" },
      })
    );

    const activeVersion = activeTemplate?.version || "v1.0";

    const members = await withDbRetry(() =>
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          jobTitle: true,
          department: true,
          accountStatus: true,
          isActive: true,
          joiningDate: true,
          createdAt: true,
          ndaAccepted: true,
          ndaAcceptedAt: true,
          ndaVersionAccepted: true,
          hrProfile: {
            select: {
              employeeId: true,
              phone: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
            },
          },
          teamLead: {
            select: {
              id: true,
              name: true,
            },
          },
          ndaAcceptances: {
            select: {
              id: true,
              version: true,
              acceptedAt: true,
              ipAddress: true,
              userAgent: true,
              template: {
                select: {
                  title: true,
                },
              },
            },
            orderBy: { acceptedAt: "desc" },
          },
        },
        orderBy: { name: "asc" },
      })
    );

    // Format member records with compliance status
    const formatted = members.map((m) => {
      const isCompliant = Boolean(m.ndaAccepted && m.ndaVersionAccepted === activeVersion);
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        employeeId: m.hrProfile?.employeeId || "EMP-" + m.id.substring(0, 4).toUpperCase(),
        department: m.department || "General",
        designation: m.jobTitle || "Member",
        role: m.role,
        reportingManager: m.manager?.name || "Direct (None)",
        reportingManagerId: m.manager?.id || null,
        teamLead: m.teamLead?.name || "Direct (None)",
        teamLeadId: m.teamLead?.id || null,
        accountStatus: m.accountStatus || (m.isActive ? "ACTIVE" : "DEACTIVATED"),
        joiningDate: m.joiningDate || m.createdAt,
        ndaStatus: isCompliant ? "Accepted" : "Pending",
        ndaAccepted: isCompliant,
        acceptanceDate: m.ndaAcceptedAt,
        ndaVersion: m.ndaVersionAccepted || "None",
        activeVersionEnforced: activeVersion,
        history: m.ndaAcceptances,
      };
    });

    const totalMembers = formatted.length;
    const acceptedCount = formatted.filter((m) => m.ndaStatus === "Accepted").length;
    const pendingCount = totalMembers - acceptedCount;
    const complianceRate = totalMembers > 0 ? Math.round((acceptedCount / totalMembers) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        activeVersion,
        metrics: {
          totalMembers,
          acceptedCount,
          pendingCount,
          complianceRate,
        },
        members: formatted,
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Super Admin privileges required" } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: err.message || "Failed to load compliance records" } },
      { status: 500 }
    );
  }
}
