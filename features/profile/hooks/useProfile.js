"use client";
import { useState, useEffect, useCallback } from "react";
import { profileService } from "../services/profileService";

// Loads the aggregate advisor profile and exposes it with a setter so section
// save handlers can apply the fresh aggregate returned by each mutation.
export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await profileService.get();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, setProfile, loading, error, reload: load };
}
