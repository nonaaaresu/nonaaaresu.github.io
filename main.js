document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar Grilla de Proyectos en index.html
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) {
        fetch('proyectos.json')
            .then(res => res.json())
            .then(proyectos => {
                projectsGrid.innerHTML = proyectos.map(p => `
                    <article class="project-card">
                        <a href="proyecto.html?id=${p.id}" class="project-link">
                            <figure class="project-media">
                                <img src="${p.portada}" alt="${p.titulo}" loading="lazy">
                            </figure>
                            <div class="project-tooltip">
                                <h3 class="project-title">${p.titulo}</h3>
                                <span class="project-tag">${p.categoria} — ${p.year}</span>
                            </div>
                        </a>
                    </article>
                `).join('');

                initHoverEffect();
            })
            .catch(err => console.error('Error al cargar proyectos:', err));
    }

    // 2. Cargar Detalle del Proyecto en proyecto.html
    const galleryContainer = document.getElementById('project-gallery');
    if (galleryContainer) {
        const params = new URLSearchParams(window.location.search);
        const projectId = params.get('id');

        fetch('proyectos.json')
            .then(res => res.json())
            .then(proyectos => {
                const proyecto = proyectos.find(p => p.id === projectId) || proyectos[0];
                if (!proyecto) return;

                document.title = `${proyecto.titulo} — BRUNO PIETRANERA`;
                document.getElementById('project-title').textContent = proyecto.titulo;
                document.getElementById('project-category').textContent = proyecto.categoria;
                document.getElementById('project-year').textContent = proyecto.year;
                document.getElementById('project-desc').textContent = proyecto.descripcion;

                galleryContainer.innerHTML = proyecto.imagenes.map(imgSrc => `
                    <img src="${imgSrc}" loading="lazy" alt="${proyecto.titulo}">
                `).join('');
            });
    }
});

// Función para mover la etiqueta con el cursor
function initHoverEffect() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        const tooltip = card.querySelector('.project-tooltip');
        if (!tooltip) return;

        card.addEventListener('mousemove', (e) => {
            tooltip.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 16}px, 0)`;
        });

        card.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
        });

        card.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
}