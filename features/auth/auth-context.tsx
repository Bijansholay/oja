"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Profile, UserRole } from "@/lib/types";
import { account, databases } from "@/lib/appwrite/client";
import { DATABASE_ID, COLLECTIONS, APPWRITE_PROJECT_ID } from "@/lib/appwrite/constants";
import { DEMO_PROFILES } from "@/lib/demo/store";
import { encodeGeohash } from "@/lib/geo/geohash";
import { APP_CONFIG } from "@/lib/config";

interface AuthUser {
  $id: string;
  name?: string;
  phone?: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  sendPhoneOtp: (phone: string) => Promise<{ userId: string }>;
  verifyPhoneOtp: (userId: string, secret: string) => Promise<void>;
  sendEmailOtp: (email: string) => Promise<{ userId: string }>;
  verifyEmailOtp: (userId: string, secret: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<Profile>;
  logout: () => Promise<void>;
  isDemoMode: boolean;
  loginAsDemoUser: (profileId: string) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_MODE_STORAGE_KEY = "oja_active_user_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>("buyer");
  const lastPhoneRef = useRef<string>("");

  const isDemo =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !APPWRITE_PROJECT_ID;

  // Initialize Auth state
  useEffect(() => {
    async function initAuth() {
      try {
        if (isDemo) {
          const savedUserId = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
          if (savedUserId) {
            const found = DEMO_PROFILES.find((p) => p.userId === savedUserId);
            if (found) {
              setUser({
                $id: found.userId,
                name: found.name,
                phone: found.phone,
              });
              setProfile(found);
              setActiveRole(found.role === "seller" ? "seller" : "buyer");
              setIsLoading(false);
              return;
            }
          }
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // Live Appwrite Account check
        const currentAccount = await account.get();
        setUser(currentAccount);

        // Fetch user profile from database
        try {
          const userProfile = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            currentAccount.$id
          );
          setProfile(userProfile as unknown as Profile);
          setActiveRole((userProfile as unknown as Profile).role === "seller" ? "seller" : "buyer");
        } catch (e) {
          // Profile may not exist yet if fresh signup
          console.log("No profile record found yet for user", currentAccount.$id);
        }
      } catch (err) {
        // User is guest/unauthenticated
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, [isDemo]);

  const sendPhoneOtp = async (phone: string) => {
    lastPhoneRef.current = phone;
    if (isDemo) {
      // In demo mode, simulated instant OTP
      const demoUserId = "buyer_" + phone.replace(/[^0-9]/g, "").slice(-6);
      return { userId: demoUserId };
    }
    const token = await account.createPhoneToken("unique()", phone);
    return { userId: token.userId };
  };

  const verifyPhoneOtp = async (userId: string, secret: string) => {
    if (isDemo) {
      const demoProfile: Profile = {
        $id: userId,
        userId,
        name: "Produce Member",
        phone: lastPhoneRef.current || "+234" + userId.replace(/[^0-9]/g, ""),
        role: "both",
        lat: APP_CONFIG.geo.defaultLat,
        lng: APP_CONFIG.geo.defaultLng,
        geohash: encodeGeohash(
          APP_CONFIG.geo.defaultLat,
          APP_CONFIG.geo.defaultLng,
          APP_CONFIG.geo.geohashPrecision
        ),
        areaName: APP_CONFIG.geo.defaultAreaName,
        createdAt: new Date().toISOString(),
      };
      setUser({ $id: userId, phone: demoProfile.phone });
      setProfile(demoProfile);
      localStorage.setItem(DEMO_MODE_STORAGE_KEY, userId);
      return;
    }

    await account.createSession(userId, secret);
    const currentAccount = await account.get();
    setUser(currentAccount);

    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        currentAccount.$id
      );
      setProfile(doc as unknown as Profile);
      setActiveRole((doc as unknown as Profile).role === "seller" ? "seller" : "buyer");
    } catch {
      // Create empty profile draft
      const newProfile: Partial<Profile> = {
        userId: currentAccount.$id,
        phone: currentAccount.phone || "",
        name: currentAccount.name || "Produce Buyer",
        role: "buyer",
        lat: APP_CONFIG.geo.defaultLat,
        lng: APP_CONFIG.geo.defaultLng,
        geohash: encodeGeohash(
          APP_CONFIG.geo.defaultLat,
          APP_CONFIG.geo.defaultLng,
          APP_CONFIG.geo.geohashPrecision
        ),
        areaName: APP_CONFIG.geo.defaultAreaName,
        createdAt: new Date().toISOString(),
      };
      const created = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        currentAccount.$id,
        newProfile
      );
      setProfile(created as unknown as Profile);
    }
  };

  const sendEmailOtp = async (email: string) => {
    if (isDemo) {
      return { userId: "user_" + email.split("@")[0] };
    }
    const token = await account.createEmailToken("unique()", email);
    return { userId: token.userId };
  };

  const verifyEmailOtp = async (userId: string, secret: string) => {
    if (isDemo) {
      const demoProfile: Profile = {
        $id: userId,
        userId,
        name: "Market Buyer",
        phone: "",
        role: "buyer",
        lat: APP_CONFIG.geo.defaultLat,
        lng: APP_CONFIG.geo.defaultLng,
        geohash: encodeGeohash(
          APP_CONFIG.geo.defaultLat,
          APP_CONFIG.geo.defaultLng,
          APP_CONFIG.geo.geohashPrecision
        ),
        areaName: APP_CONFIG.geo.defaultAreaName,
        createdAt: new Date().toISOString(),
      };
      setUser({ $id: demoProfile.userId, name: demoProfile.name, email: secret });
      setProfile(demoProfile);
      localStorage.setItem(DEMO_MODE_STORAGE_KEY, userId);
      return;
    }
    await account.createSession(userId, secret);
    const current = await account.get();
    setUser(current);
  };

  const updateProfile = async (data: Partial<Profile>): Promise<Profile> => {
    if (!user) throw new Error("Must be logged in to update profile");

    const geohash =
      data.lat && data.lng
        ? encodeGeohash(data.lat, data.lng, APP_CONFIG.geo.geohashPrecision)
        : profile?.geohash ||
          encodeGeohash(
            APP_CONFIG.geo.defaultLat,
            APP_CONFIG.geo.defaultLng,
            APP_CONFIG.geo.geohashPrecision
          );

    const payload = {
      ...data,
      geohash,
    };

    if (isDemo) {
      const updated = { ...profile, ...payload } as Profile;
      setProfile(updated);
      return updated;
    }

    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      user.$id,
      payload
    );
    const result = updatedDoc as unknown as Profile;
    setProfile(result);
    return result;
  };

  const logout = async () => {
    if (isDemo) {
      localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
      setUser(null);
      setProfile(null);
      return;
    }
    await account.deleteSession("current");
    setUser(null);
    setProfile(null);
  };

  const loginAsDemoUser = (profileId: string) => {
    const found = DEMO_PROFILES.find((p) => p.userId === profileId);
    if (found) {
      localStorage.setItem(DEMO_MODE_STORAGE_KEY, found.userId);
      setUser({
        $id: found.userId,
        name: found.name,
        phone: found.phone,
      });
      setProfile(found);
      setActiveRole(found.role === "seller" ? "seller" : "buyer");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendEmailOtp,
        verifyEmailOtp,
        updateProfile,
        logout,
        isDemoMode: isDemo,
        loginAsDemoUser,
        activeRole,
        setActiveRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
