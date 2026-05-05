# 适配器接口抽象原生模块

## 类型定义

```typescript
// src/biometrics/biometrics.types.ts
export type BiometricType = 'fingerprint' | 'faceId' | 'iris' | 'none';

export interface BiometricsAdapter {
  isAvailable(): Promise<boolean>;
  getSupportedType(): Promise<BiometricType>;
  authenticate(reason: string): Promise<boolean>;
}
```

## iOS 实现

```typescript
// src/biometrics/index.ios.ts
import type { BiometricsAdapter, BiometricType } from './biometrics.types';
import NativeBiometrics from '../native/NativeBiometrics';

export const biometrics: BiometricsAdapter = {
  async isAvailable() {
    return NativeBiometrics.canEvaluatePolicy();
  },
  async getSupportedType(): Promise<BiometricType> {
    const type = await NativeBiometrics.biometryType();
    return type === 'FaceID' ? 'faceId' : 'fingerprint';
  },
  async authenticate(reason) {
    return NativeBiometrics.evaluatePolicy(reason);
  },
};
```

## Android 实现

```typescript
// src/biometrics/index.android.ts
import type { BiometricsAdapter, BiometricType } from './biometrics.types';
import NativeBiometrics from '../native/NativeBiometrics';

export const biometrics: BiometricsAdapter = {
  async isAvailable() {
    return NativeBiometrics.isHardwareAvailable();
  },
  async getSupportedType(): Promise<BiometricType> {
    const hasFingerprint = await NativeBiometrics.hasFingerprints();
    return hasFingerprint ? 'fingerprint' : 'none';
  },
  async authenticate(reason) {
    return NativeBiometrics.showBiometricPrompt(reason);
  },
};
```

## 何时用适配器 vs 何时用 `.native.ts`

| 条件 | 选择 |
|---|---|
| iOS 和 Android 调用不同原生 API | 适配器 + `.ios.ts` / `.android.ts` |
| iOS 和 Android 调用同一 API | `.native.ts` 即可 |
| 需要 Web / Tauri 等更多平台 | 适配器 + 多平台文件 |
| 仅值差异（尺寸/颜色） | `Platform.select` |
