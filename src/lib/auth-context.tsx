import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
    createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from "react";
import { auth, db } from "./firebase";

export type Role = "customer" | "owner";

export type Profile = {
  name: string;
  email: string;
  phone: string;
  role: Role;
  remindersOn: boolean;
};

type AuthState = {
  user: User | null;
  profile: Profile | null;
  initializing: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(uid: string): Promise<Profile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as Profile) : null;
  } catch (e) {
    console.warn("Failed to load profile", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Each profile load gets a number; only the newest one is allowed to update the screen.
  // This stops a slow, older load from overwriting a newer one (e.g. during sign-up).
  const latestRequest = useRef(0);

  const loadProfile = useCallback(async (u: User | null) => {
    const requestId = ++latestRequest.current;
    const result = u ? await fetchProfile(u.uid) : null;
    if (requestId === latestRequest.current) setProfile(result);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await loadProfile(u);
      setInitializing(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(auth.currentUser), [loadProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, initializing, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}