// Custom error types for the Vortex Exporter

export class VortexError extends Error {
  public code: string;
  public details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'VortexError';
    this.code = code;
    this.details = details;
  }
}

export class FigmaApiError extends VortexError {
  public statusCode?: number;

  constructor(message: string, statusCode?: number, details?: Record<string, unknown>) {
    super(message, 'FIGMA_API_ERROR', { ...details, statusCode });
    this.name = 'FigmaApiError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends VortexError {
  public issues: string[];

  constructor(issues: string[]) {
    super(
      `Validation failed: ${issues.length} issue(s) found`,
      'VALIDATION_ERROR',
      { issues }
    );
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export class ParseError extends VortexError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PARSE_ERROR', details);
    this.name = 'ParseError';
  }
}

export class CompileError extends VortexError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'COMPILE_ERROR', details);
    this.name = 'CompileError';
  }
}

export class TokenError extends VortexError {
  constructor(message: string) {
    super(message, 'TOKEN_ERROR');
    this.name = 'TokenError';
  }
}