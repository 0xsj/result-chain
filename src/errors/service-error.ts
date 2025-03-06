export type ServiceErrorKind =
  | "validation"
  | "not_found"
  | "auth"
  | "unexpected"
  | "network";

export class ServiceError extends Error {
  public readonly context?: Record<string, unknown>;
  public readonly source?: Error;

  private constructor(
    public readonly kind: ServiceErrorKind,
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ) {
    super(message);
    this.context = options?.context;
    this.source = options?.source;
    this.name = "ServiceError";
  }

  static validation(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ): ServiceError {
    return new ServiceError("validation", message, options);
  }

  static notFound(entity: string, id: string, source?: Error): ServiceError {
    return new ServiceError("not_found", `${entity} not found: ${id}`, {
      context: { entity, id },
      source,
    });
  }

  static auth(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ): ServiceError {
    return new ServiceError("auth", message, options);
  }

  static unexpected(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ): ServiceError {
    return new ServiceError("unexpected", message, options);
  }

  static network(
    message: string,
    options?: {
      context?: Record<string, unknown>;
      source?: Error;
    },
  ): ServiceError {
    return new ServiceError("network", message, options);
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