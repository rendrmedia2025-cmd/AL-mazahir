'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  /** The target number to count to */
  target: number;
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Prefix text (e.g., "$", "+") */
  prefix?: string;
  /** Suffix text (e.g., "K", "M", "+") */
  suffix?: string;
  /** Custom formatting function */
  formatter?: (value: number) => string;
  /** Whether to start animation immediately or wait for intersection */
  startOnMount?: boolean;
  /** CSS classes for styling */
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  duration = 2000,
  prefix = '',
  suffix = '',
  formatter,
  startOnMount = false,
  className = ''
}) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Format the display value
  const formatValue = (value: number): string => {
    if (formatter) {
      return formatter(value);
    }
    return Math.floor(value).toLocaleString();
  };

  // Animation logic
  useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const startValue = 0;
    const endValue = target;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, target, duration]);

  // Intersection Observer for triggering animation when element comes into view
  useEffect(() => {
    if (startOnMount) {
      setHasStarted(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [startOnMount, hasStarted]);

  return (
    <span ref={elementRef} className={className}>
      {prefix}{formatValue(count)}{suffix}
    </span>
  );
};

export default AnimatedCounter;