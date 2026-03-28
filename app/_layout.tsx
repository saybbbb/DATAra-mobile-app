import { Stack } from "expo-router";
import { UserProvider } from "../context/UserContext";

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </UserProvider>
  );
}
