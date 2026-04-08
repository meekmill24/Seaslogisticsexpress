/**
 * Firestore Service Layer — Seas Logistics Express
 * Handles all database reads & writes for:
 *   - quotes
 *   - contacts
 *   - shipments (tracking)
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  enableNetwork
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from './firebase';

// Global Handshake: Force live connection on library load
enableNetwork(db).catch(err => console.error("Initial Network Wake-up Failed:", err));

// ─── QUOTES ────────────────────────────────────────────────

/**
 * Save a new quote request from the landing page form.
 */
export async function saveQuote(data) {
  return addDoc(collection(db, 'quotes'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

/**
 * Get quotes for a specific user node.
 */
export async function getQuotesByUser(email) {
  if (!email) return [];
  const q = query(
    collection(db, 'quotes'), 
    where('email', '==', email.toLowerCase())
  );
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Client-side sort to bypass index requirement
  return results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/**
 * Get all quotes (for admin dashboard).
 */
export async function getQuotes() {
  const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── USER NODES / AUTH ─────────────────────────────────────

/**
 * Create a new institutional user node profile.
 */
export async function createUserNode(data) {
  if (!data.email) return;
  const userRef = doc(db, 'users', data.email.toLowerCase());
  const { setDoc } = await import('firebase/firestore');
  return setDoc(userRef, {
    ...data,
    nodeStatus: 'Active',
    createdAt: serverTimestamp(),
  });
}

/**
 * Fetch a specific user profile by email index.
 */
export async function getUserNode(email) {
  if (!email) return null;
  const userRef = doc(db, 'users', email.toLowerCase());
  const snap = await getDoc(userRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── CONTACTS ──────────────────────────────────────────────

/**
 * Save a contact message from the landing page form.
 */
export async function saveContact(data) {
  return addDoc(collection(db, 'contacts'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
}

/**
 * Get all contact messages (for admin inbox).
 */
export async function getContacts() {
  const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Mark a contact message as read.
 */
export async function markContactRead(id) {
  return updateDoc(doc(db, 'contacts', id), { read: true });
}

// ─── SHIPMENTS / TRACKING ──────────────────────────────────

/**
 * Create a new shipment record (admin adds this).
 * tracking_number is the unique identifier users search with.
 */
export async function createShipment(data) {
  return addDoc(collection(db, 'shipments'), {
    ...data,
    status: 'Order Placed',
    steps: [
      { label: 'Order Placed', time: new Date().toLocaleString(), done: true },
      { label: 'Picked Up',      time: '',   done: false },
      { label: 'In Transit',     time: '',   done: false },
      { label: 'Out for Delivery', time: '', done: false },
      { label: 'Delivered',      time: '',   done: false },
    ],
    createdAt: serverTimestamp(),
  });
}

/**
 * Look up a shipment by tracking number.
 */
export async function getShipmentByTracking(trackingNumber) {
  const q = query(
    collection(db, 'shipments'),
    where('trackingNumber', '==', trackingNumber.trim().toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Get all shipments for a specific user node.
 */
export async function getShipmentsByUser(email) {
  if (!email) return [];
  const q = query(
    collection(db, 'shipments'),
    where('email', '==', email.toLowerCase())
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get all shipments (for admin dashboard table).
 */
export async function getAllShipments() {
  const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Update shipment status & steps.
 */
export async function updateShipment(id, updates) {
  return updateDoc(doc(db, 'shipments', id), updates);
}

// ─── RATES & SETTINGS ──────────────────────────────────────

/**
 * Get the global shipping rate settings.
 * Returns default values if the document doesn't exist.
 */
export async function getRateSettings() {
  const dRef = doc(db, 'settings', 'shipping_rates');
  const snap = await getDoc(dRef);
  
  if (snap.exists()) {
    return snap.data();
  } else {
    // Default fallback settings including globalization support
    return {
      currency: 'USD',
      exchangeRates: {
        INR: 83.35,
        NGN: 1530.00,
        VND: 25440.00,
        IDR: 16180.00,
        THB: 36.70,
        SAR: 3.75,
        MXN: 16.90
      },
      basePickupFee: 50,
      pricePerKg: 10,
      minCharge: 20,
      dimDivisor: 5000,
      fuelSurcharge: 5, // 5%
      handlingFee: 15,
      updatedAt: new Date().toLocaleString()
    };
  }
}

/**
 * Save/Update the global shipping rate settings.
 */
export async function updateRateSettings(data) {
  const dRef = doc(db, 'settings', 'shipping_rates');
  return updateDoc(dRef, {
    ...data,
    updatedAt: new Date().toLocaleString()
  }).catch(async (err) => {
    // If update fails because doc doesn't exist, create it
    if (err.code === 'not-found') {
      const { setDoc } = await import('firebase/firestore');
      return setDoc(dRef, {
        ...data,
      });
    }
    throw err;
  });
}

// ─── FINANCIAL LEDGER & REFERRALS ──────────────────────────
/**
 * Log a transaction in the financial ledger for audit purposes.
 * @param {string} userId - User ID or 'system'
 * @param {string} type - 'welcome_bonus', 'referral_commission', 'withdrawal', etc.
 * @param {number} amount - Amount in USD
 * @param {string} description - Human-readable details
 */
export async function logTransaction(userId, type, amount, description) {
  return addDoc(collection(db, 'ledger'), {
    userId,
    type,
    amount,
    description,
    timestamp: serverTimestamp()
  });
}

/**
 * Get all ledger transactions (for admin dashboard).
 */
export async function getFinancialLedger() {
  const q = query(collection(db, 'ledger'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get all transactions for a specific user node.
 */
export async function getTransactionsByUser(email) {
  if (!email) return [];
  const q = query(
    collection(db, 'ledger'),
    where('userId', '==', email.toLowerCase())
  );
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Client-side sort to bypass index requirement
  return results.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
}

/**
 * Get all support tickets for a specific user node.
 */
export async function getSupportTicketsByUser(email) {
  if (!email) return [];
  const q = query(
    collection(db, 'support'),
    where('email', '==', email.toLowerCase())
  );
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Client-side sort to bypass index requirement
  return results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/**
 * Apply a 20% referral commission to the referrer of a user.
 */
export async function applyReferralCommission(referrerId, taskAmount, taskId) {
  const commission = taskAmount * 0.20;
  await logTransaction(
    referrerId, 
    'referral_commission', 
    commission, 
    `20% Commission for Task #${taskId}`
  );
  // In a real app, you would also update the referrer's wallet document here.
  return commission;
}

/**
 * Upload a document (PDF/Image) for a specific shipment.
 */
export async function uploadShipmentDocument(shipmentId, file) {
  const fileRef = ref(storage, `shipments/${shipmentId}/${file.name}`);
  const snapshot = await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // Update the shipment record with the document URL
  return updateDoc(doc(db, 'shipments', shipmentId), {
    documentUrl: downloadURL,
    documentName: file.name,
    documentType: file.type,
    documentUpdatedAt: serverTimestamp()
  });
}
