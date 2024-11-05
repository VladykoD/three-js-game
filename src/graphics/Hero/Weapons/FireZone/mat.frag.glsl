varying vec2 vUv;
uniform float time;

// Настройки качества
#define MarchSteps 4

// Настройки сцены
#define ExpPosition vec3(0.0)
#define Radius 4.0  // Увеличенный радиус в 2 раза
#define Background vec4(0.0, 0.0, 0.0, 0.0) // Прозрачный фон

// Настройки шума
#define NoiseSteps 1
#define NoiseAmplitude 0.06
#define NoiseFrequency 4.0
#define Animation vec3(0.0, -3.0, 0.5)

// Цветовой градиент
#define Color1 vec3(1.0, 1.0, 1.0)
#define Color2 vec3(1.0, 0.8, 0.2)
#define Color3 vec3(1.0, 0.03, 0.0)
#define Color4 vec3(0.05, 0.02, 0.0)

#define saturate(oo) clamp(oo, 0.0, 1.0)

// Функции для шума Перлина
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

// Основная функция шума
float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;

    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));

    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;

    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Функция турбулентности для создания более естественного пламени
float Turbulence(vec3 position, float minFreq, float maxFreq, float qWidth) {
    float value = 0.0;
    float cutoff = clamp(0.5/qWidth, 0.0, maxFreq);
    float fade;
    float fOut = minFreq;

    for(int i=NoiseSteps ; i>=0 ; i--) {
        if (fOut >= 0.5 * cutoff) break;
        fOut *= 2.0;
        value += abs(snoise(position * fOut))/fOut;
    }
    fade = clamp(2.0 * (cutoff-fOut)/cutoff, 0.0, 1.0);
    return 1.0 - value - fade * abs(snoise(position * fOut)) / fOut;
}

// Расчет расстояния до сферы
float SphereDist(vec3 position) {
    return length(position - ExpPosition) - Radius;
}

// Функция затенения для создания градиента цветов
vec3 Shade(float distance) {
    float c1 = saturate(distance*5.0 + 0.5);
    float c2 = saturate(distance*5.0);
    float c3 = saturate(distance*3.4 - 0.5);

    vec3 a = mix(Color1, Color2, c1);
    vec3 b = mix(a, Color3, c2);
    return mix(b, Color4, c3);
}

// Рендеринг сцены с шумом
float RenderScene(vec3 position, out float distance) {
    float noise = Turbulence(position * NoiseFrequency + Animation*time*0.4, 0.1, 1.5, 0.03) * NoiseAmplitude;
    noise = saturate(abs(noise));
    distance = SphereDist(position) - noise;
    return noise;
}

// Функция марширования лучей
vec4 March(vec3 rayOrigin, vec3 rayStep) {
    vec3 position = rayOrigin;
    float distance;
    float displacement;

    for(int step = MarchSteps; step >= 0; --step) {
        displacement = RenderScene(position, distance);
        if(distance < 0.05) break;
        position += rayStep * distance;
    }
    vec3 color = mix(Shade(displacement), Background.rgb, float(distance >= 0.5));
    float alpha = distance >= 0.5 ? 0.0 : 1.0;
    return vec4(color, alpha);
}

// Дополнительная функция шума для эффекта горения
float snoise(vec3 uv, float res) {
    const vec3 s = vec3(1e0, 1e2, 1e3);
    uv *= res;
    vec3 uv0 = floor(mod(uv, res))*s;
    vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;
    vec3 f = fract(uv);
    f = f*f*(3.0-2.0*f);
    vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
    uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);
    vec4 r = fract(sin(v*1e-1)*1e3);
    float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
    r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);
    float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
    return mix(r0, r1, f.z)*2.-1.;
}

// Функция создания эффекта горения
vec3 burn(vec2 p) {
    float color1 = 4.0 - (3.0 * length(2.5 * p));
    vec3 coord = vec3(atan(p.x, p.y)/6.2832+0.5, length(p)*0.4, 0.5);

    for(int i = 1; i <= 3; i++) {
        float power = pow(2.0, float(i));
        color1 += 0.5*(1.5 / power) * snoise(coord + vec3(0.0,-time*0.05, -time*0.01), power*16.0);
    }
    color1 *= 0.6;
    return vec3(color1, pow(max(color1,0.0),2.0)*0.4, pow(max(color1,0.0),3.0)*0.15);
}

// Проверка пересечения луча со сферой
bool IntersectSphere(vec3 ro, vec3 rd, vec3 pos, float radius, out vec3 intersectPoint) {
    vec3 relDistance = (ro - pos);
    float b = dot(relDistance, rd);
    float c = dot(relDistance, relDistance) - radius*radius;
    float d = b*b - c;
    intersectPoint = ro + rd*(-b - sqrt(d));
    return d >= 0.0;
}

// Создание огненного шара
vec4 fireball(vec2 p) {
    float zoom = 10.0;

    vec3 ro = zoom * normalize(vec3(cos(0.0), cos(0.0), sin(0.0)));
    vec3 ww = normalize(vec3(0.0, 0.0, 0.0) - ro);
    vec3 uu = normalize(cross(vec3(0.0, 1.0, 0.0), ww));
    vec3 vv = normalize(cross(ww, uu));
    vec3 rd = normalize(p.x*uu + p.y*vv + 1.5*ww);

    vec4 col = Background;
    vec3 origin;

    if(IntersectSphere(ro, rd, ExpPosition, Radius + NoiseAmplitude*6.0, origin)) {
        col = March(origin, rd);
    }
    return col;
}

void main() {
    // Преобразование координат UV
    vec2 p = vUv * 2.0 - 1.0;
    p.x *= 1.0;

    // Получение цветов от обоих эффектов
    vec4 color1 = fireball(p);
    vec3 color2 = burn(p);

    // Смешивание цветов
    vec3 finalColor = mix(color1.rgb, color2, 0.7);

    // Финальный цвет с прозрачностью
    gl_FragColor = vec4(finalColor, 1);
}
