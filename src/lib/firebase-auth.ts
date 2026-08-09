import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { auth } from "./firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user!.updateProfile({ displayName: name });
  return mapUser(cred.user!);
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return mapUser(cred.user!);
}

export async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const cred = await auth.signInWithPopup(provider);
  return mapUser(cred.user!);
}

export async function logOut() {
  return auth.signOut();
}

export function onAuthChange(callback: (user: AuthUser | null) => void) {
  return auth.onAuthStateChanged((user) => callback(user ? mapUser(user) : null));
}

function mapUser(user: firebase.User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
  };
}
