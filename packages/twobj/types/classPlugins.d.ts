/// <reference types="tailwind-types" />
import type { UnnamedPlugin } from "./plugin";
declare type ClassPlugins = {
    [P in keyof Tailwind.CorePluginFeatures]?: UnnamedPlugin;
};
export declare const classPlugins: ClassPlugins;
export {};
