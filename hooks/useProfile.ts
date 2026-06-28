"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ProfileData {
  display_name: string | null;
  phone_number: string | null;
  country_code: string | null;
  is_admin: boolean;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Always reset loading to true when we start a real fetch
    setLoading(true);

    const timeout = setTimeout(() => {
      setHasProfile(false);
      setLoading(false);
    }, 5000);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, phone_number, country_code, is_admin")
        .eq("id", userId)
        .single();

      clearTimeout(timeout);
      if (!error && data) {
        setProfile(data as ProfileData);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
    } catch {
      clearTimeout(timeout);
      setHasProfile(false);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function createProfile(name: string) {
    if (!userId) return;

    const { data: { user } } = await supabase.auth.getUser();
    const meta = user?.user_metadata ?? {};

    await supabase.from("profiles").upsert({
      id: userId,
      display_name: name,
      phone_number: meta.phone_number ?? null,
      country_code: meta.country_code ?? null,
    }, { onConflict: "id" });

    // Re-fetch to get the real profile (picks up is_admin set server-side)
    await fetchProfile();

    // Fallback: if the DB read was blocked (RLS not configured yet),
    // set local state so the user can proceed past ProfileSetup
    setHasProfile((prev) => {
      if (!prev) {
        setProfile({
          display_name: name,
          phone_number: meta.phone_number ?? null,
          country_code: meta.country_code ?? null,
          is_admin: false,
        });
        return true;
      }
      return prev;
    });
  }

  async function updateProfile(name: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name })
      .eq("id", userId);
    if (!error) {
      setProfile((prev) => prev ? { ...prev, display_name: name } : prev);
    }
  }

  return {
    displayName: profile?.display_name ?? null,
    hasProfile,
    loading,
    isAdmin: profile?.is_admin ?? false,
    createProfile,
    updateProfile,
  };
}
