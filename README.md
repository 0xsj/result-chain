# result-chain

A TypeScript utility library for robust error handling and result management with a clean, functional API.

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

## Case Conversion Utilities

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
    notification_