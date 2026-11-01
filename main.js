const escapeHTML = (str = '') =>
    String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

async function loadProjects() {
    const res = await fetch('proyectos.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

const showMessage = (el, text) => {
    el.innerHTML = `<p class="empty-state">${text}</p>`;
};

/* 1. Grilla de proyectos (index.html) */
const projectsGrid = document.getElementById('projects-grid');
if (projectsGrid) {
    loadProjects()
        .then(proyectos => {
            projectsGrid.innerHTML = proyectos.map((p, i) => `
                <article class="project-card">
                    <a href="proyecto.html?id=${encodeURIComponent(p.id)}" class="project-link">
                        <figure class="project-media">
                            <img src="${escapeHTML(p.portada)}"
                                 alt="${escapeHTML(p.titulo)}"
                                 decoding="async"
                                 ${i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'}>
                        </figure>
                        <div class="project-tooltip">
                            <h3 class="project-title">${escapeHTML(p.titulo)}</h3>
                            <span class="project-tag">${escapeHTML(p.categoria)} — ${escapeHTML(p.year)}</span>
                        </div>
                    </a>
                </article>
            `).join('');

            initHoverEffect(projectsGrid);
        })
        .catch(err => {
            console.error('Error al cargar proyectos:', err);
            showMessage(projectsGrid, 'No se pudieron cargar los proyectos. Probá recargando la página.');
        });
}

/* 2. Detalle de proyecto (proyecto.html) */
const galleryContainer = document.getElementById('project-gallery');
if (galleryContainer) {
    const projectId = new URLSearchParams(window.location.search).get('id');

    loadProjects()
        .then(proyectos => {
            const proyecto = proyectos.find(p => p.id === projectId);

            if (!proyecto) {
                document.getElementById('project-title').textContent = 'Proyecto no encontrado';
                document.getElementById('project-desc').innerHTML =
                    '<a href="index.html">← Volver a proyectos</a>';
                return;
            }

            document.title = `${proyecto.titulo} — BRUNO "QWWRT" PIETRANERA`;
            document.querySelector('meta[name="description"]')
                ?.setAttribute('content', proyecto.descripcion.trim().slice(0, 155));

            document.getElementById('project-title').textContent = proyecto.titulo;
            document.getElementById('project-category').textContent = proyecto.categoria;
            document.getElementById('project-year').textContent = proyecto.year;
            document.getElementById('project-desc').textContent = proyecto.descripcion;

            const total = proyecto.imagenes.length;
            galleryContainer.innerHTML = proyecto.imagenes.map((src, i) => `
                <img src="${escapeHTML(src)}"
                     alt="${escapeHTML(proyecto.titulo)} — imagen ${i + 1} de ${total}"
                     decoding="async"
                     ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
            `).join('');
        })
        .catch(err => {
            console.error('Error al cargar el proyecto:', err);
            document.getElementById('project-title').textContent = 'No se pudo cargar el proyecto';
        });
}

/* Etiqueta que sigue al cursor: un solo listener, solo con mouse */
function initHoverEffect(grid) {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    let current = null;
    let tip = null;
    let x = 0, y = 0;
    let ticking = false;

    const place = () => {
        ticking = false;
        if (!tip) return;
        const pad = 16;
        const { width, height } = tip.getBoundingClientRect();
        let tx = x + pad;
        let ty = y + pad;
        // Si no entra a la derecha o abajo, se acomoda del otro lado del cursor
        if (tx + width > window.innerWidth - 8) tx = x - width - pad;
        if (ty + height > window.innerHeight - 8) ty = y - height - pad;
        tip.style.transform = `translate3d(${Math.max(8, tx)}px, ${Math.max(8, ty)}px, 0)`;
    };

    grid.addEventListener('pointermove', e => {
        const card = e.target.closest('.project-card');

        if (card !== current) {
            if (tip) tip.style.opacity = '0';
            current = card;
            tip = card ? card.querySelector('.project-tooltip') : null;
            if (tip) tip.style.opacity = '1';
        }

        x = e.clientX;
        y = e.clientY;
        if (tip && !ticking) {
            ticking = true;
            requestAnimationFrame(place);
        }
    });

    grid.addEventListener('pointerleave', () => {
        if (tip) tip.style.opacity = '0';
        current = null;
        tip = null;
    });
}