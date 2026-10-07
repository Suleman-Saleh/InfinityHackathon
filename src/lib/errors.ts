export class AppError extends Error {
  constructor(
    message: string,
    public status: number,
    public issues?: string[],
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, issues: string[] = []) {
    super(message, 400, issues);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Please log in") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class UpstreamError extends AppError {
  constructor(message: string) {
    super(message, 502);
  }
}
