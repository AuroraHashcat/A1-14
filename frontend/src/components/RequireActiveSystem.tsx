import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

export default function RequireActiveSystem() {
  const { activeSystem } = useProject();
  if (!activeSystem) {
    return <Navigate to="/systems" replace />;
  }
  return <Outlet />;
}
