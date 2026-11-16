import { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Button from "../components/Button";
import Card from "../components/Card";
import Screen from "../components/Screen";
import { colors } from "../constants/colors";
import {
  clearSession,
  endShift,
  getLatestShift,
  getUser,
  Shift,
  startShift,
  User,
} from "../constants/api";

// TODO:
// - Use the real user name and today's date
// - "End shift" should actually end the shift and update the green card
// - Shift start time should come from real data
// - Build the "Report incident" screen
// - Build the "Report appliance issue" screen
// - Disable "Submit sales report" until the shift has ended

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [busy, setBusy] = useState(false);

  // Reload every time this screen comes into view
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const u = await getUser();
        if (!u) return router.replace("/");
        setUser(u);
        try {
          const { shift } = await getLatestShift();
          setShift(shift);
        } catch (e: any) {
          Alert.alert("Error", e.message);
        }
      })();
    }, []),
  );

  const running = !!shift && !shift.ended_at;

  async function handleStart() {
    try {
      setBusy(true);
      setShift(await startShift());
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleEnd() {
    try {
      setBusy(true);
      setShift(await endShift());
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await clearSession();
    router.replace("/");
  }

  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, gap: 12 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            Hi, {user?.name ?? ""}
          </Text>
          <Text style={{ color: "#555" }}>{today}</Text>
        </View>

        {running && shift ? (
          <>
            <Card color={colors.green}>
              <Text style={{ fontWeight: "bold", color: "#2E7D32" }}>
                Shift running
              </Text>
              <Text style={{ color: "#2E7D32", fontSize: 12 }}>
                Started at {time(shift.started_at)}
              </Text>
            </Card>
            <Button
              title={busy ? "Ending..." : "End shift"}
              onPress={handleEnd}
              outline
            />
          </>
        ) : (
          <>
            <Card>
              <Text style={{ fontWeight: "bold" }}>No shift running</Text>
              {shift?.ended_at ? (
                <Text style={{ color: "#555", fontSize: 12 }}>
                  Last shift: {time(shift.started_at)} to {time(shift.ended_at)}
                </Text>
              ) : null}
            </Card>
            <Button
              title={busy ? "Starting..." : "Start shift"}
              onPress={handleStart}
            />
          </>
        )}

        <Text style={{ color: "#555", fontSize: 12, marginTop: 12 }}>
          End-of-night tasks
        </Text>

        <Button
          title="Submit sales report"
          onPress={() => router.push("/salesReport")}
        />
        <Button title="Report incident" outline />
        <Button title="Report appliance issue" outline />

        <Button title="Log out" onPress={handleLogout} outline />
      </View>
    </Screen>
  );
}
