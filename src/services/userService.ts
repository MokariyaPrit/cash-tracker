import { db } from "../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export const createUserProfile = async (user: any) => {
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    createdAt: new Date(),
  });
};