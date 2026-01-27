import * as THREE from 'three'
import type { FontAtlas } from './atlas'

const vertexShader = /* glsl */ `
  attribute float aCharIndex;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vCharIndex;

  void main() {
    vUv = uv;
    vColor = instanceColor;
    vCharIndex = aCharIndex;
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uCharsPerRow;
  uniform float uTotalChars;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vCharIndex;

  void main() {
    float idx = floor(vCharIndex + 0.5);
    float col = mod(idx, uCharsPerRow);
    float row = floor(idx / uCharsPerRow);

    // Atlas rows (texture rows may exceed charsPerRow rows)
    float atlasRows = ceil(uTotalChars / uCharsPerRow);

    vec2 atlasUv = vec2(
      (col + vUv.x) / uCharsPerRow,
      1.0 - (row + 1.0 - vUv.y) / atlasRows
    );

    vec4 texColor = texture2D(uAtlas, atlasUv);
    float alpha = texColor.r; // white-on-black atlas → r channel is glyph mask
    if (alpha < 0.1) discard;

    gl_FragColor = vec4(vColor * alpha, 1.0);
  }
`

export function createASCIIMaterial(atlas: FontAtlas): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uAtlas: { value: atlas.texture },
      uCharsPerRow: { value: atlas.charsPerRow },
      uTotalChars: { value: atlas.totalChars },
    },
    transparent: true,
    depthWrite: false,
  })
}
