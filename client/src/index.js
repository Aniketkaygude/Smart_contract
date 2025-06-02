import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

// ✅ React 18 uses createRoot
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);

// Optional: for PWA
serviceWorker.unregister();
