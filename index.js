const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (serviceAccountKey.json will be added later)
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
  res.send("Hello from Render + Firestore API!");
});

// Example endpoint: Get all categories
app.get("/categories", async (req, res) => {
  try {
    const snapshot = await db.collection("categories").get();
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Error fetching categories");
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
