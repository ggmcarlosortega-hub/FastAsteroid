import { NextResponse } from "next/server";

export class ServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function toErrorResponse(err) {
  if (err instanceof ServiceError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  throw err;
}
