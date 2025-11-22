import getFirestore from "@/lib/firestore";
import { IActivity } from "@/types";

const COLLECTION_NAME = "activities";

/**
 * Activity model for Firestore
 */
export const Activity = {
  /**
   * Get the activities collection reference
   */
  getCollection: async () => {
    const db = await getFirestore();
    return db.collection(COLLECTION_NAME);
  },

  /**
   * Find all activities, optionally sorted
   */
  find: (filter?: Record<string, unknown>) => {
    return {
      sort: (sortOptions?: Record<string, number>) => ({
        populate: (_field?: string) => ({
          exec: async (): Promise<IActivity[]> => {
            const collection = await Activity.getCollection();
            let query: FirebaseFirestore.Query = collection;

            // Apply filters if provided
            if (filter && Object.keys(filter).length > 0) {
              // Handle simple equality filters
              for (const [key, value] of Object.entries(filter)) {
                query = query.where(key, "==", value);
              }
            }

            // Apply sorting
            if (sortOptions) {
              for (const [key, order] of Object.entries(sortOptions)) {
                query = query.orderBy(key, order === -1 ? "desc" : "asc");
              }
            }

            const snapshot = await query.get();
            return snapshot.docs.map((doc) => ({
              _id: doc.id,
              ...doc.data(),
            })) as IActivity[];
          },
        }),
        exec: async (): Promise<IActivity[]> => {
          const collection = await Activity.getCollection();
          let query: FirebaseFirestore.Query = collection;

          // Apply filters if provided
          if (filter && Object.keys(filter).length > 0) {
            for (const [key, value] of Object.entries(filter)) {
              query = query.where(key, "==", value);
            }
          }

          // Apply sorting
          if (sortOptions) {
            for (const [key, order] of Object.entries(sortOptions)) {
              query = query.orderBy(key, order === -1 ? "desc" : "asc");
            }
          }

          const snapshot = await query.get();
          return snapshot.docs.map((doc) => ({
            _id: doc.id,
            ...doc.data(),
          })) as IActivity[];
        },
      }),
      populate: (_field?: string) => ({
        exec: async (): Promise<IActivity[]> => {
          const collection = await Activity.getCollection();
          let query: FirebaseFirestore.Query = collection;

          // Apply filters if provided
          if (filter && Object.keys(filter).length > 0) {
            for (const [key, value] of Object.entries(filter)) {
              query = query.where(key, "==", value);
            }
          }

          const snapshot = await query.get();
          return snapshot.docs.map((doc) => ({
            _id: doc.id,
            ...doc.data(),
          })) as IActivity[];
        },
      }),
      exec: async (): Promise<IActivity[]> => {
        const collection = await Activity.getCollection();
        let query: FirebaseFirestore.Query = collection;

        // Apply filters if provided
        if (filter && Object.keys(filter).length > 0) {
          for (const [key, value] of Object.entries(filter)) {
            query = query.where(key, "==", value);
          }
        }

        const snapshot = await query.get();
        return snapshot.docs.map((doc) => ({
          _id: doc.id,
          ...doc.data(),
        })) as IActivity[];
      },
    };
  },

  /**
   * Find activity by ID
   */
  findById: async (id: string, _options?: { populate?: string }): Promise<IActivity | null> => {
    const collection = await Activity.getCollection();
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const activity = {
      _id: doc.id,
      ...doc.data(),
    } as IActivity;

    // Note: Firestore doesn't auto-populate, but we maintain the same structure
    // The options field already contains option IDs
    return activity;
  },

  /**
   * Create a new activity
   */
  create: async (
    activityData: Omit<IActivity, "_id">
  ): Promise<IActivity> => {
    const collection = await Activity.getCollection();
    const docRef = await collection.add({
      ...activityData,
      created_at: activityData.created_at || new Date(),
      updated_at: activityData.updated_at || new Date(),
    });

    const doc = await docRef.get();
    return {
      _id: doc.id,
      ...doc.data(),
    } as IActivity;
  },

  /**
   * Update an activity (findByIdAndUpdate equivalent)
   */
  findByIdAndUpdate: async (
    id: string,
    update: {
      $set?: Partial<IActivity>;
      $push?: { options: string };
      $addToSet?: { users: string };
      $pull?: { options: string };
    },
    options?: { new?: boolean }
  ): Promise<IActivity | null> => {
    const collection = await Activity.getCollection();
    const docRef = collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (update.$set) {
      Object.assign(updateData, update.$set);
    }

    if (update.$push?.options) {
      const data = doc.data() as IActivity;
      const optionsArray = [...(data.options || []), update.$push.options];
      updateData.options = optionsArray;
    }

    if (update.$addToSet?.users) {
      const data = doc.data() as IActivity;
      const users = data.users || [];
      if (!users.includes(update.$addToSet.users)) {
        updateData.users = [...users, update.$addToSet.users];
      }
    }

    if (update.$pull?.options) {
      const data = doc.data() as IActivity;
      const optionsArray = (data.options || []).filter(
        (opt) => opt !== update.$pull!.options
      );
      updateData.options = optionsArray;
    }

    await docRef.update(updateData);

    if (options?.new) {
      const updatedDoc = await docRef.get();
      return {
        _id: updatedDoc.id,
        ...updatedDoc.data(),
      } as IActivity;
    }

    return {
      _id: doc.id,
      ...doc.data(),
    } as IActivity;
  },

  /**
   * Delete an activity (findByIdAndDelete equivalent)
   */
  findByIdAndDelete: async (id: string): Promise<IActivity | null> => {
    const collection = await Activity.getCollection();
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const activity = {
      _id: doc.id,
      ...doc.data(),
    } as IActivity;

    await collection.doc(id).delete();

    return activity;
  },

  /**
   * Update an activity
   */
  updateOne: async (
    filter: { _id: string },
    update: {
      $set?: Partial<IActivity>;
      $push?: { options: string };
      $addToSet?: { users: string };
    }
  ): Promise<void> => {
    const collection = await Activity.getCollection();
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (update.$set) {
      Object.assign(updateData, update.$set);
    }

    if (update.$push?.options) {
      const doc = await collection.doc(filter._id).get();
      if (doc.exists) {
        const data = doc.data() as IActivity;
        const options = [...(data.options || []), update.$push.options];
        updateData.options = options;
      }
    }

    if (update.$addToSet?.users) {
      const doc = await collection.doc(filter._id).get();
      if (doc.exists) {
        const data = doc.data() as IActivity;
        const users = data.users || [];
        if (!users.includes(update.$addToSet.users)) {
          updateData.users = [...users, update.$addToSet.users];
        }
      }
    }

    await collection.doc(filter._id).update(updateData);
  },

  /**
   * Delete an activity
   */
  deleteOne: async (filter: { _id: string }): Promise<void> => {
    const collection = await Activity.getCollection();
    await collection.doc(filter._id).delete();
  },

  /**
   * Find one activity
   */
  findOne: async (filter: Record<string, unknown>): Promise<IActivity | null> => {
    const collection = await Activity.getCollection();
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
    } as IActivity;
  },
};

