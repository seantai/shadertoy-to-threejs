uniform vec2 iResolution;
uniform float iTime;

void mainImage(out vec4 outputColor, in vec2 inputCoordinates) {
  vec3 color;
  float lengthToOrigin, waveOffset = iTime;

  for (int i = 0; i < 3; i++) {
    vec2 uvCoordinates,
        normalizedCoordinates = inputCoordinates.xy / iResolution;
    uvCoordinates = normalizedCoordinates;

    normalizedCoordinates -= 0.5;
    normalizedCoordinates.x *= iResolution.x / iResolution.y;

    waveOffset += 0.8;
    lengthToOrigin = length(normalizedCoordinates);

    uvCoordinates += normalizedCoordinates / lengthToOrigin *
                     (sin(waveOffset) + 1.) *
                     (sin(lengthToOrigin * 9. - waveOffset * .21));
    color[i] = .01 / length(fract(uvCoordinates) - 0.5);
  }

  outputColor = vec4(color / lengthToOrigin, iTime);
}
void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }