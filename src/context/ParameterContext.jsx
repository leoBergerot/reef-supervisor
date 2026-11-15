import { createContext, useContext, useMemo, useState } from "react";

const ParameterContext = createContext(null);
const KEY = "reef.parameter";

function readStored() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ParameterProvider({ children }) {
  const [parameter, setParameterState] = useState(readStored);

  const setParameter = (value) => {
    setParameterState(value);
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value));
    else sessionStorage.removeItem(KEY);
  };

  const value = useMemo(() => ({ parameter, setParameter }), [parameter]);
  return <ParameterContext.Provider value={value}>{children}</ParameterContext.Provider>;
}

export function useParameter() {
  const context = useContext(ParameterContext);
  if (!context) throw new Error("useParameter");
  return context;
}
