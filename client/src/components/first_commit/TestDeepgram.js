import React, { useState, useRef, useEffect } from "react";

const DeepgramSTT_TTS = () => {
    const [transcription, setTranscription] = useState(""); // Stores the transcribed text
    const [inputText, setInputText] = useState(""); // Stores the text for TTS
    const audioRef = useRef(null); // Reference for the audio player
    const mediaRecorderRef = useRef(null); // Media Recorder reference
    const wsRef = useRef(null); // WebSocket reference

    const API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY; // 🔥 Replace this with your actual Deepgram API key

    // 🎤 Start Speech-to-Text (STT)
    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
            mediaRecorderRef.current = mediaRecorder;

            wsRef.current = new WebSocket(`wss://api.deepgram.com/v1/listen?punctuate=true`, [
                "token",
                API_KEY,
            ]);

            wsRef.current.onopen = () => console.log("🎧 WebSocket Connected");

            wsRef.current.onmessage = (message) => {
                const data = JSON.parse(message.data);
                if (data.channel && data.channel.alternatives[0]) {
                    setTranscription(data.channel.alternatives[0].transcript);
                }
            };

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && wsRef.current.readyState === WebSocket.OPEN) {
                    console.log("🎤 Sending audio chunk to Deepgram...");
                    wsRef.current.send(event.data);
                }
            };

            mediaRecorder.start(1000);
        } catch (error) {
            console.error("Microphone access error:", error);
        }
    };

    // 🛑 Stop Speech-to-Text
    const stopListening = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
    };

    // 🔊 Convert Text-to-Speech (TTS)
    const playAudio = async () => {
        try {
            const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
                method: "POST",
                headers: {
                    Authorization: `Token ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: inputText }),
            });

            if (!response.ok) throw new Error("❌ Failed to fetch audio");

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current.src = audioUrl;
            audioRef.current.play();
        } catch (error) {
            console.error("TTS Error:", error);
        }
    };

    return (
        <div style={{ padding: "20px", background: "#222", color: "#fff", fontFamily: "Orbitron" }}>
            <h2>Deepgram STT & TTS Test</h2>

            {/* STT Section */}
            <button onClick={startListening} style={{ padding: "10px", background: "purple", color: "#fff", border: "none" }}>
                🎙 Start Listening (STT)
            </button>
            <button onClick={stopListening} style={{ padding: "10px", background: "red", color: "#fff", marginLeft: "10px", border: "none" }}>
                ⏹ Stop Listening
            </button>
            <p>Transcription: {transcription || "Speak something..."}</p>

            {/* TTS Section */}
            <input 
                type="text" 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                placeholder="Enter text for TTS" 
                style={{ padding: "5px", width: "100%", marginBottom: "10px" }} 
            />
            <button onClick={playAudio} style={{ padding: "10px", background: "goldenrod", color: "#222", border: "none" }}>
                🔊 Convert to Speech (TTS)
            </button>

            <audio ref={audioRef} controls hidden />
        </div>
    );
};

export default DeepgramSTT_TTS;
