// src/app/firebase.ts
import { initializeApp } from "firebase/app";
import { environment } from "../environments/environment";

// Initialize Firebase without analytics
const app = initializeApp(environment.firebaseConfig);

// Only export the app, not analytics
export { app };