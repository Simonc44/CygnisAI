'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook for creating a typing effect.
 * @param text The full text to be typed out.
 * @param duration The delay between each character, in milliseconds.
 * @param enabled A boolean to control whether the effect is active.
 * @returns The text to be displayed at the current point in the animation.
 */
export function useTypingEffect(
  text: string = '',
  duration: number = 10,
  enabled: boolean = true
) {
  const [displayedText, setDisplayedText] = useState('');
  const currentIndexRef = useRef(0);
  const fullTextRef = useRef(text);
  const animationFrameRef = useRef<number>();

  // Update the full text reference if the input text changes.
  // This is important if the parent component re-renders with new text.
  useEffect(() => {
    if (text !== fullTextRef.current) {
        fullTextRef.current = text;
        // If the effect is active, restart it with the new text
        if (enabled) {
            setDisplayedText('');
            currentIndexRef.current = 0;
        } else {
            setDisplayedText(text);
        }
    }
  }, [text, enabled]);
  
  useEffect(() => {
    // If the effect is disabled, just show the full text immediately.
    if (!enabled) {
      setDisplayedText(fullTextRef.current);
      return;
    }

    // Reset for a new run
    setDisplayedText('');
    currentIndexRef.current = 0;

    let lastTime = 0;
    const animate = (currentTime: number) => {
      if (!lastTime) lastTime = currentTime;
      const deltaTime = currentTime - lastTime;

      if (deltaTime > duration) {
        const currentFullText = fullTextRef.current;
        const currentIndex = currentIndexRef.current;

        if (currentIndex < currentFullText.length) {
          setDisplayedText(currentFullText.substring(0, currentIndex + 1));
          currentIndexRef.current++;
          lastTime = currentTime;
        } else {
          // Animation finished
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    
  }, [duration, enabled]); // Rerun effect only when `enabled` flag changes

  return displayedText;
}
