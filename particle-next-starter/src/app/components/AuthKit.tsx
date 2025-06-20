"use client";

// Particle imports
import {
  AuthCoreContextProvider,
  PromptSettingType,
} from "@particle-network/authkit";
import { AuthType } from "@particle-network/auth-core";
import { baseSepolia, sepolia } from "@particle-network/authkit/chains";

export const ParticleAuthkit = ({ children }: React.PropsWithChildren) => {
  return (
    <AuthCoreContextProvider
      options={{
        // All env variable must be defined at runtime
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
        clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
        appId: process.env.NEXT_PUBLIC_APP_ID!,

        // This is how you limit the options available.
        // Remove the authTypes array to display all options available
        authTypes: [
          AuthType.email,
          AuthType.google,
          AuthType.twitter,
          AuthType.github,
          AuthType.discord,
        ],
        // Locks the chain selector to Base Sepolia and Ethereum Sepolia
        chains: [baseSepolia, sepolia],
        themeType: "dark",
        // You can prompt the user to set up extra security measure upon login or other interactions
        promptSettingConfig: {
          promptPaymentPasswordSettingWhenSign: PromptSettingType.first,
          promptMasterPasswordSettingWhenLogin: PromptSettingType.first,
        },
        wallet: {
          // Set to false to remove the embedded wallet modal
          visible: true,
          customStyle: {
            supportUIModeSwitch: true,
            supportLanguageSwitch: false,
          },
        },
        // optional, ERC4337
        erc4337: {
          name: "BICONOMY",
          version: "2.0.0",
        },
      }}
    >
      {children}
    </AuthCoreContextProvider>
  );
};
