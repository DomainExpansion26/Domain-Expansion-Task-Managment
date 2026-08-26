import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isHRAdmin, isSuperAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const [openings, candidates] = await Promise.all([
      prisma.jobOpening.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.candidate.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const openingMap = new Map(openings.map((o) => [o.id, o]));

    const candidatesWithJob = candidates.map((c) => ({
      ...c,
      jobOpening: c.jobOpeningId ? openingMap.get(c.jobOpeningId) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        openings,
        candidates: candidatesWithJob,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch recruitment data" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body; // action: "CREATE_JOB" | "ADD_CANDIDATE"

    if (action === "CREATE_JOB") {
      const { title, department, location, workMode = "HYBRID", openingsCount = 1, experienceRequired = "2-4 Years", description } = body;
      if (!title?.trim() || !department) {
        return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Job title and department are required" } }, { status: 400 });
      }

      const job = await prisma.jobOpening.create({
        data: {
          title: title.trim(),
          department,
          location: location?.trim() || "Bangalore, IN (Hybrid)",
          workMode,
          openingsCount: Number(openingsCount) || 1,
          experienceRequired,
          description: description?.trim() || null,
          status: "OPEN",
        },
      });

      return NextResponse.json({ success: true, data: job, message: `Job opening "${job.title}" created successfully` });
    }

    if (action === "ADD_CANDIDATE") {
      const { jobOpeningId, name, email, phone, resumeUrl } = body;
      if (!name?.trim() || !email?.trim()) {
        return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Candidate name and email are required" } }, { status: 400 });
      }

      const candidate = await prisma.candidate.create({
        data: {
          jobOpeningId: jobOpeningId || null,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          resumeUrl: resumeUrl?.trim() || null,
          status: "APPLIED",
        },
      });

      return NextResponse.json({ success: true, data: candidate, message: `Candidate ${candidate.name} added to pipeline` });
    }

    return NextResponse.json({ success: false, error: { code: "INVALID_ACTION", message: "Invalid action type" } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to process recruitment request" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { candidateId, status, interviewDate, interviewType, interviewerName, interviewFeedback, rating } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Candidate ID is required" } }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (interviewDate) updateData.interviewDate = new Date(interviewDate);
    if (interviewType) updateData.interviewType = interviewType;
    if (interviewerName) updateData.interviewerName = interviewerName;
    if (interviewFeedback) updateData.interviewFeedback = interviewFeedback;
    if (rating !== undefined) updateData.rating = Number(rating);

    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Candidate ${updated.name} updated successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update candidate" } }, { status: 500 });
  }
}
