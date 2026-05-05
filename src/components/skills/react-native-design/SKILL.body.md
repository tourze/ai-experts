## 核心约束

- 默认使用 `StyleSheet.create` 固化样式；热路径里避免频繁新建内联样式对象。
- 导航层级要稳定：路由负责页面切换，组件不要私下维护另一套“伪导航”状态。
- 高帧率动画优先走 Reanimated worklet；不要把跟手动画压回 JS 线程。
- 平台分支应尽量收敛在边界组件或样式层，不要把 `Platform.OS` 散落在整页 JSX 里。
- 触控区、可见状态、加载态必须明确；移动端交互不能只看静态视觉。

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

## 检查清单

- [ ] 样式是否主要通过 `StyleSheet.create` 或稳定引用构建？
- [ ] 手势与动画是否放在 Reanimated / Gesture Handler 的正确线程模型上？
- [ ] 页面切换是否通过导航栈管理，而不是手写隐藏/显示分支模拟导航？
- [ ] 不同尺寸、刘海屏、安全区与横竖屏下是否都可用？
- [ ] 平台分支是否集中在边界层，而不是散在业务组件内部？
- [ ] 交互反馈、禁用态、加载态与错误态是否明确可见？

## 反模式

### FAIL: render 内构造 style

```tsx
<View style={{ padding: 16, backgroundColor: theme.bg }}>
  {items.map(i => <Row key={i.id} style={{ marginTop: 8 }} />)} // 所有 Row 失去 memo
</View>
```

### PASS: StyleSheet.create

```tsx
const styles = StyleSheet.create({ screen: { padding: 16 }, row: { marginTop: 8 } });
<View style={styles.screen}>{items.map(i => <Row key={i.id} style={styles.row} />)}</View>
```

### FAIL: JS 线程做跟手动画

```tsx
const [x, setX] = useState(0);
<PanResponder onMove={e => setX(e.nativeEvent.pageX)}> // 每帧穿桥 + JS 渲染
  <Animated.View style={{ transform: [{ translateX: x }] }} />
</PanResponder>
```

### PASS: Reanimated worklet (UI 线程)

```tsx
const x = useSharedValue(0);
const gesture = Gesture.Pan().onUpdate(e => { x.value = e.translationX; });
const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
```
