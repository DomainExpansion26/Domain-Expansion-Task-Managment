import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    const isHRorSuper = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);
    const isLeadOrManager = isManager(currentUser.role) || isTeamLead(currentUser.role);

    let where: any = {};
    if (!isHRorSuper && !isLeadOrManager) {
      where.userId = currentUser.id;
    } else if (targetUserId) {
      where.userId = targetUserId;
    } else if (isLeadOrManager && !isHRorSuper) {
      where.OR = [
        { userId: currentUser.id },
        { reviewerId: currentUser.id },
      ];
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, jobTitle: true, department: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = reviews.map((r) => {
      let goals: any[] = [];
      try {
        goals = JSON.parse(r.goalsJson);
      } catch (e) {}

      return {
        ...r,
        user: userMap.get(r.userId) || null,
        reviewer: r.reviewerId ? userMap.get(r.reviewerId) || null : null,
        goals,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch performance reviews" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { userId, period = "Q1 2026", selfReview, managerFeedback, rating = 5.0, goals = [], strengths, improvementAreas, status = "PENDING_SELF_REVIEW" } = await request.json();

    const targetUserId = userId || currentUser.id;

    const review = await prisma.performanceReview.create({
      data: {
        userId: targetUserId,
        reviewerId: currentUser.id !== targetUserId ? currentUser.id : null,
        period,
        selfReview: selfReview?.trim() || null,
        managerFeedback: managerFeedback?.trim() || null,
        rating: Number(rating) || 5.0,
        goalsJson: JSON.stringify(goals),
        strengths: strengths?.trim() || null,
        improvementAreas: improvementAreas?.trim() || null,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: "Performance review submitted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to create performance review" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id, selfReview, managerFeedback, rating, goals, strengths, improvementAreas, status } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Review ID is required" } }, { status: 400 });
    }

    const existing = await prisma.performanceReview.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Review not found" } }, { status: 404 });
    }

    const updateData: any = {};
    if (selfReview !== undefined) updateData.selfReview = selfReview;
    if (managerFeedback !== undefined) {
      updateData.managerFeedback = managerFeedback;
      updateData.reviewerId = currentUser.id;
    }
    if (rating !== undefined) updateData.rating = Number(rating);
    if (goals !== undefined) updateData.goalsJson = JSON.stringify(goals);
    if (strengths !== undefined) updateData.strengths = strengths;
    if (improvementAreas !== undefined) updateData.improvementAreas = improvementAreas;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.performanceReview.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Performance review updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update review" } }, { status: 500 });
  }
}
