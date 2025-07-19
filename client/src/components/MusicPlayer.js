import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import musicFile from "../assets/background-music01.mp3"; // Ensure this file exists

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio(musicFile));

  useEffect(() => {
    audioRef.current.loop = true;

    // Pause audio when the component unmounts
    return () => {
      audioRef.current.pause();
    };
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying((prev) => !prev);
  };

  return (
    <motion.button
      className={`music-btn animated-btn ${isPlaying ? "neon-pulse" : ""}`}
      onClick={togglePlayPause}
      whileTap={{ scale: 0.92, boxShadow: "0 0 20px #f1c40f" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      aria-label={isPlaying ? "Pause music" : "Play music"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isPlaying ? "pause" : "play"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: "inline-block" }}
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

export default MusicPlayer;
