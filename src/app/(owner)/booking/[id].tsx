import { useLocalSearchParams } from "expo-router";
import { Placeholder } from "../../../components/placeholder";

export default function BookingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Placeholder title="Booking details" note={`Booking ID: ${id}`} />;
}