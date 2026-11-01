// ============================================
// src/components/salon/OwnerContext.jsx
// Loads the owner's salon overview once for all salon pages; pages call reload() after changes.
// ============================================
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ownerService } from '../../services/ownerService';

const OwnerContext = createContext(null);

export const OwnerProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // null | 'nosalon' | 'error'

  const reload = useCallback(async () => {
    try {
      setData(await ownerService.getSalon());
      setError(null);
    } catch (e) {
      setError(e.response?.status === 404 ? 'nosalon' : 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return <OwnerContext.Provider value={{ data, loading, error, reload }}>{children}</OwnerContext.Provider>;
};

export const useOwner = () => useContext(OwnerContext);
