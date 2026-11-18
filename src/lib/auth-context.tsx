import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc, runTransaction, type Timestamp } from "firebase/firestore";
import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from "react";
import { Alert } from "react-native";
import { auth, db } from "./firebase";

export type Role = "customer" | "owner";

export type Profile = {
  name: string;
  email: string;
  phone: string;
  role: Role;
  remindersOn: boolean;
  createdAt?: Timestamp | null; // null for a moment while a brand-new profile is saving
};

// The only fields a customer may change (the security rules allow exactly these)
export type EditableProfile = Pick<Profile, "name" | "phone" | "remindersOn">;

type AuthState = {
  user: User | null;
  profile: Profile | null;
  profileError: boolean; // true = we couldn't load the profile (e.g. offline), NOT "no profile"
  initializing: boolean;
  refreshProfile: () => Promise<void>;
};

type ProfileResult =
  | { status: "found"; profile: Profile }
  | { status: "missing" }
  | { status: "error" };

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(uid: string): Promise<ProfileResult> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists()
      ? { status: "found", profile: snap.data() as Profile }
      : { status: "missing" };
  } catch (e) {
    console.warn("Failed to load profile", e);
    return { status: "error" };
  }
}

// Shared log out for every screen. Shows a message if it fails instead of silently doing nothing.
export async function logOut() {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Failed to log out", e);
    Alert.alert("Couldn't log out", "Check your connection and try again.");
  }
}

// Save changes to your own profile. A transaction fails straight away when offline,
// instead of waiting silently until the connection comes back.
// Call refreshProfile() afterwards so every screen shows the new details.
export async function saveProfile(uid: string, changes: Partial<EditableProfile>) {
  const ref = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Profile not found");
    tx.update(ref, changes);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Only the newest profile load may update the screen (stops slow, older loads overwriting newer ones)
  const latestRequest = useRef(0);

  const loadProfile = useCallback(async (u: User | null) => {
    const requestId = ++latestRequest.current;

    if (!u) {
      setProfile(null);
      setProfileError(false);
      return;
    }

    const result = await fetchProfile(u.uid);
    if (requestId !== latestRequest.current) return;

    setProfile(result.status === "found" ? result.profile : null);
    setProfileError(result.status === "error");
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
    <AuthContext.Provider value={{ user, profile, profileError, initializing, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}