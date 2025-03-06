import { DataError } from '../errors/data-error';
import { ServiceError } from '../errors/service-error';

export type DataResult<T> =
  | { kind: "success"; data: T }
  | { kind: "error"; error: DataError };

export type ServiceResult<T> =
  | { kind: "success"; data: T }
  | { kind: "error"; error: ServiceError }