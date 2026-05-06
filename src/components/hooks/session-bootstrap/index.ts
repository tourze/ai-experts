import type { HookDefinition } from "../../sdk";
import { androidEnvDetectorHook } from "./android-env-detector";
import { contextInjectorHook } from "./context-injector";
import { frontendCreativeEnvDetectorHook } from "./frontend-creative-env-detector";
import { frontendEnvDetectorHook } from "./frontend-env-detector";
import { goEnvDetectorHook } from "./go-env-detector";
import { iosEnvDetectorHook } from "./ios-env-detector";
import { javaEnvDetectorHook } from "./java-env-detector";
import { javascriptEnvDetectorHook } from "./javascript-env-detector";
import { javascriptVueEnvDetectorHook } from "./javascript-vue-env-detector";
import { phpEnvDetectorHook } from "./php-env-detector";
import { phpLaravelEnvDetectorHook } from "./php-laravel-env-detector";
import { phpWebmanEnvDetectorHook } from "./php-webman-env-detector";
import { pythonEnvDetectorHook } from "./python-env-detector";
import { reactEnvDetectorHook } from "./react-env-detector";
import { reactNextjsEnvDetectorHook } from "./react-nextjs-env-detector";
import { rustEnvDetectorHook } from "./rust-env-detector";
import { tauriEnvDetectorHook } from "./tauri-env-detector";
import { typescriptEnvDetectorHook } from "./typescript-env-detector";
import { typescriptNestjsEnvDetectorHook } from "./typescript-nestjs-env-detector";

export { androidEnvDetectorHook, contextInjectorHook, frontendCreativeEnvDetectorHook, frontendEnvDetectorHook, goEnvDetectorHook, iosEnvDetectorHook, javaEnvDetectorHook, javascriptEnvDetectorHook, javascriptVueEnvDetectorHook, phpEnvDetectorHook, phpLaravelEnvDetectorHook, phpWebmanEnvDetectorHook, pythonEnvDetectorHook, reactEnvDetectorHook, reactNextjsEnvDetectorHook, rustEnvDetectorHook, tauriEnvDetectorHook, typescriptEnvDetectorHook, typescriptNestjsEnvDetectorHook };

export const sessionBootstrapHooks: readonly HookDefinition[] = [
  androidEnvDetectorHook,
  contextInjectorHook,
  frontendCreativeEnvDetectorHook,
  frontendEnvDetectorHook,
  goEnvDetectorHook,
  iosEnvDetectorHook,
  javaEnvDetectorHook,
  javascriptEnvDetectorHook,
  javascriptVueEnvDetectorHook,
  phpEnvDetectorHook,
  phpLaravelEnvDetectorHook,
  phpWebmanEnvDetectorHook,
  pythonEnvDetectorHook,
  reactEnvDetectorHook,
  reactNextjsEnvDetectorHook,
  rustEnvDetectorHook,
  tauriEnvDetectorHook,
  typescriptEnvDetectorHook,
  typescriptNestjsEnvDetectorHook,
];
