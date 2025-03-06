import { DataError } from '../errors/data-error';
import { ServiceError } from '../errors/service-error';

/**
 * Serializes any error into a JSON-compatible format with stack trace control
 */
export function serializeErr(
  error: unknown,
  meta?: Record<string, unknown>,
  options: {
    prettyPrint?: boolean;
    includeStacks?: boolean | "truncated";
    stackFrameLimit?: number;
  } = {},
): string | Record<string, unknown> {
  const {
    prettyPrint = true,
    includeStacks = false,
    stackFrameLimit = 3,
  } = options;

  const serialize = (err: unknown): Record<string, unknown> => {
    if (err instanceof DataError || err instanceof ServiceError) {
      const result: Record<string, unknown> = {
        name: err.name,
        kind: err.kind,
        message: err.message,
      };

      if (err.context) {
        result.context = err.context;
      }

      if (includeStacks) {
        if (includeStacks === "truncated" && err.stack) {
          const stackLines = err.stack.split("\n");
          result.stack = stackLines.slice(0, stackFrameLimit + 1).join("\n");
        } else if (includeStacks === true) {
          result.stack = err.stack;
        }
      }

      if (err.source) {
        result.source = serialize(err.source);
      }

      return result;
    }

    if (err instanceof Error) {
      const result: Record<string, unknown> = {
        name: err.name,
        message: err.message,
      };

      if (includeStacks) {
        if (includeStacks === "truncated" && err.stack) {
          const stackLines = err.stack.split("\n");
          result.stack = stackLines.slice(0, stackFrameLimit + 1).join("\n");
        } else if (includeStacks === true) {
          result.stack = err.stack;
        }
      }

      if ("cause" in err && err.cause) {
        result.cause = serialize(err.cause);
      }

      return result;
    }

    return {
      value: typeof err === "object" ? JSON.stringify(err) : String(err),
    };
  };

  const serialized = {
    error: serialize(error),
    meta,
    timestamp: new Date().toISOString(),
  };

  return prettyPrint ? JSON.stringify(serialized, null, 2) : serialized;
}