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
import { useAuth } from "../data/AuthContext";

export default function RegisterScreen() {
  const { registerAccount } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  async function register() {
    if (password !== confirmPassword) {
      Alert.alert("Password Error", "Passwords do not match.");
      return;
    }

    setIsRegistering(true);
    try {
      await registerAccount({ username, email, password });
      router.replace("/home");
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error instanceof Error ? error.message : "Could not create your account."
      );
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/spootehbai-logo.jpg")}
        style={styles.logo}
      />
      <Text style={styles.title}>Join Spootehbai</Text>
      <Text style={styles.subtitle}>Create your Spootehbai account</Text>
      <TextInput
        placeholder="Username"
        placeholderTextColor="#9CA3AF"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        textContentType="newPassword"
        style={styles.input}
      />
      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        autoCapitalize="none"
        textContentType="newPassword"
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={register}
        disabled={isRegistering}
      >
        <Text style={styles.buttonText}>
          {isRegistering ? "Creating account..." : "Register"}
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
  logo: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 22,
  },
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
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
  link: {
    color: "#00FF66",
    marginTop: 22,
    fontSize: 14,
    fontWeight: "600",
  },
});
