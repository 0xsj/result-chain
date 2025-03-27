import { DataError, DataErrorKind } from './data-error';
import { ServiceError, ServiceErrorKind } from './service-error';

/**
 * Enriches an error with additional context information
 */
export function enrichErrorContext<E extends DataError | ServiceError>(
  error: E,
  additionalContext: Record<string, unknown>
): E {
  if (!error) {
    throw new Error("Cannot enrich context of undefined error");
  }
  
  const newContext = { ...(error.context || {}), ...additionalContext };
  
  // Create a new error with the same properties but updated context
  if (error instanceof DataError) {
    switch (error.kind) {
      case 'not_found':
        return DataError.notFound(
          String(newContext.entity || 'item'),
          String(newContext.id || 'unknown'),
          error.source
        ) as unknown as E;
      
      case 'invalid':
        return DataError.invalid(
          error.message,
          { context: newContext, source: error.source }
        ) as unknown as E;
      
      case 'query':
        return DataError.query(
          error.message,
          { context: newContext, source: error.source }
        ) as unknown as E;
      
      case 'connection':
        return DataError.connection(
          error.message,
          { context: newContext, source: error.source }
        ) as unknown as E;
      
      case 'unexpected':
      default:
        return DataError.unexpected(
          error.message,
          { context: newContext, source: error.source }
        ) as unknown as E;
    }
  }
  
  if (error instanceof ServiceError) {
    switch (error.kind) {
      case 'not_found':
        return ServiceError.notFound(
          String(newContext.entity || 'item'),
          String(newContext.id || 'unknown'),
          error.source
        ) as unknown as E;
      
      case 'validation':
        return ServiceError.validation(
          error.message,
          { context: newContext, source: error.source }
        ) as unknown as E;
      
      case 'auth':
        return ServiceError.auth(
          error.message,
          { context: newContext, source: error.source }
        ) as unknown as E;
      
      case 'network':
        return ServiceError.network(
          error.message,
          { context: newContext, source: error.source }
        ) as unknown as E;
      
      case 'unexpected':
      default:
        return ServiceError.unexpected(
          error.message,
          { context: newContext, source: error.source }
        ) as unknown as E;
    }
  }
  
  return error;
}