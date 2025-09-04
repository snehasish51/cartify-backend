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


const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // contains uid, email, etc.
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Test route
app.get("/", (req, res) => {
  res.send("Hello from Render + Firestore API!");
});

// Public: Get all categories
app.get("/categories", async (req, res) => {
  try {
    const snapshot = await db.collection("categories").get();
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Error fetching categories");
  }
});

// Protected: Get current user
app.get("/users/me", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      uid,
      user: { id: uid, ...userDoc.data() },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Protected: Update  user
app.patch("/users/me", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { cart, wishlist, addresses, firstName, lastName, phone } = req.body;

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedData = {};
    if (cart) updatedData.cart = cart;
    if (wishlist) updatedData.wishlist = wishlist;
    if (addresses) updatedData.addresses = addresses;
    if (firstName) updatedData.firstName = firstName;
    if (lastName) updatedData.lastName = lastName;
    if (phone) updatedData.phone = phone;

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await userRef.update(updatedData);
    const updatedDoc = await userRef.get();

    res.status(200).json({
      message: "User updated",
      user: { id: uid, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
