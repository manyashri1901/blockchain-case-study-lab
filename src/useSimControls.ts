import { useRef } from "react";

export interface SimHandlers {
  next: () => void;
  reset: () => void;
}

/** Stable registry so App can route N / R to the visible simulator. */
export function useSimControls() {
  const map = useRef<Record<string, SimHandlers>>({});
  const ref = useRef({
    register: (id: string, h: SimHandlers) => {
      map.current[id] = h;
    },
    get: (id: string): SimHandlers | undefined => map.current[id],
  });
  return ref.current;
}
