import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { ROLE_PERMISSIONS, Role, isHRMSActive } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      const response = NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
      response.cookies.delete("dx_session_token");
      return response;
    }

    const permissions = ROLE_PERMISSIONS[user.role as Role] || [];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          isHRMSActive: isHRMSActive(user),
        },
        permissions,
      },
      message: "Authenticated user session retrieved",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to retrieve session" } },
      { status: 500 }
    );
  }
}
