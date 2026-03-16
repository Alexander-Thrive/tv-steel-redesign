const fs = require('fs');
const path = require('path');

const galleryPath = path.join(__dirname, 'gallery.html');
const galleryHtml = fs.readFileSync(galleryPath, 'utf-8');

const headerEndIndex = galleryHtml.indexOf('</header>') + '</header>'.length;
const footerStartIndex = galleryHtml.indexOf('<footer data-elementor-type="footer"');

if (headerEndIndex === -1 || footerStartIndex === -1) {
    console.error("Could not find header or footer tags");
    process.exit(1);
}

const headerPart = galleryHtml.substring(0, headerEndIndex);
const footerPart = galleryHtml.substring(footerStartIndex);

// Dynamic extraction of all images for the grid section
const urlRegex = /https:\/\/www\.treasurevalleysteel\.com\/wp-content\/uploads\/[0-9]{4}\/[0-9]{2}\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)/gi;
const allUrls = [];
let match;
while ((match = urlRegex.exec(galleryHtml)) !== null) {
    if (!match[0].toLowerCase().includes('logo') && !match[0].toLowerCase().includes('icon')) {
        allUrls.push(match[0]);
    }
}
const uniqueUrls = [...new Set(allUrls)];

// Featured Projects Data
const featuredProjects = [
    { panel: "3' Tuff Rib", color: "Shiny Black & White" },
    { panel: "7.2 & 3' Apex", color: "7.2 Ran in Shiny black & 3' Apex ran in Weathered Copper" },
    { panel: "1' Standing Seam", color: "Shiny Black" },
    { panel: "Board & Batten", color: "Board & Batten ran in Onyx Black. Trim & Soffit ran in 26 gauge Shiny Black" },
    { panel: "3' Tuff Rib & 7.2 Wainscot", color: "Roofing ran in Shiny Black, Siding ran in Wooden Concrete, & wainscot ran in Shiny Black" },
    { panel: "1' Standing Seam", color: "Light Gray" },
    { panel: "Board & Batten", color: "Naive Wood" },
    { panel: "3' Apex", color: "Siding in Wooden Concrete. Wainscot & Trim in Weathered Copper" },
    { panel: "Board & Batten", color: "Moss" },
    { panel: "1' Standing Seam", color: "Corten" }
];

const featuredProjectsWithImages = featuredProjects.map((proj, i) => {
    return {
        ...proj,
        image: uniqueUrls[i] || uniqueUrls[0]
    };
});

// Extract specific tab contents to map images to correct categories
const getTabContent = (html, tabTitle) => {
    // Find the ID of the tab based on its title
    const titleRegex = new RegExp(`<div[^>]*id="([^"]+)"[^>]*>[\\s\\S]*?${tabTitle}[\\s\\S]*?<\\/div>`, 'i');
    const titleMatch = html.match(titleRegex);
    
    if (!titleMatch) return "";
    
    const tabId = titleMatch[1];
    // Find the corresponding content panel
    // The panel ID usually matches or relates to the title ID, or we can just search for the title text first
    // In elementor tabs, title is e-n-tab-title-XXX and content is e-n-tab-content-XXX
    const baseId = tabId.replace('e-n-tab-title-', '');
    const contentRegex = new RegExp(`<div[^>]*id="e-n-tab-content-${baseId}"[\\s\\S]*?(?=<div[^>]*id="e-n-tab-content-|<footer>|<\\/main>)`, 'i');
    
    const contentMatch = html.match(contentRegex);
    return contentMatch ? contentMatch[0] : "";
};

const homeSweetHomeHtml = getTabContent(galleryHtml, 'Home Sweet Home');
const interiorDesignHtml = getTabContent(galleryHtml, 'Interior Design');
const localHtml = getTabContent(galleryHtml, 'Local');

const imagesJsObj = uniqueUrls.map((url, index) => {
    let cat = 'residential'; // default fallback shouldn't be needed but just in case
    
    // Check which block contains the URL
    if (homeSweetHomeHtml.includes(url)) {
        cat = 'residential';
    } else if (interiorDesignHtml.includes(url)) {
        cat = 'interior';
    } else if (localHtml.includes(url)) {
        cat = 'commercial';
    } else {
        // If it's only in 'Projects', default to residential to show somewhere, or keep as 'all'
        // User requested matching the specific tabs to filters.
        cat = 'residential'; 
    }
    
    const filename = url.split('/').pop().split('.')[0];
    const cleanTitle = filename.replace(/[-_0-9A-F]+/g, ' ').trim() || 'Steel Project';
    
    return {
        src: url,
        category: cat,
        title: cleanTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    };
});

// Build Carousel Slides
// Add dragging class to the wrap
const carouselHtml = featuredProjectsWithImages.map((proj, index) => {
    return `
        <div class="tvs-carousel-slide">
            <div class="tvs-slide-image-wrap">
                <div class="tvs-slide-image" style="background-image: url('${proj.image}');"></div>
                <div class="tvs-slide-overlay">
                    <span class="tvs-slide-kicker">Project ${(index + 1).toString().padStart(2, '0')}</span>
                    <div class="tvs-slide-specs">
                        <div class="tvs-slide-spec-group">
                            <h4>Panel</h4>
                            <p>${proj.panel}</p>
                        </div>
                        <div class="tvs-slide-spec-group">
                            <h4>Color</h4>
                            <p>${proj.color}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}).join('');

const imagesJson = JSON.stringify(imagesJsObj, null, 4);

// Brand Colors
const newContent = `
<main id="main" class="site-main" role="main">
    <div data-elementor-type="wp-page" data-elementor-id="320" class="elementor elementor-320" data-elementor-post-type="page">
        
        <style>
            :root {
                --tvs-blue: #1C2B3F;
                --tvs-blue-light: #2A3F5C;
                --tvs-grey: #6B7280;
                --tvs-light: #F3F4F6;
                --tvs-dark: #111827;
                --tvs-accent: #3B82F6;
            }

            /* NEW HEADERS */
            .tvs-section-title-wrap {
                text-align: center;
                margin-bottom: 70px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            .tvs-section-title {
                display: block;
                font-size: clamp(38px, 5vw, 64px);
                color: var(--tvs-blue);
                margin: 0;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 3px;
                position: relative;
                font-family: 'Poppins', sans-serif;
            }
            .tvs-section-title::before, .tvs-section-title::after {
                content: '';
                position: absolute;
                top: 50%;
                width: 60px;
                height: 3px;
                background-color: var(--tvs-blue);
            }
            .tvs-section-title::before { right: 100%; margin-right: 30px; }
            .tvs-section-title::after { left: 100%; margin-left: 30px; }
            
            .tvs-section-subtitle-overlay {
                font-size: 16px;
                color: var(--tvs-grey);
                text-transform: uppercase;
                letter-spacing: 5px;
                font-weight: 600;
                margin-bottom: 10px;
            }

            @media (max-width: 900px) {
                .tvs-section-title::before, .tvs-section-title::after { display: none; }
            }

            /* Featured Carousel Section */
            .tvs-featured-section {
                background: var(--tvs-light);
                padding: 100px 0; /* Full bleed carousel wrapper */
                font-family: 'Poppins', sans-serif;
                overflow: hidden;
            }
            
            .tvs-carousel-container {
                position: relative;
                width: 100%;
                display: flex;
                align-items: center;
                cursor: grab;
            }
            .tvs-carousel-container:active {
                cursor: grabbing;
            }
            
            .tvs-carousel-track {
                display: flex;
                gap: 20px;
                padding: 0 5%;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                scroll-behavior: smooth;
                -ms-overflow-style: none; /* IE and Edge */
                scrollbar-width: none; /* Firefox */
                width: 100%;
                /* allow physics overscroll but hide UI scrollbar */
            }
            .tvs-carousel-track.is-dragging {
                scroll-snap-type: none; /* disable snapping during free drag */
                scroll-behavior: auto;
            }
            
            .tvs-carousel-track::-webkit-scrollbar {
                display: none;
            }
            
            .tvs-carousel-slide {
                flex: 0 0 calc(90vw - 40px);
                max-width: 900px;
                scroll-snap-align: center;
                position: relative;
                pointer-events: none; /* Let parent container handle dragging */
            }
            
            .tvs-slide-image-wrap {
                position: relative;
                border-radius: 4px;
                overflow: hidden;
                aspect-ratio: 16/9;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            }
            
            .tvs-slide-image {
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                transition: transform 0.6s ease;
            }
            
            .tvs-slide-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(to top, rgba(28, 43, 63, 0.95) 0%, rgba(28, 43, 63, 0.4) 40%, rgba(28, 43, 63, 0) 100%);
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                padding: 50px;
                color: white;
                pointer-events: auto; /* Allow text selection/clicking inside */
            }
            
            .tvs-slide-kicker {
                display: inline-block;
                color: rgba(255,255,255,0.7);
                font-weight: 600;
                letter-spacing: 3px;
                text-transform: uppercase;
                font-size: 14px;
                margin-bottom: 20px;
            }
            
            .tvs-slide-specs {
                display: flex;
                gap: 50px;
                flex-wrap: wrap;
            }
            
            .tvs-slide-spec-group h4 {
                font-size: 15px;
                color: var(--tvs-accent);
                margin: 0 0 8px 0;
                text-transform: uppercase;
                font-weight: 700;
                letter-spacing: 1.5px;
            }
            .tvs-slide-spec-group p {
                font-size: 24px;
                color: white;
                margin: 0;
                font-weight: 300;
                line-height: 1.3;
            }
            
            /* Gallery Grid Section */
            .tvs-gallery-section {
                background: #ffffff;
                padding: 100px 0; /* Full width */
                font-family: 'Poppins', sans-serif;
                color: var(--tvs-blue);
            }
            
            .tvs-filter-container {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-bottom: 60px;
                flex-wrap: wrap;
                padding: 0 5%;
            }
            
            .tvs-filter-btn {
                background: transparent !important;
                border: 2px solid var(--tvs-blue) !important;
                color: var(--tvs-blue) !important;
                padding: 12px 28px;
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                letter-spacing: 1.5px;
            }
            
            .tvs-filter-btn.active, .tvs-filter-btn:hover {
                background: var(--tvs-blue) !important;
                border-color: var(--tvs-blue) !important;
                color: white !important;
                box-shadow: 0 4px 15px rgba(28, 43, 63, 0.2);
            }
            
            .tvs-grid {
                display: grid;
                /* Making thumbnails MUCH larger by forcing grid items to be min 400px (approx 4 across on 1080p) */
                grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); 
                gap: 8px; /* Extremely thin gutters */
                width: 100%;
            }
            
            /* For very large screens (2K/4K), explicitly set up to 6 across max to prevent them getting absurdly huge */
            @media (min-width: 2500px) {
                 .tvs-grid { grid-template-columns: repeat(6, 1fr); }
            }
            
            .tvs-grid-item {
                position: relative;
                overflow: hidden;
                aspect-ratio: 4/3; /* slightly wider than square for big thumbs */
                cursor: pointer;
                background: #111;
                opacity: 0;
                transform: scale(0.95);
            }
            
            .tvs-grid-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease;
                opacity: 0.85;
            }
            
            .tvs-grid-item::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(to top, rgba(28, 43, 63, 0.95) 0%, rgba(28, 43, 63, 0) 65%);
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            
            .tvs-grid-item-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                padding: 35px;
                color: white;
                z-index: 2;
                opacity: 0;
                transform: translateY(15px);
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            .tvs-grid-item-overlay h3 {
                margin: 0;
                font-size: 22px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 2px;
                border-left: 4px solid var(--tvs-accent);
                padding-left: 15px;
                line-height: 1.3;
            }
            
            .tvs-grid-item:hover img {
                transform: scale(1.08);
                opacity: 1;
            }
            
            .tvs-grid-item:hover::after, .tvs-grid-item:hover .tvs-grid-item-overlay {
                opacity: 1;
                transform: translateY(0);
            }
            
            /* Lightbox */
            .tvs-lightbox {
                position: fixed;
                inset: 0;
                background: rgba(17, 24, 39, 0.98);
                backdrop-filter: blur(5px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.4s ease;
            }
            
            .tvs-lightbox.active {
                opacity: 1;
                pointer-events: auto;
            }
            
            .tvs-lightbox-img {
                max-width: 90%;
                max-height: 85vh;
                border-radius: 4px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
                transform: scale(0.95);
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            .tvs-lightbox.active .tvs-lightbox-img {
                transform: scale(1);
            }
            
            .tvs-lightbox-close {
                position: absolute;
                top: 40px;
                right: 40px;
                color: white;
                font-size: 40px;
                line-height: 1;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.1);
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            .tvs-lightbox-close:hover {
                background: var(--tvs-blue);
            }
            
            .tvs-lightbox-caption {
                position: absolute;
                bottom: 40px;
                color: white;
                font-size: 16px;
                font-weight: 400;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
            
            @media (max-width: 768px) {
                .tvs-grid { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
                .tvs-slide-specs { flex-direction: column; gap: 20px; }
                .tvs-slide-overlay { padding: 30px; }
            }
        </style>

        <div class="elementor-element elementor-element-9e994e0 e-flex e-con-boxed e-con e-parent" data-id="9e994e0" data-element_type="container" data-e-type="container" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}" style="min-height: 520px; align-items: center; justify-content: center; display: flex;">
            <div class="e-con-inner" style="width: 100%;">
                <div class="elementor-element elementor-element-c0cfdf2 elementor-widget elementor-widget-heading" data-id="c0cfdf2" data-element_type="widget" data-e-type="widget" data-widget_type="heading.default">
                    <div class="elementor-widget-container" style="text-align: center;">
                        <h1 class="elementor-heading-title elementor-size-default" style="color: white !important; font-size: 64px; font-weight: 800; font-family: 'Poppins', sans-serif; text-transform: uppercase; margin: 0; padding-top: 100px;">Our Capabilities & Portfolio</h1>
                    </div>
                </div>
            </div>
        </div>
        
        <section class="tvs-featured-section">
            <div class="tvs-section-title-wrap">
                <div class="tvs-section-subtitle-overlay">Case Studies</div>
                <h2 class="tvs-section-title">Highlighted Projects</h2>
            </div>
            
            <div class="tvs-carousel-container" id="tvs-carousel-container">
                <div class="tvs-carousel-track" id="tvs-carousel">
                    ${carouselHtml}
                </div>
            </div>
        </section>

        <section class="tvs-gallery-section" id="tvs-gallery">
            <div class="tvs-section-title-wrap" style="margin-bottom: 50px;">
                <div class="tvs-section-subtitle-overlay">Our Work</div>
                <h2 class="tvs-section-title">Full Visual Gallery</h2>
            </div>
            
            <div class="tvs-filter-container">
                <button class="tvs-filter-btn active" data-filter="all">All Photos</button>
                <button class="tvs-filter-btn" data-filter="residential">Residential</button>
                <button class="tvs-filter-btn" data-filter="commercial">Commercial</button>
                <button class="tvs-filter-btn" data-filter="interior">Interior</button>
            </div>
            
            <div class="tvs-grid" id="tvs-grid-container">
            </div>
            
            <div class="tvs-lightbox" id="tvs-lightbox">
                <div class="tvs-lightbox-close">&times;</div>
                <img src="" alt="" class="tvs-lightbox-img" id="tvs-lightbox-img">
                <div class="tvs-lightbox-caption" id="tvs-lightbox-caption"></div>
            </div>
            
        </section>
        
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
        <script>
            const images = ${imagesJson};

            window.addEventListener('DOMContentLoaded', () => {
                // Drag and Auto Scroll Carousel Controls
                const carouselTrack = document.getElementById('tvs-carousel');
                
                let isDown = false;
                let startX;
                let scrollLeft;
                let isHovering = false;
                
                let scrollFloat = carouselTrack.scrollLeft;
                let lastTime = performance.now();

                // Physics Auto-Scroller (Sub-pixel precise)
                function autoScrollLoop(currentTime) {
                    const deltaTime = currentTime - lastTime;
                    lastTime = currentTime;
                    
                    // Only scroll if we aren't clicking or hovering
                    if (!isDown && !isHovering) {
                        // 80 pixels per second = 0.08 pixels per millisecond
                        scrollFloat += 0.08 * deltaTime;
                        
                        // If hit the end, reset seamlessly
                        if(Math.floor(scrollFloat) + carouselTrack.clientWidth >= carouselTrack.scrollWidth - 5) {
                            scrollFloat = 0;
                        }
                        
                        carouselTrack.scrollLeft = Math.floor(scrollFloat);
                    } else {
                        // Keep our math synced with user's manual dragging/scrolling
                        scrollFloat = carouselTrack.scrollLeft;
                    }
                    
                    requestAnimationFrame(autoScrollLoop);
                }

                // Initial start
                requestAnimationFrame(autoScrollLoop);
                
                carouselTrack.addEventListener('mouseenter', () => isHovering = true);
                carouselTrack.addEventListener('mouseleave', () => {
                    isHovering = false;
                    isDown = false;
                    carouselTrack.classList.remove('is-dragging');
                });

                // Mouse Drag Logic
                carouselTrack.addEventListener('mousedown', (e) => {
                    isDown = true;
                    carouselTrack.classList.add('is-dragging');
                    startX = e.pageX - carouselTrack.offsetLeft;
                    scrollLeft = carouselTrack.scrollLeft;
                });

                carouselTrack.addEventListener('mouseup', () => {
                    isDown = false;
                    carouselTrack.classList.remove('is-dragging');
                });

                carouselTrack.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - carouselTrack.offsetLeft;
                    const walk = (x - startX) * 2.5; // Scroll speed multiplier
                    carouselTrack.scrollLeft = scrollLeft - walk;
                    scrollFloat = carouselTrack.scrollLeft;
                });

                // Touch support for drag
                carouselTrack.addEventListener('touchstart', () => isHovering = true, {passive: true});
                carouselTrack.addEventListener('touchend', () => isHovering = false);

                // Grid Controls
                const gridContainer = document.getElementById('tvs-grid-container');
                const filters = document.querySelectorAll('.tvs-filter-btn');
                const lightbox = document.getElementById('tvs-lightbox');
                const lightboxImg = document.getElementById('tvs-lightbox-img');
                const lightboxCaption = document.getElementById('tvs-lightbox-caption');
                const lightboxClose = document.querySelector('.tvs-lightbox-close');

                function renderGallery(filter = 'all') {
                    gridContainer.innerHTML = '';
                    let items = [];
                    
                    images.forEach((img, index) => {
                        if (filter === 'all' || img.category === filter) {
                            const item = document.createElement('div');
                            item.className = 'tvs-grid-item';
                            item.innerHTML = '<img src="' + img.src + '" alt="' + img.title + '" loading="lazy">' +
                                             '<div class="tvs-grid-item-overlay">' +
                                                 '<h3>' + img.title + '</h3>' +
                                             '</div>';
                            
                            item.addEventListener('click', () => {
                                lightboxImg.src = img.src;
                                lightboxCaption.textContent = img.title;
                                lightbox.classList.add('active');
                            });
                            
                            gridContainer.appendChild(item);
                            items.push(item);
                        }
                    });

                    setTimeout(() => {
                        ScrollTrigger.batch(items, {
                            onEnter: batch => gsap.to(batch, { opacity: 1, scale: 1, stagger: 0.05, duration: 0.6, ease: "back.out(1.2)" }),
                            start: "top 95%"
                        });
                    }, 50);
                }

                renderGallery();

                filters.forEach(btn => {
                    btn.addEventListener('click', () => {
                        filters.forEach(f => f.classList.remove('active'));
                        btn.classList.add('active');
                        const filterVal = btn.getAttribute('data-filter');
                        
                        ScrollTrigger.getAll().forEach(t => {
                            if(t.vars.trigger && t.vars.trigger.classList && t.vars.trigger.classList.contains('tvs-grid-item')) {
                                t.kill();
                            }
                        });
                        
                        const currentItems = document.querySelectorAll('.tvs-grid-item');
                        if(currentItems.length > 0) {
                            gsap.to(currentItems, {
                                scale: 0.9, opacity: 0, duration: 0.2, onComplete: () => renderGallery(filterVal)
                            });
                        } else {
                            renderGallery(filterVal);
                        }
                    });
                });

                lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
                lightbox.addEventListener('click', (e) => {
                    if (e.target === lightbox) lightbox.classList.remove('active');
                });
            });
        </script>
    </div>
</main>
`;

const finalHtml = headerPart + newContent + footerPart;
fs.writeFileSync(path.join(__dirname, 'index.html'), finalHtml);
console.log("Successfully rebuilt index.html with large grid, fixed headings, and draggable scroll carousel!");
