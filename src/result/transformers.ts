import { DataError } from '../errors/data-error';
import { DataResult } from './types';

/**
 * Transforms a fetch API response into a DataResult
 */
export async function fromApiResponse<T>(
  response: Response,
  parser: (data: any) => T,
  options?: {
    networkErrorMessage?: string;
    parseErrorMessage?: string;
  }
): Promise<DataResult<T>> {
  const { 
    networkErrorMessage = "Failed to connect to API", 
    parseErrorMessage = "Failed to parse API response" 
  } = options || {};
  
  try {
    // First check if the response is ok
    if (!response.ok) {
      let errorContext: Record<string, unknown> = { 
        status: response.status, 
        statusText: response.statusText 
      };
      
      // Try to get more details from the response if possible
      try {
        const errorBody = await response.json();
        errorContext.body = errorBody;
      } catch {
        // Ignore parse errors for the error body
      }
      
      return {
        kind: "error",
        error: DataError.query(`API returned error: ${response.status} ${response.statusText}`, {
          context: errorContext
        })
      };
    }
    
    // Try to parse the response
    const data = await response.json();
    
    try {
      const parsed = parser(data);
      return { kind: "success", data: parsed };
    } catch (error) {
      return {
        kind: "error",
        error: DataError.invalid(parseErrorMessage, {
          source: error instanceof Error ? error : new Error(String(error)),
          context: { responseData: data }
        })
      };
    }
  } catch (error) {
    return {
      kind: "error",
      error: DataError.connection(networkErrorMessage, {
        source: error instanceof Error ? error : new Error(String(error))
      })
    };
  }
}