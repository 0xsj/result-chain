/**
 * Repository-layer error types
 */

export type DataErrorKind =
  | "not_found"
  | "invalid"
  | "query"
  | "connection"
  | "unexpected";

/**
 * Error class for repository layer errors
 */

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
    Object.setPrototypeOf(this, DataError.prototype);
  }

  /**
   * Creates a "not_found" error when a entity can't be found
   */
  static notFound(entity: string, id: string, source?: Error): DataError {
    return new DataError("not_found", `${entity} not found: ${id}`, {
      context: { entity, id },
      source,
    });
  }

	/**
	 * Creast an 'invalid' error when input data is invalid
	 */
	static invalid(
		message: string,
		options?: {
			context?: Record<string, unknown>;
			source?: Error
		}
	): DataError{
		return new DataError("invalid", message, options)
	}
}
