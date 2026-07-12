import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [display, setDisplay] = useState(children);

  useEffect(() => {
    setDisplay(children);
  }, [location.pathname, children]);

  return <div className="page-enter">{display}</div>;
}
