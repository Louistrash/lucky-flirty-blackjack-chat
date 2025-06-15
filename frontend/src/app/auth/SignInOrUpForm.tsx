import React from "react";
import { CustomFirebaseAuth } from "./CustomFirebaseAuth";

interface Props {
  signInOptions: {
    google?: boolean;
    facebook?: boolean;
    github?: boolean;
    twitter?: boolean;
    emailAndPassword?: boolean;
    magicLink?: boolean;
  };
}

export const SignInOrUpForm = (props: Props) => {
  // Use our CustomFirebaseAuth component instead of react-firebaseui
  // This eliminates the UNSAFE_componentWillMount warnings
  return <CustomFirebaseAuth signInOptions={props.signInOptions} />;
};
