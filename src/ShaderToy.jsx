import React, { useEffect } from 'react';
import * as THREE from 'three';
import fragmentShader from './glsl/shader.frag'

// ShaderToy component takes a Three.js scene as a prop 
const ShaderToy = ({ scene }) => {
  useEffect(() => {
    // Return early if there's no scene
    if (!scene) return;

    const textureLoader = new THREE.TextureLoader();

    const mouse = new THREE.Vector2();

    // Set up a custom shader material with uniforms for time and resolution
    const customShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(600,600) },
        iChannel0: {value: textureLoader.load('bd6464771e47eed832c5eb2cd85cdc0bfc697786b903bfd30f890f9d4fc36657.jpg')},
        iMouse: {value: mouse},
      },
      // Vertex shader positions vertices in 3D space
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      // Fragment shader calculates the color of each pixel
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Create a mesh using a plane geometry and the custom shader material
    const planeGeometry = new THREE.PlaneGeometry(6, 6);
    const shaderMesh = new THREE.Mesh(planeGeometry, customShaderMaterial);
    shaderMesh.position.set(0, 0, -3);
    scene.add(shaderMesh);

    // Update the shader material's resolution uniform
    customShaderMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);

    document.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  });

    // Set up an animation loop that updates the time uniform
    const animate = () => {
      if (!scene) return;
      customShaderMaterial.uniforms.iTime.value = performance.now() / 1000;
      requestAnimationFrame(animate);
    };
    animate();

    // Clean up when the component is unmounted
    return () => {
      if (scene) {
        scene.remove(shaderMesh);
      }
    };
  }, [scene]);

  return null;
};

export default ShaderToy;
