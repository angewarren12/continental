import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb } from './config';
import { User, UserRole } from '../types/user';
import { createUser, getUser, getUserByPhone } from './firestore';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Convertit un numéro de téléphone en email pour Firebase Auth
 * Firebase Auth nécessite un format email, donc on utilise le téléphone comme identifiant
 */
const phoneToEmail = (phoneNumber: string): string => {
  // Nettoyer le numéro de téléphone
  const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^+\d]/g, '');
  // Utiliser le téléphone comme email avec un domaine fictif
  return `${cleanPhone}@continental.local`;
};

/**
 * Nettoie et formate un numéro de téléphone
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Supprimer tous les espaces et caractères non numériques sauf +
  let cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Si le numéro commence par 0, le remplacer par +225
  if (cleaned.startsWith('0')) {
    cleaned = '+225' + cleaned.substring(1);
  }
  
  // Si le numéro ne commence pas par +, ajouter +225
  if (!cleaned.startsWith('+')) {
    cleaned = '+225' + cleaned;
  }
  
  return cleaned;
};

/**
 * Inscription avec téléphone et mot de passe
 */
export const signUpWithPhoneAndPassword = async (
  phoneNumber: string,
  password: string,
  name: string,
  role: UserRole,
  email?: string
): Promise<FirebaseUser> => {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const emailForAuth = phoneToEmail(formattedPhone);
  
  // Vérifier si l'utilisateur existe déjà
  const existingUser = await getUserByPhone(formattedPhone);
  if (existingUser) {
    throw new Error('Un compte avec ce numéro de téléphone existe déjà');
  }
  
  // Créer l'utilisateur dans Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    emailForAuth,
    password
  );
  
  const user = userCredential.user;
  
  // Mettre à jour le profil avec le nom
  await updateProfile(user, {
    displayName: name,
  });
  
  // Créer le document utilisateur dans Firestore
  await createUser(user.uid, {
    phoneNumber: formattedPhone,
    name,
    email,
    role,
  });
  
  return user;
};

/**
 * Connexion avec téléphone et mot de passe
 */
export const signInWithPhoneAndPassword = async (
  phoneNumber: string,
  password: string
): Promise<FirebaseUser> => {
  const auth = getFirebaseAuth();
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const emailForAuth = phoneToEmail(formattedPhone);
  
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailForAuth,
      password
    );
    
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Numéro de téléphone ou mot de passe incorrect');
    }
    throw error;
  }
};

/**
 * Déconnexion
 */
export const signOut = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
};

/**
 * Récupère l'utilisateur Firebase actuel
 */
export const getCurrentUser = (): FirebaseUser | null => {
  const auth = getFirebaseAuth();
  return auth.currentUser;
};

/**
 * Écoute les changements d'état d'authentification
 */
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
};

/**
 * Récupère les données utilisateur depuis Firestore
 */
export const getUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  return getUser(firebaseUser.uid);
};
