import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

type TauriDragDropEvent = {
  paths: string[];
  position: {
    x: number;
    y: number;
  };
};

const useDropZone = ({ onDrop }: { onDrop: (paths: string[]) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragIn, setDragIn] = useState(false);
  useEffect(() => {
    const unlisten = listen<TauriDragDropEvent>("tauri://drag-drop", (e) => {
      const { x, y } = e.payload.position;
      const element = document.elementFromPoint(x, y);
      if (ref.current && element && ref.current.contains(element)) {
        onDrop(e.payload.paths);
        setDragIn(false);
      }
    });
    return () => {
      unlisten.then((unlisten) => {
        unlisten();
      });
    };
  }, [onDrop]);
  useEffect(() => {
    const unlisten = listen<TauriDragDropEvent>("tauri://drag-over", (e) => {
      const { x, y } = e.payload.position;
      const element = document.elementFromPoint(x, y);
      if (ref.current && element && ref.current.contains(element)) {
        setDragIn(true);
      } else {
        setDragIn(false);
      }
    });
    return () => {
      unlisten.then((unlisten) => {
        unlisten();
      });
    };
  }, []);
  return { ref, dragIn };
};

export { useDropZone };
