import { NextResponse } from "next/server";

import { InterviewRequestSchema } from "@/schemas/interview";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = InterviewRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Invalid interview request.",
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Interview service is not available yet.",
        },
      },
      { status: 501 },
    );
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid request body.",
        },
      },
      { status: 400 },
    );
  }
}
