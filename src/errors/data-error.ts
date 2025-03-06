export type DataErrorKind =
  | "not_found"
  | "invalid"
  | "query"
  | "connection"
  | "unexpected";

export class DataError extends Error {
  public readonly context?: Record<string, unknown>;
  public readonly source?: Error;

  private constructor(
    public readonly kind: DataErrorKind,
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ) {
    super(message);
    this.context = options?.context;
    this.source = options?.source;
    this.name = "DataError";
  }

  static notFound(entity: string, id: string, source?: Error): DataError {
    return new DataError("not_found", `${entity} not found: ${id}`, {
      context: { entity, id },
      source,
    });
  }

  static invalid(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ): DataError {
    return new DataError("invalid", message, options);
  }

  static query(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ): DataError {
    return new DataError("query", message, options);
  }

  static connection(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ): DataError {
    return new DataError("connection", message, options);
  }

  static unexpected(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ): DataError {
    return new DataError("unexpected", message, options);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      kind: this.kind,
      message: this.message,
      context: this.context,
      source: this.source,
      stack: this.stack,
    };
  }
}