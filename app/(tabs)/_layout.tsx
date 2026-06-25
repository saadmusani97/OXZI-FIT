import { Tabs } from 'expo-router'
import { View, Text, TouchableOpacity, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRef, useEffect } from 'react'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const TABS: { name: string; title: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { name: 'index',       title: 'Home',     icon: 'home-outline',    activeIcon: 'home' },
  { name: 'exercises',   title: 'Workouts', icon: 'barbell-outline', activeIcon: 'barbell' },
  { name: 'calories',    title: 'Cal AI',   icon: 'camera-outline',  activeIcon: 'camera' },
  { name: 'track',       title: 'Track',    icon: 'map-outline',     activeIcon: 'map' },
  { name: 'profile',     title: 'Profile',  icon: 'person-outline',  activeIcon: 'person' },
  { name: 'leaderboard', title: 'Ranks',    icon: 'trophy-outline',  activeIcon: 'trophy' },
]

function TabItem({ tab, isFocused, onPress }: { tab: typeof TABS[0]; isFocused: boolean; onPress: () => void }) {
  const glowAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(glowAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.08 : 1,
        tension: 120,
        friction: 8,
        useNativeDriver: false,
      }),
    ]).start()
  }, [isFocused])

  const bgColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(246,108,63,0)', 'rgba(246,108,63,0.18)'],
  })

  const iconColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.38)', '#F66C3F'],
  })

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  })

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      <Animated.View style={{
        width: 44,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        transform: [{ scale: scaleAnim }],
        shadowColor: '#F66C3F',
        shadowOpacity: shadowOpacity,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      }}>
        <Ionicons
          name={isFocused ? tab.activeIcon : tab.icon}
          size={20}
          color={isFocused ? '#F66C3F' : 'rgba(255,255,255,0.38)'}
        />
      </Animated.View>
      <Animated.Text style={{
        fontSize: 10,
        fontWeight: '600',
        color: isFocused ? '#F66C3F' : 'rgba(255,255,255,0.38)',
        letterSpacing: 0.2,
      }}>
        {tab.title}
      </Animated.Text>
    </TouchableOpacity>
  )
}

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#141416',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(255,255,255,0.08)',
      paddingBottom: insets.bottom || 12,
      paddingTop: 10,
      paddingHorizontal: 8,
    }}>
      {TABS.map((tab) => {
        const route = state.routes.find((r: any) => r.name === tab.name)
        const isFocused = state.index === state.routes.indexOf(route)
        const isCenter = tab.name === 'calories'

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route?.key, canPreventDefault: true })
          if (!isFocused && !event.defaultPrevented) navigation.navigate(tab.name)
        }

        if (isCenter) {
          return (
            <View key={tab.name} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -18 }}>
              <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#F66C3F',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#F66C3F',
                  shadowOpacity: 0.55,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 10,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    position: 'absolute',
                    top: 4, left: 8, right: 8, height: 14,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }} />
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          )
        }

        return (
          <TabItem key={tab.name} tab={tab} isFocused={isFocused} onPress={onPress} />
        )
      })}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  )
}
