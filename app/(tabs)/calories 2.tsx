import { useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { Card, Button, Badge, EmptyState } from "@/components";
import { Ionicons } from "@expo/vector-icons";

interface MealLog {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  meal_type: string;
  logged_at: string;
  image_url: string | null;
}

export default function CaloriesScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [mealLog, setMealLog] = useState<MealLog | null>(null);
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos to scan food.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setMealLog(null);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your camera to scan food.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setMealLog(null);
    }
  };

  const analyzeFood = async () => {
    if (!image) return;

    setLoading(true);
    setAnalyzing(true);

    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { image: base64 },
      });

      if (error) throw error;

      const newMeal: MealLog = {
        id: Date.now().toString(),
        food_name: data.food_name || "Scanned Food",
        calories: data.calories || 0,
        protein_g: data.protein_g || 0,
        fat_g: data.fat_g || 0,
        carbs_g: data.carbs_g || 0,
        meal_type: data.meal_type || "snack",
        logged_at: new Date().toISOString(),
        image_url: image,
      };

      setMealLog(newMeal);
      setRecentMeals((prev) => [newMeal, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error("Error analyzing food:", error);
      Alert.alert("Error", "Failed to analyze food. Make sure you have an internet connection.");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getTodayCalories = () => {
    return recentMeals
      .filter((m) => new Date(m.logged_at).toDateString() === new Date().toDateString())
      .reduce((sum, m) => sum + m.calories, 0);
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-6">
        <Text className="text-text-primary text-3xl font-bold">Cal AI</Text>
        <Text className="text-muted text-base mt-1">
          Scan food to track nutrition
        </Text>
      </View>

      <View className="px-6 mb-4">
        <Card className="p-4">
          <Text className="text-text-primary font-semibold mb-3">Today`s Progress</Text>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-3xl font-bold text-accent">{getTodayCalories()}</Text>
              <Text className="text-muted text-sm">calories consumed</Text>
            </View>
            <View className="bg-accent/10 px-4 py-2 rounded-full">
              <Text className="text-accent font-semibold">{recentMeals.length} meals</Text>
            </View>
          </View>
        </Card>
      </View>

      <View className="px-6 mb-4">
        <Card className="p-4">
          <Text className="text-text-primary font-semibold mb-3">Scan Food</Text>
          
          {image ? (
            <View className="mb-4">
              <Image source={{ uri: image }} className="w-full aspect-square rounded-xl" resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setImage(null)}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow"
              >
                <Ionicons name="close" size={20} color="#DC5F00" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-gray-100 rounded-xl aspect-square mb-4 items-center justify-center">
              <Ionicons name="camera-outline" size={64} color="#686D76" />
              <Text className="text-muted mt-2">Take or select a photo</Text>
            </View>
          )}

          <View className="flex-row gap-3">
            {!image ? (
              <>
                <Button
                  title="Take Photo"
                  onPress={takePhoto}
                  variant="primary"
                  className="flex-1"
                />
                <Button
                  title="Gallery"
                  onPress={pickImage}
                  variant="outline"
                  className="flex-1"
                />
              </>
            ) : (
              <Button
                title={analyzing ? "Analyzing..." : "Analyze Food"}
                onPress={analyzeFood}
                loading={loading}
                variant="primary"
                className="flex-1"
              />
            )}
          </View>
        </Card>
      </View>

      {analyzing && (
        <View className="px-6 mb-4">
          <Card className="p-6 items-center">
            <ActivityIndicator size="large" color="#DC5F00" />
            <Text className="text-text-primary font-medium mt-3">Analyzing your food...</Text>
            <Text className="text-muted text-sm mt-1">Using AI to detect nutrition</Text>
          </Card>
        </View>
      )}

      {mealLog && (
        <View className="px-6 mb-4">
          <Card className="p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-text-primary font-semibold text-lg">Nutrition Results</Text>
              <Badge text={mealLog.meal_type} variant="accent" />
            </View>
            
            <Text className="text-text-primary text-xl font-bold mb-4">{mealLog.food_name}</Text>
            
            <View className="grid grid-cols-2 gap-3">
              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-muted text-xs">Calories</Text>
                <Text className="text-2xl font-bold text-accent">{mealLog.calories}</Text>
              </View>
              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-muted text-xs">Protein</Text>
                <Text className="text-2xl font-bold text-text-primary">{mealLog.protein_g}g</Text>
              </View>
              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-muted text-xs">Fat</Text>
                <Text className="text-2xl font-bold text-text-primary">{mealLog.fat_g}g</Text>
              </View>
              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-muted text-xs">Carbs</Text>
                <Text className="text-2xl font-bold text-text-primary">{mealLog.carbs_g}g</Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {recentMeals.length > 0 && (
        <View className="px-6 mb-4">
          <Text className="text-text-primary font-semibold mb-3">Recent Meals</Text>
          <View className="gap-3">
            {recentMeals.map((meal) => (
              <Card key={meal.id} className="p-3 flex-row items-center">
                {meal.image_url && (
                  <Image source={{ uri: meal.image_url }} className="w-16 h-16 rounded-lg" />
                )}
                <View className="flex-1 ml-3">
                  <Text className="text-text-primary font-medium">{meal.food_name}</Text>
                  <Text className="text-muted text-sm">
                    {meal.calories} cal • {meal.protein_g}g protein
                  </Text>
                </View>
                <Badge text={meal.meal_type} variant="default" />
              </Card>
            ))}
          </View>
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}