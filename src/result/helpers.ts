import { DataError } from '../errors/data-error';
import { ServiceError } from '../errors/service-error';
import { DataResult, ServiceResult } from './types';

/**
 * Creates a success result
 */
export function success<T>(data: T): { kind: "success"; data: T } {
  return { kind: "success", data };
}

/**
 * Creates a data error result
 */
export function dataError<T = never>(error: DataError): DataResult<T> {
  return { kind: "error", error };
}

/**
 * Creates a service error result
 */
export function serviceError<T = never>(error: ServiceError): ServiceResult<T> {
  return { kind: "error", error };
}