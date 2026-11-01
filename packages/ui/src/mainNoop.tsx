import { createRoot } from "react-dom/client";
import App from "./AppNoop.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <App />
);

// Enable CSS animations after initial render (prevents FOUC)
document.body.classList.add('app-init');
