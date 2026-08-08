import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FBUser,
} from "firebase/auth";
import { auth } from "./firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return mapUser(cred.user);
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return mapUser(cred.user);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return mapUser(cred.user);
}

export async function logOut() {
  return fbSignOut(auth);
}

export function onAuthChange(callback: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (user) => callback(user ? mapUser(user) : null));
}

function mapUser(user: FBUser): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
  };
}
