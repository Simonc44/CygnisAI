
"use client"

import { useState, useEffect, useCallback } from 'react';

// Custom event to notify other tabs/components of a change
const dispatchStorageEvent = (key: string, newValue: any) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
  }
};

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const isClient = typeof window !== 'undefined';

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (!isClient) return;
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        const serializedValue = JSON.stringify(valueToStore);
        window.localStorage.setItem(key, serializedValue);
        // Dispatch custom event to notify other instances of the hook
        dispatchStorageEvent(key, serializedValue);
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [isClient, key, storedValue]
  );
  
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (event: StorageEvent) => {
      // Check if the key matches and the value has actually changed
      if (event.key === key && event.newValue !== JSON.stringify(storedValue)) {
         try {
           setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
         } catch(e) {
           console.warn(`Error parsing storage event value for key “${key}”:`, e);
           setStoredValue(initialValue);
         }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, isClient, initialValue, storedValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
