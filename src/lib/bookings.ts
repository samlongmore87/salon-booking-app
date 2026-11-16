import { collection, getDocsFromServer, query, Timestamp, where } from "firebase/firestore";
import { db } from "./firebase";

export type Booking = {
  id: string;
  serviceId: string;
  serviceName: string;
  durationMin: number;
  price: number;
  stylistId: string;
  date: string;
  startMin: number;
  startTime: Timestamp;
  status: string;
};

// All of one customer's bookings, fresh from the server.
// The caller sorts them on the phone, so Firestore needs no extra index.
export async function fetchMyBookings(uid: string): Promise<Booking[]> {
  const snap = await getDocsFromServer(
    query(collection(db, "bookings"), where("customerId", "==", uid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) }));
}

// Still going ahead, and hasn't started yet
export function isUpcoming(b: Booking, now: number) {
  return b.status === "upcoming" && b.startTime.toMillis() > now;
}