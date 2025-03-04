import {
  getAllWindows,
  getCurrentWindow,
  PhysicalPosition,
} from "@tauri-apps/api/window";
import { useEffect } from "react";

const Downloads = () => {
  const downloadsWindow = getCurrentWindow();

  useEffect(() => {
    const updateSize = async () => {
      const windows = await getAllWindows();
      const appBarWindow = windows.find((w) => w.label == "app_bar");

      let y = (await appBarWindow?.innerPosition())?.y || 0;
      let width = 400.0;
      let x = (await appBarWindow?.innerSize())?.width || 1000 - width;

      console.log("left ", x);
      console.log("top ", y);

      downloadsWindow.setPosition(new PhysicalPosition(x, y));
    };

    updateSize();
  }, []);

  return <div>Downloads</div>;
};

export default Downloads;
