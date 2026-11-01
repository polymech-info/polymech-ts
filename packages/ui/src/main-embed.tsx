import { createRoot } from "react-dom/client";
import EmbedApp from "./EmbedApp";
import "./index.css";
import { ThemeProvider } from "@/components/ThemeProvider";

// Check for initial state injected by server
const initialState = (window as any).__INITIAL_STATE__ || {};

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="light">
        <EmbedApp initialState={initialState} />
    </ThemeProvider>
);
