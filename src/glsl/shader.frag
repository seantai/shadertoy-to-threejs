uniform vec2 iResolution;
uniform float iTime;

/**
    License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
    
    Year of Truchets #057
    10/20/2023  @byt3_m3chanic
    Truchet Core \M/->.<-\M/ 2023 
    
    see all https://www.shadertoy.com/user/byt3_m3chanic/sort=newest
*/

#define R   iResolution
#define M   iMouse
#define T   iTime
#define PI  3.14159265359
#define PI2 6.28318530718

#define MAX_DIST    100.
#define MIN_DIST    .0001

float hash21(vec2 p){return fract(sin(dot(p,vec2(23.43,84.21)))*4832.323); }
mat2 rot(float a){ return mat2(cos(a),sin(a),-sin(a),cos(a)); }

float noise (in vec2 uv) {
    vec2 i = floor(uv),f = fract(uv);
    float a = hash21(i),b = hash21(i+vec2(1,0)),c = hash21(i+vec2(0,1)),d = hash21(i+vec2(1,1));
    vec2 u = f*f*(3.-2.*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
}

float box(vec3 p, vec3 s) {p=abs(p)-s;return length(max(p,0.))+min(max(p.x,max(p.y,p.z)),0.);}

vec3 hit=vec3(0),hitPoint,gid,sid,speed=vec3(0);
float wtime;

const float size = 1.3;
const float hlf = size/2.;
const float dbl = size*2.;
          
vec2 map(in vec3 p) {
    vec2 res = vec2(1e5,0.);
    vec3 ps = p, q;
    
    p += speed;

    float id,nz=0.;
    for(int i = 0; i<2; i++) {

        float cnt = i<1 ? size : dbl;
        q = vec3(p.x-cnt,p.yz);
        id = floor(q.x/dbl) + .5;
        q.x -= (id)*dbl;
        float qf = (id)*dbl + cnt;

        vec2 nvec = i==1 ? vec2((qf*2.35)+wtime,q.z*.145): vec2(q.z*.185,(qf*5.175)+wtime);
        nz = noise(nvec);
        
        float dz = nz*1.25;
        float tz = dz+dz*sin(q.z*.55);
        tz += dz+dz*cos(q.x*.35);
        q.y += tz;

        float d = box(q,vec3(.52,.52,50))-.05;

        if(d<res.x){
            res = vec2(d,1.);
            hitPoint = q;
            gid = vec3(qf,nz,float(i));
        }
    }
    return res;
}

vec3 normal(vec3 p, float t) {
    float e = MIN_DIST*t;
    vec2 h =vec2(1,-1)*.5773;
    vec3 n = h.xyy * map(p+h.xyy*e).x+
             h.yyx * map(p+h.yyx*e).x+
             h.yxy * map(p+h.yxy*e).x+
             h.xxx * map(p+h.xxx*e).x;
    return normalize(n);
}

vec2 marcher(vec3 ro, vec3 rd){
	float d = 0.,m = 0.;
    for(int i=0;i<90;i++){
    	vec2 ray = map(ro + rd * d);
        if(ray.x<MIN_DIST*d||d>MAX_DIST) break;
        d += i<42?ray.x*.4:ray.x*.85;
        m  = ray.y;
    }
	return vec2(d,m);
}

vec3 hue(float t){ 
    t+=50.;
    return .65+.45*cos(13.+PI2*t*(vec3(.25,.11,.99)*vec3(.95,.97,.98))); 
}

vec3 render(inout vec3 ro, inout vec3 rd, inout vec3 ref, inout float d, vec2 uv) {

    vec3 C = vec3(0);
    vec2 ray = marcher(ro,rd);
    float m = ray.y;
    d = ray.x;

    if(d<MAX_DIST)
    {
        sid = gid;
        hit = hitPoint;
        
        vec3 p = ro + rd * d,
             n = normal(p,d);
             
        vec3 lpos =vec3(-10.,5,-12.),
             l = normalize(lpos-p),
             h = vec3(0), 
             h2 = vec3(0);
        
        float shdw = 1.,
              diff = clamp(dot(n,l),0.,1.);
              
        for( float t=.1; t < 10.; ) {
            float h = map(p + l*t).x;
            if( h<MIN_DIST ) { shdw = 0.; break; }
            shdw = min(shdw, 10.*h/t);
            t += h;
            if( shdw<MIN_DIST || t>10. ) break;
        }
        diff = mix(diff,diff*shdw,.75);

        float bnd = hash21(sid.xx);
        float snd = fract(bnd*321.7) *3.-1.5;

        vec3 aN = abs(n);
        ivec3 idF = ivec3(n.x<-.25? 0 : 5, n.y<-.25? 1 : 4, n.z<-.25? 2 : 3);
        int face = aN.x>.5? idF.x : aN.y>.5? idF.y : idF.z;
        
        vec2 hpp;
        if( face == 0 ){  
            hpp = hit.zy; 
            hpp.x+=T*snd;
        } else {
            hpp = hit.xz; 
            hpp.y+=T*snd;
        }
        vec2 dv = fract(hpp*2.)-.5,
             id = floor(hpp*2.);

        float ch = mod(id.x+id.y,2.)*2.-1.;
        float px = 12./R.x;

        float rnd = hash21(id+sid.xx);
        
        if(rnd<.45) dv.x = -dv.x;

        vec2 gx = length(dv-.5)<length(dv+.5) ? vec2(dv-.5) : vec2(dv+.5);
        float cx = length(gx)-.5;
        
        if(rnd>.65&&bnd<.75) cx = min(length(dv.x)-.005,length(dv.y)-.005);
  
        if (bnd<.25) cx = abs(cx)-.25;
        if (bnd>.75) {
            cx = (ch>.5 ^^ rnd<.45) ? smoothstep(px,-px,cx):smoothstep(-px,px,cx);
        } else {
            cx = smoothstep(px,-px, bnd>.7 ? abs(cx)-.2 : abs(cx)-.1 );
        }
    
        h2 = vec3(.1);
        h  = hue((T*.1)+(floor(sid.z+sid.y)-(p.z*.085)-(p.x*.1)));
        
        h = mix(h,h2,cx);
        ref = mix(vec3(0),h,cx);
 
        C = diff * h;
        
        ro = p+n*.01;
        rd = reflect(rd,n);
    } 
    
    return C;
}

void mainImage( out vec4 O, in vec2 F )
{   

    wtime=T*.4;
    speed = vec3(T*.45,0,0);
    
    float zoom = 10.;

    vec2 uv = (2.*F.xy-R.xy)/max(R.x,R.y);
    vec3 ro = vec3(uv*zoom,-(zoom+7.));
    vec3 rd = vec3(0.,0.,1.);

    //camera
    mat2 rx = rot(-.5), ry = rot(.5);
    
    ro.yz *= rx, ro.xz *= ry;
    rd.yz *= rx, rd.xz *= ry;

    // reflection loop (@BigWings)
    vec3 C = vec3(0), ref=vec3(0), fil=vec3(1);
    vec4 FC = vec4(0);
    
    float d =0., a = 0., bnc = 2.;
    for(float i=0.; i<bnc; i++) {
        vec3 pass = render(ro, rd, ref, d, uv);
        C += pass.rgb*fil;
        fil*=ref;
         if(i==0.) FC = vec4(vec3(.025),exp(-.000005*d*d*d*d));
    }
    
    C = mix(C,FC.rgb,1.-FC.w);
    C=pow(C, vec3(.4545));
    O = vec4(C,1.0);
}

void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }