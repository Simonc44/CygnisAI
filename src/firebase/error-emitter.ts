import { EventEmitter } from 'events';
import { isFirestorePermissionError } from './errors';

// This is a simple event emitter that allows different parts of the application
// to communicate without being directly coupled.
// We use it here to broadcast Firestore permission errors to a central listener.

type Events = {
  'permission-error': (error: unknown) => void;
};

class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  private emitter = new EventEmitter();

  on<E extends keyof T>(event: E, listener: T[E]): void {
    this.emitter.on(event as string, listener);
  }

  off<E extends keyof T>(event: E, listener: T[E]): void {
    this.emitter.off(event as string, listener);
  }

  emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): void {
    this.emitter.emit(event as string, ...args);
  }
}

export const errorEmitter = new TypedEventEmitter<Events>();

// We can also add a global listener to catch unhandled promise rejections,
// though the primary mechanism should be the explicit .catch() blocks.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (isFirestorePermissionError(event.reason)) {
      errorEmitter.emit('permission-error', event.reason);
    }
  });
}
