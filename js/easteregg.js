// ========================================
// EASTER EGG - Hani's Rundgang
// 2D Pixel-Art Minispiel: Der Hund Hani zeigt Gäste über das FarmInn
// Kartendaten kommen aus easteregg/map.json (Fallback: js/easteregg-map.js).
// Gestalten lässt sich die Karte über easteregg/editor.html.
// ========================================
(function () {
    'use strict';

    // Weltkoordinaten (alle Kartendaten beziehen sich hierauf) ...

    const CANVAS_W = 480;
    const CANVAS_H = 360;
    // ... werden mit diesem Faktor hochauflösend gerendert (größer + detailreicher).
    const SCALE = 2.5;
    const OUT_W = Math.round(CANVAS_W * SCALE);
    const OUT_H = Math.round(CANVAS_H * SCALE);

    const DEFAULT_MAP = window.FARMINN_DEFAULT_MAP || { features: [], buildings: [], huts: [], areas: [] };

    // Palette
    const C = {
        grass: '#8aa55e',
        grassDark: '#7f9b54',
        grassLight: '#93ad67',
        grassTuft: '#6f8a48',
        dirt: '#c6aa7a',
        road: '#cdb083',
        roadDark: '#bd9f72',
        roadLine: '#e6d9b6',
        cobble: '#c9b489',
        cobbleDark: '#bda878',
        cobbleLine: 'rgba(90,74,48,0.14)',
        asph: '#b3ada0',
        asphDark: '#a49e91',
        line: '#e9e5db',
        wall: '#f0e2c4',
        wallShade: '#dcc79c',
        stone: '#cbbb95',
        stoneDark: '#b3a37d',
        timber: '#7a5236',
        plank: '#e8d6b0',
        plankDark: '#d3bd92',
        window: '#5b7fa6',
        windowDark: '#44637f',
        frame: '#efe6d2',
        door: '#6b432d',
        wood: '#6b432d',
        woodDark: '#52321f',
        roofA: '#a5573f',
        roofB: '#8a4b3a',
        roofC: '#7d4636',
        ridge: '#c96a4e',
        water: '#7c9ec2',
        waterHi: '#a9c9e4',
        fence: '#9b755c',
        fenceDark: '#7d5c45',
        tent: '#c96a4e',
        tentLight: '#e08a72',
        tentDark: '#7d4636',
        alpaca: '#f3ede1',
        alpacaBrown: '#b08a5e',
        hedge: '#4f6d34',
        hedgeLight: '#618143',
        bush: '#5f7a3f',
        bushLight: '#6f8a4a',
        pine: '#3f5c33',
        pineLight: '#4f7040',
        flower1: '#e0b23c',
        flower2: '#d96a7a',
        flower3: '#cfe0f0',
        sand: '#e3cfa0',
        signBlue: '#3f6ea8',
        signWhite: '#f4f1ea',
        crest: '#c9a24a',
        crestDark: '#8a6a2e'
    };

    const ctx = document.getElementById('egg-canvas').getContext('2d');
    ctx.canvas.width = OUT_W;
    ctx.canvas.height = OUT_H;
    ctx.imageSmoothingEnabled = false;

    const dialogText = document.getElementById('egg-dialog-text');
    const progressEl = document.getElementById('egg-progress');
    const legendList = document.getElementById('egg-legend-list');
    const resetBtn = document.getElementById('egg-reset');

    // ---- Weltzustand (aus der Karte befüllt) ----
    let FEATURES = [];
    let BUILDINGS = [];
    let HUTS = [];
    let AREAS = [];
    let ROADS = [];
    let PONDS = [];
    let TREES = [];
    let PARKINGS = [];
    let POINTS = [];
    let TOTAL = 0;
    let START = { x: 122, y: 80 };
    let PLAZA_C = null;
    let TENT_B = null;
    let TERRACE = null;

    const dog = {
        x: 122,
        y: 80,
        t: 0,
        frame: 0,
        moving: false,
        faceLeft: false
    };

    const input = { up: false, down: false, left: false, right: false };
    let target = null;
    let currentFeature = null;
    const discovered = new Set();

    const IDLE = 'Wuff! Folgt mir über den Hof – geht einfach in die Nähe eines Ortes, dann erzähle ich euch, was ihr seht!';

    // ---- Zufall (deterministisch) ----
    function seededRandom(seed) {
        let s = seed;
        return function () {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    const rand = seededRandom(1337);

    // ---- Vorberechnete Deko ----
    const tufts = [];
    for (let i = 0; i < 190; i++) {
        tufts.push({ x: Math.floor(rand() * CANVAS_W), y: Math.floor(rand() * CANVAS_H) });
    }
    const patches = [];
    for (let i = 0; i < 90; i++) {
        patches.push({
            x: Math.floor(rand() * CANVAS_W),
            y: Math.floor(rand() * CANVAS_H),
            w: 6 + Math.floor(rand() * 12),
            h: 5 + Math.floor(rand() * 9),
            dark: rand() < 0.5
        });
    }
    const bushes = [];
    for (let i = 0; i < 26; i++) {
        bushes.push({
            x: 14 + Math.floor(rand() * (CANVAS_W - 28)),
            y: 20 + Math.floor(rand() * (CANVAS_H - 36)),
            brown: rand() < 0.35
        });
    }
    // Dreck-/Kiesflächen (Wege und Plätze)
    const dirtPatches = [
        { x: 150, y: 156, w: 66, h: 30 },
        { x: 210, y: 120, w: 34, h: 42 },
        { x: 250, y: 196, w: 78, h: 52 },
        { x: 168, y: 236, w: 60, h: 34 }
    ];
    // Blumenbeete
    const flowerBeds = [
        { x: 206, y: 190, w: 12, h: 6 },
        { x: 244, y: 176, w: 16, h: 5 },
        { x: 326, y: 158, w: 18, h: 6 },
        { x: 388, y: 200, w: 14, h: 6 },
        { x: 150, y: 300, w: 22, h: 7 },
        { x: 300, y: 300, w: 22, h: 7 }
    ];
    // Hecken
    const hedges = [
        { x: 4, y: 340, w: 96, h: 7 },
        { x: 372, y: 340, w: 104, h: 7 },
        { x: 4, y: 12, w: 70, h: 7 },
        { x: 360, y: 12, w: 116, h: 7 }
    ];

    // ---- Zeichen-Helfer ----
    function rect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function px(x, y, color) {
        rect(x, y, 1, 1, color);
    }

    function poly(pts, color) {
        if (!pts.length) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath();
        ctx.fill();
    }

    function path(pts) {
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    }

    function bbox(pts) {
        const xs = pts.map(p => p[0]);
        const ys = pts.map(p => p[1]);
        return { x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys), x1: Math.max.apply(null, xs), y1: Math.max.apply(null, ys) };
    }

    function label(text, x, y, size, color, halo) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "bold " + size + "px 'Press Start 2P', monospace";
        if (halo) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = halo;
            ctx.lineJoin = 'round';
            ctx.strokeText(text, x, y);
        }
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }

    function buildingAABB(b) {
        const rot = (b.rot || 0) * Math.PI / 180;
        if (!rot) return { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h };
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const hw = b.w / 2;
        const hh = b.h / 2;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(function (d) {
            return [cx + d[0] * cos - d[1] * sin, cy + d[0] * sin + d[1] * cos];
        });
        return { x0: Math.min.apply(null, pts.map(p => p[0])), y0: Math.min.apply(null, pts.map(p => p[1])), x1: Math.max.apply(null, pts.map(p => p[0])), y1: Math.max.apply(null, pts.map(p => p[1])) };
    }

    // ---- Boden ----
    function drawGrass() {
        rect(0, 0, CANVAS_W, CANVAS_H, C.grass);
        patches.forEach(p => rect(p.x, p.y, p.w, p.h, p.dark ? C.grassDark : C.grassLight));
        for (let y = 0; y < CANVAS_H; y += 16) {
            for (let x = 0; x < CANVAS_W; x += 16) {
                if (((x / 16) + (y / 16)) % 2 === 0) rect(x, y, 16, 16, 'rgba(0,0,0,0.025)');
            }
        }
        tufts.forEach(t => {
            rect(t.x, t.y, 2, 3, C.grassTuft);
            px(t.x + 2, t.y + 1, C.grassTuft);
        });
    }

    function drawDirt() {
        dirtPatches.forEach(d => {
            rect(d.x, d.y, d.w, d.h, C.dirt);
            rect(d.x, d.y, d.w, 1, 'rgba(255,255,255,0.08)');
        });
    }

    // ---- Straßen ----
    function drawRoad(r) {
        if (r.points && r.points.length) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            path(r.points);
            ctx.strokeStyle = C.road;
            ctx.lineWidth = r.w || 14;
            ctx.stroke();

            ctx.globalAlpha = 0.22;
            path(r.points);
            ctx.strokeStyle = C.roadDark;
            ctx.lineWidth = Math.max(2, (r.w || 14) - 7);
            ctx.stroke();
            ctx.globalAlpha = 1;

            if ((r.w || 14) >= 20) {
                path(r.points);
                ctx.setLineDash([6, 7]);
                ctx.strokeStyle = C.roadLine;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.setLineDash([]);
            }
            ctx.restore();
        } else {
            rect(r.x, r.y, r.w, r.h, C.road);
            rect(r.x, r.y, r.w, 1, 'rgba(255,255,255,0.06)');
            rect(r.x, r.y + r.h - 2, r.w, 2, C.roadDark);
        }
    }

    // ---- Teich ----
    function drawPond(p) {
        ctx.fillStyle = C.water;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6a8aad';
        ctx.lineWidth = 1;
        ctx.stroke();
        rect(p.x - 6, p.y - 7, 10, 2, C.waterHi);
    }

    // ---- Parkplatz ----
    function drawParking(cx, cy, cols) {
        const w = cols * 8 + 4;
        const h = 14;
        const x = cx - w / 2;
        const y = cy - h / 2;
        rect(x, y, w, h, C.asph);
        rect(x, y, w, 1, 'rgba(255,255,255,0.12)');
        for (let i = 0; i <= cols; i++) {
            rect(x + 2 + i * 8, y + 2, 1, h - 4, C.line);
        }
    }

    function drawCar(x, y, color) {
        rect(x, y + 2, 6, 4, color);
        rect(x + 1, y + 1, 4, 2, '#8fb0cf');
        rect(x, y + 2, 6, 1, 'rgba(0,0,0,0.18)');
        rect(x + 1, y + 6, 1, 1, '#3a3a3a');
        rect(x + 4, y + 6, 1, 1, '#3a3a3a');
    }

    function drawCarsInParking(cx, cy, cols) {
        const w = cols * 8 + 4;
        const x = cx - w / 2;
        const y = cy - 7;
        const colors = ['#c96a4e', '#5b7fa6', '#e0b23c', '#8aa55e', '#cfc8b8', '#9b755c'];
        for (let i = 0; i < cols; i++) {
            if (i % 3 === 1) continue;
            drawCar(x + 3 + i * 8, y + 2, colors[i % colors.length]);
        }
    }

    function drawBus(cx, cy) {
        const x = cx - 11;
        const y = cy - 5;
        rect(x, y, 22, 9, '#e9e5db');
        rect(x, y, 22, 2, '#cbb89a');
        for (let i = 0; i < 4; i++) rect(x + 2 + i * 5, y + 2, 4, 4, C.windowDark);
        rect(x + 1, y + 9, 2, 2, '#3a3a3a');
        rect(x + 19, y + 9, 2, 2, '#3a3a3a');
    }

    // ---- Flächen ----
    function areaWorldPts(a) {
        return a.points.map(c => [c[0] * CANVAS_W, c[1] * CANVAS_H]);
    }

    function drawFencedPoly(pts, fill, edge) {
        poly(pts, fill);
        ctx.strokeStyle = edge;
        ctx.lineWidth = 2;
        path(pts);
        ctx.closePath();
        ctx.stroke();
    }

    function drawCobble(pts) {
        poly(pts, C.cobble);
        const b = bbox(pts);
        ctx.save();
        path(pts);
        ctx.closePath();
        ctx.clip();
        ctx.strokeStyle = C.cobbleLine;
        ctx.lineWidth = 1;
        for (let x = Math.floor(b.x0 / 8) * 8; x < b.x1; x += 8) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, b.y0);
            ctx.lineTo(x + 0.5, b.y1);
            ctx.stroke();
        }
        for (let y = Math.floor(b.y0 / 8) * 8; y < b.y1; y += 8) {
            ctx.beginPath();
            ctx.moveTo(b.x0, y + 0.5);
            ctx.lineTo(b.x1, y + 0.5);
            ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = C.cobbleDark;
        ctx.lineWidth = 2;
        path(pts);
        ctx.closePath();
        ctx.stroke();
    }

    function drawAlpaca(x, y, brown) {
        const body = brown ? C.alpacaBrown : C.alpaca;
        const head = brown ? '#c69c6d' : '#f7f2e8';
        rect(x + 1, y + 8, 2, 4, '#8a8272');
        rect(x + 5, y + 8, 2, 4, '#8a8272');
        rect(x, y + 1, 7, 7, body);
        rect(x + 1, y + 2, 5, 2, 'rgba(255,255,255,0.35)');
        rect(x - 1, y - 5, 3, 7, body);
        rect(x - 2, y - 8, 5, 4, head);
        rect(x - 2, y - 9, 2, 2, head);
        rect(x + 5, y - 7, 2, 2, '#3a3a3a');
    }

    function drawTent(x, y) {
        rect(x, y + 6, 12, 4, C.tent);
        rect(x + 1, y + 4, 10, 2, C.tent);
        rect(x + 3, y + 2, 6, 2, C.tentLight);
        rect(x + 4, y + 6, 4, 4, C.tentDark);
        rect(x + 5, y + 7, 2, 3, '#e0c9a0');
    }

    function drawCamper(x, y) {
        rect(x, y + 4, 16, 8, '#f4f1ea');
        rect(x + 1, y + 5, 6, 4, C.window);
        rect(x, y, 16, 5, '#e7e2d6');
        rect(x + 11, y + 1, 4, 3, '#cfc8b8');
        rect(x + 1, y + 11, 2, 2, '#3a3a3a');
        rect(x + 13, y + 11, 2, 2, '#3a3a3a');
    }

    function drawAreas() {
        AREAS.forEach(a => {
            if (!a.points || !a.points.length) return;
            const pts = areaWorldPts(a);
            const b = bbox(pts);
            if (a.kind === 'pasture') {
                drawFencedPoly(pts, '#7f9b54', C.fence);
                // Zaunpfosten
                ctx.fillStyle = C.fenceDark;
                pts.forEach(p => rect(p[0] - 1, p[1] - 1, 2, 2, C.fenceDark));
                // Futterstelle + Heu
                rect(b.x0 + 6, b.y0 + 6, 12, 5, '#8a7a52');
                rect(b.x0 + 7, b.y0 + 7, 10, 3, '#b6a472');
                rect(b.x1 - 22, b.y0 + 8, 14, 10, '#c9a24a');
                rect(b.x1 - 21, b.y0 + 6, 12, 4, '#e0c06a');
                drawAlpaca(b.x0 + 24, b.y0 + 20, false);
                drawAlpaca(b.x0 + 46, b.y0 + 30, true);
                drawAlpaca(b.x1 - 30, b.y0 + 24, false);
            } else if (a.kind === 'plaza') {
                drawCobble(pts);
            } else if (a.kind === 'parking') {
                poly(pts, C.asph);
                ctx.strokeStyle = C.line;
                ctx.lineWidth = 1;
                const cy = (b.y0 + b.y1) / 2 - 8;
                for (let i = 0; i < 3; i++) rect(b.x0 + 6 + i * 22, b.y0 + 4, 1, b.y1 - b.y0 - 8, C.line);
                drawCamper(b.x0 + 8, cy);
                drawCamper(b.x0 + 30, cy);
            } else if (a.kind === 'tents') {
                rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, C.sand);
                rect(b.x0, b.y0, b.x1 - b.x0, 1, 'rgba(255,255,255,0.12)');
                drawTent(b.x0 + 6, b.y0 + 8);
                drawTent(b.x0 + 22, b.y0 + 18);
                drawTent(b.x0 + 10, b.y0 + 30);
            }
        });
    }

    // ---- Gebäude ----
    function drawBuilding(b) {
        const w = b.w;
        const h = b.h;
        const cx = b.x + w / 2;
        const cy = b.y + h / 2;
        const rot = (b.rot || 0) * Math.PI / 180;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        const X = -w / 2;
        const Y = -h / 2;

        // Schatten
        ctx.fillStyle = 'rgba(30,25,15,0.16)';
        ctx.fillRect(X + 3, Y + 5, w, h);

        // Steinsockel
        rect(X, Y + h - 4, w, 4, C.stone);
        for (let sx = 0; sx < w; sx += 6) rect(X + sx, Y + h - 4, 1, 4, C.stoneDark);

        // Wände
        if (b.timber) {
            rect(X, Y + 8, w, h - 12, C.plank);
            for (let sx = 3; sx < w; sx += 5) rect(X + sx, Y + 9, 1, h - 14, C.plankDark);
            // Fachwerk-Balken
            rect(X, Y + 8, w, 2, C.timber);
            rect(X, Y + 8, 2, h - 12, C.timber);
            rect(X + w - 2, Y + 8, 2, h - 12, C.timber);
            rect(X, Y + h - 6, w, 2, C.timber);
            rect(X + w / 2 - 1, Y + 8, 2, h - 12, C.timber);
        } else {
            rect(X, Y + 8, w, h - 12, C.wall);
            rect(X, Y + 8, w, 3, C.wallShade);
            for (let sy = Y + 13; sy < Y + h - 5; sy += 4) rect(X, sy, w, 1, 'rgba(0,0,0,0.05)');
            rect(X, Y + h - 3, w, 2, '#c9b489');
        }

        // Giebeldach
        const steps = 9;
        for (let i = 0; i < steps; i++) {
            const inset = steps - 1 - i;
            const col = i < 2 ? C.ridge : (b.roof || C.roofB);
            rect(X + inset, Y + i, w - inset * 2, 1, col);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 1;
        for (let i = 3; i < steps; i += 2) {
            const inset = steps - 1 - i;
            ctx.beginPath();
            ctx.moveTo(X + inset, Y + i + 0.5);
            ctx.lineTo(X + w - inset, Y + i + 0.5);
            ctx.stroke();
        }
        rect(X + steps - 1, Y, w - (steps - 1) * 2, 1, '#e0a07c');

        // Schornstein
        if (w > 42) {
            rect(X + w - 12, Y - 1, 4, 5, C.stoneDark);
            rect(X + w - 12, Y - 1, 4, 1, '#8a7a5a');
        }

        // Fenster
        const cols = Math.max(1, Math.floor((w - 8) / 14));
        const step = w / cols;
        const rows = h > 34 ? 2 : 1;
        for (let r2 = 0; r2 < rows; r2++) {
            for (let c = 0; c < cols; c++) {
                const wx = X + step * c + step / 2 - 3;
                const wy = Y + 12 + r2 * 10;
                if (wy + 7 > Y + h - 4) continue;
                rect(wx - 1, wy - 1, 8, 8, C.frame);
                rect(wx, wy, 6, 6, C.window);
                rect(wx, wy, 6, 1, C.windowDark);
                rect(wx + 2, wy, 1, 6, C.windowDark);
                rect(wx - 3, wy, 2, 6, C.timber);
                rect(wx + 7, wy, 2, 6, C.timber);
            }
        }

        // Tür
        const dx = X + w / 2 - 5;
        const dy = Y + h - 11;
        rect(dx - 1, dy - 1, 12, 12, C.frame);
        rect(dx, dy, 10, 11, C.door);
        rect(dx + 1, dy + 1, 8, 1, '#8a5a3b');
        rect(dx + 6, dy + 4, 2, 2, '#d4a574');

        ctx.restore();
    }

    function drawHut(h) {
        const x = h.x;
        const y = h.y;
        rect(x + 1, y + 6, 12, 6, 'rgba(0,0,0,0.14)');
        rect(x, y + 4, 12, 8, C.plank);
        for (let i = 1; i < 12; i += 3) rect(x + i, y + 5, 1, 6, C.plankDark);
        for (let i = 0; i < 6; i++) {
            const inset = 5 - i;
            rect(x + inset, y + i, 12 - inset * 2, 1, i < 1 ? C.ridge : C.roofB);
        }
        rect(x + 1, y + 9, 10, 1, C.timber);
        rect(x + 3, y + 7, 2, 3, C.window);
        // Wimpelkette
        rect(x - 1, y + 5, 1, 1, C.flower2);
        rect(x + 6, y + 5, 1, 1, C.flower1);
        rect(x + 12, y + 5, 1, 1, C.flower3);
    }

    // ---- Vegetation ----
    function drawTree(t) {
        const x = t.x;
        const y = t.y;
        if (t.v === 1) {
            // Nadelbaum
            rect(x - 1, y + 2, 3, 7, C.wood);
            rect(x - 5, y - 3, 11, 6, C.pine);
            rect(x - 4, y - 7, 9, 5, C.pine);
            rect(x - 3, y - 10, 7, 4, C.pineLight);
            rect(x - 1, y - 12, 3, 3, C.pineLight);
            rect(x - 3, y - 6, 2, 1, 'rgba(255,255,255,0.18)');
        } else {
            // Laubbaum
            rect(x - 1, y, 3, 8, C.wood);
            rect(x - 7, y - 7, 15, 10, C.pine);
            rect(x - 6, y - 10, 13, 6, C.bush);
            rect(x - 4, y - 12, 9, 4, C.bushLight);
            rect(x - 5, y - 8, 4, 3, 'rgba(255,255,255,0.16)');
            rect(x + 1, y - 6, 3, 3, 'rgba(0,0,0,0.10)');
        }
    }

    function drawBush(b) {
        const col = b.brown ? '#8a7a52' : C.bush;
        const hi = b.brown ? '#a49468' : C.bushLight;
        rect(b.x - 4, b.y - 3, 9, 6, col);
        rect(b.x - 3, b.y - 5, 7, 3, hi);
        rect(b.x - 2, b.y - 4, 3, 2, 'rgba(255,255,255,0.15)');
    }

    function drawHedge(h) {
        rect(h.x, h.y, h.w, h.h, C.hedge);
        rect(h.x, h.y, h.w, 2, C.hedgeLight);
        for (let x = h.x + 2; x < h.x + h.w - 1; x += 4) rect(x, h.y + 2, 1, h.h - 2, 'rgba(0,0,0,0.12)');
    }

    function drawFlowerBed(f) {
        rect(f.x, f.y, f.w, f.h, '#6f5a3a');
        const cols = [C.flower1, C.flower2, C.flower3];
        for (let i = 0; i < f.w; i += 3) {
            rect(f.x + i, f.y + 1, 1, 1, cols[(i / 3) % 3]);
            rect(f.x + i + 1, f.y + 3, 1, 1, cols[(i / 3 + 1) % 3]);
        }
    }

    // ---- Deko/Gadgets ----
    function drawParkingSign(x, y) {
        rect(x, y + 6, 1, 6, C.fenceDark);
        rect(x - 4, y, 9, 8, C.signBlue);
        rect(x - 3, y + 1, 7, 6, C.signBlue);
        label('P', x + 0.5, y + 4, 6, C.signWhite);
    }

    function drawMaypole(x, y) {
        rect(x, y - 16, 2, 20, C.wood);
        rect(x - 1, y - 18, 4, 3, C.flower1);
        const cols = [C.flower2, C.flower3, C.flower1, C.tent];
        for (let i = 0; i < 4; i++) {
            const dx = Math.cos(i * Math.PI / 2) * 6;
            const dy = Math.sin(i * Math.PI / 2) * 6;
            ctx.strokeStyle = cols[i];
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 1, y - 15);
            ctx.lineTo(x + 1 + dx, y - 12 + dy);
            ctx.stroke();
        }
    }

    function drawPlayground(x, y) {
        rect(x, y + 8, 30, 12, C.sand);
        rect(x, y + 8, 30, 1, 'rgba(255,255,255,0.12)');
        // Rutsche
        rect(x + 2, y, 2, 9, C.timber);
        rect(x + 2, y - 1, 6, 2, C.tent);
        rect(x + 4, y + 3, 9, 2, C.signBlue);
        // Schaukel
        rect(x + 18, y, 2, 9, C.timber);
        rect(x + 16, y - 1, 6, 1, C.timber);
        rect(x + 17, y, 1, 5, '#8a8272');
        rect(x + 20, y, 1, 5, '#8a8272');
        rect(x + 16, y + 5, 6, 2, '#6b432d');
    }

    function drawGarden(x, y) {
        ctx.fillStyle = C.dirt;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.fenceDark;
        ctx.lineWidth = 1;
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2;
            const gx = x + Math.cos(a) * 7;
            const gy = y + Math.sin(a) * 7;
            rect(gx - 1, gy - 1, 3, 3, C.bush);
            px(gx, gy - 2, C.flower2);
        }
        rect(x - 1, y - 1, 2, 2, C.flower1);
    }

    function drawLoungers(x, y) {
        const cols = ['#e9e5db', C.tent, '#e9e5db', C.tent];
        for (let i = 0; i < 4; i++) {
            rect(x + i * 5, y, 3, 8, cols[i]);
            rect(x + i * 5, y, 1, 8, 'rgba(0,0,0,0.08)');
            rect(x + i * 5, y - 3, 3, 3, '#8a8272');
        }
    }

    function drawBench(x, y) {
        rect(x, y, 12, 2, C.timber);
        rect(x, y - 3, 12, 2, C.timber);
        rect(x, y + 2, 1, 3, C.woodDark);
        rect(x + 11, y + 2, 1, 3, C.woodDark);
    }

    function drawCrest(x, y) {
        // FarmInn-Wappen (Schild)
        ctx.fillStyle = C.crest;
        ctx.beginPath();
        ctx.moveTo(x - 7, y - 8);
        ctx.lineTo(x + 7, y - 8);
        ctx.lineTo(x + 7, y + 2);
        ctx.lineTo(x, y + 9);
        ctx.lineTo(x - 7, y + 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = C.crestDark;
        ctx.lineWidth = 1;
        ctx.stroke();
        rect(x - 5, y - 6, 10, 2, C.crestDark);
        label('F', x, y, 6, '#4a3a18');
    }

    function drawGadgets() {
        // Wappen oben links
        drawCrest(24, 22);
        // Straßen-Labels
        label('K18', 60, 40, 6, '#6a5a3a', 'rgba(255,255,255,0.5)');
        label('K18', 432, 90, 6, '#6a5a3a', 'rgba(255,255,255,0.5)');

        // Parkplatz-Schilder + Fahrzeuge
        PARKINGS.forEach(p => {
            const w = p.cols * 8 + 4;
            drawParkingSign(p.x - w / 2 - 7, p.y - 7);
            if (p.cols === 1) drawBus(p.x, p.y);
            else drawCarsInParking(p.x, p.y, p.cols);
        });

        // Spielplatz am Zeltplatz
        if (TENT_B) drawPlayground(TENT_B.x0 - 4, TENT_B.y0 - 14);
        // Maibaum auf dem Hofplatz
        if (PLAZA_C) drawMaypole(PLAZA_C.x, PLAZA_C.y);
        // Garten/Spiralbeet an der Taverne
        drawGarden(232, 236);
        // Liegen auf der Terrasse
        if (TERRACE) drawLoungers(TERRACE.x - 10, TERRACE.y + 2);
        // Bänke
        drawBench(206, 156);
        drawBench(300, 214);
    }

    // ---- Marker/Badges ----
    function drawBadges() {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "bold 8px 'Press Start 2P', monospace";
        POINTS.forEach(p => {
            const found = discovered.has(p.n);
            const bx = Math.round(p.px) - 8;
            const by = Math.round(p.py) - 8;
            if (currentFeature === p) {
                ctx.strokeStyle = 'rgba(255,253,249,0.9)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.px, p.py, 13 + Math.sin(dog.t * 6) * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            rect(bx, by, 16, 16, found ? '#5a6448' : '#6b432d');
            rect(bx + 1, by + 1, 14, 14, found ? '#8a9475' : '#FFFDF9');
            ctx.fillStyle = found ? '#FFFDF9' : '#6b432d';
            ctx.fillText(String(p.n), p.px, p.py + 1);
        });
    }

    // ---- Hund ----
    function drawDog() {
        const cx = Math.round(dog.x);
        const cy = Math.round(dog.y);
        const bob = dog.moving ? (Math.floor(dog.frame) % 2) : 0;
        const by = cy - 16 - bob;

        // Sanfter Ring unter Hani, damit man ihn gut im Blick behält
        const pulse = 0.5 + 0.5 * Math.sin(dog.t * 4);
        ctx.strokeStyle = 'rgba(255,253,249,' + (0.4 + 0.35 * pulse).toFixed(2) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, 13, 6.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 1, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        if (dog.faceLeft) {
            ctx.translate(cx * 2, 0);
            ctx.scale(-1, 1);
        }

        const walkBack = dog.moving && Math.floor(dog.frame) % 2 === 0;
        const walkFront = dog.moving && Math.floor(dog.frame) % 2 === 1;
        const wag = Math.sin(dog.t * 8) * 3;

        // Schwanz
        rect(cx - 17, by - 4 + wag, 5, 4, '#5f3b26');
        rect(cx - 16, by - 8 + wag, 4, 5, '#5f3b26');

        // Beine
        rect(cx - 10, cy - 5, 3, 5, '#6b432d');
        rect(cx - 4, cy - 5, 3, 5, '#6b432d');
        rect(cx + 5, cy - 5 - (walkFront ? 1 : 0), 3, 5, '#8a5a3b');
        rect(cx + 9, cy - 5 + (walkBack ? 1 : 0), 3, 5, '#8a5a3b');

        // Körper
        rect(cx - 13, by + 2, 21, 9, '#8a5a3b');
        rect(cx - 11, by + 2, 13, 4, '#6b432d');
        rect(cx - 10, by + 9, 16, 2, '#a5754f');

        // Kopf
        rect(cx + 5, by - 3, 11, 10, '#8a5a3b');
        rect(cx + 5, by - 7, 5, 6, '#5f3b26');
        rect(cx + 13, by + 2, 6, 5, '#d9b98f');
        rect(cx + 18, by + 3, 2, 2, '#2b2b2b');
        rect(cx + 10, by, 2, 2, '#2b2b2b');
        rect(cx + 5, by + 5, 11, 2, '#c96a4e');

        ctx.restore();
    }

    // ---- Render ----
    function render() {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        drawGrass();
        drawDirt();
        ROADS.forEach(drawRoad);
        drawAreas();
        PARKINGS.forEach(p => drawParking(p.x, p.y, p.cols));
        hedges.forEach(drawHedge);
        flowerBeds.forEach(drawFlowerBed);
        PONDS.forEach(drawPond);

        BUILDINGS.forEach(drawBuilding);
        HUTS.forEach(drawHut);

        TREES.forEach(drawTree);
        bushes.forEach(drawBush);

        drawGadgets();

        drawBadges();
        drawDog();
    }

    // ---- Kollision ----
    function collides(x, y) {
        const bx = x - 7;
        const by = y - 12;
        const bw = 14;
        const bh = 12;
        for (let i = 0; i < BUILDINGS.length; i++) {
            const b = BUILDINGS[i]._aabb || BUILDINGS[i];
            const x0 = b.x0 !== undefined ? b.x0 : b.x;
            const y0 = b.y0 !== undefined ? b.y0 : b.y;
            const x1 = b.x1 !== undefined ? b.x1 : b.x + b.w;
            const y1 = b.y1 !== undefined ? b.y1 : b.y + b.h;
            if (bx < x1 && bx + bw > x0 && by < y1 && by + bh > y0) {
                return true;
            }
        }
        return false;
    }

    // ---- Update ----
    const SPEED = 82;

    function update(dt) {
        let dx = 0;
        let dy = 0;
        if (input.up) dy -= 1;
        if (input.down) dy += 1;
        if (input.left) dx -= 1;
        if (input.right) dx += 1;

        if (dx || dy) {
            target = null;
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;
        } else if (target) {
            const tdx = target.x - dog.x;
            const tdy = target.y - dog.y;
            const d = Math.hypot(tdx, tdy);
            if (d < 4) {
                target = null;
            } else {
                dx = tdx / d;
                dy = tdy / d;
            }
        }

        const moving = !!(dx || dy);
        const nx = dog.x + dx * SPEED * dt;
        const ny = dog.y + dy * SPEED * dt;

        if (!collides(nx, dog.y)) {
            dog.x = nx;
        } else if (target) {
            target = null;
        }

        if (!collides(dog.x, ny)) {
            dog.y = ny;
        } else if (target) {
            target = null;
        }

        dog.x = Math.max(8, Math.min(CANVAS_W - 8, dog.x));
        dog.y = Math.max(14, Math.min(CANVAS_H - 6, dog.y));

        if (moving) {
            dog.frame += dt * 9;
            if (dx < 0) dog.faceLeft = true;
            else if (dx > 0) dog.faceLeft = false;
        }
        dog.moving = moving;
        dog.t += dt;

        checkProximity();
    }

    function checkProximity() {
        let best = null;
        let bestDist = Infinity;
        for (let i = 0; i < POINTS.length; i++) {
            const p = POINTS[i];
            const d = Math.hypot(dog.x - p.px, dog.y - p.py);
            if (d < p.r && d < bestDist) {
                best = p;
                bestDist = d;
            }
        }

        if (currentFeature) {
            const cd = Math.hypot(dog.x - currentFeature.px, dog.y - currentFeature.py);
            if (cd <= currentFeature.r + 6 && (!best || bestDist > cd * 0.6)) {
                return;
            }
        }

        if (best !== currentFeature) {
            currentFeature = best;
            if (best) {
                setDialog(best.name, best.d);
                if (!discovered.has(best.n)) {
                    discovered.add(best.n);
                    updateProgress();
                }
            } else {
                setDialog(null, IDLE);
            }
        }
    }

    function setDialog(name, text) {
        dialogText.innerHTML = name ? '<strong>' + name + '</strong>' + text : text;
    }

    function updateProgress() {
        progressEl.textContent = 'Entdeckt: ' + discovered.size + ' / ' + TOTAL;
        legendList.querySelectorAll('li').forEach(li => {
            if (discovered.has(parseInt(li.dataset.n, 10))) {
                li.classList.add('found');
            } else {
                li.classList.remove('found');
            }
        });
    }

    // ---- Eingabe ----
    function setKey(dir, value) {
        if (input[dir] !== value) input[dir] = value;
    }

    const KEYMAP = {
        arrowup: 'up', w: 'up',
        arrowdown: 'down', s: 'down',
        arrowleft: 'left', a: 'left',
        arrowright: 'right', d: 'right'
    };

    document.addEventListener('keydown', (e) => {
        const dir = KEYMAP[e.key.toLowerCase()];
        if (dir) {
            e.preventDefault();
            setKey(dir, true);
        }
    });

    document.addEventListener('keyup', (e) => {
        const dir = KEYMAP[e.key.toLowerCase()];
        if (dir) {
            e.preventDefault();
            setKey(dir, false);
        }
    });

    window.addEventListener('blur', () => {
        setKey('up', false);
        setKey('down', false);
        setKey('left', false);
        setKey('right', false);
    });

    document.querySelectorAll('.dpad-btn').forEach(btn => {
        const dir = btn.dataset.dir;
        const press = (e) => {
            e.preventDefault();
            setKey(dir, true);
            btn.classList.add('active');
        };
        const release = (e) => {
            if (e) e.preventDefault();
            setKey(dir, false);
            btn.classList.remove('active');
        };
        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointerleave', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    function canvasToWorld(clientX, clientY) {
        const r = ctx.canvas.getBoundingClientRect();
        return {
            x: (clientX - r.left) / r.width * CANVAS_W,
            y: (clientY - r.top) / r.height * CANVAS_H
        };
    }

    ctx.canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const p = canvasToWorld(e.clientX, e.clientY);
        target = { x: p.x, y: p.y };
    });

    ctx.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // ---- Legende ----
    function buildLegend() {
        const seen = new Set();
        const items = [];
        FEATURES.forEach(f => {
            if (!seen.has(f.n)) {
                seen.add(f.n);
                items.push({ n: f.n, name: f.name });
            }
        });
        items.sort((a, b) => a.n - b.n);
        legendList.innerHTML = items.map(it =>
            '<li data-n="' + it.n + '"><span class="num">' + it.n + '</span><span class="name">' + it.name + '</span></li>'
        ).join('');
    }

    // ---- Reset ----
    function reset() {
        dog.x = START.x;
        dog.y = START.y;
        dog.faceLeft = false;
        dog.frame = 0;
        target = null;
        currentFeature = null;
        discovered.clear();
        Object.keys(input).forEach(k => input[k] = false);
        document.querySelectorAll('.dpad-btn.active').forEach(b => b.classList.remove('active'));
        setDialog(null, IDLE);
        updateProgress();
    }

    resetBtn.addEventListener('click', reset);

    // ---- Loop ----
    let last = 0;
    function loop(ts) {
        if (!last) last = ts;
        let dt = (ts - last) / 1000;
        last = ts;
        if (dt > 0.05) dt = 0.05;
        update(dt);
        render();
        requestAnimationFrame(loop);
    }

    // ---- Welt aus Kartendaten aufbauen ----
    function buildWorld(map) {
        FEATURES = (map.features || []).slice();
        BUILDINGS = (map.buildings || []).slice();
        HUTS = (map.huts || []).slice();
        AREAS = (map.areas || []).slice();
        ROADS = (map.roads || []).slice();
        PONDS = (map.ponds || []).slice();
        TREES = (map.trees || []).slice();
        PARKINGS = (map.parkings || []).slice();

        BUILDINGS.forEach(b => { b._aabb = buildingAABB(b); });

        AREAS.forEach(a => {
            if (!a.points || !a.points.length) return;
            const b = bbox(areaWorldPts(a));
            if (a.kind === 'plaza') PLAZA_C = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 };
            else if (a.kind === 'tents') TENT_B = b;
        });
        const terrace = FEATURES.find(f => /terrasse/i.test(f.name || ''));
        if (terrace) TERRACE = { x: terrace.x * CANVAS_W, y: terrace.y * CANVAS_H };

        const ds = map.dogStart || { x: 122, y: 80 };
        START = { x: ds.x, y: ds.y };
        dog.x = START.x;
        dog.y = START.y;

        TOTAL = new Set(FEATURES.map(f => f.n)).size;

        POINTS = FEATURES.map(f => ({
            id: f.id,
            n: f.n,
            name: f.name,
            d: f.d,
            px: f.x * CANVAS_W,
            py: f.y * CANVAS_H,
            r: 30,
            dupe: false
        }));

        for (let i = 0; i < POINTS.length; i++) {
            for (let j = i + 1; j < POINTS.length; j++) {
                if (Math.abs(POINTS[i].px - POINTS[j].px) < 3 && Math.abs(POINTS[i].py - POINTS[j].py) < 3) {
                    POINTS[j].px += 16;
                    POINTS[j].py -= 11;
                    POINTS[j].dupe = true;
                }
            }
        }

        POINTS.forEach(p => {
            let margin = Infinity;
            BUILDINGS.forEach(b => {
                const bb = b._aabb;
                const inside = p.px > bb.x0 && p.px < bb.x1 && p.py > bb.y0 && p.py < bb.y1;
                if (inside) {
                    const m = Math.min(p.px - bb.x0, bb.x1 - p.px, p.py - bb.y0, bb.y1 - p.py);
                    margin = Math.min(margin, m);
                }
            });
            p.r = isFinite(margin) ? margin + 30 : 30;
        });
    }

    function boot(map) {
        buildWorld(map);
        buildLegend();
        updateProgress();
        requestAnimationFrame(loop);
    }

    if (typeof fetch === 'function') {
        fetch('map.json', { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
            .then(map => boot(map))
            .catch(() => boot(DEFAULT_MAP));
    } else {
        boot(DEFAULT_MAP);
    }
})();
