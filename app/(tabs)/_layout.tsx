import { Tabs } from 'expo-router'
import { View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const LEFT_TABS: { name: string; title: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'exercises', title: 'Workouts', icon: 'barbell-outline', activeIcon: 'barbell' },
]

const RIGHT_TABS: { name: string; title: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { name: 'track', title: 'Track', icon: 'map-outline', activeIcon: 'map' },
  { name: 'profile', title: 'Profile', icon: 'person-outline', activeIcon: 'person' },
]

const ALL_TABS = [
  ...LEFT_TABS,
  { name: 'calories', title: 'Cal AI', icon: 'camera-outline' as IoniconName, activeIcon: 'camera' as IoniconName },
  ...RIGHT_TABS,
  { name: 'leaderboard', title: 'Ranks', icon: 'trophy-outline' as IoniconName, activeIcon: 'trophy' as IoniconName },
]

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0ece8',
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarActiveTintColor: '#c2410c',
        tabBarInactiveTintColor: '#9a7b6e',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      {ALL_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
              if (tab.name === 'calories') {
                return (
                  <View style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#c2410c',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                    shadowColor: '#c2410c',
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}>
                    <Ionicons name="camera" size={24} color="#fff" />
                  </View>
                )
              }
              return <Ionicons name={focused ? tab.activeIcon : tab.icon} size={22} color={color} />
            },
            tabBarLabel: tab.name === 'calories' ? () => null : undefined,
          }}
        />
      ))}
    </Tabs>
  )
}
