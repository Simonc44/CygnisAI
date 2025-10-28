'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import {
  FirestorePermissionError,
  isFirestorePermissionError,
} from '@/firebase/errors';
import { useAuth } from '@/services/auth-service';
import { Button } from './ui/button';

export function FirebaseErrorListener() {
  const { user } = useAuth();
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (e: unknown) => {
      if (isFirestorePermissionError(e)) {
        setError(e);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (!error) {
    return null;
  }

  // Enhance the error with user information for better debugging
  if (user) {
    error.setUser(user);
  }

  // We throw the error here to make it visible in the Next.js dev overlay
  // This provides a much better developer experience than just logging to the console.
  throw error;

  // The code below is a fallback for production, but in dev, the overlay is preferred.
  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        right: '10px',
        zIndex: 9999,
        background: 'rgba(255, 0, 0, 0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.6',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>
          Firestore Permission Error
        </h3>
        <Button onClick={() => setError(null)} size="sm">
          Dismiss
        </Button>
      </div>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          marginTop: '15px',
          background: 'rgba(0,0,0,0.2)',
          padding: '10px',
          borderRadius: '4px',
        }}
      >
        {error.toString()}
      </pre>
    </div>
  );
}
