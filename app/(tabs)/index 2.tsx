import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { useSteps } from "../../hooks/useSteps";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const { profile } = useAuth();
  const { todaySteps, stepGoal, progress } = useSteps();

  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-6">
        <Text className="text-muted text-base">{greeting}</Text>
        <Text className="text-text-primary text-3xl font-bold">
          {profile?.full_name || "Athlete"}
        </Text>
        {profile?.streak_days ? (
          <View className="flex-row items-center mt-1">
            <Ionicons name="flame" size={16} color="#DC5F00" />
            <Text className="text-accent text-sm ml-1 font-semibold">
              {profile.streak_days} day streak
            </Text>
          </View>
        ) : null}
      </View>

      {/* Steps Card */}
      <View className="mx-6 bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-text-primary text-lg font-semibold">
            Today`s Steps
          </Text>
          <Text className="text-muted text-sm">
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View className="items-center mb-3">
          <Text className="text-accent text-5xl font-bold">
            {todaySteps.toLocaleString()}
          </Text>
          <Text className="text-muted text-sm mt-1">
            / {stepGoal.toLocaleString()} goal
          </Text>
        </View>
        <View className="bg-border rounded-full h-3">
          <View
            className="bg-accent rounded-full h-3"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 mb-4">
        <Text className="text-text-primary text-lg font-semibold mb-3">
          Quick Actions
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
            <View className="bg-accent/10 rounded-full p-3 mb-2">
              <Ionicons name="camera" size={24} color="#DC5F00" />
            </View>
            <Text className="text-text-primary text-sm font-medium">
              Scan Food
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
            <View className="bg-accent/10 rounded-full p-3 mb-2">
              <Ionicons name="play" size={24} color="#DC5F00" />
            </View>
            <Text className="text-text-primary text-sm font-medium">
              Start Run
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
            <View className="bg-accent/10 rounded-full p-3 mb-2">
              <Ionicons name="barbell" size={24} color="#DC5F00" />
            </View>
            <Text className="text-text-primary text-sm font-medium">
              Workout
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
            <View className="bg-accent/10 rounded-full p-3 mb-2">
              <Ionicons name="chatbubble" size={24} color="#DC5F00" />
            </View>
            <Text className="text-text-primary text-sm font-medium">
              AI Coach
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Summary */}
      <View className="px-6 mb-4">
        <Text className="text-text-primary text-lg font-semibold mb-3">
          Today`s Summary
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <Ionicons name="flame-outline" size={20} color="#DC5F00" />
            <Text className="text-text-primary text-xl font-bold mt-2">
              0
            </Text>
            <Text className="text-muted text-xs">Calories</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <Ionicons name="restaurant-outline" size={20} color="#DC5F00" />
            <Text className="text-text-primary text-xl font-bold mt-2">
              0
            </Text>
            <Text className="text-muted text-xs">Meals</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <Ionicons name="fitness-outline" size={20} color="#DC5F00" />
            <Text className="text-text-primary text-xl font-bold mt-2">
              0
            </Text>
            <Text className="text-muted text-xs">Workouts</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <Ionicons name="map-outline" size={20} color="#DC5F00" />
            <Text className="text-text-primary text-xl font-bold mt-2">
              0 km
            </Text>
            <Text className="text-muted text-xs">Distance</Text>
          </View>
        </View>
      </View>

      {/* Streak Section */}
      <View className="px-6 mb-8">
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="flame" size={28} color="#DC5F00" />
              <View className="ml-3">
                <Text className="text-text-primary text-lg font-semibold">
                  {profile?.streak_days || 0} Day Streak
                </Text>
                <Text className="text-muted text-sm">
                  Keep it going! Don`t break the chain.
                </Text>
              </View>
            </View>
            <TouchableOpacity className="bg-accent/10 rounded-full px-4 py-2">
              <Text className="text-accent font-semibold text-sm">Freeze</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
