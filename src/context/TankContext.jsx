import { createContext, useContext, useMemo, useState } from "react";

const TankContext = createContext(null);
const TANK_KEY = "reef.tankId";

export function TankProvider({ children }) {
  const [tankId, setTankIdState] = useState(() => localStorage.getItem(TANK_KEY));

  const setTankId = (id) => {
    if (id == null) {
      localStorage.removeItem(TANK_KEY);
      setTankIdState(null);
      return;
    }
    localStorage.setItem(TANK_KEY, String(id));
    setTankIdState(String(id));
  };

  const value = useMemo(() => ({ tankId, setTankId }), [tankId]);
  return <TankContext.Provider value={value}>{children}</TankContext.Provider>;
}

export function useTankSelection() {
  const context = useContext(TankContext);
  if (!context) throw new Error("useTankSelection");
  return context;
}
