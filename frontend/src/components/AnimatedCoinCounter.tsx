import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCoinCounterProps {
  endValue: number;
  duration?: number;
}

const AnimatedCoinCounter: React.FC<AnimatedCoinCounterProps> = ({ endValue, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const prevValueRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // When the component mounts, instantly set the count to the initial endValue
    // without animation, and store it as the prevValue for future animations.
    setCount(endValue);
    prevValueRef.current = endValue;
  }, []);

  useEffect(() => {
    const startValue = prevValueRef.current;
    
    // Only animate if the endValue has actually changed
    if (startValue === endValue) {
      setCount(endValue); // Ensure it displays the correct value
      return;
    }

    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }
      
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentCount = Math.round(startValue + progress * (endValue - startValue));
      
      setCount(currentCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished, update the prevValue for the next change
        prevValueRef.current = endValue;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration]);

  // Add null check to prevent TypeError when count is undefined
  return <span>{count !== undefined && count !== null ? count.toLocaleString() : '0'}</span>;
};

export default AnimatedCoinCounter; 