import { FirebaseError } from "firebase/app";

// Turns Firebase's technical error codes into messages a customer understands
export function authErrorMessage(e: unknown): string {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password is incorrect.";
      case "auth/invalid-email":
        return "That email address doesn't look right.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try logging in.";
      case "auth/weak-password":
        return "Choose a stronger password (at least 8 characters).";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a few minutes and try again.";
      case "auth/network-request-failed":
        return "No connection. Check your internet and try again.";
    }
  }
  console.warn("Auth error", e);
  return "Something went wrong. Please try again.";
}