# result-chain

A TypeScript utility library for robust error handling and result management with a clean, functional API.

[![npm version](https://img.shields.io/npm/v/result-chain.svg)](https://www.npmjs.com/package/result-chain)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

## Features

- **Strong Typing**: Fully typed errors and results for better compile-time safety
- **Error Hierarchy**: Specialized error types for different application layers
- **Chaining API**: Fluent interface for transforming, validating, and handling errors
- **Serialization**: Error serialization with context preservation and stack trace control
- **Data Masking**: Automatic masking of sensitive information
- **Case Conversion**: Utilities for converting between snake_case and camelCase

## Installation

```bash
npm install result-chain
# or
yarn add result-chain
```

## Basic Usage

```typescript
import { 
  DataError, 
  ServiceError, 
  chain 
} from 'result-chain';

// Repository layer with DataError
async function fetchUserFromDatabase(id: string) {
  try {
    const user = await db.users.findOne({ id });
    if (!user) {
      return {
        kind: 'error' as const,
        error: DataError.notFound('User', id)
      };
    }
    return {
      kind: 'success' as const,
      data: user
    };
  } catch (error) {
    return {
      kind: 'error' as const,
      error: DataError.query('Database query failed', { source: error })
    };
  }
}

// Service layer with Result chain
async function getUserProfile(id: string) {
  const result = await fetchUserFromDatabase(id);
  
  return chain(result)
    .mapErr({ 
      // Map specific data errors to service errors
      not_found: 'not_found',
      query: 'unexpected'
    })
    .map(user => ({
      id: user.id,
      displayName: `${user.firstName} ${user.lastName}`,
      email: user.email
    }))
    .log({ operation: 'getUserProfile', userId: id })
    .toServiceResult();
}
```

## API Documentation

### Error Types

#### `DataError`
Repository layer errors with the following kinds:
- `not_found`: Resource not found
- `invalid`: Invalid input or state
- `query`: Query execution error
- `connection`: Connection or network error
- `unexpected`: Unexpected or unknown error

#### `ServiceError`
Service layer errors with the following kinds:
- `validation`: Input validation error
- `not_found`: Resource not found
- `auth`: Authentication or authorization error
- `network`: Network or external service error
- `unexpected`: Unexpected or unknown error

### Result Types

#### `DataResult<T>`
Repository layer result with either success data or a data error:
- `{ kind: "success"; data: T }`
- `{ kind: "error"; error: DataError }`

#### `ServiceResult<T>`
Service layer result with either success data or a service error:
- `{ kind: "success"; data: T }`
- `{ kind: "error"; error: ServiceError }`

### ResultChain Class

The `ResultChain` class provides a fluent API for working with results:

- `mapErr()`: Map data errors to service errors
- `map()`: Transform success data
- `validate()`: Validate data against a schema
- `log()`: Log the result
- `unwrap()`: Get the raw result
- `toResult()`: Convert to the appropriate result type
- `toServiceResult()`: Explicitly convert to a service result

### Utility Functions

- `chain()`: Create a ResultChain from a result
- `serializeErr()`: Serialize any error with context
- `maskSensitive()`: Mask sensitive data fields
- `transformToCamelCase()`: Convert object keys to camelCase
- `transformToSnakeCase()`: Convert object keys to snake_case

## Error Handling Examples

### Data Layer (Repository) Errors

```typescript
import { DataError, DataResult } from 'result-chain';

async function createUser(userData: UserInput): Promise<DataResult<User>> {
  try {
    // Validation
    if (!userData.email.includes('@')) {
      return {
        kind: 'error',
        error: DataError.invalid('Invalid email format')
      };
    }
    
    // DB operation
    const existingUser = await db.users.findOne({ email: userData.email });
    if (existingUser) {
      return {
        kind: 'error',
        error: DataError.invalid('User with this email already exists')
      };
    }
    
    const newUser = await db.users.create(userData);
    return {
      kind: 'success',
      data: newUser
    };
  } catch (error) {
    return {
      kind: 'error',
      error: DataError.unexpected('Failed to create user', { source: error })
    };
  }
}
```

### Service Layer with Chain Operations

```typescript
import { chain, ServiceResult } from 'result-chain';
import { z } from 'zod'; // Example validation library

// Define a schema for validation
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(2)
});

async function registerUser(input: UserInput): Promise<ServiceResult<User>> {
  return chain(await createUser(input))
    // Map data errors to service errors
    .mapErr({
      invalid: 'validation',
      query: 'unexpected'
    })
    // Validate the shape of returned data
    .validate(userSchema, 'Invalid user data returned from database')
    // Transform the data
    .map(user => ({
      ...user,
      createdAt: new Date().toISOString()
    }))
    // Log the operation with metadata
    .log({ 
      operation: 'registerUser',
      email: input.email 
    }, { 
      maskSensitiveData: true,
      includeStacks: 'truncated'
    })
    // Convert to service result
    .toServiceResult();
}
```

## Advanced Features

### Error Serialization

Serialize errors with control over stack traces and formatting:

```typescript
import { serializeErr } from 'result-chain';

try {
  // Some operation that might fail
} catch (error) {
  const serialized = serializeErr(error, 
    { operation: 'processPayment', userId: '123' },
    { 
      prettyPrint: true, 
      includeStacks: 'truncated',
      stackFrameLimit: 3 
    }
  );
  
  console.log(serialized);
  // or send to your logging service
  logger.error(serialized);
}
```

### Data Masking

Automatically mask sensitive information in logs:

```typescript
import { maskSensitive } from 'result-chain';

const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  password: 'supersecret',
  preferences: {
    apiKey: '12345abcde'
  }
};

const maskedData = maskSensitive(userData);
console.log(maskedData);
// Output:
// {
//   name: 'John Doe',
//   email: 'john@example.com',
//   accessToken: 'eyJh...kpXV',
//   password: '********',
//   preferences: {
//     apiKey: '1234...bcde'
//   }
// }
```

### Case Conversion Utilities

Convert between snake_case and camelCase formats:

```typescript
import { 
  transformToCamelCase, 
  transformToSnakeCase 
} from 'result-chain';

// Data from an API (snake_case)
const apiResponse = {
  user_id: '123',
  first_name: 'John',
  last_name: 'Doe',
  email_address: 'john@example.com',
  account_settings: {
    notification_preferences: {
      email_updates: true,
      sms_alerts: false
    }
  }
};

// Convert to camelCase for your application
const userData = transformToCamelCase(apiResponse);
console.log(userData);
// Output:
// {
//   userId: '123',
//   firstName: 'John',
//   lastName: 'Doe',
//   emailAddress: 'john@example.com',
//   accountSettings: {
//     notificationPreferences: {
//       emailUpdates: true,
//       smsAlerts: false
//     }
//   }
// }

// When sending back to the API, convert to snake_case
const updateData = {
  userId: '123',
  emailAddress: 'john.doe@example.com'
};

const apiData = transformToSnakeCase(updateData);
console.log(apiData);
// Output:
// {
//   user_id: '123',
//   email_address: 'john.doe@example.com'
// }
```