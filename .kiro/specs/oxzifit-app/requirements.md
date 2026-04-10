# Requirements Document

## Introduction

OXZIFIT is an all-in-one fitness mobile application built with React Native + Expo that eliminates the need for multiple fitness apps. It combines an exercise library with muscle visualization, AI-powered food scanning (Cal AI), GPS route tracking with territory conquest mechanics, a pedometer-based step counter, a gamified leaderboard with monthly rewards, and a comprehensive onboarding flow — all in a single app. The target users are fitness enthusiasts who want a unified, gamified, and socially competitive fitness experience.

---

## Glossary

- **App**: The OXZIFIT React Native + Expo mobile application
- **User**: An authenticated person using the App
- **Cal_AI**: The food photo scanning and nutrition detection subsystem powered by OpenAI GPT-4o Vision
- **Scanner**: The camera-based component used to capture food photos or barcodes
- **Nutrition_Analyzer**: The Supabase Edge Function that proxies images to OpenAI GPT-4o Vision and returns structured nutrition data
- **Muscle_Highlighter**: The `react-native-body-highlighter` SVG component that visualizes trained muscle groups
- **Exercise_Library**: The searchable, filterable database of 1500+ exercises sourced from the ExerciseDB API (exercisedb.dev)
- **ExerciseDB_API**: The free REST API at exercisedb.dev providing 1500+ exercises with animated GIF demonstrations, muscle group metadata, and step-by-step instructions
- **Exercise_GIF**: The animated GIF provided by the ExerciseDB_API that demonstrates correct exercise form for a given exercise
- **Pedometer**: The `expo-sensors` Pedometer-based step counting subsystem
- **Route_Tracker**: The GPS tracking subsystem using `expo-location` and `react-native-maps`
- **Territory_Engine**: The subsystem that converts completed routes into polygon overlays representing claimed map areas
- **Leaderboard**: The monthly competitive ranking system based on accumulated points
- **Points_Engine**: The subsystem that calculates and awards points for user activities
- **Streak_System**: The Duolingo-style consecutive-day activity tracking subsystem
- **Onboarding_Flow**: The multi-step initial setup screens that collect user profile data
- **Profile**: The user's stored personal data including biometrics, goals, and preferences
- **Friend**: Another User who has an accepted friendship connection with the current User
- **Achievement**: A milestone badge unlocked when a User meets a defined activity threshold
- **Report_Card**: The weekly auto-generated shareable summary of a User's fitness activity
- **Fitness_Score**: The single numeric score (300–850) representing a User's overall fitness consistency
- **Meal**: A logged food item with associated nutrition data
- **Route**: A completed GPS-tracked activity (run, walk, or cycle) stored as a coordinate array
- **Territory**: A polygon overlay on the map representing an area a User has covered during a Route
- **Supabase**: The backend-as-a-service providing authentication, PostgreSQL database, storage, Edge Functions, and Realtime
- **Edge_Function**: A Supabase serverless function used to proxy AI API calls server-side

---

## Requirements

### Requirement 1: User Onboarding

**User Story:** As a new user, I want to complete a guided onboarding flow, so that the App can personalize my fitness experience from day one.

#### Acceptance Criteria

1. WHEN a User completes signup for the first time, THE Onboarding_Flow SHALL present a minimum of 5 sequential screens collecting: full name, age, gender, height (cm), weight (kg), fitness goal, activity level, dietary preference, daily step goal, and daily calorie goal.
2. WHEN a User advances between onboarding steps, THE App SHALL animate the transition using `react-native-reanimated` with a slide or fade animation completing within 300ms.
3. WHEN a User submits the final onboarding step, THE App SHALL persist all collected Profile data to the Supabase `profiles` table before navigating to the home screen.
4. IF a required onboarding field is left empty when the User attempts to advance, THEN THE Onboarding_Flow SHALL display an inline validation message and prevent navigation to the next step.
5. WHEN a User has already completed onboarding, THE App SHALL skip the Onboarding_Flow and navigate directly to the home tab.
6. THE Onboarding_Flow SHALL offer the following fitness goal options: lose weight, gain muscle, maintain weight, improve endurance.
7. THE Onboarding_Flow SHALL offer the following activity level options: sedentary, lightly active, moderately active, very active, extremely active.

---

### Requirement 2: Authentication

**User Story:** As a user, I want to securely sign up and log in, so that my fitness data is private and persists across sessions.

#### Acceptance Criteria

1. THE App SHALL support email and password-based registration via Supabase Auth.
2. WHEN a User submits valid credentials on the login screen, THE App SHALL authenticate via Supabase Auth and navigate to the home tab within 3 seconds under normal network conditions.
3. IF a User submits an email that is already registered during signup, THEN THE App SHALL display the message "An account with this email already exists."
4. IF a User submits incorrect credentials on the login screen, THEN THE App SHALL display the message "Invalid email or password."
5. WHEN a User's session token is valid and stored in AsyncStorage, THE App SHALL restore the authenticated session on next launch without requiring re-login.
6. WHEN a User taps the logout button, THE App SHALL clear the session from AsyncStorage and navigate to the login screen.
7. THE App SHALL enforce Supabase Row Level Security policies so that each User can only read and write their own data.

---

### Requirement 3: Exercise Library with Animated Demonstrations and Muscle Highlighting

**User Story:** As a user, I want to browse exercises, watch animated demonstrations, and see which muscles they target, so that I can follow correct form, plan balanced workouts, and track which body parts I've trained.

#### Acceptance Criteria

1. THE Exercise_Library SHALL display a searchable list of exercises fetched from the ExerciseDB_API (exercisedb.dev), providing a minimum of 1500 exercises at launch.
2. WHEN a User searches by exercise name or filters by muscle group or equipment, THE Exercise_Library SHALL return matching results within 500ms using client-side filtering on the cached ExerciseDB_API response.
3. WHEN a User selects an exercise, THE App SHALL display an exercise detail screen showing: the Exercise_GIF animated demonstration, name, targeted muscle groups, body part, equipment required, and step-by-step instructions.
4. WHEN an exercise detail screen is displayed, THE App SHALL render the Exercise_GIF using the `gifUrl` field returned by the ExerciseDB_API so that the User can follow the animated demonstration to perform the exercise correctly.
5. WHEN an exercise detail screen is displayed, THE Muscle_Highlighter SHALL render a front and back SVG body diagram with the primary and secondary muscle groups highlighted in distinct colors alongside the Exercise_GIF.
6. THE Muscle_Highlighter SHALL support toggling between front-body and back-body views.
7. WHEN a User logs a completed workout set, THE App SHALL save the record to the Supabase `workouts` table with: exercise_id, sets, reps, weight_kg, duration_seconds, and completed_at timestamp.
8. WHEN a User views their workout history, THE Muscle_Highlighter SHALL render a cumulative heatmap showing all muscle groups trained in the selected time period, with color intensity proportional to training frequency.

---

### Requirement 4: Cal AI — Food Photo Nutrition Detection

**User Story:** As a user, I want to photograph my food and instantly see its nutritional breakdown, so that I can track my diet without manually looking up nutrition data.

#### Acceptance Criteria

1. WHEN a User opens the Cal AI screen, THE Scanner SHALL present options to capture a new photo via camera or select an existing photo from the device gallery.
2. WHEN a User captures or selects a food photo, THE App SHALL base64-encode the image and send it to the Nutrition_Analyzer Edge Function within 1 second of selection.
3. WHEN the Nutrition_Analyzer receives an image, THE Edge_Function SHALL call OpenAI GPT-4o Vision with a structured prompt requesting a JSON response containing: food_name, calories, protein_g, fat_g, carbs_g, fiber_g, portion_size, and confidence score.
4. THE Nutrition_Analyzer SHALL never expose the OPENAI_API_KEY to the client; the key SHALL only exist as a Supabase Edge Function secret.
5. WHEN the Nutrition_Analyzer returns a successful response, THE App SHALL display the nutrition data with animated progress bars for protein, fat, carbohydrates, and fiber using `react-native-reanimated`.
6. WHEN a User confirms a scanned meal, THE App SHALL save the Meal record to the Supabase `meals` table with: food_name, calories, protein_g, fat_g, carbs_g, fiber_g, portion_size, image_url, ai_confidence, meal_type, and logged_at timestamp.
7. IF the Nutrition_Analyzer returns an error or a non-food image is detected, THEN THE App SHALL display the message "Could not identify food. Please try a clearer photo." and allow the User to retake.
8. THE Cal AI screen SHALL display a daily meal log showing all Meals logged for the current day with a running total of calories, protein, fat, and carbohydrates.
9. WHEN a User scans a packaged food barcode using the Scanner, THE App SHALL query the Open Food Facts API (https://world.openfoodfacts.org/api/v2/product/{barcode}.json) and populate the nutrition fields from the product data.
10. IF a barcode is not found in the Open Food Facts database, THEN THE App SHALL fall back to the GPT-4o Vision scan flow.

---

### Requirement 5: Steps Tracking

**User Story:** As a user, I want the app to count my steps throughout the day like a pedometer, so that I can monitor my daily activity and progress toward my step goal.

#### Acceptance Criteria

1. WHEN the App is in the foreground, THE Pedometer SHALL read step count data from `expo-sensors` Pedometer and update the displayed step count in real time.
2. THE App SHALL display a circular progress indicator showing steps taken versus the User's daily step goal, updating at a minimum of once every 10 seconds while the App is active.
3. WHEN the User's step count reaches their daily step goal, THE App SHALL display a congratulatory animation using Lottie.
4. WHEN the day changes at midnight (device local time), THE App SHALL save the final step count for the completed day to the Supabase `daily_steps` table with: user_id, date, steps, distance_km, and calories_burned.
5. THE App SHALL calculate distance_km from step count using the formula: steps × 0.000762 (average stride length of 76.2 cm).
6. THE App SHALL calculate calories_burned from steps using the formula: steps × 0.04 (approximate kcal per step for an average adult).
7. THE App SHALL display a 7-day step history chart on the home screen showing daily step totals as a bar chart.
8. IF the device does not support the Pedometer sensor, THEN THE App SHALL display the message "Step tracking is not available on this device" and hide the step counter widget.

---

### Requirement 6: GPS Route Tracking

**User Story:** As a user, I want to track my runs and walks on a map in real time, so that I can see my route, distance, pace, and duration like a Strava-style activity tracker.

#### Acceptance Criteria

1. WHEN a User taps "Start" on the track screen, THE Route_Tracker SHALL request foreground location permission via `expo-location` and begin recording GPS coordinates at a minimum interval of 5 seconds.
2. WHILE a route is being recorded, THE App SHALL render the User's path as a Polyline overlay on a `react-native-maps` MapView, updating in real time as new coordinates are received.
3. WHILE a route is being recorded, THE App SHALL display: elapsed duration (HH:MM:SS), total distance in km (calculated via Haversine formula), and current pace in min/km, updating every second.
4. WHEN a User taps "Stop" on the track screen, THE Route_Tracker SHALL stop recording coordinates and save the completed Route to the Supabase `routes` table with: activity_type, distance_km, duration_seconds, coordinates (JSONB array of {lat, lng, timestamp}), started_at, and ended_at.
5. IF location permission is denied by the User, THEN THE App SHALL display the message "Location permission is required for route tracking" and disable the Start button.
6. THE App SHALL display a list of the User's past Routes on the track screen, showing: activity type, distance, duration, and date for each Route.
7. WHEN a User selects a past Route from the list, THE App SHALL display the Route detail screen showing the full Polyline on a map, along with distance, duration, pace, and date.

---

### Requirement 7: Territory Conquest Map

**User Story:** As a user, I want the areas I've run or walked to be visually claimed on the map, so that I can see my total coverage and compete with friends for map territory.

#### Acceptance Criteria

1. WHEN a Route is saved, THE Territory_Engine SHALL compute a convex hull polygon from the Route's coordinate array using `@turf/turf` and store it in the Supabase `territory_claims` table with: user_id, route_id, polygon (JSONB), and area_sqkm.
2. WHEN a User views the territory map, THE App SHALL render all of the User's Territory polygons as semi-transparent colored Polygon overlays on the MapView.
3. WHEN a User has covered the same geographic area on multiple Routes, THE Territory_Engine SHALL increase the opacity of the corresponding Territory polygon proportionally to the visit count, with a maximum opacity of 0.8.
4. WHEN a User views the territory map, THE App SHALL also render Friend Territory polygons in a distinct color to enable visual comparison.
5. THE App SHALL display the User's total claimed territory area in square kilometers on the territory map screen.
6. WHEN two Users have overlapping Territory polygons, THE App SHALL render the overlap region in a blended color to indicate contested territory.

---

### Requirement 8: Leaderboard and Points System

**User Story:** As a user, I want to compete on a monthly leaderboard and earn points for my fitness activities, so that I stay motivated and can compare my performance with friends.

#### Acceptance Criteria

1. THE Points_Engine SHALL award points according to the following rules: 1 point per 1,000 steps, 10 points per completed workout, 5 points per logged Meal, 1 point per km of completed Route, and 5 bonus points per consecutive streak day.
2. WHEN a User completes a point-earning activity, THE Points_Engine SHALL update the User's record in the Supabase `leaderboard_entries` table for the current month (YYYY-MM format) within 5 seconds.
3. THE Leaderboard screen SHALL display the top 10 Users for the current month ranked by total_points, with the top 3 displayed in a visually distinct podium layout.
4. THE Leaderboard screen SHALL update in real time using Supabase Realtime subscriptions so that rank changes are reflected without requiring a manual refresh.
5. THE App SHALL display the current User's rank and total points on the Leaderboard screen even if the User is not in the top 10.
6. THE App SHALL support a Friends leaderboard view that filters the Leaderboard to show only the User and their accepted Friends, ranked by total_points for the current month.
7. WHEN a User views a Friend's profile, THE App SHALL display a side-by-side comparison of: total points, steps, workouts completed, meals logged, km tracked, and current streak — with a win/loss indicator per category.
8. THE App SHALL display the top 3 Users of the previous month with a "Monthly Champion" badge on their profiles.

---

### Requirement 9: Streak System

**User Story:** As a user, I want to maintain a daily activity streak, so that I stay consistently engaged with the app and earn bonus rewards for consecutive days.

#### Acceptance Criteria

1. THE Streak_System SHALL increment a User's streak count by 1 for each calendar day in which the User logs at least one of: a workout, a Meal, a step count above 0, or a completed Route.
2. WHEN a User's streak count reaches 7, 30, 60, or 100 consecutive days, THE App SHALL display a Lottie celebration animation and award a Streak Shield that protects against one missed day.
3. WHEN a User misses a calendar day with no logged activity and holds no Streak Shield or Streak Freeze, THE Streak_System SHALL reset the User's streak count to 0.
4. WHEN a User spends 50 points to activate a Streak Freeze, THE Streak_System SHALL protect the User's streak for exactly 1 missed day, and the User SHALL hold a maximum of 2 active Streak Freezes at any time.
5. THE App SHALL display the User's current streak count with a fire icon and the number of days on the home screen and profile screen.
6. WHEN a User's streak is broken, THE App SHALL display a notification informing the User that their streak has ended and showing the final streak length achieved.

---

### Requirement 10: Friend System

**User Story:** As a user, I want to add friends and compare my fitness stats with them, so that I can stay socially motivated and track my progress relative to others.

#### Acceptance Criteria

1. WHEN a User searches for another User by email address, THE App SHALL query the Supabase `profiles` table and display matching results.
2. WHEN a User sends a friend request, THE App SHALL insert a record into the Supabase `friendships` table with status "pending" and notify the recipient.
3. WHEN a recipient accepts a friend request, THE App SHALL update the friendship record status to "accepted" and make both Users visible on each other's Friends leaderboard.
4. THE App SHALL display a list of pending incoming friend requests on the profile screen with accept and decline actions.
5. WHEN a User views the friend comparison screen for a specific Friend, THE App SHALL display the PUBG-style win/loss comparison showing which User leads in each of the 6 stat categories: points, steps, workouts, meals, km, and streak.

---

### Requirement 11: User Profile and Settings

**User Story:** As a user, I want to view and edit my profile, see my achievements, and manage my app settings, so that I can keep my data accurate and customize my experience.

#### Acceptance Criteria

1. THE Profile screen SHALL display: avatar, full name, current Fitness_Score, current streak, total workouts, total steps, total km tracked, and total meals logged.
2. WHEN a User edits their profile, THE App SHALL allow updating: full name, height, weight, fitness goal, activity level, dietary preference, daily step goal, and daily calorie goal, and SHALL persist changes to the Supabase `profiles` table.
3. THE Profile screen SHALL display an achievements gallery showing all unlocked Achievements with unlock date and all locked Achievements as greyed-out placeholders.
4. WHEN a User meets the requirement for an Achievement (e.g., first 10,000 steps, first completed route, 7-day streak), THE App SHALL insert a record into `user_achievements`, display a Lottie unlock animation, and award the associated points.
5. THE Fitness_Score SHALL be calculated as a value between 300 and 850 using the formula: base 300 + (workout_points × 0.4) + (steps_points × 0.3) + (meal_points × 0.2) + (route_points × 0.1), capped at 850.
6. THE Profile screen SHALL display a weekly Fitness_Score trend chart showing the score for each of the past 7 days.

---

### Requirement 12: Home Dashboard

**User Story:** As a user, I want a unified home screen showing my daily progress at a glance, so that I can quickly understand my activity status and take action.

#### Acceptance Criteria

1. THE Home screen SHALL display the following daily summary widgets: today's step count with progress toward goal, today's total calories consumed, today's workout count, and current streak.
2. THE Home screen SHALL display quick action buttons for: scan food (opens Cal AI), start route (opens Route_Tracker), and browse exercises (opens Exercise_Library).
3. THE Home screen SHALL display the User's 3 most recently logged Meals for the current day.
4. THE Home screen SHALL display the User's current rank on the monthly Leaderboard.
5. WHEN the User pulls down on the Home screen, THE App SHALL refresh all dashboard data from Supabase.

---

### Requirement 13: Shareable Report Card

**User Story:** As a user, I want to generate and share a weekly fitness summary card, so that I can showcase my progress on social media.

#### Acceptance Criteria

1. WHEN a User requests a Report_Card, THE App SHALL aggregate the following data for the past 7 days: total steps, total calories logged, workouts completed, total km tracked, current streak, and Fitness_Score.
2. THE Report_Card SHALL render as an animated card using Lottie and `react-native-reanimated`, displaying all 7-day aggregated stats with a muscle heatmap of trained areas and a mini territory map.
3. WHEN a User taps "Share", THE App SHALL capture the Report_Card as a screenshot using `react-native-view-shot` and open the native share sheet via `expo-sharing`.
4. THE Report_Card SHALL be generated entirely on the client side without requiring a server round-trip, using only data already cached locally or fetched from Supabase.

---

### Requirement 14: AI Trainer Chat

**User Story:** As a user, I want to chat with an AI personal trainer that knows my fitness data, so that I can get personalized workout advice, meal suggestions, and motivation.

#### Acceptance Criteria

1. WHEN a User sends a message in the AI Trainer Chat, THE App SHALL send the message along with the User's Profile, last 7 days of Meals, last 7 days of workouts, and current streak to a Supabase Edge_Function that proxies the request to OpenAI GPT-4o.
2. THE Edge_Function SHALL return a response within 10 seconds under normal network conditions.
3. THE App SHALL display AI responses in a chat bubble UI with the most recent message visible without scrolling.
4. THE App SHALL provide quick-reply suggestion chips including: "Suggest a workout", "Review my nutrition", "I need motivation", and "What should I eat next?"
5. THE App SHALL persist chat history in the Supabase `chat_messages` table so that the conversation is restored when the User reopens the chat screen.
6. THE Edge_Function SHALL never expose the OPENAI_API_KEY to the client; the key SHALL only exist as a Supabase Edge Function secret.

---

### Requirement 15: Smart Meal Swap

**User Story:** As a user, I want the app to suggest healthier food alternatives after I scan a meal, so that I can make better dietary choices aligned with my goals.

#### Acceptance Criteria

1. WHEN a Meal is logged via Cal AI, THE App SHALL calculate a meal grade (A+, A, B, C, D) based on the ratio of protein_g to calories and the fat_g to calories ratio relative to the User's daily goals.
2. WHEN a Meal receives a grade of C or D, THE App SHALL display a "Healthier Swap" suggestion by calling the Nutrition_Analyzer Edge_Function with the meal data and User Profile to generate an alternative food suggestion via OpenAI GPT-4o.
3. THE Swap suggestion SHALL include: alternative food name, estimated calories, protein_g, fat_g, and carbs_g.
4. THE App SHALL display a nutrient gap summary after each logged Meal showing: remaining calories, remaining protein_g, remaining fat_g, and remaining carbs_g for the day.

---

### Requirement 16: Data Parsing and Serialization

**User Story:** As a developer, I want all data exchanged between the app and Supabase to be correctly serialized and deserialized, so that no data is lost or corrupted during storage and retrieval.

#### Acceptance Criteria

1. WHEN Route coordinates are saved to Supabase, THE App SHALL serialize the coordinate array as a valid JSON array of objects with the shape `{ lat: number, lng: number, timestamp: number }`.
2. WHEN Route coordinates are loaded from Supabase, THE App SHALL deserialize the JSONB field back into a typed TypeScript array matching the shape `{ lat: number, lng: number, timestamp: number }[]`.
3. FOR ALL valid Route coordinate arrays, serializing then deserializing SHALL produce an array equal in length and coordinate values to the original (round-trip property).
4. WHEN Territory polygon data is saved to Supabase, THE App SHALL serialize the GeoJSON polygon as a valid JSON object conforming to the GeoJSON Polygon geometry spec.
5. FOR ALL valid Territory polygons, serializing then deserializing SHALL produce a polygon with identical coordinate arrays to the original (round-trip property).
6. WHEN the Nutrition_Analyzer Edge_Function returns a response, THE App SHALL validate that the JSON contains all required fields (food_name, calories, protein_g, fat_g, carbs_g) before saving to the database; IF any required field is missing, THEN THE App SHALL treat the response as an error and prompt the User to retry.
