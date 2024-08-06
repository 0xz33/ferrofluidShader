"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import FerrofluidShader from "../components/FerrofluidShader";

export default function Home() {
  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Canvas style={{ position: "absolute", top: 0, left: 0 }}>
        <FerrofluidShader />
      </Canvas>
    </main>
  );
}
