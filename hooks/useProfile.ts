"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useProfile(userId: string | undefined) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setDisplayName(data.display_name);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch {
      setHasProfile(false);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function createProfile(name: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("profiles")
      .insert({ id: userId, display_name: name });
    if (!error) {
      setDisplayName(name);
      setHasProfile(true);
    }
  }

  async function updateProfile(name: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name })
      .eq("id", userId);
    if (!error) {
      setDisplayName(name);
    }
  }

  return { displayName, hasProfile, loading, createProfile, updateProfile };
}
