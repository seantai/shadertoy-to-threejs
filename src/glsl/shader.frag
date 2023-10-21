uniform vec2 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;



#define PI (acos(-1.))
#define TAU (2.*PI)

#define sat(x) clamp(x, 0., 1.)

mat2 rot2D(float a)
{
    return mat2(cos(a), -sin(a), sin(a), cos(a));
}

// Cubic smin function
// https://iquilezles.org/articles/smin
float smin( float a, float b, float k )
{
    float h = max(k - abs(a - b), 0.0 ) / k;
    return min(a, b) - h*h*h*k * (1.0 / 6.0);
}

float smax( float a, float b, float k )
{
    return -smin(-a, -b, k);
}

// Cosine Color Palette
// https://iquilezles.org/articles/palettes
vec3 palette( float t )
{
    return 0.52 + 0.48*cos( TAU * (vec3(.9, .8, .5) * t + vec3(0.1, .05, .1)) );
}


// Hash without Sine
// https://www.shadertoy.com/view/4djSRW
// MIT License...
/* Copyright (c) 2014 David Hoskins.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

float hash12(vec2 p)
{
    p = p * 1.1213;
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}


// Straight Flagstone Tiles (aka Asymmetric Tiles)
// https://www.shadertoy.com/view/7tKGRc

/**
 * Flagstone/Asymmetric tiling with tile IDs, sizes and UVs.
 * 
 * Like with my previous shader (https://www.shadertoy.com/view/flVGzm),
 * the tile IDs are computed first, and the UVs are derived from it,
 * by subtracting from the original position, and scaling by the tile size.
 * 
 * This has the advantage of not dealing with the mess that is
 * getting the UVs for each corner, and gives you already the tile ID.
 * It's great for rectangular tilings, as long as you know what the size of the tile is.
 * 
 * The distances from this does have discontinuities in the edges
 * 
 * Next time, I'd like to try doing the organic flagstone tiles with asymmetric sizes
 * Distance-to-edge voronoi is pretty close to it, but the sizes aren't so varied. :(
 * Maybe there's a way to do it in a similar vein like this one.
 * 
 * Many thanks to Shane (hello!) and fizzer for their methods
 * from which this shader is derived from:
 * 
 *   Variegated Tiling by fizzer
 *   https://www.shadertoy.com/view/3styzn
 *
 *   Asymmetric Blocks by Shane
 *   https://www.shadertoy.com/view/Ws3GRs
 *
 *   For a 3D raytraced version:
 *   Extruded Flagstone Tiling 3D by gelami
 *   https://www.shadertoy.com/view/cltGRl
**/

#define ANIMATED
#define GLOW

#define SCROLLING

//#define SHOW_CHECKER
//#define SHOW_GRID
//#define SHOW_ID
//#define SHOW_UV

const float SCALE = 4.;
const float SMOOTHNESS = 0.15;

float randSpan( vec2 p )
{
    #ifdef ANIMATED
    return (sin(iTime*1.6 + hash12(p)*TAU)*.5+.5)*.6+.2;
    #else
    return hash12(p)*.6+.2;
    #endif
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.*fragCoord - iResolution.xy) / iResolution.y;
    
    uv *= SCALE;
    
    #ifdef SCROLLING
    uv += vec2(.7, .5) * iTime;
    #endif

    vec2 fl = floor(uv);
    vec2 fr = fract(uv);
    
    bool ch = mod(fl.x + fl.y, 2.) > .5;
    
    float r1 = randSpan(fl);
    vec2 ax = ch ? fr.xy : fr.yx;
    
    float a1 = ax.x - r1;
    float si = sign(a1);
    vec2 o1 = ch ? vec2(si, 0) : vec2(0, si);
    
    float r2 = randSpan(fl + o1);
    float a2 = ax.y - r2;
    
    vec2 st = step(vec2(0), vec2(a1, a2));
    
    // Tile ID
    vec2 of = ch ? st.xy : st.yx;
    vec2 id = fl + of - 1.;
    
    bool ch2 = mod(id.x + id.y, 2.) > .5;
    
    // Get the random spans
    float r00 = randSpan(id + vec2(0, 0));
    float r10 = randSpan(id + vec2(1, 0));
    float r01 = randSpan(id + vec2(0, 1));
    float r11 = randSpan(id + vec2(1, 1));
    
    // Tile Size
    vec2 s0 = ch2 ? vec2(r00, r10) : vec2(r01, r00);
    vec2 s1 = ch2 ? vec2(r11, r01) : vec2(r10, r11);
    vec2 s = 1. - s0 + s1;
    
    // UV
    vec2 puv = (uv - id - s0) / s;
    
    // Border Distance
    vec2 b = (.5 - abs(puv - .5)) * s;
    
    float d = smin(b.x, b.y, SMOOTHNESS);
    float l = smoothstep(.02, .06, d);
    
    // **** Shading ****
    
    // Highlights
    vec2 hp = (1. - puv) * s;
    float h = smoothstep(.08, .0, max(smin(hp.x, hp.y, SMOOTHNESS), 0.));
    
    // Shadows
    vec2 sp = puv * s;
    float sh = smoothstep(.05, .12, max(smin(sp.x, sp.y, SMOOTHNESS), 0.));
    
    // Texture
    vec3 tex = pow(texture(iChannel0, puv).rgb, vec3(2.2));
    
    // Random Color
    vec3 col = palette(hash12(id));
    
    col *= tex;
    col *= (vec3(puv, 0) * .6 + .4);
    col *= sh * .8 + .2;
    col += h * vec3(.9, .7, .5);
    col *= l * 5.;
    
    // **** Defines ****
    #ifdef GLOW
    vec2 gv = (1.1 - fragCoord / iResolution.xy) * iResolution.x / iResolution.y;
    col += pow(.12 / length(gv), 1.5) * vec3(1., .8, .4) * (l * 0.3 + 0.7);
    #endif
    
    #ifdef SHOW_ID
    col = vec3(id, 0);
    #endif
    
    #ifdef SHOW_UV
    col = vec3(puv, 0);
    #endif
    
    #ifdef SHOW_GRID
    vec2 g = .5 - abs(fr - .5);
    float grid = smoothstep(.03, .02, min(g.x, g.y));
    col = mix(col, vec3(.2, .9, 1), grid);
    #endif
    
    #ifdef SHOW_CHECKER
    col = mix(col, (ch ? vec3(1, .2, .2) : vec3(.2, 1, .2)), .2);
    #endif
    
    // Tonemapping and Gamma Correction
    col = max(col, vec3(0));
    col = col / (1. + col);
    col = pow(col, vec3(1./2.2));
    fragColor = vec4(col, 1);
}
void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }