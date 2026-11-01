#!/usr/bin/env node
/*
 * Genera proyectos.json leyendo las carpetas de assets/proyectos/.
 * Cada carpeta = un proyecto:  assets/proyectos/<id>/info.json + las imágenes.
 * Uso:  node scripts/build-proyectos.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PROYECTOS_DIR = path.join(ROOT, 'assets', 'proyectos');
const OUTPUT = path.join(ROOT, 'proyectos.json');
const IMG_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;
const COVER = /^cover\.[a-z0-9]+$/i;
const REQUIRED = ['titulo', 'categoria', 'year', 'descripcion'];

// 1, 2, 10 en vez de 1, 10, 2
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
const toUrl = (...parts) => parts.map(encodeURIComponent).join('/');

if (!fs.existsSync(PROYECTOS_DIR)) {
    console.error(`No existe la carpeta ${PROYECTOS_DIR}`);
    process.exit(1);
}

const carpetas = fs.readdirSync(PROYECTOS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort(natural);

const proyectos = [];

for (const id of carpetas) {
    const dir = path.join(PROYECTOS_DIR, id);
    const infoPath = path.join(dir, 'info.json');

    if (!fs.existsSync(infoPath)) {
        console.warn(`⚠  "${id}": falta info.json, se omite.`);
        continue;
    }

    let info;
    try {
        info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    } catch (e) {
        console.error(`✖  "${id}": info.json tiene un error de formato (${e.message}).`);
        process.exitCode = 1;
        continue;
    }

    const faltan = REQUIRED.filter(k => !info[k]);
    if (faltan.length) {
        console.warn(`⚠  "${id}": faltan campos en info.json (${faltan.join(', ')}), se omite.`);
        continue;
    }

    const archivos = fs.readdirSync(dir).filter(f => IMG_EXT.test(f)).sort(natural);
    const cover = archivos.find(f => COVER.test(f));
    const galeria = archivos.filter(f => f !== cover);

    if (!cover && !galeria.length) {
        console.warn(`⚠  "${id}": no hay imágenes, se omite.`);
        continue;
    }

    proyectos.push({
        id,
        titulo: String(info.titulo).trim(),
        categoria: String(info.categoria).trim(),
        year: String(info.year).trim(),
        portada: toUrl('assets', 'proyectos', id, cover || galeria[0]),
        descripcion: String(info.descripcion).trim(),
        imagenes: galeria.map(f => toUrl('assets', 'proyectos', id, f)),
        orden: info.orden
    });
}

// Orden: primero "orden" manual si existe; si no, año más nuevo primero.
proyectos.sort((a, b) =>
    (a.orden ?? Infinity) - (b.orden ?? Infinity) ||
    b.year.localeCompare(a.year) ||
    natural(a.id, b.id)
);

const salida = proyectos.map(({ orden, ...resto }) => resto);
fs.writeFileSync(OUTPUT, JSON.stringify(salida, null, 4) + '\n');
console.log(`✔ proyectos.json generado con ${salida.length} proyecto(s).`);