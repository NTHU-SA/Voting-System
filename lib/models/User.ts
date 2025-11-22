import getFirestore from "@/lib/firestore";
import { IUser } from "@/types";

const COLLECTION_NAME = "users";

/**
 * User model for Firestore
 */
export const User = {
  /**
   * Get the users collection reference
   */
  getCollection: async () => {
    const db = await getFirestore();
    return db.collection(COLLECTION_NAME);
  },

  /**
   * Find a user by student_id
   */
  findByStudentId: async (student_id: string): Promise<IUser | null> => {
    const collection = await User.getCollection();
    const snapshot = await collection
      .where("student_id", "==", student_id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      _id: doc.id,
      ...doc.data(),
    } as IUser;
  },

  /**
   * Create a new user
   */
  create: async (userData: Omit<IUser, "_id">): Promise<IUser> => {
    const collection = await User.getCollection();
    const docRef = await collection.add({
      ...userData,
      created_at: userData.created_at || new Date(),
      updated_at: userData.updated_at || new Date(),
    });

    const doc = await docRef.get();
    return {
      _id: doc.id,
      ...doc.data(),
    } as IUser;
  },

  /**
   * Update a user
   */
  updateOne: async (
    filter: { student_id: string },
    update: { $set: Partial<IUser> }
  ): Promise<void> => {
    const collection = await User.getCollection();
    const snapshot = await collection
      .where("student_id", "==", filter.student_id)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        ...update.$set,
        updated_at: new Date(),
      });
    }
  },

  /**
   * Find a user by ID
   */
  findById: async (id: string): Promise<IUser | null> => {
    const collection = await User.getCollection();
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      _id: doc.id,
      ...doc.data(),
    } as IUser;
  },
};

