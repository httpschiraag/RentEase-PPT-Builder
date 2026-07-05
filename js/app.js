// ============================================
// RENTEASE PPT BUILDER — app.js
// AI-powered slide generator + editor + exporter
// ============================================

// ── Brand Constants ──────────────────────────────────────────────────────────
const RED   = '9B1C1C'; // Deep Rentease Red (hex, no #, for pptxgenjs)
const DARK  = '1A1A1A';
const WHITE = 'FFFFFF';
const LIGHT = 'F5F5F5';

// Rentease brand colours as CSS strings
const CSS_RED  = '#E32227';
const CSS_DARK = '#1A1A1A';

// ── API Keys (Google Custom Search — used for image lookup) ──────────────────
const IMG_SEARCH_API_KEY = 'AIzaSyCpgszqpGG0KPgC9RUiGdaNCKK22-n582s';
const IMG_SEARCH_CX      = '0506f8fd5d6bb470c';
const imageSearchCache   = {};

// ── Application State ─────────────────────────────────────────────────────────
let slides           = [];   // Array of slide data objects
let currentSlideIdx  = 0;   // Index of the currently-edited slide
let currentStep      = 1;   // Active wizard step (1-4)
let previewSlideIdx  = 0;   // Index shown in preview

// ── Slide data model ─────────────────────────────────────────────────────────
// Each slide = { id, layout, title, subtitle, bullets, imageQuery, blocks, ... }

// ── Available layouts ─────────────────────────────────────────────────────────
const LAYOUTS = [
    { id: 'title',       label: 'Title Slide',         desc: 'Cover / opening slide' },
    { id: 'image-text',  label: 'Image + Text',         desc: 'Left image, right bullets' },
    { id: 'text-image',  label: 'Text + Image',         desc: 'Left bullets, right image' },
    { id: 'bullets',     label: 'Full Text / Bullets',  desc: 'Text-only content slide' },
    { id: 'profile-quote', label: 'Profile & Quote',   desc: 'Person + quote callout' },
    { id: 'icon-grid',   label: 'Icon Grid',            desc: '6-point feature grid' },
    { id: 'four-images', label: 'Four Images',          desc: '2×2 image showcase' },
    { id: 'thank-you',   label: 'Thank You',            desc: 'Closing / contact slide' },
];

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    await initDB();
    setupNavigation();
    setupParticleCanvas();
    renderStep(1);
    updateResumePanelFromState();
});

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.addEventListener('click', function () {
            const step = parseInt(item.dataset.step);
            if (step === 2 && slides.length === 0) {
                alert('Generate or create at least one slide first.');
                return;
            }
            if ((step === 3 || step === 4) && slides.length === 0) {
                alert('You need slides before you can preview or export.');
                return;
            }
            goToStep(step);
        });
    });
}

function goToStep(step) {
    currentStep = step;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.classList.toggle('active', parseInt(item.dataset.step) === step);
    });

    renderStep(step);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RENDER ROUTER
// ─────────────────────────────────────────────────────────────────────────────
function renderStep(step) {
    const main = document.querySelector('.main-content');

    // Remove gamma-step class when leaving step 1
    main.classList.toggle('gamma-step', step === 1);

    switch (step) {
        case 1: renderStep1(main); break;
        case 2: renderStep2(main); break;
        case 3: renderStep3(main); break;
        case 4: renderStep4(main); break;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Gamma-style AI Prompt
// ─────────────────────────────────────────────────────────────────────────────
function renderStep1(main) {
    main.innerHTML = `
        <div class="gamma-hero-text">
            <h2>Rentease <span>AI</span></h2>
            <p>Type a topic. Get a presentation instantly.</p>
        </div>

        <div class="gamma-prompt-card">
            <textarea id="aiPromptInput" class="gamma-prompt-input"
                placeholder="E.g., Create a 6-slide corporate pitch deck for Rentease's new line of electric scissor lifts. Highlight eco-friendliness and safety..."></textarea>

            <div class="gamma-controls">
                <div class="gamma-settings">
                    <label>Slides:</label>
                    <input type="number" id="aiSlideCount" value="6" min="3" max="15" class="gamma-input-small">
                </div>
                <button id="aiGenerateBtn" class="gamma-generate-btn" onclick="generateAIPresentation()">
                    ✦ Generate
                </button>
            </div>

            <div id="aiLoadingStatus" class="gamma-loading" style="display:none;">
                <div class="gamma-spinner"></div>
                <p id="aiStatusText">AI is thinking…</p>
            </div>
        </div>
    `;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI PRESENTATION GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
async function generateAIPresentation() {
    const promptInput = document.getElementById('aiPromptInput');
    const slideCount  = parseInt(document.getElementById('aiSlideCount').value) || 6;
    const userPrompt  = (promptInput ? promptInput.value : '').trim();

    if (!userPrompt) {
        alert('Please type a topic or description first.');
        return;
    }

    const btn    = document.getElementById('aiGenerateBtn');
    const status = document.getElementById('aiLoadingStatus');
    const statusText = document.getElementById('aiStatusText');

    btn.disabled = true;
    status.style.display = 'block';
    statusText.textContent = 'Connecting to Gemini AI…';

    try {
        // Wait for the ESM module to load GoogleGenerativeAI
        let attempts = 0;
        while (!window.GoogleGenerativeAI && attempts < 40) {
            await new Promise(function (r) { setTimeout(r, 250); });
            attempts++;
        }
        if (!window.GoogleGenerativeAI) throw new Error('Google AI SDK not loaded.');

        statusText.textContent = 'AI is crafting your slides…';

        const genAI = new window.GoogleGenerativeAI('AIzaSyCZaKQPk0xEfCikfDjOSMuY0YGFQkMCL-s');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemInstruction = buildSystemPrompt(slideCount);
        const fullPrompt = systemInstruction + '\n\nUSER REQUEST:\n' + userPrompt;

        const result   = await model.generateContent(fullPrompt);
        const rawText  = result.response.text();

        statusText.textContent = 'Parsing slide data…';

        const parsed = parseAIResponse(rawText, slideCount);

        if (!parsed || parsed.length === 0) {
            throw new Error('AI returned no slides. Try rephrasing your prompt.');
        }

        statusText.textContent = 'Fetching images…';
        await enrichSlidesWithImages(parsed);

        slides = parsed;
        currentSlideIdx = 0;

        updateSlideBadge();
        updateResumePanelFromState();

        goToStep(2);

    } catch (err) {
        console.error('AI generation error:', err);
        alert('Generation failed: ' + err.message);
        btn.disabled = false;
        status.style.display = 'none';
    }
}

function buildSystemPrompt(slideCount) {
    return `You are a senior McKinsey-level business presentation writer and strategist for "RENTEASE LIMITED", a premium industrial equipment rental company based in India.

COMPANY CONTEXT:
- RentEase rents heavy equipment: cranes, aerial lifts (scissor lifts, boom lifts, JLG platforms), forklifts, earthmoving machinery, and material handling equipment
- Target clients: construction companies, infrastructure developers, event companies, warehouses
- Brand: Professional, reliable, safety-first, cutting-edge

YOUR TASK:
Generate exactly ${slideCount} slides based on the user's request. Output ONLY a raw JSON array (no markdown, no backticks, no code fences).

AVAILABLE LAYOUTS (use each where it makes sense):
1. "title"         — fields: title, subtitle
2. "image-text"    — fields: title, bullets (array of 3 strings), imageQuery (e.g. "scissor lift machinery")
3. "text-image"    — fields: title, bullets (array of 3 strings), imageQuery
4. "profile-quote" — fields: personName, personRole, quoteHighlight, bullets (array of 3 strings), imageQuery
5. "bullets"       — fields: title, bullets (array of 4-5 strings)
6. "icon-grid"     — fields: title, items (array of 6 objects: {icon, label, desc})
7. "four-images"   — fields: title, images (array of 4 objects: {label, imageQuery})
8. "thank-you"     — fields: title, subtitle, contactEmail, contactPhone, website

CRITICAL CONTENT RULES:
- NEVER use generic filler like "Our company is committed to excellence" or "We provide high-quality service"
- ALWAYS use specific, real-sounding data, percentages, product names, and industry terminology
- Bullets must be punchy (max 12 words each), starting with a strong action verb or metric
- Every imageQuery must be a specific, Google-searchable equipment or industry term
- First slide MUST use layout "title"
- Last slide MUST use layout "thank-you"
- Vary layouts — do not use the same layout twice in a row

OUTPUT FORMAT (pure JSON array, nothing else):
[
  { "layout": "title", "title": "...", "subtitle": "..." },
  { "layout": "image-text", "title": "...", "bullets": ["...", "...", "..."], "imageQuery": "..." },
  ...
]`;
}

function parseAIResponse(rawText, expectedCount) {
    // Strip markdown code fences if present
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    // Extract JSON array
    const start = cleaned.indexOf('[');
    const end   = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array found in AI response.');

    const jsonStr = cleaned.slice(start, end + 1);
    let parsed;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        // Try to fix common JSON issues
        const fixed = jsonStr
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
        parsed = JSON.parse(fixed);
    }

    if (!Array.isArray(parsed)) throw new Error('AI output is not a JSON array.');

    // Ensure each slide has an id
    return parsed.map(function (slide, idx) {
        slide.id = 'slide_' + Date.now() + '_' + idx;
        // Normalise bullets
        if (!slide.bullets) slide.bullets = [];
        if (!slide.items)   slide.items   = [];
        if (!slide.images)  slide.images  = [];
        return slide;
    });
}

// ── Image fetching ────────────────────────────────────────────────────────────
async function searchGoogleImage(query) {
    if (!query) return '';
    if (imageSearchCache[query]) return imageSearchCache[query];

    try {
        const q   = encodeURIComponent(query + ' equipment industrial');
        const url = `https://www.googleapis.com/customsearch/v1?key=${IMG_SEARCH_API_KEY}&cx=${IMG_SEARCH_CX}&q=${q}&searchType=image&num=1&imgSize=large&safe=active`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            const imgUrl = data.items[0].link;
            imageSearchCache[query] = imgUrl;
            return imgUrl;
        }
    } catch (e) {
        console.warn('Image search failed for:', query, e);
    }

    // Fallback: use a local layout PNG based on a hash of the query
    const fallback = localFallbackImage(query);
    imageSearchCache[query] = fallback;
    return fallback;
}

function localFallbackImage(query) {
    // Pick a layout PNG as a placeholder based on a simple hash
    const total = 29;
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
        hash = (hash * 31 + query.charCodeAt(i)) & 0xFFFF;
    }
    const num = (hash % total) + 1;
    const pad = num < 10 ? '0' + num : '' + num;
    return 'layouts/slide_' + pad + '.png';
}

async function enrichSlidesWithImages(slideArr) {
    const promises = [];
    slideArr.forEach(function (slide) {
        if (slide.imageQuery) {
            promises.push(
                searchGoogleImage(slide.imageQuery).then(function (url) {
                    slide._imageUrl = url;
                })
            );
        }
        if (slide.images && slide.images.length) {
            slide.images.forEach(function (img) {
                promises.push(
                    searchGoogleImage(img.imageQuery || img.label || '').then(function (url) {
                        img._imageUrl = url;
                    })
                );
            });
        }
    });
    await Promise.allSettled(promises);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Slide Editor
// ─────────────────────────────────────────────────────────────────────────────
function renderStep2(main) {
    main.classList.remove('gamma-step');

    if (slides.length === 0) {
        main.innerHTML = `
            <h2>Edit Slides</h2>
            <div class="editor-placeholder">
                <div class="placeholder-icon">🗂️</div>
                <p>No slides yet. Go back to Step 1 and generate a presentation.</p>
                <button class="add-btn add-btn-accent" onclick="goToStep(1)">← Go to Step 1</button>
            </div>
        `;
        return;
    }

    main.innerHTML = `
        <h2 style="margin-bottom:20px;">Edit Slides</h2>
        <div class="step2-layout">
            <div class="slide-list-panel" id="slideListPanel"></div>
            <div class="editor-area" id="editorArea"></div>
        </div>
    `;

    renderSlideList();
    renderSlideEditor(currentSlideIdx);
}

function renderSlideList() {
    const panel = document.getElementById('slideListPanel');
    if (!panel) return;

    let html = '';
    slides.forEach(function (slide, idx) {
        const isActive = idx === currentSlideIdx;
        const title    = slide.title || slide.personName || ('Slide ' + (idx + 1));
        html += `
            <div class="slide-thumb ${isActive ? 'active' : ''}" onclick="selectSlide(${idx})">
                <div class="slide-thumb-number">${idx + 1}</div>
                <div class="slide-thumb-info">
                    <span class="slide-thumb-layout">${slide.layout || 'slide'}</span>
                    <span class="slide-thumb-title">${escHtml(title)}</span>
                </div>
                <div class="slide-thumb-actions">
                    <button class="thumb-btn" title="Move up" onclick="event.stopPropagation(); moveSlide(${idx},-1)">▲</button>
                    <button class="thumb-btn thumb-btn-delete" title="Delete" onclick="event.stopPropagation(); deleteSlide(${idx})">✕</button>
                    <button class="thumb-btn" title="Move down" onclick="event.stopPropagation(); moveSlide(${idx},1)">▼</button>
                </div>
            </div>
        `;
    });

    html += `<button class="add-slide-btn" onclick="addNewSlide()">+ Add Slide</button>`;
    panel.innerHTML = html;
}

function selectSlide(idx) {
    currentSlideIdx = idx;
    renderSlideList();
    renderSlideEditor(idx);
}

function moveSlide(idx, dir) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const tmp = slides[idx];
    slides[idx]    = slides[newIdx];
    slides[newIdx] = tmp;
    if (currentSlideIdx === idx) currentSlideIdx = newIdx;
    renderSlideList();
    renderSlideEditor(currentSlideIdx);
}

function deleteSlide(idx) {
    if (slides.length === 1) { alert('You need at least one slide.'); return; }
    if (!confirm('Delete this slide?')) return;
    slides.splice(idx, 1);
    currentSlideIdx = Math.min(currentSlideIdx, slides.length - 1);
    updateSlideBadge();
    renderSlideList();
    renderSlideEditor(currentSlideIdx);
}

function addNewSlide() {
    const newSlide = {
        id: 'slide_' + Date.now(),
        layout: 'bullets',
        title: 'New Slide',
        bullets: ['Point one', 'Point two', 'Point three'],
    };
    slides.push(newSlide);
    currentSlideIdx = slides.length - 1;
    updateSlideBadge();
    renderSlideList();
    renderSlideEditor(currentSlideIdx);
}

// ── Slide editor form ─────────────────────────────────────────────────────────
function renderSlideEditor(idx) {
    const area  = document.getElementById('editorArea');
    if (!area) return;
    const slide = slides[idx];
    if (!slide) return;

    area.innerHTML = `
        <div class="editor-container">
            <div class="slide-preview-wrapper">
                <div class="slide-preview" id="livePreview">
                    ${buildSlidePreviewHTML(slide)}
                </div>
            </div>
            <div class="editor-panel">
                <div class="editor-heading">
                    Slide ${idx + 1} — 
                    <select id="layoutSelect" onchange="changeLayout(this.value)" style="font-family:inherit;padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px;font-size:0.95rem;">
                        ${LAYOUTS.map(function(l) {
                            return `<option value="${l.id}" ${slide.layout === l.id ? 'selected' : ''}>${l.label}</option>`;
                        }).join('')}
                    </select>
                </div>
                ${buildEditorForm(slide)}
            </div>
        </div>
    `;
}

function changeLayout(newLayout) {
    const slide = slides[currentSlideIdx];
    slide.layout = newLayout;
    // Preserve title if it exists
    if (!slide.title) slide.title = 'New Slide';
    if (!slide.bullets) slide.bullets = ['Point one', 'Point two', 'Point three'];
    if (!slide.items)   slide.items   = Array(6).fill(null).map(function(_, i) { return { icon: '⚡', label: 'Feature ' + (i+1), desc: 'Description' }; });
    if (!slide.images)  slide.images  = Array(4).fill(null).map(function(_, i) { return { label: 'Image ' + (i+1), imageQuery: 'industrial equipment' }; });
    renderSlideEditor(currentSlideIdx);
}

function buildEditorForm(slide) {
    switch (slide.layout) {
        case 'title':        return formTitle(slide);
        case 'image-text':   return formImageText(slide);
        case 'text-image':   return formImageText(slide, true);
        case 'bullets':      return formBullets(slide);
        case 'profile-quote':return formProfile(slide);
        case 'icon-grid':    return formIconGrid(slide);
        case 'four-images':  return formFourImages(slide);
        case 'thank-you':    return formThankYou(slide);
        default:             return formBullets(slide);
    }
}

// ── Form helpers ──────────────────────────────────────────────────────────────
function formField(label, id, value, tag, extraAttr) {
    tag = tag || 'input';
    value = value || '';
    const escapedValue = escHtml(value);
    if (tag === 'textarea') {
        return `<div class="form-group">
            <label>${label}</label>
            <textarea id="${id}" oninput="updateField('${id}')" ${extraAttr || ''}>${escapedValue}</textarea>
        </div>`;
    }
    return `<div class="form-group">
        <label>${label}</label>
        <input type="text" id="${id}" value="${escapedValue}" oninput="updateField('${id}')" ${extraAttr || ''}>
    </div>`;
}

function formTitle(s) {
    return formField('Title', 'f_title', s.title)
         + formField('Subtitle', 'f_subtitle', s.subtitle);
}

function formBullets(s) {
    const bullets = s.bullets || [];
    let html = formField('Slide Title', 'f_title', s.title);
    html += '<div class="form-group"><label>Bullet Points</label>';
    bullets.forEach(function (b, i) {
        html += `<input type="text" id="f_bullet_${i}" value="${escHtml(b)}" oninput="updateBullet(${i})" style="margin-bottom:8px;">`;
    });
    html += `</div>
    <div class="add-buttons">
        <button class="add-btn" onclick="addBullet()">+ Add Bullet</button>
        <button class="add-btn" onclick="removeBullet()">− Remove Last</button>
    </div>`;
    return html;
}

function formImageText(s, flip) {
    let html = formField('Slide Title', 'f_title', s.title);
    html += formField('Image Search Query', 'f_imageQuery', s.imageQuery || '');
    const bullets = s.bullets || [];
    html += '<div class="form-group"><label>Bullet Points</label>';
    bullets.forEach(function (b, i) {
        html += `<input type="text" id="f_bullet_${i}" value="${escHtml(b)}" oninput="updateBullet(${i})" style="margin-bottom:8px;">`;
    });
    html += `</div>
    <div class="add-buttons">
        <button class="add-btn" onclick="addBullet()">+ Add Bullet</button>
        <button class="add-btn" onclick="removeBullet()">− Remove Last</button>
        <button class="add-btn add-btn-accent" onclick="refreshImage()">🔄 Refresh Image</button>
    </div>`;
    return html;
}

function formProfile(s) {
    return formField('Person Name', 'f_personName', s.personName)
         + formField('Person Role', 'f_personRole', s.personRole)
         + formField('Quote / Highlight', 'f_quoteHighlight', s.quoteHighlight, 'textarea')
         + formField('Image Search Query', 'f_imageQuery', s.imageQuery || '');
}

function formIconGrid(s) {
    const items = s.items || [];
    let html = formField('Slide Title', 'f_title', s.title);
    html += '<div class="form-group"><label>Grid Items (icon | label | description)</label>';
    items.forEach(function (item, i) {
        html += `<div style="display:flex;gap:8px;margin-bottom:8px;">
            <input type="text" value="${escHtml(item.icon||'')}" oninput="updateIconItem(${i},'icon',this.value)" style="width:50px;text-align:center;" placeholder="⚡">
            <input type="text" value="${escHtml(item.label||'')}" oninput="updateIconItem(${i},'label',this.value)" placeholder="Label">
            <input type="text" value="${escHtml(item.desc||'')}" oninput="updateIconItem(${i},'desc',this.value)" placeholder="Short description" style="flex:2;">
        </div>`;
    });
    html += '</div>';
    return html;
}

function formFourImages(s) {
    const images = s.images || [];
    let html = formField('Slide Title', 'f_title', s.title);
    html += '<div class="form-group"><label>Images (label + search query)</label>';
    images.forEach(function (img, i) {
        html += `<div style="display:flex;gap:8px;margin-bottom:8px;">
            <input type="text" value="${escHtml(img.label||'')}" oninput="updateImageItem(${i},'label',this.value)" placeholder="Label">
            <input type="text" value="${escHtml(img.imageQuery||'')}" oninput="updateImageItem(${i},'imageQuery',this.value)" placeholder="Search query" style="flex:2;">
            <button class="add-btn" style="padding:4px 10px;font-size:0.75rem;" onclick="refreshImageItem(${i})">🔄</button>
        </div>`;
    });
    html += '</div>';
    return html;
}

function formThankYou(s) {
    return formField('Heading', 'f_title', s.title)
         + formField('Subtitle', 'f_subtitle', s.subtitle)
         + formField('Email', 'f_contactEmail', s.contactEmail)
         + formField('Phone', 'f_contactPhone', s.contactPhone)
         + formField('Website', 'f_website', s.website);
}

// ── Field update handlers ─────────────────────────────────────────────────────
function updateField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    const slide = slides[currentSlideIdx];
    const key   = fieldId.replace('f_', '');
    slide[key]  = el.value;
    refreshLivePreview();
}

function updateBullet(idx) {
    const el = document.getElementById('f_bullet_' + idx);
    if (!el) return;
    slides[currentSlideIdx].bullets[idx] = el.value;
    refreshLivePreview();
}

function addBullet() {
    const slide = slides[currentSlideIdx];
    if (!slide.bullets) slide.bullets = [];
    slide.bullets.push('New point');
    renderSlideEditor(currentSlideIdx);
}

function removeBullet() {
    const slide = slides[currentSlideIdx];
    if (!slide.bullets || slide.bullets.length <= 1) return;
    slide.bullets.pop();
    renderSlideEditor(currentSlideIdx);
}

function updateIconItem(idx, key, value) {
    const slide = slides[currentSlideIdx];
    if (!slide.items) slide.items = [];
    if (!slide.items[idx]) slide.items[idx] = {};
    slide.items[idx][key] = value;
    refreshLivePreview();
}

function updateImageItem(idx, key, value) {
    const slide = slides[currentSlideIdx];
    if (!slide.images) slide.images = [];
    if (!slide.images[idx]) slide.images[idx] = {};
    slide.images[idx][key] = value;
    refreshLivePreview();
}

async function refreshImage() {
    const slide = slides[currentSlideIdx];
    const query = slide.imageQuery;
    if (!query) return;
    delete imageSearchCache[query];
    const url = await searchGoogleImage(query);
    slide._imageUrl = url;
    refreshLivePreview();
}

async function refreshImageItem(idx) {
    const slide = slides[currentSlideIdx];
    const img   = slide.images[idx];
    if (!img) return;
    delete imageSearchCache[img.imageQuery];
    const url = await searchGoogleImage(img.imageQuery);
    img._imageUrl = url;
    refreshLivePreview();
}

function refreshLivePreview() {
    const container = document.getElementById('livePreview');
    if (!container) return;
    container.innerHTML = buildSlidePreviewHTML(slides[currentSlideIdx]);
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE PREVIEW HTML (the little in-app preview)
// ─────────────────────────────────────────────────────────────────────────────
function buildSlidePreviewHTML(slide) {
    const content = buildSlidePreviewContent(slide);
    return `
        <div class="slide-frame">
            <div class="sf-header">
                <div class="sf-title-bar">
                    <span class="sf-title-text">${escHtml(slide.title || slide.personName || 'RENTEASE')}</span>
                </div>
                <img src="assets/logo.png" class="sf-logo" alt="Rentease Logo" onerror="this.style.display='none'">
            </div>
            <div class="sf-body">
                ${content}
            </div>
            <div class="sf-footer">
                <span class="sf-footer-text"><span class="red">Rentease</span> Limited — Powered by trust.</span>
            </div>
        </div>
    `;
}

function buildSlidePreviewContent(slide) {
    switch (slide.layout) {
        case 'title':         return previewTitle(slide);
        case 'image-text':    return previewImageText(slide, false);
        case 'text-image':    return previewImageText(slide, true);
        case 'bullets':       return previewBullets(slide);
        case 'profile-quote': return previewProfile(slide);
        case 'icon-grid':     return previewIconGrid(slide);
        case 'four-images':   return previewFourImages(slide);
        case 'thank-you':     return previewThankYou(slide);
        default:              return previewBullets(slide);
    }
}

function previewTitle(s) {
    return `<div class="sf-content" style="display:flex;flex-direction:column;justify-content:center;text-align:center;padding:24px;">
        <div style="font-size:1.6rem;font-weight:800;color:${CSS_DARK};margin-bottom:12px;">${escHtml(s.title||'Title')}</div>
        <div style="font-size:0.9rem;color:#6B7280;">${escHtml(s.subtitle||'')}</div>
        <div style="margin-top:16px;width:60px;height:4px;background:${CSS_RED};border-radius:2px;margin-left:auto;margin-right:auto;"></div>
    </div>`;
}

function previewBullets(s) {
    const bullets = (s.bullets || []).map(function (b) {
        return `<div class="sf-text sf-bullet">• ${escHtml(b)}</div>`;
    }).join('');
    return `<div class="sf-content" style="padding:8px 16px;">
        ${bullets}
    </div>`;
}

function previewImageText(s, flip) {
    const imgStyle = s._imageUrl
        ? `background-image:url('${s._imageUrl}');background-size:cover;background-position:center;`
        : 'background:#F3F4F6;display:flex;align-items:center;justify-content:center;font-size:1.5rem;';
    const imgContent = s._imageUrl ? '' : '🏗️';
    const bullets    = (s.bullets || []).map(function (b) {
        return `<div class="sf-text sf-bullet">• ${escHtml(b)}</div>`;
    }).join('');

    const imgBlock = `<div class="sf-left">
        <div style="${imgStyle}width:100%;height:100px;border-radius:6px;overflow:hidden;">${imgContent}</div>
    </div>`;
    const txtBlock = `<div class="sf-right" style="padding:8px;">${bullets}</div>`;

    return flip ? txtBlock + imgBlock : imgBlock + txtBlock;
}

function previewProfile(s) {
    return `<div class="sf-body" style="display:flex;gap:12px;padding:8px;">
        <div style="flex:0 0 80px;display:flex;flex-direction:column;align-items:center;gap:6px;">
            <div style="width:56px;height:56px;border-radius:50%;border:2px solid ${CSS_RED};background:#FEE2E2;display:flex;align-items:center;justify-content:center;font-size:1.4rem;">👤</div>
            <div style="font-size:0.6rem;font-weight:700;text-align:center;">${escHtml(s.personName||'')}</div>
            <div style="font-size:0.55rem;color:#6B7280;text-align:center;">${escHtml(s.personRole||'')}</div>
        </div>
        <div style="flex:1;">
            <div style="font-size:0.75rem;font-style:italic;color:#374151;margin-bottom:8px;padding:8px;background:#F9FAFB;border-left:3px solid ${CSS_RED};border-radius:0 4px 4px 0;">"${escHtml(s.quoteHighlight||'')}"</div>
            ${(s.bullets||[]).map(function(b){ return `<div class="sf-text sf-bullet">• ${escHtml(b)}</div>`;}).join('')}
        </div>
    </div>`;
}

function previewIconGrid(s) {
    const items = (s.items || []).slice(0, 6);
    const cells = items.map(function (item) {
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;background:#F9FAFB;border-radius:6px;">
            <div style="font-size:1rem;">${item.icon||'⚡'}</div>
            <div style="font-size:0.55rem;font-weight:700;color:${CSS_DARK};text-align:center;">${escHtml(item.label||'')}</div>
            <div style="font-size:0.5rem;color:#6B7280;text-align:center;">${escHtml(item.desc||'')}</div>
        </div>`;
    }).join('');
    return `<div class="sf-content">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:4px;">${cells}</div>
    </div>`;
}

function previewFourImages(s) {
    const images = (s.images || []).slice(0, 4);
    const cells  = images.map(function (img) {
        const bg = img._imageUrl
            ? `background-image:url('${img._imageUrl}');background-size:cover;background-position:center;`
            : 'background:#E5E7EB;';
        return `<div style="display:flex;flex-direction:column;gap:4px;">
            <div style="${bg}height:60px;border-radius:4px;"></div>
            <div style="font-size:0.55rem;font-weight:600;color:#374151;text-align:center;">${escHtml(img.label||'')}</div>
        </div>`;
    }).join('');
    return `<div class="sf-content">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:4px;">${cells}</div>
    </div>`;
}

function previewThankYou(s) {
    return `<div class="sf-content" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:6px;padding:16px;">
        <div style="font-size:1.4rem;font-weight:800;color:${CSS_DARK};">${escHtml(s.title||'Thank You')}</div>
        <div style="font-size:0.75rem;color:#6B7280;">${escHtml(s.subtitle||'')}</div>
        <div style="margin:8px 0;width:40px;height:3px;background:${CSS_RED};border-radius:2px;"></div>
        <div style="font-size:0.65rem;color:#374151;">${escHtml(s.contactEmail||'')} ${s.contactPhone ? '· '+escHtml(s.contactPhone) : ''}</div>
        <div style="font-size:0.65rem;color:#6B7280;">${escHtml(s.website||'www.rentease.in')}</div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Preview
// ─────────────────────────────────────────────────────────────────────────────
function renderStep3(main) {
    main.classList.remove('gamma-step');
    previewSlideIdx = 0;

    main.innerHTML = `
        <h2 style="margin-bottom:20px;">Preview</h2>
        <div class="preview-screen">
            <div class="preview-topbar">
                <span class="preview-counter">Slide <strong id="previewCurrent">1</strong> of <strong>${slides.length}</strong></span>
                <div class="preview-nav-btns">
                    <button class="preview-nav-btn" id="prevBtn" onclick="previewNav(-1)">← Prev</button>
                    <button class="preview-nav-btn" id="nextBtn" onclick="previewNav(1)">Next →</button>
                    <div class="preview-btn-divider"></div>
                    <button class="preview-nav-btn primary" onclick="goToStep(4)">Export →</button>
                    <button class="preview-nav-btn danger" onclick="goToStep(2)">✏️ Edit</button>
                </div>
            </div>

            <div class="preview-slide-wrapper">
                <div class="preview-slide-canvas" id="previewCanvas"></div>
            </div>

            <div class="preview-dots" id="previewDots"></div>
            <div class="preview-hint">Use ← → arrow keys to navigate</div>
        </div>
    `;

    renderPreviewSlide();
    renderPreviewDots();
    setupPreviewKeyboard();
}

function renderPreviewSlide() {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    const slide  = slides[previewSlideIdx];
    if (!slide) return;

    canvas.innerHTML = buildSlidePreviewHTML(slide);

    const counter = document.getElementById('previewCurrent');
    if (counter) counter.textContent = previewSlideIdx + 1;

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.disabled = previewSlideIdx === 0;
    if (nextBtn) nextBtn.disabled = previewSlideIdx === slides.length - 1;

    // Update active dot
    document.querySelectorAll('.preview-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === previewSlideIdx);
    });
}

function renderPreviewDots() {
    const dotsEl = document.getElementById('previewDots');
    if (!dotsEl) return;
    dotsEl.innerHTML = slides.map(function (_, i) {
        return `<button class="preview-dot ${i === previewSlideIdx ? 'active' : ''}" onclick="previewJump(${i})"></button>`;
    }).join('');
}

function previewNav(dir) {
    const next = previewSlideIdx + dir;
    if (next < 0 || next >= slides.length) return;
    previewSlideIdx = next;
    renderPreviewSlide();
}

function previewJump(idx) {
    previewSlideIdx = idx;
    renderPreviewSlide();
}

function setupPreviewKeyboard() {
    document.onkeydown = function (e) {
        if (currentStep !== 3) return;
        if (e.key === 'ArrowLeft')  previewNav(-1);
        if (e.key === 'ArrowRight') previewNav(1);
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Export
// ─────────────────────────────────────────────────────────────────────────────
let selectedFormat = 'pptx';

function renderStep4(main) {
    main.classList.remove('gamma-step');

    const slideListHTML = slides.map(function (s, i) {
        const title = s.title || s.personName || ('Slide ' + (i + 1));
        return `<div class="export-slide-row">
            <div class="export-slide-num">${i + 1}</div>
            <span class="export-slide-layout">${s.layout}</span>
            <span class="export-slide-title">${escHtml(title)}</span>
        </div>`;
    }).join('');

    main.innerHTML = `
        <h2 style="margin-bottom:24px;">Export</h2>
        <div class="export-container">
            <div class="export-summary-panel">
                <div class="export-stats">
                    <div class="export-stat">
                        <span class="export-stat-num">${slides.length}</span>
                        <span class="export-stat-label">Slides</span>
                    </div>
                    <div class="export-stat">
                        <span class="export-stat-num">${countImages()}</span>
                        <span class="export-stat-label">Images</span>
                    </div>
                </div>
                <div class="export-slide-list">
                    <h4>Slide Overview</h4>
                    ${slideListHTML}
                </div>
            </div>

            <div class="export-action-panel">
                <div class="export-formats">
                    <div class="export-format-card active-format" id="fmt_pptx" onclick="selectFormat('pptx')">
                        <div class="export-format-icon">📊</div>
                        <div class="export-format-info">
                            <strong>PowerPoint (.pptx)</strong>
                            <p>Editable in Microsoft PowerPoint &amp; Google Slides</p>
                        </div>
                        <span class="format-check" id="check_pptx">✓</span>
                    </div>
                    <div class="export-format-card" id="fmt_pdf" onclick="selectFormat('pdf')">
                        <div class="export-format-icon">📄</div>
                        <div class="export-format-info">
                            <strong>PDF Document</strong>
                            <p>Universal format, perfect for sharing</p>
                        </div>
                        <span class="format-check" id="check_pdf" style="display:none;">✓</span>
                    </div>
                </div>

                <button class="export-btn" id="exportBtn" onclick="runExport()">
                    ⬇ Download Presentation
                </button>
                <p class="export-hint">Your slides will be packaged with all content and branding.</p>
            </div>
        </div>
    `;
}

function countImages() {
    let n = 0;
    slides.forEach(function (s) {
        if (s._imageUrl) n++;
        if (s.images) s.images.forEach(function (img) { if (img._imageUrl) n++; });
    });
    return n;
}

function selectFormat(fmt) {
    selectedFormat = fmt;
    ['pptx', 'pdf'].forEach(function (f) {
        document.getElementById('fmt_' + f).classList.toggle('active-format', f === fmt);
        const chk = document.getElementById('check_' + f);
        if (chk) chk.style.display = f === fmt ? '' : 'none';
    });
}

async function runExport() {
    const btn = document.getElementById('exportBtn');
    btn.disabled = true;
    btn.textContent = 'Building…';
    try {
        if (selectedFormat === 'pptx') {
            await exportPPTX();
        } else {
            await exportPDF();
        }
    } catch (err) {
        console.error('Export error:', err);
        alert('Export failed: ' + err.message);
    }
    btn.disabled = false;
    btn.textContent = '⬇ Download Presentation';
}

// ─────────────────────────────────────────────────────────────────────────────
// PPTX EXPORT (via pptxgenjs)
// ─────────────────────────────────────────────────────────────────────────────
async function exportPPTX() {
    if (typeof PptxGenJS === 'undefined') {
        throw new Error('PptxGenJS library not loaded. Check your internet connection.');
    }

    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE'; // 16:9

    // Slide dimensions in inches (13.33 x 7.5)
    const SW = 13.33;
    const SH = 7.5;

    for (let i = 0; i < slides.length; i++) {
        const slideData = slides[i];
        const slide     = pres.addSlide();

        // Common frame: top red bar + logo + footer
        await addCommonFrame(pres, slide, slideData, SW, SH);
        // Layout-specific content
        await addSlideContent(slide, slideData, SW, SH);
    }

    await pres.writeFile({ fileName: 'Rentease_Presentation.pptx' });
}

async function addCommonFrame(pres, slide, slideData, SW, SH) {
    // Background
    slide.background = { color: WHITE };

    // Top red bar
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: SW, h: 0.85,
        fill: { color: '9B1C1C' },
        line: { color: '9B1C1C' },
    });

    // Slide title on red bar
    const barTitle = slideData.title || slideData.personName || 'RENTEASE';
    slide.addText(barTitle.toUpperCase(), {
        x: 0.3, y: 0.05, w: SW - 2, h: 0.75,
        fontSize: 20, bold: true, color: WHITE,
        fontFace: 'Segoe UI',
        valign: 'middle',
    });

    // Logo on top-right (use text placeholder if logo fetch fails)
    try {
        slide.addImage({
            path: 'assets/logo.png',
            x: SW - 1.6, y: 0.05, w: 1.4, h: 0.75,
            sizing: { type: 'contain', w: 1.4, h: 0.75 },
        });
    } catch (e) {
        slide.addText('RENTEASE', {
            x: SW - 1.8, y: 0.1, w: 1.6, h: 0.65,
            fontSize: 10, bold: true, color: WHITE,
            fontFace: 'Segoe UI', align: 'right',
        });
    }

    // Footer dashed line (simulated with a thin rectangle)
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: SH - 0.45, w: SW, h: 0.02,
        fill: { color: '93C5FD' },
        line: { color: '93C5FD' },
    });

    // Footer text
    slide.addText([
        { text: 'Rentease', options: { bold: true, color: '9B1C1C' } },
        { text: ' Limited — Powered by trust.', options: { color: DARK } },
    ], {
        x: 0.3, y: SH - 0.42, w: SW - 0.6, h: 0.38,
        fontSize: 9, fontFace: 'Segoe UI', valign: 'middle',
    });
}

async function addSlideContent(slide, slideData, SW, SH) {
    // Content area starts below header
    const CX = 0.3;
    const CY = 1.0;
    const CW = SW - 0.6;
    const CH = SH - 1.6;

    switch (slideData.layout) {
        case 'title':         await pptxTitle(slide, slideData, CX, CY, CW, CH, SW, SH);   break;
        case 'image-text':    await pptxImageText(slide, slideData, CX, CY, CW, CH, false); break;
        case 'text-image':    await pptxImageText(slide, slideData, CX, CY, CW, CH, true);  break;
        case 'bullets':       pptxBullets(slide, slideData, CX, CY, CW, CH);                break;
        case 'profile-quote': await pptxProfile(slide, slideData, CX, CY, CW, CH);          break;
        case 'icon-grid':     pptxIconGrid(slide, slideData, CX, CY, CW, CH);               break;
        case 'four-images':   await pptxFourImages(slide, slideData, CX, CY, CW, CH);       break;
        case 'thank-you':     pptxThankYou(slide, slideData, CX, CY, CW, CH, SW, SH);      break;
        default:              pptxBullets(slide, slideData, CX, CY, CW, CH);
    }
}

// ── PPTX layout builders ──────────────────────────────────────────────────────

async function pptxTitle(slide, s, CX, CY, CW, CH, SW, SH) {
    // Override the red bar with just RENTEASE — no slide title needed
    // Big centered title
    slide.addText(s.title || 'Rentease', {
        x: CX, y: CY, w: CW, h: CH * 0.5,
        fontSize: 40, bold: true, color: DARK,
        fontFace: 'Segoe UI', align: 'center', valign: 'bottom',
    });
    // Subtitle
    if (s.subtitle) {
        slide.addText(s.subtitle, {
            x: CX, y: CY + CH * 0.5 + 0.1, w: CW, h: CH * 0.25,
            fontSize: 18, color: '6B7280',
            fontFace: 'Segoe UI', align: 'center', valign: 'top',
        });
    }
    // Red accent line
    slide.addShape('rect', {
        x: SW / 2 - 0.6, y: CY + CH * 0.5 + 0.08, w: 1.2, h: 0.06,
        fill: { color: '9B1C1C' }, line: { color: '9B1C1C' },
    });
}

async function pptxImageText(slide, s, CX, CY, CW, CH, flip) {
    const imgW   = CW * 0.45;
    const txtX   = flip ? CX : CX + imgW + 0.3;
    const imgX   = flip ? CX + CW - imgW : CX;
    const txtW   = CW - imgW - 0.3;

    // Bullets text
    const bulletObjs = (s.bullets || []).map(function (b) {
        return { text: '• ' + b, options: { bullet: false, paraSpaceAfter: 6, color: DARK } };
    });
    slide.addText(bulletObjs, {
        x: txtX, y: CY + 0.1, w: txtW, h: CH - 0.2,
        fontSize: 14, fontFace: 'Segoe UI', valign: 'middle',
        lineSpacingMultiple: 1.4,
    });

    // Image
    if (s._imageUrl && isHttpUrl(s._imageUrl)) {
        try {
            slide.addImage({ path: s._imageUrl, x: imgX, y: CY + 0.1, w: imgW, h: CH - 0.2, sizing: { type: 'cover', w: imgW, h: CH - 0.2 } });
            return;
        } catch (e) { /* fall through to placeholder */ }
    }
    // Placeholder rect
    slide.addShape('rect', {
        x: imgX, y: CY + 0.1, w: imgW, h: CH - 0.2,
        fill: { color: 'F3F4F6' }, line: { color: 'D1D5DB' },
    });
    slide.addText('🏗️', { x: imgX, y: CY + CH / 2 - 0.3, w: imgW, h: 0.6, fontSize: 28, align: 'center' });
}

function pptxBullets(slide, s, CX, CY, CW, CH) {
    const bulletObjs = (s.bullets || []).map(function (b) {
        return { text: '• ' + b, options: { paraSpaceAfter: 8, color: DARK } };
    });
    if (bulletObjs.length === 0) return;
    slide.addText(bulletObjs, {
        x: CX, y: CY, w: CW, h: CH,
        fontSize: 16, fontFace: 'Segoe UI', valign: 'middle',
        lineSpacingMultiple: 1.5,
    });
}

async function pptxProfile(slide, s, CX, CY, CW, CH) {
    const avatarW = 1.8;
    // Avatar circle placeholder
    slide.addShape('ellipse', {
        x: CX, y: CY + 0.2, w: avatarW, h: avatarW,
        fill: { color: 'FEE2E2' }, line: { color: '9B1C1C', pt: 2 },
    });
    slide.addText('👤', { x: CX, y: CY + 0.4, w: avatarW, h: 1.4, fontSize: 32, align: 'center' });
    slide.addText(s.personName || '', {
        x: CX, y: CY + avatarW + 0.3, w: avatarW, h: 0.4,
        fontSize: 12, bold: true, align: 'center', color: DARK, fontFace: 'Segoe UI',
    });
    slide.addText(s.personRole || '', {
        x: CX, y: CY + avatarW + 0.7, w: avatarW, h: 0.35,
        fontSize: 10, align: 'center', color: '6B7280', fontFace: 'Segoe UI',
    });

    // Quote
    const qx = CX + avatarW + 0.4;
    const qw = CW - avatarW - 0.4;
    if (s.quoteHighlight) {
        slide.addShape('rect', {
            x: qx, y: CY + 0.1, w: 0.06, h: CH * 0.4,
            fill: { color: '9B1C1C' }, line: { color: '9B1C1C' },
        });
        slide.addText('"' + s.quoteHighlight + '"', {
            x: qx + 0.15, y: CY + 0.1, w: qw - 0.15, h: CH * 0.4,
            fontSize: 14, italic: true, color: '374151', fontFace: 'Segoe UI', valign: 'middle',
        });
    }
    const bulletObjs = (s.bullets || []).map(function (b) {
        return { text: '• ' + b, options: { paraSpaceAfter: 6, color: DARK } };
    });
    if (bulletObjs.length) {
        slide.addText(bulletObjs, {
            x: qx, y: CY + CH * 0.4 + 0.2, w: qw, h: CH * 0.55,
            fontSize: 13, fontFace: 'Segoe UI',
        });
    }
}

function pptxIconGrid(slide, s, CX, CY, CW, CH) {
    const items  = (s.items || []).slice(0, 6);
    const cols   = 3;
    const rows   = 2;
    const cellW  = CW / cols;
    const cellH  = CH / rows;

    items.forEach(function (item, i) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x   = CX + col * cellW + 0.1;
        const y   = CY + row * cellH + 0.1;
        const w   = cellW - 0.2;
        const h   = cellH - 0.2;

        slide.addShape('roundRect', {
            x, y, w, h,
            fill: { color: 'F9FAFB' }, line: { color: 'E5E7EB' },
            rectRadius: 0.08,
        });
        slide.addText(item.icon || '⚡', {
            x, y: y + 0.1, w, h: 0.5, fontSize: 22, align: 'center',
        });
        slide.addText(item.label || '', {
            x, y: y + 0.6, w, h: 0.3,
            fontSize: 11, bold: true, align: 'center', color: DARK, fontFace: 'Segoe UI',
        });
        slide.addText(item.desc || '', {
            x, y: y + 0.9, w, h: h - 1.0,
            fontSize: 9, align: 'center', color: '6B7280', fontFace: 'Segoe UI',
            lineSpacingMultiple: 1.2,
        });
    });
}

async function pptxFourImages(slide, s, CX, CY, CW, CH) {
    const images = (s.images || []).slice(0, 4);
    const cols   = 2;
    const rows   = 2;
    const cellW  = CW / cols;
    const cellH  = CH / rows;
    const imgH   = cellH * 0.75;

    for (let i = 0; i < images.length; i++) {
        const img  = images[i];
        const col  = i % cols;
        const row  = Math.floor(i / cols);
        const x    = CX + col * cellW + 0.1;
        const y    = CY + row * cellH + 0.1;
        const w    = cellW - 0.2;

        if (img._imageUrl && isHttpUrl(img._imageUrl)) {
            try {
                slide.addImage({ path: img._imageUrl, x, y, w, h: imgH, sizing: { type: 'cover', w, h: imgH } });
            } catch (e) {
                slide.addShape('rect', { x, y, w, h: imgH, fill: { color: 'E5E7EB' }, line: { color: 'D1D5DB' } });
            }
        } else {
            slide.addShape('rect', { x, y, w, h: imgH, fill: { color: 'E5E7EB' }, line: { color: 'D1D5DB' } });
        }

        slide.addText(img.label || '', {
            x, y: y + imgH + 0.05, w, h: cellH - imgH - 0.15,
            fontSize: 10, bold: true, align: 'center', color: DARK, fontFace: 'Segoe UI',
        });
    }
}

function pptxThankYou(slide, s, CX, CY, CW, CH, SW, SH) {
    slide.addText(s.title || 'Thank You', {
        x: CX, y: CY, w: CW, h: CH * 0.4,
        fontSize: 36, bold: true, color: DARK,
        fontFace: 'Segoe UI', align: 'center', valign: 'bottom',
    });
    if (s.subtitle) {
        slide.addText(s.subtitle, {
            x: CX, y: CY + CH * 0.4 + 0.1, w: CW, h: CH * 0.15,
            fontSize: 16, color: '6B7280', fontFace: 'Segoe UI', align: 'center',
        });
    }
    slide.addShape('rect', {
        x: SW / 2 - 0.5, y: CY + CH * 0.4 + 0.08, w: 1.0, h: 0.05,
        fill: { color: '9B1C1C' }, line: { color: '9B1C1C' },
    });

    const contactLines = [];
    if (s.contactEmail) contactLines.push(s.contactEmail);
    if (s.contactPhone) contactLines.push(s.contactPhone);
    if (s.website)      contactLines.push(s.website);

    if (contactLines.length) {
        slide.addText(contactLines.join('  ·  '), {
            x: CX, y: CY + CH * 0.65, w: CW, h: 0.5,
            fontSize: 12, color: '374151', fontFace: 'Segoe UI', align: 'center',
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EXPORT (via html2canvas + jsPDF)
// ─────────────────────────────────────────────────────────────────────────────
async function exportPDF() {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
        throw new Error('jsPDF library not loaded.');
    }
    if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas library not loaded.');
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });

    // Create an off-screen container
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1280px;height:720px;background:white;overflow:hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < slides.length; i++) {
        container.innerHTML = `<div style="width:1280px;height:720px;background:white;font-family:Segoe UI,sans-serif;">
            ${buildSlidePreviewHTML(slides[i])}
        </div>`;

        const canvas = await html2canvas(container, { scale: 1, useCORS: true, allowTaint: true });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) pdf.addPage([1280, 720], 'landscape');
        pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
    }

    document.body.removeChild(container);
    pdf.save('Rentease_Presentation.pdf');
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE CANVAS BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
function setupParticleCanvas() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function randBetween(a, b) { return a + Math.random() * (b - a); }

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: randBetween(1, 3),
            vx: randBetween(-0.3, 0.3),
            vy: randBetween(-0.3, 0.3),
            alpha: randBetween(0.05, 0.25),
        };
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(function (p) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(227,34,39,' + p.alpha + ')';
            ctx.fill();
        });

        // Draw connecting lines for nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx   = particles[i].x - particles[j].x;
                const dy   = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(227,34,39,' + (0.05 * (1 - dist / 120)) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }

    draw();
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR BADGE + RESUME PANEL
// ─────────────────────────────────────────────────────────────────────────────
function updateSlideBadge() {
    const badge = document.getElementById('slideBadge');
    if (!badge) return;
    if (slides.length > 0) {
        badge.textContent = slides.length;
        badge.classList.add('visible');
    } else {
        badge.classList.remove('visible');
    }
}

function updateResumePanelFromState() {
    const panel = document.getElementById('resumePanel');
    const info  = document.getElementById('resumeInfo');
    if (!panel || !info) return;
    if (slides.length > 0) {
        panel.style.display = 'flex';
        info.textContent = slides.length + ' slide' + (slides.length !== 1 ? 's' : '') + ' in progress';
    } else {
        panel.style.display = 'none';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
}

function isHttpUrl(url) {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
}
