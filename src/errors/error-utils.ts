import { DataError } from './data-error';
import { ServiceError } from './service-error';

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
    const newError = DataError[error.kind](
      error.message,
      { context: newContext, source: error.source }
    ) as unknown as E;
    
    return newError;
  }
  
  if (error instanceof ServiceError) {
    // Special handling for not_found which has a different constructor signature
    if (error.kind === "not_found" && newContext.entity && newContext.id) {
      return ServiceError.notFound(
        String(newContext.entity),
        String(newContext.id),
        error.source
      ) as unknown as E;
    }
    
    const newError = ServiceError[error.kind](
      error.message,
      { context: newContext, source: error.source }
    ) as unknown as E;
    
    return newError;
  }
  
  return error;
}