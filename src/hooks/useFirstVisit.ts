import { useState, useEffect } from 'react';

const STORAGE_KEY = 'kashi-gawa-welcome-shown';

export function useFirstVisit(): [boolean, () => void] {
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      setIsFirstVisit(true);
    }
  }, []);

  const markSeen = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsFirstVisit(false);
  };

  return [isFirstVisit, markSeen];
}
