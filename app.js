const velarisConfig = {
    bg: "#050505",
    colors: [
        "#1F1F1F",
        "#525252",
        "#9A9A9A",
        "#F5F5F5"
    ],
    speed: 0.85,
    grain: 0.55
};
// ============================================================
// SHADERS
// ============================================================
const vertexShaderGLSL = `
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const fragmentShaderGLSL = `
precision highp float;

varying vec2 vUv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_grain;

uniform vec3 u_colors[4];
uniform vec3 u_bg;

vec3 permute(vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {

    const vec4 C = vec4(
        0.211324865405187,
        0.366025403784439,
       -0.577350269189626,
        0.024390243902439
    );

    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1;

    if (x0.x > x0.y)
        i1 = vec2(1.0, 0.0);
    else
        i1 = vec2(0.0, 1.0);

    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod(i, 289.0);

    vec3 p =
        permute(
            permute(
                i.y + vec3(0.0, i1.y, 1.0)
            )
            + i.x + vec3(0.0, i1.x, 1.0)
        );

    vec3 m =
        max(
            0.5 - vec3(
                dot(x0, x0),
                dot(x12.xy, x12.xy),
                dot(x12.zw, x12.zw)
            ),
            0.0
        );

    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;

    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *=
        1.79284291400159 -
        0.85373472095314 *
        (a0 * a0 + h * h);

    vec3 g;

    g.x =
        a0.x * x0.x +
        h.x * x0.y;

    g.yz =
        a0.yz * x12.xz +
        h.yz * x12.yw;

    return 130.0 * dot(m, g);
}

void main() {

    vec2 uv = vUv;

    float ratio =
        u_resolution.x /
        u_resolution.y;

    vec2 p = uv - 0.5;

    p.x *= ratio;

    float t = u_time * 0.1;

    // Respiración orgánica
    float pulse =
        1.0 +
        sin(u_time * 0.15) * 0.40;

    // Distorsión líquida
    float warp =
        snoise(
            p * 0.8 +
            vec2(
                u_time * 0.05,
               -u_time * 0.04
            )
        );

    p += vec2(
        warp * 0.15,
        warp * 0.12
    );

    float n1 =
        snoise(
            p * 0.4 * pulse +
            vec2(
                t * 0.2,
               -t * 0.3
            )
        );

    float n2 =
        snoise(
            p * 0.55 +
            vec2(
               -t * 0.15,
                t * 0.25
            ) +
            n1 * 0.25
        );

    float n3 =
        snoise(
            p * 0.75 +
            vec2(
                t * 0.10,
               -t * 0.20
            ) +
            n2 * 0.20
        );

    vec3 col = u_bg;

    // Manchas orgánicas
    float blob =
        snoise(
            p * 2.5 +
            vec2(
                sin(u_time * 0.10),
                cos(u_time * 0.13)
            )
        );

    col = mix(
        col,
        u_colors[3],
        smoothstep(
            0.3,
            0.8,
            blob
        ) * 0.25
    );

    float dist =
        length(p) * 1.5;

    float vignette =
        1.0 -
        smoothstep(
            0.3,
            1.2,
            dist
        );

    col = mix(
        col,
        u_colors[0],
        smoothstep(
            -0.2,
            0.5,
            n1
        ) * 0.85
    );

    col = mix(
        col,
        u_colors[1],
        smoothstep(
            -0.1,
            0.6,
            n2
        ) * 0.70
    );

    col = mix(
        col,
        u_colors[2],
        smoothstep(
            -0.3,
            0.4,
            n3
        ) * 0.60
    );

    col = mix(
        col,
        u_colors[3],
        smoothstep(
            0.0,
            0.7,
            n1 * n2
        ) * 0.30
    );

    float glow =
        smoothstep(
            0.8,
            0.0,
            dist
        ) * 0.25;

    col += u_colors[1] * glow;

    // Variación cromática extraña
    float weird =
        sin(
            u_time * 0.2 +
            p.x * 3.0
        ) * 0.5 + 0.5;

    col =
        mix(
            col,
            col.bgr,
            weird * 0.15
        );

    // Sueño psicodélico
    float dream =
        snoise(
            p * 5.0 +
            vec2(
                u_time * 0.03,
               -u_time * 0.04
            )
        );

    col += vec3(
        dream * 0.08,
        dream * 0.03,
        dream * 0.06
    );

    col =
        mix(
            col * 0.2,
            col,
            vignette
        );

    float grain =
        fract(
            sin(
                dot(
                    uv,
                    vec2(
                        12.9898,
                        78.233
                    )
                )
            ) *
            43758.5453 +
            u_time
        );

    // Saturación Hylics
    col = pow(col, vec3(0.75));
    col *= 0.95;

    // Grano VHS
    col +=
        (grain - 0.5) *
        u_grain *
        0.25;

    gl_FragColor = vec4(col, 1.0);
    
}
`;
// ============================================================
// WEBGL
// ============================================================
let gl, program, locs, canvas;

function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255,
    ];
}

function createShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Error compilando shader:', gl.getShaderInfoLog(s));
    }
    return s;
}

function initVelaris() {
    canvas = document.getElementById('velaris-canvas');
    gl = canvas.getContext('webgl');
    if (!gl) return;

    program = gl.createProgram();
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderGLSL));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderGLSL));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    locs = {
        res: gl.getUniformLocation(program, "u_resolution"),
        time: gl.getUniformLocation(program, "u_time"),
        grain: gl.getUniformLocation(program, "u_grain"),
        colors: gl.getUniformLocation(program, "u_colors"),
        bg: gl.getUniformLocation(program, "u_bg"),
    };

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(render);
}

function resize() {
    if (!canvas || !gl) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function render(t) {
    if (!gl || !program) return;

    gl.uniform2f(locs.res, canvas.width, canvas.height);
    gl.uniform1f(locs.time, t * 0.001 * velarisConfig.speed);
    gl.uniform1f(locs.grain, velarisConfig.grain);
    gl.uniform3f(locs.bg, ...hexToRgb(velarisConfig.bg));
    const flat = new Float32Array(velarisConfig.colors.slice(0, 4).flatMap(hexToRgb));
    gl.uniform3fv(locs.colors, flat);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}

initVelaris();

// ============================================================
// DATOS DE LAS APPS
// ============================================================
const apps = [
    {
        name: "Instagram",
        icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#FD5949"/>
                    <stop offset="50%" stop-color="#D6249F"/>
                    <stop offset="100%" stop-color="#285AEB"/>
                </linearGradient>
            </defs>
            <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>`,
        slides: [
            { title: "Reels", desc: "Comparte videos cortos y creativos", icon: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>` },
            { title: "Stories", desc: "Contenido efímero de 24 horas", icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="2" stroke-dasharray="4 4"/><circle cx="12" cy="12" r="4"/></svg>` },
            { title: "Direct", desc: "Mensajes privados seguros", icon: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>` }
        ]
    },
    {
        name: "Spotify",
        icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>`,
        slides: [
            { title: "Playlists", desc: "Crea listas de reproducción", icon: `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>` },
            { title: "Podcasts", desc: "Miles de shows disponibles", icon: `<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>` },
            { title: "Descubrir", desc: "Recomendaciones personalizadas", icon: `<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>` }
        ]
    },
    {
        name: "YouTube",
        icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>`,
        slides: [
            { title: "Suscripciones", desc: "Tus canales favoritos", icon: `<svg viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>` },
            { title: "Shorts", desc: "Videos verticales rápidos", icon: `<svg viewBox="0 0 24 24"><path d="M17.77 10.32l-1.2-.6.04-.05c.29-.13.49-.39.54-.7.08-.46-.23-.9-.68-1L10 6.13V4h4c.55 0 1-.45 1-1s-.45-1-1-1H9c-.55 0-1 .45-1 1v2H5c-.55 0-1 .45-1 1s.45 1 1 1h6.82l-2.76 5H8c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-1.71l.47-.94c.2-.4.05-.88-.34-1.08z"/></svg>` },
            { title: "Directos", desc: "Transmisiones en vivo", icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" opacity="0.5"/></svg>` }
        ]
    },
    {
        name: "TikTok",
        icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>`,
        slides: [
            { title: "Para ti", desc: "Feed personalizado", icon: `<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>` },
            { title: "Siguiendo", desc: "Creadores que sigues", icon: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>` },
            { title: "LIVE", desc: "Regalos y batallas", icon: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>` }
        ]
    }
];

// ============================================================
// GENERAR EL GRID
// ============================================================
const grid = document.getElementById('iconGrid');

apps.forEach((app) => {
    const card = document.createElement('div');
    card.className = 'icon-card';
    card.tabIndex = 0;
    card.setAttribute('aria-label', `App: ${app.name}`);

    const iconLayer = document.createElement('div');
    iconLayer.className = 'icon-layer';
    iconLayer.innerHTML = `
        <div class="icon-wrapper">${app.icon}</div>
        <div class="icon-label">${app.name}</div>
    `;

    const sliderLayer = document.createElement('div');
    sliderLayer.className = 'slider-layer';

    const track = document.createElement('div');
    track.className = 'slider-track';

    app.slides.forEach((slide) => {
        const slideEl = document.createElement('div');
        slideEl.className = 'slide';
        slideEl.innerHTML = `
            <div class="slide-icon">${slide.icon}</div>
            <div class="slide-title">${slide.title}</div>
            <div class="slide-desc">${slide.desc}</div>
        `;
        track.appendChild(slideEl);
    });

    const dots = document.createElement('div');
    dots.className = 'slider-dots';
    app.slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dots.appendChild(dot);
    });

    sliderLayer.appendChild(track);
    sliderLayer.appendChild(dots);

    card.appendChild(iconLayer);
    card.appendChild(sliderLayer);
    grid.appendChild(card);

    // Lógica del slider
    let currentSlide = 0;
    const totalSlides = app.slides.length;
    const dotElements = dots.querySelectorAll('.dot');
    let autoSlideInterval = null;

    const goToSlide = (index) => {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentSlide = index;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        dotElements.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    };

    const startAutoSlide = () => {
        if (autoSlideInterval) return;
        autoSlideInterval = setInterval(() => goToSlide(currentSlide + 1), 2000);
    };

    const stopAutoSlide = () => {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    };

    let startX = 0, startY = 0, isDragging = false, isHorizontalSwipe = null;
    const dragThreshold = 10, swipeThreshold = 50;

    const onDragStart = (x, y) => {
        if (!card.classList.contains('slider-active') && !card.matches(':hover') && !card.matches(':focus-visible')) return;
        startX = x; startY = y;
        isDragging = true; isHorizontalSwipe = null;
        track.classList.add('dragging');
        stopAutoSlide();
    };

    const onDragMove = (x, y, e) => {
        if (!isDragging) return;
        const diffX = x - startX, diffY = y - startY;
        if (isHorizontalSwipe === null) {
            if (Math.abs(diffX) > dragThreshold || Math.abs(diffY) > dragThreshold) {
                isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
                if (!isHorizontalSwipe) {
                    isDragging = false;
                    track.classList.remove('dragging');
                    return;
                }
            } else return;
        }
        if (isHorizontalSwipe) {
            if (e && e.cancelable) e.preventDefault();
            const offset = -currentSlide * 100;
            const dragPercent = (diffX / card.offsetWidth) * 100;
            if ((currentSlide === 0 && diffX > 0) || (currentSlide === totalSlides - 1 && diffX < 0)) {
                track.style.transform = `translateX(${offset + dragPercent * 0.3}%)`;
            } else {
                track.style.transform = `translateX(${offset + dragPercent}%)`;
            }
        }
    };

    const onDragEnd = (x) => {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('dragging');
        const diffX = x - startX;
        if (Math.abs(diffX) > swipeThreshold) {
            goToSlide(diffX < 0 ? currentSlide + 1 : currentSlide - 1);
        } else {
            goToSlide(currentSlide);
        }
        setTimeout(() => {
            if (card.matches(':hover') || card.matches(':focus-visible') || card.classList.contains('slider-active')) startAutoSlide();
        }, 3000);
    };

    track.addEventListener('touchstart', (e) => onDragStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    track.addEventListener('touchmove', (e) => onDragMove(e.touches[0].clientX, e.touches[0].clientY, e), { passive: false });
    track.addEventListener('touchend', (e) => onDragEnd(e.changedTouches[0].clientX));
    track.addEventListener('mousedown', (e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); });
    window.addEventListener('mousemove', (e) => onDragMove(e.clientX, e.clientY, e));
    window.addEventListener('mouseup', (e) => onDragEnd(e.clientX));

    dotElements.forEach((dot, i) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            goToSlide(i);
            stopAutoSlide();
            setTimeout(() => {
                if (card.matches(':hover') || card.matches(':focus-visible')) startAutoSlide();
            }, 3000);
        });
    });

    const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

    card.addEventListener('click', () => {
        if (isTouchDevice() && !card.classList.contains('slider-active')) {
            card.classList.add('slider-active');
            startAutoSlide();
        }
    });

    document.addEventListener('click', (e) => {
        if (isTouchDevice() && !card.contains(e.target) && card.classList.contains('slider-active')) {
            card.classList.remove('slider-active');
            stopAutoSlide();
            goToSlide(0);
        }
    });

    card.addEventListener('mouseenter', startAutoSlide);
    card.addEventListener('mouseleave', () => { stopAutoSlide(); goToSlide(0); });
    card.addEventListener('focus', startAutoSlide);
    card.addEventListener('blur', () => { stopAutoSlide(); goToSlide(0); });

    card.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); goToSlide(currentSlide + 1); stopAutoSlide(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); goToSlide(currentSlide - 1); stopAutoSlide(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startAutoSlide(); }
    });
});