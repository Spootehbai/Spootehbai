import { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function register() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { username: cleanUsername } },
    });

    if (error) {
      setLoading(false);
      Alert.alert("Registration Failed", error.message);
      return;
    }

    if (data?.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        username: cleanUsername,
        email: cleanEmail,
        private_listening: false,
      });
    }

    setLoading(false);
    Alert.alert("Account Created", "You can now log in.", [
      { text: "OK", onPress: () => router.replace("/login") },
    ]);
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/spootehbai-logo.jpg")}
        style={styles.logo}
      />
      <Text style={styles.title}>Join Spootehbai</Text>
      <Text style={styles.subtitle}>Fill in the form below</Text>

      <TextInput
        placeholder="Display Name"
        placeholderTextColor="#9CA3AF"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={register}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating..." : "Register"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/login")}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  logo: { width: 90, height: 90, borderRadius: 50, marginBottom: 20 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#fff", fontSize: 14, marginBottom: 22 },
  input: {
    width: "100%",
    height: 55,
    backgroundColor: "#343A40",
    borderRadius: 8,
    paddingHorizontal: 15,
    color: "#fff",
    marginBottom: 12,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#00FF66",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  buttonText: { color: "#000", fontSize: 16, fontWeight: "800" },
  link: { color: "#00FF66", marginTop: 22, fontSize: 14, fontWeight: "600" },
});