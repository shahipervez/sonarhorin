import { forwardRef } from "react";

/**
 * Clean cloudless origin zone for CV rain.
 * Cloud graphic removed per user request: "just cloud ta thakbe na".
 * Retains measuring anchor so JobRain accurately spawns falling CVs from upper sky.
 */
const StormCloud = forwardRef(function StormCloud(_, ref) {
  return (
    <div
      className="storm storm-cloudless"
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "clamp(60px, 8vh, 90px)",
        width: "min(980px, 96vw)",
        height: "80px",
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
});

export default StormCloud;
