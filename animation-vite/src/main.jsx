import React, { useRef } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

const TextureMesh = () => {
  const mesh = useRef();

  useFrame(({ clock, mouse, gl }) => {
    if (mesh.current) {
      mesh.current.material.uniforms.u_mouse.value = [
        mouse.x / 2 + 0.5,
        mouse.y / 2 + 0.5,
      ];
      mesh.current.material.uniforms.u_time.value = clock.getElapsedTime();
      const { width, height } = gl.domElement.getBoundingClientRect();
      mesh.current.material.uniforms.u_resolution.value = [width, height];
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <shaderMaterial
        fragmentShader={`// Fragment shader
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec3 u_colors[4];
uniform vec4 u_background;
uniform float u_scale;
uniform int u_waves;
uniform float u_thickness;
uniform float u_stretch_x;
uniform float u_stretch_y;
uniform float u_blur;
uniform float u_speed;
uniform float u_coil;

vec4 wave(vec2 uv, float speed, float height, vec3 col) {
  float taper = abs(uv.x);
  uv.y += smoothstep(1., 0., taper) * sin(u_time * speed + uv.x * height) * .2;
  return vec4(
    smoothstep(u_blur * smoothstep(.1, .9, taper), 0., abs(uv.y)*(1.-u_blur) - .2*u_thickness) * col,
    1.0
  ) * smoothstep(1., .5, abs(uv.x));
}

vec4 render(vec2 uv) {
  vec4 color = vec4(0.);
  uv *= (1. - u_scale);
  for (int i = 1; i <= u_waves; i++) {
    vec3 c = u_colors[i % 4];
    float t = float(i) / float(u_waves);
    vec4 l = wave(
      uv * vec2(1.5 - 1.5 * u_stretch_x, 4. - 4. * u_stretch_y),
      1. + t * u_speed * 8.0,
      u_coil * t,
      c * vec3(.2 + t * .7, .2 + t * .4, 1.0 * t)
    );
    color += vec4(l.rgb, clamp(l.r + l.g + l.b, 0., 1.));
  }
  return color;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;
  vec4 color = render(uv);
  color = (color * color.a) + (u_background * (1. - color.a));
  gl_FragColor = color;
}
`}
        vertexShader={`
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`}
        uniforms={{
          u_colors: {
            value: [
              new THREE.Vector3(0.937, 0, 1),
              new THREE.Vector3(0.875, 1, 0),
              new THREE.Vector3(0, 1, 1),
              new THREE.Vector3(0.467, 0.22, 1),
            ],
          },
          u_background: {
            value: new THREE.Vector4(0.0078, 0.0039, 0.0588, 1),
          },
          u_scale: { value: 0 },
          u_waves: { value: 8 },
          u_thickness: { value: 0.04 },
          u_stretch_x: { value: 0 },
          u_stretch_y: { value: 0.677 },
          u_blur: { value: 0.04 },
          u_speed: { value: 0.196 },
          u_coil: { value: 6.084 },
          u_time: { value: 0 },
          u_mouse: { value: [0, 0] },
          u_resolution: { value: [100, 100] },
        }}
        glslVersion={THREE.GLSL1}
      />
    </mesh>
  );
};

const App = () => (
  <Canvas
    gl={{
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      alpha: true,
      antialias: true,
      precision: "highp",
      powerPreference: "high-performance",
    }}
    resize={{ debounce: 0, scroll: false, offsetSize: true }}
    dpr={1}
    camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 5] }}
    style={{ height: "100%", width: "100%" }}
  >
    <TextureMesh />
  </Canvas>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);