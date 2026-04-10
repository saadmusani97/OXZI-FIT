import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const tabs: { name: string; title: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'exercises', title: 'Exercises', icon: 'barbell-outline', activeIcon: 'barbell' },
  { name: 'calories', title: 'Cal AI', icon: 'camera-outline', activeIcon: 'camera' },
  { name: 'track', title: 'Track', icon: 'map-outline', activeIcon: 'map' },
  { name: 'leaderboard', title: 'Ranks', icon: 'trophy-outline', activeIcon: 'trophy' },
  { name: 'profile', title: 'Profile', icon: 'person-outline', activeIcon: 'person' },
]

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#09090b', borderTopColor: '#27272a' },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#71717a',
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
              <Ionicons name={focused ? tab.activeIcon : tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
