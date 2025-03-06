type CamelCase<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
    : S;

type SnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? T extends Lowercase<T>
    ? `${T}${SnakeCase<U>}`
    : `_${Lowercase<T>}${SnakeCase<U>}`
  : S;

type CamelToSnakeCase<T> =
  T extends Array<infer U>
    ? Array<CamelToSnakeCase<U>>
    : T extends object
      ? {
        [K in keyof T as SnakeCase<string & K>]: CamelToSnakeCase<T[K]>;
      }
      : T;

type SnakeToCamelCase<T> =
  T extends Array<infer U>
    ? Array<SnakeToCamelCase<U>>
    : T extends object
      ? {
        [K in keyof T as CamelCase<string & K>]: SnakeToCamelCase<T[K]>;
      }
      : T;

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function transformKeys<T extends Record<string, any>>(
  data: T,
  transformer: (key: string) => string,
  deep = true,
): Record<string, any> {
  if (Array.isArray(data)) {
    return data.map((item) =>
      typeof item === "object" && item !== null
        ? transformKeys(item, transformer, deep)
        : item,
    );
  }

  if (typeof data !== "object" || data === null) {
    return data;
  }

  return Object.entries(data).reduce(
    (acc, [key, value]) => {
      const transformedKey = transformer(key);
      acc[transformedKey] =
        deep && typeof value === "object" && value !== null
          ? transformKeys(value, transformer, deep)
          : value;
      return acc;
    },
    {} as Record<string, any>,
  );
}

export function transformToCamelCase<T extends Record<string, any>>(
  data: T,
): SnakeToCamelCase<T> {
  return transformKeys(data, snakeToCamel) as SnakeToCamelCase<T>;
}

export function transformToSnakeCase<T extends Record<string, any>>(
  data: T,
): CamelToSnakeCase<T> {
  return transformKeys(data, camelToSnake) as CamelToSnakeCase<T>;
}