export function maskSensitive(data: any): any {
    if (!data) return data;
  
    if (Array.isArray(data)) {
      return data.map((item) => maskSensitive(item));
    }
  
    if (typeof data === "object") {
      const masked = { ...data };
  
      const sensitiveFields = [
        "password",
        "secret",
        "token",
        "accessToken",
        "refreshToken",
        "key",
        "apiKey",
        "credential",
        "auth",
      ];
  
      for (const key in masked) {
        if (
          sensitiveFields.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          if (typeof masked[key] === "string") {
            const value = masked[key];
            if (value.length > 8) {
              masked[key] =
                `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
            } else {
              masked[key] = "********";
            }
          }
        } else if (typeof masked[key] === "object" && masked[key] !== null) {
          masked[key] = maskSensitive(masked[key]);
        }
      }
  
      return masked;
    }
  
    return data;
  }
  