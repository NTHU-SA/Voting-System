import getFirestore from "@/lib/firestore";
import { IVote } from "@/types";

const COLLECTION_NAME = "votes";

/**
 * Vote model for Firestore
 */
export const Vote = {
  /**
   * Get the votes collection reference
   */
  getCollection: async () => {
    const db = await getFirestore();
    return db.collection(COLLECTION_NAME);
  },

  /**
   * Find votes by filter
   * Note: For large datasets with skip/offset, consider using cursor-based pagination
   * with startAfter() for better Firestore performance
   */
  find: async (
    filter: Record<string, unknown>,
    options?: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<IVote[]> => {
    const collection = await Vote.getCollection();
    let query: FirebaseFirestore.Query = collection;

    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, "==", value);
    }

    // Apply sorting
    if (options?.sort) {
      for (const [key, order] of Object.entries(options.sort)) {
        query = query.orderBy(key, order === -1 ? "desc" : "asc");
      }
    }

    // Apply limit and offset
    // Note: offset() can be inefficient with large skip values in Firestore
    if (options?.limit) {
      if (options?.skip) {
        query = query.offset(options.skip);
      }
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    })) as IVote[];
  },

  /**
   * Count documents matching filter
   */
  countDocuments: async (filter: Record<string, unknown>): Promise<number> => {
    const collection = await Vote.getCollection();
    let query: FirebaseFirestore.Query = collection;

    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, "==", value);
    }

    const snapshot = await query.get();
    return snapshot.size;
  },

  /**
   * Create a new vote
   */
  create: async (voteData: Omit<IVote, "_id">): Promise<IVote> => {
    const collection = await Vote.getCollection();
    const docRef = await collection.add({
      ...voteData,
      created_at: voteData.created_at || new Date(),
      updated_at: voteData.updated_at || new Date(),
    });

    const doc = await docRef.get();
    return {
      _id: doc.id,
      ...doc.data(),
    } as IVote;
  },

  /**
   * Find vote by ID
   */
  findById: async (id: string): Promise<IVote | null> => {
    const collection = await Vote.getCollection();
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      _id: doc.id,
      ...doc.data(),
    } as IVote;
  },

  /**
   * Find one vote by filter
   */
  findOne: async (filter: Record<string, unknown>): Promise<IVote | null> => {
    const collection = await Vote.getCollection();
    let query: FirebaseFirestore.Query = collection;

    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, "==", value);
    }

    const snapshot = await query.limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      _id: doc.id,
      ...doc.data(),
    } as IVote;
  },
};

