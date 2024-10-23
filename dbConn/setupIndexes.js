const connectDB = require('./dbConn');

const setupIndexes = async () => {
    try {
        const db =await connectDB();

        const usersCollection =await db.collection("users");

        // Drop the existing index on the `phone` field if it exists
        await usersCollection.dropIndex("phone_1").catch((err) => {
          if (err.code === 27) {
            console.log("Index not found, skipping drop...");
          } else {
            console.error("Error dropping index:", err);
          }
        });
    
        console.log("Dropped phone_1 index if it existed");
    
        // Recreate the index with sparse:true
        await usersCollection.createIndex({ phone: 1 }, { unique: true, sparse: true });
        console.log("Created new sparse unique index for phone");
    } catch (err) {
        console.error("Error setting up indexes:", err);
    }
};

module.exports = setupIndexes;
