import React from "react";
import "./VideoBackground.css";
import myVideo from "./background.mp4"; // or use "/background.mp4" if in public

function VideoBackground() {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="video-background"
    >
      <source src={myVideo} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}

export default VideoBackground;
