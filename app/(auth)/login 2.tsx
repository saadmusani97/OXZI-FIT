import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-text-primary text-4xl font-bold mb-2">OXZIFIT</Text>
        <Text className="text-muted text-lg mb-12">Your all-in-one fitness app</Text>

        <View className="mb-4">
          <Text className="text-text-secondary text-sm mb-2">Email</Text>
          <TextInput
            className="bg-white border border-border rounded-xl px-4 py-4 text-text-primary text-base"
            placeholder="Enter your email"
            placeholderTextColor="#686D76"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-6">
          <Text className="text-text-secondary text-sm mb-2">Password</Text>
          <TextInput
            className="bg-white border border-border rounded-xl px-4 py-4 text-text-primary text-base"
            placeholder="Enter your password"
            placeholderTextColor="#686D76"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className="bg-accent rounded-xl py-4 items-center mb-4"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-lg font-semibold">
            {loading ? "Signing in..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-muted"> Don`t have an account? </Text>
          <Link href="/(auth)/signup">
            <Text className="text-accent font-semibold">Sign Up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
