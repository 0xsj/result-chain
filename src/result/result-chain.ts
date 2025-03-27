import { DataError, DataErrorKind } from '../errors/data-error';
import { ServiceError, ServiceErrorKind } from '../errors/service-error';
import { DataResult, ServiceResult } from './types';
import { maskSensitive } from '../utils';
import { serializeErr } from '../utils';

/**
 * A wrapper class that allows chaining operations on DataResult and ServiceResult
 */
export class ResultChain<T, E extends DataError | ServiceError> {
  constructor(
    private readonly result: { kind: "success" | "error"; data?: T; error?: E },
  ) {}

  /**
   * Maps DataResult errors to ServiceResult errors
   */
  mapErr(
    errorMap?: Partial<Record<DataErrorKind, ServiceErrorKind>>,
    defaultMessage?: string,
  ): ResultChain<T, ServiceError> {
    if (this.result.kind === "success") {
      return new ResultChain<T, ServiceError>(
        this.result as { kind: "success"; data: T },
      );
    }

    if (!this.result.error) {
      return new ResultChain<T, ServiceError>({
        kind: "error",
        error: ServiceError.unexpected("Unknown error occurred"),
      });
    }

    if (!(this.result.error instanceof DataError)) {
      if (this.result.error instanceof ServiceError) {
        return new ResultChain<T, ServiceError>({
          kind: "error",
          error: this.result.error,
        });
      }

      return new ResultChain<T, ServiceError>({
        kind: "error",
        error: ServiceError.unexpected("Unknown error type", {
          source:
            this.result.error instanceof Error
              ? this.result.error
              : new Error(String(this.result.error)),
        }),
      });
    }

    const dataError = this.result.error;

    const defaultErrorMap: Record<DataErrorKind, ServiceErrorKind> = {
      not_found: "not_found",
      invalid: "validation",
      query: "unexpected",
      connection: "network",
      unexpected: "unexpected",
    };

    const finalErrorMap = { ...defaultErrorMap, ...errorMap };

    const serviceErrorKind = finalErrorMap[dataError.kind];

    const message = defaultMessage || dataError.message;

    let serviceError: ServiceError;

    switch (serviceErrorKind) {
      case "not_found":
        if (dataError.context?.entity && dataError.context?.id) {
          serviceError = ServiceError.notFound(
            dataError.context.entity as string,
            dataError.context.id as string,
            dataError,
          );
        } else {
          serviceError = ServiceError.notFound("item", "unknown", dataError);
        }
        break;

      case "validation":
        serviceError = ServiceError.validation(message, {
          context: dataError.context,
          source: dataError,
        });
        break;

      case "auth":
        serviceError = ServiceError.auth(message, {
          context: dataError.context,
          source: dataError,
        });
        break;

      case "network":
        serviceError = ServiceError.network(message, {
          context: dataError.context,
          source: dataError,
        });
        break;

      case "unexpected":
      default:
        serviceError = ServiceError.unexpected(message, {
          context: dataError.context,
          source: dataError,
        });
        break;
    }

    return new ResultChain<T, ServiceError>({
      kind: "error",
      error: serviceError,
    });
  }

  /**
   * Logs the result with optional metadata
   */
  log(
    meta?: Record<string, unknown>,
    options?: {
      prettyPrint?: boolean;
      includeStacks?: boolean | "truncated";
      stackFrameLimit?: number;
      maskSensitiveData?: boolean;
      logger?: (message: string | Record<string, unknown>) => void;
    },
  ): ResultChain<T, E> {
    const {
      prettyPrint = true,
      includeStacks = false,
      stackFrameLimit = 3,
      maskSensitiveData = true,
      logger = console.log,
    } = options || {};

    if (this.result.kind === "error" && this.result.error) {
      const serialized = serializeErr(this.result.error, meta, {
        prettyPrint,
        includeStacks,
        stackFrameLimit,
      });
      logger(
        typeof serialized === "string"
          ? serialized
          : JSON.stringify(serialized, null, 2),
      );
    } else if (
      this.result.kind === "success" &&
      this.result.data !== undefined
    ) {
      let data = this.result.data;

      if (maskSensitiveData) {
        data = maskSensitive(data);
      }

      const output = {
        result: {
          kind: "success",
          data,
        },
        meta,
        timestamp: new Date().toISOString(),
      };

      logger(prettyPrint ? JSON.stringify(output, null, 2) : output);
    }

    return this;
  }

  /**
   * Transforms the data in a success result
   */
  map<U>(fn: (data: T) => U): ResultChain<U, E> {
    if (this.result.kind === "success" && this.result.data !== undefined) {
      try {
        return new ResultChain<U, E>({
          kind: "success",
          data: fn(this.result.data),
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return new ResultChain<U, E>({
          kind: "error",
          error: (this.result.error?.constructor as any).unexpected(
            "Error transforming data",
            { source: err },
          ) as E,
        });
      }
    }

    return new ResultChain<U, E>({
      kind: "error",
      error: this.result.error,
    });
  }

  /**
   * Validates the data in a success result, returning an error if validation fails
   */
  validate<Schema>(
    schema: {
      safeParse: (data: any) => { success: boolean; data?: any; error?: any };
    },
    errorMessage: string = "Validation failed",
  ): ResultChain<T, ServiceError> {
    if (this.result.kind !== "success" || !this.result.data) {
      return new ResultChain<T, ServiceError>(this.result as any);
    }

    const validation = schema.safeParse(this.result.data);
    if (!validation.success) {
      const error = ServiceError.validation(errorMessage, {
        context: { validationErrors: validation.error },
        source:
          validation.error instanceof Error
            ? validation.error
            : new Error(String(validation.error)),
      });

      return new ResultChain<T, ServiceError>({
        kind: "error",
        error,
      });
    }

    return new ResultChain<T, ServiceError>({
      kind: "success",
      data: validation.data,
    });
  }

  /**
   * Unwraps the result to get the final value
   */
  unwrap(): { kind: "success" | "error"; data?: T; error?: E } {
    return this.result;
  }

  /**
   * Returns the result as a ServiceResult if E is ServiceError,
   * or as DataResult if E is DataError
   */
  toResult(): E extends ServiceError ? ServiceResult<T> : DataResult<T> {
    if (this.result.kind === "success") {
      return { kind: "success", data: this.result.data as T } as any;
    } else {
      return { kind: "error", error: this.result.error as E } as any;
    }
  }

  /**
   * Explicitly returns the result as a ServiceResult, regardless of error type
   */
  toServiceResult(): ServiceResult<T> {
    if (this.result.kind === "success") {
      return { kind: "success", data: this.result.data as T };
    } else if (this.result.error instanceof ServiceError) {
      return { kind: "error", error: this.result.error };
    } else {
      return {
        kind: "error",
        error: ServiceError.unexpected(
          this.result.error instanceof Error
            ? this.result.error.message
            : "Unknown error",
          {
            source:
              this.result.error instanceof Error
                ? this.result.error
                : undefined,
          },
        ),
      };
    }
  }

  /**
   * async support
   */
  async mapAsync<U>(fn: (data: T) => Promise<U>): Promise<ResultChain<U, E>> {
    if (this.result.kind === 'success' && this.result.data !== undefined) {
      try {
        const transformed = await fn(this.result.data);
        return new ResultChain<U, E> ({
          kind: 'success',
          data: transformed
        })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return new ResultChain<U, E>({
          kind: "error",
          error: (this.result.error?.constructor as any).unexpected(
            "Error transforming data asynchronously",
            {source: err},
          ) as E
        })
      }
    }

    return new ResultChain<U, E>({
      kind: "error",
      error: this.result.error
    })
  }
}

/**
 * Creates a ResultChain from a DataResult or ServiceResult
 */
export function chain<T, E extends DataError | ServiceError>(result: {
  kind: "success" | "error";
  data?: T;
  error?: E;
}): ResultChain<T, E> {
  return new ResultChain<T, E>(result);
}


/**
 * Retry capabilities
 */

export async function retry<T, E extends DataError | ServiceError>(
  operation: () => Promise<{ kind: "success" | "error"; data?: T; error?: E }>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffFactor?: number;
    shouldRetry?: (error: E, attempt: number) => boolean;
  } = {}
): Promise<{ kind: "success" | "error"; data?: T; error?: E }> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffFactor = 2,
    shouldRetry = () => true,
  } = options;

  let lastResult: { kind: "success" | "error"; data?: T; error?: E } = {
    kind: "error",
    error: undefined as unknown as E, 
  };
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await operation();
    
    if (lastResult.kind === "success") {
      return lastResult;
    }
    
    if (attempt < maxAttempts && shouldRetry(lastResult.error as E, attempt)) {
      // Exponential backoff
      const delay = delayMs * Math.pow(backoffFactor, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    break;
  }
  
  return lastResult;
}
