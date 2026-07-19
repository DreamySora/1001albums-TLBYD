import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // Album covers come from several third-party CDNs and use native responsive
    // image attributes. Migrating to next/image requires a separate image proxy
    // and cache policy, so keep that intentional exception explicit.
    "@next/next/no-img-element": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills"]
}];

export default eslintConfig;
