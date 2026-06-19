const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix Firebase v10 "Component auth has not been registered yet" error.
// Metro resolves Firebase ESM browser bundles by default (via package exports),
// which are NOT pre-configured for React Native. Disabling this forces Metro
// to use the CJS 'main' entry which works correctly in React Native.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./src/global.css" });

