import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import Button from "../components/Button";
import Input from "../components/Input";
import Screen from "../components/Screen";
import { colors } from "../constants/colors";
import { useEffect, useState } from "react";
import { login, saveSession, getUser } from "../constants/api";
// TODO:
// - Real login check (email and password)
// - Show an error message when login fails
// - "Forgot password?" should be tappable and open a reset screen
// - Remember the user so they stay logged in
// - Show users real name on Home based on who logged in

export default function Index() {
  // State variables for email, password, error message, and loading state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in before? Skip the login screen.
  useEffect(() => {
    getUser().then((user) => {
      if (user) router.replace("/home");
    });
  }, []);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const { token, user } = await login(email.trim(), password);
      await saveSession(token, user);
      router.replace("/home");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: "100%", height: 90 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
          Tommyfield Ops
        </Text>
        <Text style={{ textAlign: "center", color: "#555", marginBottom: 12 }}>
          Sign in to your shift
        </Text>

        <Input
          label="Email"
          placeholder="GM@tommyfield.ca"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button
          title={loading ? "Logging in..." : "Log in"}
          onPress={handleLogin}
        />
        {error ? (
          <Text style={{ color: colors.red, fontSize: 12 }}>{error}</Text>
        ) : null}
        <Text style={{ textAlign: "center", color: colors.red, fontSize: 12 }}>
          Forgot password?
        </Text>
      </View>
    </Screen>
  );
}
