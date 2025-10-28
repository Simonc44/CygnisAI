import type { User } from 'firebase/auth';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * A custom error class for Firestore permission errors.
 * This class is designed to be thrown in the Next.js development overlay
 * to provide rich, actionable feedback for debugging Security Rules.
 */
export class FirestorePermissionError extends Error {
  public readonly isFirestorePermissionError = true;
  private context: SecurityRuleContext;
  private user: User | null = null;

  constructor(context: SecurityRuleContext) {
    // Generate a detailed error message.
    const message = `
Firestore Security Rules Denied Request:
-----------------------------------------
Operation: ${context.operation.toUpperCase()}
Path: /${context.path}
-----------------------------------------

This error was caught by the application's custom error handler. To fix this, examine your 'firestore.rules' file and ensure the currently authenticated user has the necessary permissions for this operation.

Debugging Information (will be populated below):
`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error object more readable in the console and overlay.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }

  /**
   * Attaches the authenticated user object to the error for more detailed debugging.
   * This is typically called by the error listener component.
   */
  setUser(user: User | null) {
    this.user = user;
  }

  /**
   * Overrides the default toString method to format a rich error message
   * for the Next.js development overlay.
   */
  toString(): string {
    const simulatedRuleEvaluation = {
      'request.auth': this.user
        ? {
            uid: this.user.uid,
            token: {
              email: this.user.email,
              email_verified: this.user.emailVerified,
              name: this.user.displayName,
              picture: this.user.photoURL,
              // Note: Custom claims are not available on the client,
              // but we include this to make the structure familiar.
            },
          }
        : null,
      'request.method': this.context.operation,
      'request.path': this.context.path,
      // 'resource.data' is the data *before* the operation. We don't have it.
      // 'request.resource.data' is the data for write operations.
      ...(this.context.requestResourceData && {
        'request.resource.data': this.context.requestResourceData,
      }),
    };

    return `
${this.message}
${JSON.stringify(simulatedRuleEvaluation, null, 2)}
`;
  }
}

/**
 * Type guard to check if an error is an instance of FirestorePermissionError.
 */
export function isFirestorePermissionError(
  error: unknown
): error is FirestorePermissionError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as any).isFirestorePermissionError === true
  );
}
