import React, { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const FerrofluidMaterial = shaderMaterial(
  {
    time: 0,
    mouse: new THREE.Vector2(0, 0),
    resolution: new THREE.Vector2(0, 0),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform vec2 mouse;
    uniform vec2 resolution;
    varying vec2 vUv;

    #define OCTAVES 6

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.0;
      for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 st = gl_FragCoord.xy / resolution.xy;
      st.x *= resolution.x / resolution.y;

      vec2 mousePos = mouse / resolution;
      float dist = distance(st, mousePos);

      vec2 q = vec2(0.);
      q.x = fbm(st + 0.1 * time);
      q.y = fbm(st + vec2(1.0));

      vec2 r = vec2(0.);
      r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * time);
      r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time);

      float f = fbm(st + r);

      f = mix(f, f * 0.5, smoothstep(0.0, 0.3, dist));

      vec3 color = mix(
        vec3(0.101961, 0.619608, 0.666667),
        vec3(0.666667, 0.666667, 0.498039),
        clamp((f * f) * 4.0, 0.0, 1.0)
      );

      color = mix(
        color,
        vec3(0, 0, 0.164706),
        clamp(length(q), 0.0, 1.0)
      );

      color = mix(
        color,
        vec3(0.666667, 1, 1),
        clamp(length(r.x), 0.0, 1.0)
      );

      gl_FragColor = vec4((f * f * f + 0.6 * f * f + 0.5 * f) * color, 1.0);
    }
  `
);

extend({ FerrofluidMaterial });

function FerrofluidShader() {
  const mesh = useRef();
  const { size, viewport } = useThree();
  const [mousePosition, setMousePosition] = React.useState([0, 0]);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      mouse: { value: new THREE.Vector2(0, 0) },
      resolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    []
  );

  const handleResize = useCallback(() => {
    if (mesh.current && mesh.current.material) {
      mesh.current.material.uniforms.resolution.value.set(
        window.innerWidth,
        window.innerHeight
      );
    }
  }, []);

  const handleMouseMove = useCallback((event) => {
    setMousePosition([
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    ]);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    handleResize(); // Initial resize
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleResize, handleMouseMove]);

  useFrame((state) => {
    const { clock } = state;
    if (mesh.current && mesh.current.material) {
      mesh.current.material.uniforms.time.value = clock.getElapsedTime();
      mesh.current.material.uniforms.mouse.value.set(
        mousePosition[0],
        mousePosition[1]
      );
    }
  });

  return (
    <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <ferrofluidMaterial uniforms={uniforms} />
    </mesh>
  );
}

export default FerrofluidShader;
