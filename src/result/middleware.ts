import { DataError } from '../errors/data-error';
import { ServiceError } from '../errors/service-error';
import { transformToCamelCase } from '../utils';

/**
 * A middleware function that processes a result and returns a potentially transformed result
 */
export type ResultMiddleware<T, U, E extends DataError | ServiceError> = 
  (result: { kind: "success" | "error"; data?: T; error?: E }) => { kind: "success" | "error"; data?: U; error?: E };

/**
 * Applies a series of middleware functions to a result
 */
export function applyMiddleware<T, U, E extends DataError | ServiceError>(
  result: { kind: "success" | "error"; data?: T; error?: E },
  ...middlewares: ResultMiddleware<any, any, E>[]
): { kind: "success" | "error"; data?: U; error?: E } {
  return middlewares.reduce(
    (acc, middleware) => middleware(acc),
    result
  ) as { kind: "success" | "error"; data?: U; error?: E };
}

/**
 * Creates a middleware that logs results
 */
export const createLoggingMiddleware = (
  logger = console.log
): ResultMiddleware<any, any, DataError | ServiceError> => {
  return (result) => {
    if (result.kind === "error") {
      logger(`Error: ${result.error?.message}`);
    } else {
      logger("Operation succeeded");
    }
    return result;
  };
};

/**
 * Creates a middleware that converts all result data keys to camelCase
 */
export const createCamelCaseMiddleware = (): ResultMiddleware<any, any, DataError | ServiceError> => {
  return (result) => {
    if (result.kind === "success" && result.data) {
      return { ...result, data: transformToCamelCase(result.data) };
    }
    return result;
  };
};