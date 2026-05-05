## 代码模式

```tsx
import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#111827",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#cbd5e1",
  },
});

export function ProfileCard() {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>React Native screen with stable styles.</Text>
      </View>
    </View>
  );
}
```

```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Pressable, Text } from "react-native";

export function AnimatedCTA() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      <Animated.View style={animatedStyle}>
        <Text>Continue</Text>
      </Animated.View>
    </Pressable>
  );
}
```

```tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

const Stack = createNativeStackNavigator();

function HomeScreen() {
  return (
    <View>
      <Text>Home</Text>
    </View>
  );
}

function DetailsScreen() {
  return (
    <View>
      <Text>Details</Text>
    </View>
  );
}

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}
```
