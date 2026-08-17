import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { isBirthdayTomorrow, isBirthdayToday } from "@/lib/hrms";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }

    const profiles = await prisma.hRProfile.findMany({
      where: {
        dateOfBirth: { not: null },
        status: { in: ["ACTIVE", "PROBATION"] },
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true, department: true } },
      },
    });

    const tomorrowBirthdays: any[] = [];
    const todayBirthdays: any[] = [];

    for (const profile of profiles) {
      if (isBirthdayTomorrow(profile.dateOfBirth)) {
        tomorrowBirthdays.push({
          userId: profile.userId,
          name: profile.user.name,
          jobTitle: profile.user.jobTitle || profile.designation || "Team Member",
          department: profile.user.department || profile.department || "General",
          avatarUrl: profile.user.avatarUrl,
          bannerMessage: `🎉 Tomorrow is ${profile.user.name}'s Birthday! (${profile.user.jobTitle || "Team Member"} — ${profile.user.department || "General"}). Let's wish ${profile.user.name} a Happy Birthday!`,
        });
      }
      if (isBirthdayToday(profile.dateOfBirth)) {
        todayBirthdays.push({
          userId: profile.userId,
          name: profile.user.name,
          jobTitle: profile.user.jobTitle || profile.designation || "Team Member",
          department: profile.user.department || profile.department || "General",
          avatarUrl: profile.user.avatarUrl,
          bannerMessage: `🎂 Today is ${profile.user.name}'s Birthday! Let's wish ${profile.user.name} a wonderful day!`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tomorrow: tomorrowBirthdays,
        today: todayBirthdays,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to load birthdays" } }, { status: 500 });
  }
}
