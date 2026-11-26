import React, { useEffect, useRef } from "react";

interface FocusWaveformProps {
  progress: number; // 0 to 1
  isPlaying: boolean;
  analyser?: AnalyserNode; // Optional for future real audio integration
}

export function FocusWaveform({ progress, isPlaying, analyser }: FocusWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  // Physics parameters
  const POINT_COUNT = 28;
  const stiffness = 0.08;
  const damping = 0.82;

  // State for points
  const pointsRef = useRef(
    Array.from({ length: POINT_COUNT }, () => ({ value: 0, velocity: 0, target: 0 })),
  );

  // Idle animation phase
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dataArray: Uint8Array | null = null;
    if (analyser) {
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    const render = () => {
      // Resize canvas to match display size
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Only resize if necessary
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const points = pointsRef.current;

      // If playing audio and we have an analyser, use it
      if (isPlaying && analyser && dataArray) {
        analyser.getByteTimeDomainData(dataArray as any);
        const step = Math.floor(dataArray.length / POINT_COUNT);
        for (let i = 0; i < POINT_COUNT; i++) {
          const normalized = ((dataArray[i * step] ?? 128) - 128) / 128;
          const point = points[i];
          if (point) point.target = normalized * (height * 0.4);
        }
      } else {
        // Idle state: very subtle sine wave breathing
        phaseRef.current += 0.02;
        for (let i = 0; i < POINT_COUNT; i++) {
          const v = Math.sin(phaseRef.current + i * 0.4) * 0.05;
          const point = points[i];
          if (point) point.target = v * (height * 0.3);
        }
      }

      // Update Physics
      // Physics always runs so it settles smoothly when paused
      for (let i = 0; i < POINT_COUNT; i++) {
        const p = points[i];
        if (p) {
          p.velocity += (p.target - p.value) * stiffness;
          p.velocity *= damping;
          p.value += p.velocity;
        }
      }

      // Draw Waveform
      ctx.beginPath();

      const segmentWidth = width / (POINT_COUNT - 1);

      // Generate render points
      const renderPoints = points.map((p, i) => ({
        x: i * segmentWidth,
        y: centerY + (p?.value || 0),
      }));

      // Draw active/inactive parts by using a gradient
      const activeX = width * progress;

      // Create gradient for progress
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(168, 85, 247, 1)"); // Purple 500

      if (progress > 0 && progress < 1) {
        gradient.addColorStop(progress, "rgba(168, 85, 247, 0.8)");
        gradient.addColorStop(progress + 0.01, "rgba(168, 85, 247, 0.2)");
      }

      gradient.addColorStop(1, "rgba(168, 85, 247, 0.2)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Glow effect
      ctx.shadowColor = "rgba(168, 85, 247, 0.5)";
      ctx.shadowBlur = 8;

      // Spline interpolation
      if (renderPoints[0]) {
        ctx.moveTo(renderPoints[0].x, renderPoints[0].y);
      }
      for (let i = 0; i < renderPoints.length - 1; i++) {
        const p1 = renderPoints[i];
        const p2 = renderPoints[i + 1];
        if (p1 && p2) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
      }
      // Last point
      const lastP = renderPoints[renderPoints.length - 1];
      if (lastP) {
        ctx.lineTo(lastP.x, lastP.y);
      }

      ctx.stroke();

      // Draw Progress Dot
      // Find exact Y position on the curve for the progress X
      const dotIndex = progress * (POINT_COUNT - 1);
      const idx1 = Math.floor(dotIndex);
      const idx2 = Math.ceil(dotIndex);

      const dotX = activeX;
      let dotY = centerY;

      if (idx1 >= 0 && idx2 < POINT_COUNT) {
        const t = dotIndex - idx1;
        const p1 = renderPoints[idx1];
        const p2 = renderPoints[idx2];
        if (p1 && p2) {
          const y1 = p1.y;
          const y2 = p2.y;
          // Simple linear interpolation for the dot Y is usually fine since segments are small
          dotY = y1 + (y2 - y1) * t;
        }
      }

      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
      ctx.shadowBlur = 12;
      ctx.fill();

      // Loop
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [progress, isPlaying, analyser]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />;
}
