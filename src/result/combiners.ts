import { DataError } from '../errors/data-error';
import { ServiceError } from '../errors/service-error';
import { DataResult, ServiceResult } from './types';

/**
 * Combines multiple results into a single result
 */
export function combineResults<T extends any[]>(
  results: { [K in keyof T]: DataResult<T[K]> }
): DataResult<T>;
export function combineResults<T extends any[]>(
  results: { [K in keyof T]: ServiceResult<T[K]> }
): ServiceResult<T>;
export function combineResults<T extends any[]>(
  results: { [K in keyof T]: DataResult<T[K]> | ServiceResult<T[K]> }
): DataResult<T> | ServiceResult<T> {
  const errorResult = results.find(result => result.kind === "error");
  
  if (errorResult) {
    return errorResult as any;
  }
  
  const data = results.map(result => (result as any).data) as T;
  return { kind: "success", data };
}

/**
 * Combines two results into a single result with a tuple of both values
 */
export function combine2<T1, T2, E extends DataError | ServiceError>(
    result1: { kind: "success" | "error"; data?: T1; error?: E },
    result2: { kind: "success" | "error"; data?: T2; error?: E }
  ): { kind: "success" | "error"; data?: [T1, T2]; error?: E } {
    if (result1.kind === "error") {
      return {
        kind: "error",
        error: result1.error
      };
    }
    
    if (result2.kind === "error") {
      return {
        kind: "error",
        error: result2.error
      };
    }
    
    // At this point, we know both results are successful and have data
    return {
      kind: "success",
      data: [result1.data as T1, result2.data as T2]
    };
  }