"use client";

import { useEffect } from "react";

export function ReactDevTools() {
  useEffect(() => {
    let active = true;
    let disableScan: (() => void) | null = null;
    let disposeGrab: (() => void) | null = null;

    async function enableTools(): Promise<void> {
      const [scanModule, grabModule] = await Promise.all([
        import("react-scan"),
        import("react-grab/core"),
      ]);

      if (!active) return;

      scanModule.scan({ enabled: true });
      disableScan = () => scanModule.setOptions({ enabled: false });

      const grab = grabModule.init({ telemetry: false });
      disposeGrab = () => grab.dispose();
    }

    void enableTools();

    return () => {
      active = false;
      disableScan?.();
      disposeGrab?.();
    };
  }, []);

  return null;
}
