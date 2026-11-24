import { useCallback, useRef, useState } from 'react';

const HISTORY_LIMIT = 100;

export function useUndoRedo<T>() {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  const record = useCallback(
    (snapshot: T) => {
      if (past.current[past.current.length - 1] === snapshot) return;
      past.current.push(snapshot);
      if (past.current.length > HISTORY_LIMIT) past.current.shift();
      future.current = [];
      bump();
    },
    [bump]
  );

  const reset = useCallback(() => {
    past.current = [];
    future.current = [];
    bump();
  }, [bump]);

  const undo = useCallback(
    (current: T): T | null => {
      const previous = past.current.pop();
      if (previous === undefined) return null;
      future.current.push(current);
      bump();
      return previous;
    },
    [bump]
  );

  const redo = useCallback(
    (current: T): T | null => {
      const next = future.current.pop();
      if (next === undefined) return null;
      past.current.push(current);
      bump();
      return next;
    },
    [bump]
  );

  return {
    record,
    reset,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
