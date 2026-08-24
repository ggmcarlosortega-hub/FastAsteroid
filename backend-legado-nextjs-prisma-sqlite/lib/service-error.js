import { NextResponse } from "next/server";

export class ServiceError extends Error {
  constructor(message, status, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function toErrorResponse(err) {
  if (err instanceof ServiceError) {
    return NextResponse.json({ error: err.message, ...err.extra }, { status: err.status });
  }
  throw err;
}
