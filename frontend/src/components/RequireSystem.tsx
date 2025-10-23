import React, { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

export default function RequireSystem() {
  const { systemId } = useParams();
  const { systems, activeSystemId, setActiveSystem } = useProject();

  useEffect(() => {
    if (systemId && activeSystemId !== systemId) {
      // if the system exists, set it as active
      const exists = systems.some((s) => s.id === systemId);
      if (exists) setActiveSystem(systemId);
    }
  }, [systemId, activeSystemId, setActiveSystem, systems]);

  if (!systemId) {
    return <Navigate to="/systems" replace />;
  }

  const target = systems.find((s) => s.id === systemId);
  if (!target) {
    return <Navigate to="/systems" replace />;
  }

  return <Outlet />;
}
