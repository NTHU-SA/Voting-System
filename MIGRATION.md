# Migration Guide: MongoDB to Firebase Firestore

This guide explains how to migrate your existing MongoDB data to Firebase Firestore.

## Overview

The voting system has been migrated from MongoDB to Firebase Firestore while maintaining the same data structure. This means you can export your MongoDB data and import it directly into Firestore.

## Prerequisites

- Existing MongoDB instance with voting data
- Firebase project with Firestore enabled
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js 18+ installed

## Migration Steps

### Step 1: Export Data from MongoDB

First, export your data from MongoDB:

```bash
# Export all collections
mongoexport --uri="mongodb://username:password@host:27017/voting_sa?authSource=admin" --collection=users --out=users.json
mongoexport --uri="mongodb://username:password@host:27017/voting_sa?authSource=admin" --collection=activities --out=activities.json
mongoexport --uri="mongodb://username:password@host:27017/voting_sa?authSource=admin" --collection=options --out=options.json
mongoexport --uri="mongodb://username:password@host:27017/voting_sa?authSource=admin" --collection=votes --out=votes.json
```

### Step 2: Prepare Firebase Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Enable Firestore Database:
   - Navigate to Firestore Database
   - Click "Create database"
   - Choose production mode
   - Select a location (choose closest to your users)
4. Generate service account credentials:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `service-account.json`

### Step 3: Transform MongoDB Data for Firestore

MongoDB ObjectIds need to be converted to strings. Create a script `transform-data.js`:

```javascript
const fs = require('fs');

function transformCollection(inputFile, outputFile) {
  const data = fs.readFileSync(inputFile, 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  const transformed = data.map(doc => {
    // Convert _id to string
    if (doc._id && doc._id.$oid) {
      doc._id = doc._id.$oid;
    }
    
    // Convert date fields
    if (doc.created_at && doc.created_at.$date) {
      doc.created_at = new Date(doc.created_at.$date);
    }
    if (doc.updated_at && doc.updated_at.$date) {
      doc.updated_at = new Date(doc.updated_at.$date);
    }
    if (doc.open_from && doc.open_from.$date) {
      doc.open_from = new Date(doc.open_from.$date);
    }
    if (doc.open_to && doc.open_to.$date) {
      doc.open_to = new Date(doc.open_to.$date);
    }
    
    // Convert ObjectId references to strings
    if (doc.activity_id && doc.activity_id.$oid) {
      doc.activity_id = doc.activity_id.$oid;
    }
    
    // Convert options array
    if (doc.options) {
      doc.options = doc.options.map(opt => 
        opt.$oid ? opt.$oid : opt
      );
    }
    
    // Convert choose_all option_ids
    if (doc.choose_all) {
      doc.choose_all = doc.choose_all.map(choice => ({
        ...choice,
        option_id: choice.option_id.$oid || choice.option_id
      }));
    }
    
    // Convert choose_one
    if (doc.choose_one && doc.choose_one.$oid) {
      doc.choose_one = doc.choose_one.$oid;
    }
    
    return doc;
  });

  fs.writeFileSync(outputFile, JSON.stringify(transformed, null, 2));
  console.log(`Transformed ${transformed.length} documents from ${inputFile} to ${outputFile}`);
}

// Transform all collections
transformCollection('users.json', 'users-firestore.json');
transformCollection('activities.json', 'activities-firestore.json');
transformCollection('options.json', 'options-firestore.json');
transformCollection('votes.json', 'votes-firestore.json');
```

Run the transformation:

```bash
node transform-data.js
```

### Step 4: Import Data to Firestore

Create an import script `import-to-firestore.js`:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importCollection(collectionName, dataFile) {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const batch = db.batch();
  
  console.log(`Importing ${data.length} documents to ${collectionName}...`);
  
  for (let i = 0; i < data.length; i++) {
    const doc = data[i];
    const docId = doc._id;
    delete doc._id; // Remove _id as it will be the document ID
    
    const docRef = db.collection(collectionName).doc(docId);
    batch.set(docRef, doc);
    
    // Firestore batch has a limit of 500 operations
    if ((i + 1) % 500 === 0) {
      await batch.commit();
      console.log(`Committed batch ${Math.floor(i / 500) + 1}`);
    }
  }
  
  // Commit remaining documents
  await batch.commit();
  console.log(`Completed importing ${collectionName}`);
}

async function main() {
  try {
    await importCollection('users', 'users-firestore.json');
    await importCollection('activities', 'activities-firestore.json');
    await importCollection('options', 'options-firestore.json');
    await importCollection('votes', 'votes-firestore.json');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
```

Install dependencies and run the import:

```bash
npm install firebase-admin
node import-to-firestore.js
```

### Step 5: Create Firestore Indexes

Some queries require composite indexes. Create them in Firebase Console:

1. Go to Firestore Database > Indexes
2. Create the following composite indexes:
   - Collection: `votes`
     - Fields: `activity_id` (Ascending), `created_at` (Descending)
   - Collection: `options`
     - Fields: `activity_id` (Ascending), `created_at` (Ascending)

Alternatively, these indexes will be automatically suggested when you run queries that need them.

### Step 6: Update Application Configuration

Update your `.env.production` file:

```env
# Remove MongoDB configuration
# MONGODB_URI=...

# Add Firebase configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

Convert your service account JSON to a single line:

```bash
cat service-account.json | jq -c .
```

### Step 7: Deploy Updated Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Step 8: Verify Migration

1. Check that all collections have data:
   - Go to Firebase Console > Firestore Database
   - Verify document counts match your MongoDB collections

2. Test the application:
   - Login with OAuth
   - View existing activities
   - View voting results
   - Create a test vote (if in development)

3. Check application logs:
   ```bash
   docker-compose logs -f app
   ```

## Rollback Plan

If you need to rollback:

1. Keep your MongoDB instance running during initial migration
2. Switch back by updating environment variables:
   ```env
   MONGODB_URI=mongodb://username:password@host:27017/voting_sa
   ```
3. Redeploy the previous version of the application

## Data Structure Differences

The data structure remains the same, but note these differences:

1. **Document IDs**: MongoDB ObjectIds are converted to strings
2. **References**: All ObjectId references become string references
3. **Dates**: Stored as Firestore Timestamp objects (automatically handled)
4. **Arrays**: Work the same way
5. **Embedded Documents**: Work the same way

## Performance Considerations

1. **Queries**: Firestore may require composite indexes for complex queries
2. **Pagination**: Consider cursor-based pagination for large datasets
3. **Reads/Writes**: Monitor Firebase usage to stay within free tier or budget

## Troubleshooting

### "Missing index" error

Create the required index in Firebase Console or use the provided link in the error message.

### "Permission denied" error

Check Firestore security rules. For production, ensure you're using service account authentication correctly.

### Date conversion issues

Ensure all date fields are properly converted to Date objects or Firestore Timestamps.

### Large batch imports fail

Reduce batch size in the import script from 500 to 100 documents per batch.

## Support

For issues or questions:
1. Check Firebase documentation: https://firebase.google.com/docs/firestore
2. Review application logs: `docker-compose logs -f app`
3. Open an issue on GitHub
