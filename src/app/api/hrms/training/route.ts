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

    const programs = await prisma.trainingProgram.findMany({
      orderBy: { startDate: "asc" },
    });

    const formatted = programs.map((p) => {
      let participants: any[] = [];
      try {
        participants = JSON.parse(p.participantsJson);
      } catch (e) {}
      return {
        ...p,
        participants,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch training programs" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || (!isHRAdmin(currentUser.role) && !isSuperAdmin(currentUser.role))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "HR Admin or Super Admin permission required" } }, { status: 403 });
    }

    const { title, description, trainer, startDate, endDate, participants = [] } = await request.json();

    if (!title?.trim() || !trainer?.trim() || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Title, trainer, start date, and end date are required" } }, { status: 400 });
    }

    const program = await prisma.trainingProgram.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        trainer: trainer.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "UPCOMING",
        participantsJson: JSON.stringify(participants),
      },
    });

    return NextResponse.json({
      success: true,
      data: program,
      message: `Training program ${program.title} created successfully`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to create program" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const { id, status, participants } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: { code: "INVALID_INPUT", message: "Program ID is required" } }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (participants) updateData.participantsJson = JSON.stringify(participants);

    const updated = await prisma.trainingProgram.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Training program updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Failed to update training" } }, { status: 500 });
  }
}
