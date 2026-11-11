// Supabase Edge Functions Shared Error & Response Handler

// Global BigInt serialization polyfill
// @ts-ignore
if (typeof BigInt !== "undefined" && !BigInt.prototype.toJSON) {
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return Number(this);
  };
}

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE"
  | "RATE_LIMITED"
  | "AI_UNAVAILABLE"
  | "AI_UNCLEAR"
  | "PAYPAL_ERROR"
  | "PAYMENT_PENDING_VERIFICATION"
  | "NOT_VERIFIED"
  | "INTERNAL";

export class ApiError extends Error {
  code: string;
  statusCode: number;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    arg1: number | string,
    arg2: string,
    arg3?: number | string | Record<string, unknown>,
    arg4?: Record<string, unknown>
  ) {
    if (typeof arg1 === "number") {
      // Called as: new ApiError(status, message, code?, details?)
      super(arg2);
      this.statusCode = arg1;
      this.status = arg1;
      this.code = typeof arg3 === "string" ? arg3 : "INTERNAL";
      this.details = typeof arg3 === "object" ? arg3 : arg4;
    } else {
      // Called as: new ApiError(code, message, status?, details?)
      super(arg2);
      this.code = arg1;
      this.statusCode = typeof arg3 === "number" ? arg3 : 400;
      this.status = this.statusCode;
      this.details = typeof arg3 === "object" ? arg3 : arg4;
    }
    this.name = "ApiError";
  }
}

export function jsonResponse(data: unknown, status = 200, reqId?: string): Response {
  const requestId = reqId ?? ("req_" + crypto.randomUUID().slice(0, 8));
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": requestId,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key, x-cron-secret",
    },
  });
}

export function errorResponse(err: unknown, reqId?: string): Response {
  const requestId = reqId ?? ("req_" + crypto.randomUUID().slice(0, 8));
  let message = "An unexpected error occurred. Please try again.";
  let code: ErrorCode | string = "INTERNAL";
  let status = 500;
  let details: Record<string, unknown> | undefined;

  if (err instanceof ApiError) {
    message = err.message;
    code = err.code;
    status = err.statusCode;
    details = err.details;
  } else if (err instanceof Error) {
    message = err.message;
    if (message.includes("not found") || message.includes("NOT_FOUND")) {
      status = 404;
      code = "NOT_FOUND";
    } else if (message.includes("forbidden") || message.includes("permission") || message.includes("FORBIDDEN")) {
      status = 403;
      code = "FORBIDDEN";
    } else if (message.includes("unauthenticated") || message.includes("auth")) {
      status = 401;
      code = "UNAUTHENTICATED";
    }
  }

  // Log structured JSON
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    request_id: requestId,
    error_code: code,
    message,
    details,
  }));

  // Structured response compatible with frontend http.ts error extraction
  return new Response(
    JSON.stringify({
      error: message,
      code,
      details,
      request_id: requestId,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key, x-cron-secret",
      },
    }
  );
}

