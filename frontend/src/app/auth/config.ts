import { z } from "zod";

const configSchema = z.object({
  signInOptions: z.object({
    google: z.coerce.boolean({
      description: "Enable Google sign-in",
    }),
    github: z.coerce.boolean({ description: "Enable GitHub sign-in" }),
    facebook: z.coerce.boolean({ description: "Enable Facebook sign-in" }),
    twitter: z.coerce.boolean({ description: "Enable Twitter sign-in" }),
    emailAndPassword: z.coerce.boolean({
      description: "Enable email and password sign-in",
    }),
    magicLink: z.coerce.boolean({
      description: "Enable magic link sign-in",
    }),
  }),
  siteName: z.string({
    description: "The name of the site",
  }),
  signInSuccessUrl: z.preprocess(
    (it) => it || "/",
    z.string({
      description: "The URL to redirect to after a successful sign-in",
    }),
  ),
  tosLink: z
    .string({
      description: "Link to the terms of service",
    })
    .optional(),
  privacyPolicyLink: z
    .string({
      description: "Link to the privacy policy",
    })
    .optional(),
  firebaseConfig: z.object(
    {
      apiKey: z.string().default(""),
      authDomain: z.string().default(""),
      projectId: z.string().default(""),
      storageBucket: z.string().default(""),
      messagingSenderId: z.string().default(""),
      appId: z.string().default(""),
      measurementId: z.string().optional(),
    },
    {
      description:
        "Firebase config as as describe in https://firebase.google.com/docs/web/learn-more#config-object",
    },
  ),
});

type FirebaseExtensionConfig = z.infer<typeof configSchema>;

// Directe configuratie zonder Databutton complexity
export const config: FirebaseExtensionConfig = {
  firebaseConfig: {
    apiKey: "AIzaSyBrENmWwomte9B3p3emXZcNN6S1KbMw-yk",
    authDomain: "flirty-chat-a045e.firebaseapp.com",
    projectId: "flirty-chat-a045e",
    storageBucket: "flirty-chat-a045e.firebasestorage.app",
    messagingSenderId: "177376218865",
    appId: "1:177376218865:web:2fc736cfc207b307cce350",
    measurementId: "G-M7K4JFS3EW"
  },
  signInOptions: {
    google: true,
    github: false,
    facebook: false,
    twitter: false,
    emailAndPassword: true,
    magicLink: false
  },
  siteName: "Lucky Flirty Chat",
  signInSuccessUrl: "/"
};
