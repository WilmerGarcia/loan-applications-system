import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // si el valor cambia antes, se cancela
  }, [value, delay]);

  return debounced;
}