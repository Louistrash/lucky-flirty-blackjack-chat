import { auth } from "app/auth";
import { API_PATH } from "../constants";
import { Brain } from "./Brain";
import type { RequestParams } from "./http-client";

const isLocalhost = /localhost:\d{4}/i.test(window.location.origin);

const constructBaseUrl = (): string => {
  if (isLocalhost) {
    // Local development - proxy to backend on port 8000
    return `http://localhost:8000`;
  }

  // Production - adjust this URL to your deployed backend
  return `${window.location.origin}/api`;
};

const brain = new Brain(
  constructBaseUrl(),
  async (config: RequestParams) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
);

export { brain };
