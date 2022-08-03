import { slideThemes } from "../config/slide-themes";

export interface SlideShowSettings {
  controls: boolean;
  progress: boolean;
  history: boolean;
  center: boolean;
  loop: boolean;
  slideNumber: boolean;
  controlsLayout: "edges" | "bottom-right";
  controlsBackArrows: "faded" | "hidden" | "visible";
  slidesLogoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export interface StyleSettings {
  theme: keyof typeof slideThemes;
}
