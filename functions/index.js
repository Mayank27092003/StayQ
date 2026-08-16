const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Initialize Razorpay
// In production, these should be stored in Firebase config or Secret Manager
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_SECRET",
});

/**
 * 1. Safe Booking Creation
 * Writes the booking and availability blocks in a single transaction
 * to prevent double-booking.
 */
exports.createBooking = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }
  
  const { propertyId, checkInStr, checkOutStr, adults, children, nightlyRate } = data;
  const guestId = context.auth.uid;
  
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  
  const propertyRef = db.collection("properties").doc(propertyId);
  const bookingRef = db.collection("bookings").doc();
  
  try {
    await db.runTransaction(async (transaction) => {
      const propertySnap = await transaction.get(propertyRef);
      if (!propertySnap.exists) {
        throw new functions.https.HttpsError("not-found", "Property not found");
      }
      
      const propertyData = propertySnap.data();
      
      // Calculate dates to block (sparse logic)
      let currentDate = new Date(checkIn);
      const datesToBlock = [];
      while (currentDate < checkOut) {
        const dateStr = currentDate.toISOString().split("T")[0];
        datesToBlock.push(dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Verify availability
      for (const dateStr of datesToBlock) {
        const availRef = propertyRef.collection("availability").doc(dateStr);
        const availSnap = await transaction.get(availRef);
        if (availSnap.exists) {
          throw new functions.https.HttpsError("already-exists", `Date ${dateStr} is already booked or blocked.`);
        }
      }
      
      // Calculate costs (Snapshot values)
      const nights = datesToBlock.length;
      const subtotal = nightlyRate * nights;
      const cleaningFee = propertyData.cleaningFee || 0;
      const serviceFee = subtotal * 0.15; // Example 15% platform fee
      const taxes = (subtotal + cleaningFee + serviceFee) * 0.18; // 18% GST example
      const totalAmount = subtotal + cleaningFee + serviceFee + taxes;

      const bookingData = {
        propertyId: propertyId,
        hostId: propertyData.hostId,
        guestId: guestId,
        guestName: context.auth.token.name || "Guest",
        checkIn: admin.firestore.Timestamp.fromDate(checkIn),
        checkOut: admin.firestore.Timestamp.fromDate(checkOut),
        adults: adults,
        children: children || 0,
        nights: nights,
        
        // Snapshot data
        propertyTitle: propertyData.title,
        propertyCity: propertyData.city,
        nightlyRate: nightlyRate,
        subtotal: subtotal,
        cleaningFee: cleaningFee,
        serviceFee: serviceFee,
        taxes: taxes,
        totalAmount: totalAmount,
        
        status: "pending_payment", // Holds dates during Razorpay checkout
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      transaction.set(bookingRef, bookingData);
      
      // Block dates
      for (const dateStr of datesToBlock) {
        const availRef = propertyRef.collection("availability").doc(dateStr);
        transaction.set(availRef, {
          state: "booked",
          bookingId: bookingRef.id,
        });
      }
    });
    
    return { success: true, bookingId: bookingRef.id };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});


/**
 * 2. Razorpay Webhook
 * Verifies payment signature and marks booking as confirmed.
 */
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "YOUR_WEBHOOK_SECRET";
  const signature = req.headers["x-razorpay-signature"];
  
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");
      
    if (expectedSignature !== signature) {
      return res.status(400).send("Invalid signature");
    }
    
    const event = req.body.event;
    if (event === "payment.captured") {
      const paymentData = req.body.payload.payment.entity;
      // Fetch bookingId from notes
      const bookingId = paymentData.notes.bookingId;
      
      if (bookingId) {
        const bookingRef = db.collection("bookings").doc(bookingId);
        await bookingRef.update({
          status: "confirmed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Add to payments collection
        await db.collection("payments").add({
          bookingId: bookingId,
          amount: paymentData.amount / 100,
          currency: paymentData.currency,
          razorpayPaymentId: paymentData.id,
          method: paymentData.method,
          status: "captured",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
    
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Webhook Error");
  }
});


/**
 * 3. Update Property Rating on Review
 * Automatically recalculates average rating when a review is added.
 */
exports.updatePropertyRating = functions.firestore
  .document("reviews/{reviewId}")
  .onWrite(async (change, context) => {
    const reviewData = change.after.exists ? change.after.data() : null;
    const previousData = change.before.exists ? change.before.data() : null;
    
    // Get propertyId from either new or old data
    const propertyId = reviewData ? reviewData.propertyId : previousData.propertyId;
    
    if (!propertyId) return null;
    
    // Query all reviews for this property
    const reviewsSnap = await db.collection("reviews")
      .where("propertyId", "==", propertyId)
      .where("moderationStatus", "==", "visible")
      .get();
      
    let totalScore = 0;
    const reviewCount = reviewsSnap.size;
    
    reviewsSnap.forEach((doc) => {
      totalScore += doc.data().rating;
    });
    
    const averageRating = reviewCount > 0 ? (totalScore / reviewCount) : 0;
    
    // Update the property document
    return db.collection("properties").doc(propertyId).update({
      rating: averageRating,
      reviewCount: reviewCount,
    });
});


/**
 * 4. Broadcast Notifications Fan-out
 * Reads from broadcasts collection and sends FCM to target users.
 */
exports.fanOutBroadcast = functions.firestore
  .document("broadcasts/{broadcastId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const audience = data.audience || "all";
    
    let usersQuery = db.collection("users");
    if (audience === "guests") {
      usersQuery = usersQuery.where("roles", "array-contains", "guest");
    } else if (audience === "hosts") {
      usersQuery = usersQuery.where("roles", "array-contains", "host");
    }
    
    const usersSnap = await usersQuery.get();
    const batch = db.batch();
    
    let recipientCount = 0;
    usersSnap.forEach((userDoc) => {
      const notifRef = userDoc.ref.collection("notifications").doc();
      batch.set(notifRef, {
        type: "broadcast",
        title: data.title,
        body: data.body,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      recipientCount++;
    });
    
    await batch.commit();
    
    // Update broadcast with count
    return snap.ref.update({ recipientCount: recipientCount });
});
