import getFirestore from "@/lib/firestore";
import { IOption } from "@/types";

const COLLECTION_NAME = "options";

/**
 * Option model for Firestore
 */
export const Option = {
  /**
   * Get the options collection reference
   */
  getCollection: async () => {
    const db = await getFirestore();
    return db.collection(COLLECTION_NAME);
  },

  /**
   * Find options by filter
   */
  find: async (
    filter: Record<string, unknown>,
    options?: { sort?: Record<string, 1 | -1> }
  ): Promise<IOption[]> => {
    const collection = await Option.getCollection();
    let query: FirebaseFirestore.Query = collection;

    // Handle special operators
    for (const [key, value] of Object.entries(filter)) {
      if (key === "_id" && typeof value === "object" && value !== null && "$in" in value) {
        // Handle $in operator
        const inValues = (value as { $in: string[] }).$in;
        if (inValues.length > 0) {
          // Firestore 'in' operator supports up to 10 values
          if (inValues.length <= 10) {
            query = query.where(key, "in", inValues);
          } else {
            // For more than 10 values, we need to make multiple queries
            const chunks: string[][] = [];
            for (let i = 0; i < inValues.length; i += 10) {
              chunks.push(inValues.slice(i, i + 10));
            }
            
            const results: IOption[] = [];
            for (const chunk of chunks) {
              const chunkQuery = collection.where(key, "in", chunk);
              // Apply sorting if provided
              let sortedQuery: FirebaseFirestore.Query = chunkQuery;
              if (options?.sort) {
                for (const [sortKey, sortOrder] of Object.entries(options.sort)) {
                  sortedQuery = sortedQuery.orderBy(sortKey, sortOrder === -1 ? "desc" : "asc");
                }
              }
              const snapshot = await sortedQuery.get();
              snapshot.docs.forEach((doc) => {
                results.push({
                  _id: doc.id,
                  ...doc.data(),
                } as IOption);
              });
            }
            return results;
          }
        }
      } else {
        query = query.where(key, "==", value);
      }
    }

    // Apply sorting
    if (options?.sort) {
      for (const [key, order] of Object.entries(options.sort)) {
        query = query.orderBy(key, order === -1 ? "desc" : "asc");
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    })) as IOption[];
  },

  /**
   * Create a new option
   */
  create: async (optionData: Omit<IOption, "_id">): Promise<IOption> => {
    const collection = await Option.getCollection();
    const docRef = await collection.add({
      ...optionData,
      created_at: optionData.created_at || new Date(),
      updated_at: optionData.updated_at || new Date(),
    });

    const doc = await docRef.get();
    return {
      _id: doc.id,
      ...doc.data(),
    } as IOption;
  },

  /**
   * Update an option
   */
  updateOne: async (
    filter: { _id: string },
    update: { $set: Partial<IOption> }
  ): Promise<void> => {
    const collection = await Option.getCollection();
    await collection.doc(filter._id).update({
      ...update.$set,
      updated_at: new Date(),
    });
  },

  /**
   * Delete an option
   */
  deleteOne: async (filter: { _id: string }): Promise<void> => {
    const collection = await Option.getCollection();
    await collection.doc(filter._id).delete();
  },

  /**
   * Delete multiple options
   */
  deleteMany: async (filter: Record<string, unknown>): Promise<number> => {
    const collection = await Option.getCollection();
    let query: FirebaseFirestore.Query = collection;

    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, "==", value);
    }

    const snapshot = await query.get();
    const batch = (await import("@/lib/firestore")).admin.firestore().batch();
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  },

  /**
   * Update option (findByIdAndUpdate equivalent)
   */
  findByIdAndUpdate: async (
    id: string,
    update: { $set: Partial<IOption> },
    options?: { new?: boolean }
  ): Promise<IOption | null> => {
    const collection = await Option.getCollection();
    const docRef = collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    await docRef.update({
      ...update.$set,
      updated_at: new Date(),
    });

    if (options?.new) {
      const updatedDoc = await docRef.get();
      return {
        _id: updatedDoc.id,
        ...updatedDoc.data(),
      } as IOption;
    }

    return {
      _id: doc.id,
      ...doc.data(),
    } as IOption;
  },

  /**
   * Delete option (findByIdAndDelete equivalent)
   */
  findByIdAndDelete: async (id: string): Promise<IOption | null> => {
    const collection = await Option.getCollection();
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const option = {
      _id: doc.id,
      ...doc.data(),
    } as IOption;

    await collection.doc(id).delete();

    return option;
  },

  /**
   * Find option by ID
   */
  findById: async (id: string): Promise<IOption | null> => {
    const collection = await Option.getCollection();
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      _id: doc.id,
      ...doc.data(),
    } as IOption;
  },
};

