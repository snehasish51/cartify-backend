const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

//test
app.get("/", (req, res) => {
  res.send("Hello from Render + Firestore API!");
});

//Get all categories
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

//post users
app.post("/users", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    const uid = userRecord.uid;
    await db.collection('users').doc(uid).set({
      firstName,
      lastName,
      email,
      phone: "",
      cart: [],
      wishlist: [],
      addresses: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    res.status(201).json({
      message: "User created",
      uid,
      user: { id: uid, ...userDoc.data() }
    });
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
})


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
