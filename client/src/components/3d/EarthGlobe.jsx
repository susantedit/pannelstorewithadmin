import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";

export default function EarthGlobe({ 
  className = "", 
  width = 600, 
  height = 600,
  phi = 0,
  theta = 0,
  dark = 1,
  diffuse = 1.2,
  mapSamples = 16000,
  mapBrightness = 6,
  baseColor = [0.3, 0.3, 0.3],
  markerColor = [0.1, 0.8, 1],
  glowColor = [1, 0.1, 0.2],
  markers = [
    { location: [27.7172, 85.324], size: 0.05 }, // Kathmandu, Nepal (assuming user context)
    { location: [37.7595, -122.4367], size: 0.03 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [51.5074, -0.1278], size: 0.05 },
    { location: [35.6895, 139.6917], size: 0.05 },
  ]
}) {
  const canvasRef = useRef();

  useEffect(() => {
    let currentPhi = phi;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: height * 2,
      phi: 0,
      theta: 0,
      dark: dark,
      diffuse: diffuse,
      mapSamples: mapSamples,
      mapBrightness: mapBrightness,
      baseColor: baseColor,
      markerColor: markerColor,
      glowColor: glowColor,
      opacity: 1,
      markers: markers,
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = currentPhi;
        currentPhi += 0.005;
      },
    });

    return () => {
      globe.destroy();
    };
  }, [width, height, phi, theta, dark, diffuse, mapSamples, mapBrightness, baseColor, markerColor, glowColor, markers]);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        maxWidth: width,
        aspectRatio: "1/1",
        margin: "auto",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          contain: "layout paint size",
          opacity: 0,
          transition: "opacity 1s ease",
        }}
        onPointerDown={(e) => {
          // Add interaction if needed
        }}
        onLoad={(e) => {
          e.target.style.opacity = "1";
        }}
      />
    </div>
  );
}
