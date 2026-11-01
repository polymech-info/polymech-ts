import { createRoot } from "react-dom/client";
import FileBrowserApp from "./FileBrowserApp";
import "@/index.css";
import { ThemeProvider } from "@/components/ThemeProvider";

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark">
        <FileBrowserApp />
    </ThemeProvider>
);
