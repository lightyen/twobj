import type { UnnamedPlugin } from "./plugin";
declare type VariantPlugins = {
    [P in string]: UnnamedPlugin;
};
export declare const variantPlugins: VariantPlugins;
export {};
