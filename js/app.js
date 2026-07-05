// ============================================
// RENTEASE PPT BUILDER — Core Framework
// ============================================

// ============================================
// 1. PRESENTATION DATA MODEL
// ============================================

let presentation = { slides: [] };
let activeSlideId = null;
let blockCounter = 0;
let slideCounter = 0;
let currentPreviewIndex = 0;

// ============================================
// 2. DOM REFERENCES
// ============================================

const navItems = document.querySelectorAll('.nav-item');
const mainContent = document.querySelector('.main-content');
// Add gamma-step class on initial load so step 1 gets the centred layout
mainContent.classList.add('gamma-step');
const step1Content = mainContent.innerHTML;
let selectedLayout = null;

const stepContent = {
    3: `
        <h2>Preview</h2>
        <p class="subtitle">Review your presentation before exporting</p>
        <div class="editor-placeholder">
            <div class="placeholder-icon">👁️</div>
            <p>Your slide preview will appear here.</p>
        </div>
    `,
    4: `
        <h2>Export</h2>
        <p class="subtitle">Download your presentation</p>
        <div class="editor-placeholder">
            <div class="placeholder-icon">📥</div>
            <p>Export options will appear here.</p>
        </div>
    `
};

const layoutNames = {
    'title-slide': 'Title Slide',
    'image-text': 'Image + Text',
    'icon-grid': 'Icon Grid',
    'text-image': 'Text + Image',
    'profile-quote': 'Profile / Quote',
    'image-showcase': 'Image Showcase',
    'image-grid-labels': 'Image Grid + Labels',
    'equipment-comparison': 'Equipment Comparison',
    'thank-you': 'Thank You / Contact'
};

// ============================================
// 3. SLIDE MANAGEMENT
// ============================================

function addSlide(layoutType) {
    const slideId = 'slide-' + slideCounter;
    slideCounter++;

    const slide = {
        id: slideId,
        layout: layoutType,
        title: '',
        blocks: [],
        // Extra fields used by specific layouts
        fields: {}
    };

    // Pre-fill default fields per layout
    if (layoutType === 'title-slide') {
        slide.fields = {
            companyName: 'RENTEASE LIMITED',
            subtitle: 'Corporate Presentation',
            tagline: 'MAKE THE DIFFERENCE'
        };
    }

    if (layoutType === 'thank-you') {
        slide.fields = {
            address: '705-706, The Landmark, Plot 26A, Sector 7, Kharghar, Navi Mumbai - 410210',
            phone: '+91 22 2774 7458',
            email: 'info@rentease.co'
        };
    }

    if (layoutType === 'image-grid-labels') {
        slide.fields = {
            cells: [
                { src: '', label: '' },
                { src: '', label: '' },
                { src: '', label: '' },
                { src: '', label: '' }
            ]
        };
    }

    if (layoutType === 'equipment-comparison') {
        slide.fields = {
            leftImage: '',
            leftBullets: ['', '', ''],
            centerTitle: '',
            centerDesc: '',
            tableRows: [
                { col1: '', col2: '', col3: '' }
            ],
            rightImage: '',
            rightBullets: ['', '', '']
        };
    }

    if (layoutType === 'profile-quote') {
        slide.fields = {
            photo: '',
            personName: '',
            personRole: '',
            quoteHighlight: ''
        };
    }

    presentation.slides.push(slide);
    activeSlideId = slideId;
    updateSidebarStatus();
    savePresentation();
    return slide;
}

function removeSlide(slideId) {
    presentation.slides = presentation.slides.filter(s => s.id !== slideId);
    if (activeSlideId === slideId) {
        activeSlideId = presentation.slides.length > 0
            ? presentation.slides[presentation.slides.length - 1].id
            : null;
    }
    updateSidebarStatus();
    savePresentation();
    renderStep2();
}

function moveSlide(slideId, direction) {
    const index = presentation.slides.findIndex(s => s.id === slideId);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= presentation.slides.length) return;
    const slide = presentation.slides.splice(index, 1)[0];
    presentation.slides.splice(newIndex, 0, slide);
    updateSidebarStatus();
    savePresentation();
    renderStep2();
}

function getActiveSlide() {
    return presentation.slides.find(s => s.id === activeSlideId);
}

function selectSlide(slideId) {
    activeSlideId = slideId;
    renderStep2();
}

// ============================================
// 4. BLOCK MANAGEMENT
// ============================================

function addBlock(type) {
    const slide = getActiveSlide();
    if (!slide) return;

    const blockId = 'block-' + blockCounter++;

    if (type === 'image') {
        slide.blocks.push({ id: blockId, type: 'image', src: '', caption: '', shape: 'circle' });
    } else if (type === 'icon') {
        slide.blocks.push({ id: blockId, type: 'icon', src: '', label: '' });
    } else if (type === 'logo') {
        slide.blocks.push({ id: blockId, type: 'logo', src: '' });
    } else {
        slide.blocks.push({ id: blockId, type: type, text: '' });
    }
    savePresentation();
    renderStep2();

}

function removeBlock(blockId) {
    const slide = getActiveSlide();
    if (!slide) return;
    slide.blocks = slide.blocks.filter(b => b.id !== blockId);
    savePresentation();
    renderStep2();
}

function updateBlockText(blockId, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) block.text = value;
    updateSlidePreview();
}

function updateBlockLabel(blockId, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) block.label = value;
    updateSlidePreview();
}

function updateSlideTitle(value) {
    const slide = getActiveSlide();
    if (slide) slide.title = value;
    updateSlidePreview();
}

function updateField(fieldName, value) {
    const slide = getActiveSlide();
    if (slide) slide.fields[fieldName] = value;
    updateSlidePreview();
}

function updateImageCaption(blockId, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) block.caption = value;
    updateSlidePreview();
}

function updateImageShape(blockId, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) block.shape = value;
    updateSlidePreview();
}

// Handles image blocks (Image+Text, Image Showcase etc.)
function handleImageUpload(blockId, event) {
    const file = event.target.files[0];
    if (!file) return;
    const imageKey = 'img_' + blockId;
    dbSaveImage(imageKey, file).then(function() {
        return dbLoadImage(imageKey);
    }).then(function(url) {
        const slide = getActiveSlide();
        if (!slide) return;
        const block = slide.blocks.find(function(b) { return b.id === blockId; });
        if (block) {
            block.src = url;
            block.imageKey = imageKey;
            savePresentation();
            updateSlidePreview();
        }
    });
}

// Handles field images (profile photo, comparison images)
function handleFieldImageUpload(fieldName, event) {
    const file = event.target.files[0];
    if (!file) return;
    const imageKey = 'field_' + activeSlideId + '_' + fieldName;
    dbSaveImage(imageKey, file).then(function() {
        return dbLoadImage(imageKey);
    }).then(function(url) {
        const slide = getActiveSlide();
        if (slide) {
            slide.fields[fieldName] = url;
            slide.fields[fieldName + '_key'] = imageKey;
            savePresentation();
            updateSlidePreview();
        }
    });
}
// Handles 2x2 grid cell images
function handleCellImageUpload(index, event) {
    const file = event.target.files[0];
    if (!file) return;
    const imageKey = 'cell_' + activeSlideId + '_' + index;
    dbSaveImage(imageKey, file).then(function() {
        return dbLoadImage(imageKey);
    }).then(function(url) {
        const slide = getActiveSlide();
        if (slide && slide.fields.cells) {
            slide.fields.cells[index].src = url;
            slide.fields.cells[index].imageKey = imageKey;
            savePresentation();
            updateSlidePreview();
        }
    });
}

function updateComparisonField(side, index, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    if (side === 'leftBullets' || side === 'rightBullets') {
        slide.fields[side][index] = value;
    } else {
        slide.fields[side] = value;
    }
    updateSlidePreview();
}

// Handles equipment comparison side images
function handleComparisonImage(side, event) {
    const file = event.target.files[0];
    if (!file) return;
    const imageKey = 'comp_' + activeSlideId + '_' + side;
    dbSaveImage(imageKey, file).then(function() {
        return dbLoadImage(imageKey);
    }).then(function(url) {
        const slide = getActiveSlide();
        if (slide) {
            slide.fields[side] = url;
            slide.fields[side + '_key'] = imageKey;
            savePresentation();
            updateSlidePreview();
        }
    });
}
// ============================================
// 5. EDITOR HTML — one case per layout
// ============================================

function getEditorHTML(slide) {
    let blocksHTML = '';
    slide.blocks.forEach(b => { blocksHTML += getBlockHTML(b); });

    const previewHTML = getSlidePreviewHTML(slide);

    // ------- Shared wrapper -------
    const wrapEditor = (formFields) => `
        <div class="editor-container">
            <div class="slide-preview-wrapper">
                <div class="slide-preview" id="slidePreview">
                    ${previewHTML}
                </div>
            </div>
            <div class="editor-panel">
                <h3 class="editor-heading">Edit: ${layoutNames[slide.layout]}</h3>
                ${formFields}
            </div>
        </div>
    `;

    const titleField = `
        <div class="form-group">
            <label>Slide Title</label>
            <input type="text" id="slideTitle" placeholder="e.g. COMPANY PROFILE" oninput="updateSlideTitle(this.value)">
        </div>
    `;

    // ============================================
    switch (slide.layout) {

        // ---- 1. TITLE SLIDE ----
        case 'title-slide':
            return wrapEditor(`
                <div class="form-group">
                    <label>Company Name</label>
                    <input type="text" id="f_companyName" placeholder="RENTEASE LIMITED"
                        oninput="updateField('companyName', this.value)">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" id="f_subtitle" placeholder="Corporate Presentation"
                        oninput="updateField('subtitle', this.value)">
                </div>
                <div class="form-group">
                    <label>Tagline (bottom)</label>
                    <input type="text" id="f_tagline" placeholder="MAKE THE DIFFERENCE"
                        oninput="updateField('tagline', this.value)">
                </div>
            `);

        // ---- 2. IMAGE + TEXT ----
        case 'image-text':
            return wrapEditor(`
                ${titleField}
                <div id="contentBlocks">${blocksHTML}</div>
                <div class="add-buttons">
                    <button class="add-btn" onclick="addBlock('paragraph')">+ Paragraph</button>
                    <button class="add-btn" onclick="addBlock('bullet')">+ Bullet Point</button>
                    <button class="add-btn add-btn-accent" onclick="addBlock('image')">+ Image</button>
                </div>
            `);

        // ---- 3. ICON GRID ----
        case 'icon-grid':
            return wrapEditor(`
                ${titleField}
                <p class="form-hint">Add icons with labels. Ideal: 6–10 icons in a grid.</p>
                <div id="contentBlocks">${blocksHTML}</div>
                <div class="add-buttons">
                    <button class="add-btn add-btn-accent" onclick="addBlock('icon')">+ Add Icon</button>
                </div>
            `);

        // ---- 4. TEXT + IMAGE ----
        case 'text-image':
            return wrapEditor(`
                ${titleField}
                <div id="contentBlocks">${blocksHTML}</div>
                <div class="add-buttons">
                    <button class="add-btn" onclick="addBlock('paragraph')">+ Paragraph</button>
                    <button class="add-btn" onclick="addBlock('bullet')">+ Bullet Point</button>
                    <button class="add-btn add-btn-accent" onclick="addBlock('image')">+ Image</button>
                </div>
            `);

        // ---- 5. PROFILE / QUOTE ----
        case 'profile-quote':
            return wrapEditor(`
                ${titleField}
                <div class="form-group">
                    <label>Person Photo</label>
                    <input type="file" accept="image/*" onchange="handleFieldImageUpload('photo', event)">
                </div>
                <div class="form-group">
                    <label>Person Name</label>
                    <input type="text" id="f_personName" placeholder="Mr. Meghraj Singh"
                        oninput="updateField('personName', this.value)">
                </div>
                <div class="form-group">
                    <label>Role / Title</label>
                    <input type="text" id="f_personRole" placeholder="Co-founder & MD"
                        oninput="updateField('personRole', this.value)">
                </div>
                <div class="form-group">
                    <label>Quote / Highlight Box</label>
                    <input type="text" id="f_quoteHighlight" placeholder="&quot;Leading the Aerial Platform Association...&quot;"
                        oninput="updateField('quoteHighlight', this.value)">
                </div>
                <div id="contentBlocks">${blocksHTML}</div>
                <div class="add-buttons">
                    <button class="add-btn" onclick="addBlock('paragraph')">+ Paragraph</button>
                    <button class="add-btn" onclick="addBlock('bullet')">+ Bullet Point</button>
                </div>
            `);

        // ---- 6. IMAGE SHOWCASE ----
        case 'image-showcase':
            return wrapEditor(`
                ${titleField}
                <p class="form-hint">Upload images with optional captions. They'll be displayed across the slide.</p>
                <div id="contentBlocks">${blocksHTML}</div>
                <div class="add-buttons">
                    <button class="add-btn add-btn-accent" onclick="addBlock('image')">+ Add Image</button>
                </div>
            `);

        // ---- 7. IMAGE GRID + LABELS ----
        case 'image-grid-labels': {
            const cells = slide.fields.cells || [{},{},{},{}];
            const cellsHTML = cells.map((cell, i) => `
                <div class="content-block">
                    <div class="block-header">
                        <span class="block-type-label">Cell ${i + 1}</span>
                    </div>
                    <div class="image-block-controls">
                        <input type="file" accept="image/*" onchange="handleCellImageUpload(${i}, event)">
                        <input type="text" placeholder="Label text (e.g. Recruitment and Training)"
                            value="${escapeHtml(cell.label || '')}"
                            oninput="updateGridCell(${i}, 'label', this.value)">
                    </div>
                </div>
            `).join('');

            return wrapEditor(`
                ${titleField}
                <p class="form-hint">Fill in all 4 cells. Each cell has an image and a label.</p>
                ${cellsHTML}
            `);
        }

        // ---- 8. EQUIPMENT COMPARISON ----
        case 'equipment-comparison': {
            const f = slide.fields;
            return wrapEditor(`
                ${titleField}
                <div class="comparison-editor">
                    <div class="comp-section">
                        <h4 class="comp-section-title">⬅ Left Side</h4>
                        <div class="form-group">
                            <label>Image</label>
                            <input type="file" accept="image/*" onchange="handleComparisonImage('leftImage', event)">
                        </div>
                        <div class="form-group">
                            <label>Bullet Points</label>
                            ${[0,1,2].map(i => `
                                <input type="text" placeholder="Bullet ${i+1}..."
                                    value="${escapeHtml((f.leftBullets||[])[i] || '')}"
                                    oninput="updateComparisonField('leftBullets', ${i}, this.value)"
                                    style="margin-bottom:6px;">
                            `).join('')}
                        </div>
                    </div>
                    <div class="comp-section">
                        <h4 class="comp-section-title">⚙ Centre</h4>
                        <div class="form-group">
                            <label>Label (e.g. "Powered by Diesel")</label>
                            <input type="text" placeholder="Powered by Diesel"
                                value="${escapeHtml(f.centerTitle || '')}"
                                oninput="updateComparisonField('centerTitle', null, this.value)">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea placeholder="Short description..." rows="3"
                                oninput="updateComparisonField('centerDesc', null, this.value)">${escapeHtml(f.centerDesc || '')}</textarea>
                        </div>
                    </div>
                    <div class="comp-section">
                        <h4 class="comp-section-title">➡ Right Side</h4>
                        <div class="form-group">
                            <label>Image</label>
                            <input type="file" accept="image/*" onchange="handleComparisonImage('rightImage', event)">
                        </div>
                        <div class="form-group">
                            <label>Bullet Points</label>
                            ${[0,1,2].map(i => `
                                <input type="text" placeholder="Bullet ${i+1}..."
                                    value="${escapeHtml((f.rightBullets||[])[i] || '')}"
                                    oninput="updateComparisonField('rightBullets', ${i}, this.value)"
                                    style="margin-bottom:6px;">
                            `).join('')}
                        </div>
                    </div>
                </div>
            `);
        }

        // ---- 9. THANK YOU / CONTACT ----
        case 'thank-you':
            return wrapEditor(`
                <div class="form-group">
                    <label>Address</label>
                    <textarea id="f_address" rows="2"
                        placeholder="705-706, The Landmark..."
                        oninput="updateField('address', this.value)">${escapeHtml(slide.fields.address || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="text" id="f_phone" placeholder="+91 22 2774 7458"
                        oninput="updateField('phone', this.value)">
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="text" id="f_email" placeholder="info@rentease.co"
                        oninput="updateField('email', this.value)">
                </div>
            `);

        default:
            return `<div class="editor-placeholder">
                <div class="placeholder-icon">🚧</div>
                <p>Editor coming soon!</p>
            </div>`;
    }
}

// ============================================
// 6. BLOCK HTML
// ============================================

function getBlockHTML(block) {
    let inner = '';

    if (block.type === 'paragraph') {
        inner = `
            <div class="block-header">
                <span class="block-type-label">📝 Paragraph</span>
                <button class="remove-btn" onclick="removeBlock('${block.id}')">✕</button>
            </div>
            <textarea placeholder="Enter paragraph text..."
                oninput="updateBlockText('${block.id}', this.value)">${escapeHtml(block.text)}</textarea>
        `;
    } else if (block.type === 'bullet') {
        inner = `
            <div class="block-header">
                <span class="block-type-label">• Bullet Point</span>
                <button class="remove-btn" onclick="removeBlock('${block.id}')">✕</button>
            </div>
            <input type="text" placeholder="Bullet text..."
                value="${escapeHtml(block.text)}"
                oninput="updateBlockText('${block.id}', this.value)">
        `;
    } else if (block.type === 'image') {
        inner = `
            <div class="block-header">
                <span class="block-type-label">🖼️ Image</span>
                <button class="remove-btn" onclick="removeBlock('${block.id}')">✕</button>
            </div>
            <div class="image-block-controls">
                <input type="file" accept="image/*" onchange="handleImageUpload('${block.id}', event)">
                <input type="text" placeholder="Caption (e.g. Boom Lift)"
                    value="${escapeHtml(block.caption)}"
                    oninput="updateImageCaption('${block.id}', this.value)">
                <div class="shape-selector">
                    <label>Shape:</label>
                    <select onchange="updateImageShape('${block.id}', this.value)">
                        <option value="circle" ${block.shape==='circle'?'selected':''}>Circle</option>
                        <option value="rectangle" ${block.shape==='rectangle'?'selected':''}>Rectangle</option>
                        <option value="rounded" ${block.shape==='rounded'?'selected':''}>Rounded</option>
                    </select>
                </div>
            </div>
        `;
    } else if (block.type === 'icon') {
        inner = `
            <div class="block-header">
                <span class="block-type-label">🔷 Icon</span>
                <button class="remove-btn" onclick="removeBlock('${block.id}')">✕</button>
            </div>
            <div class="image-block-controls">
                <input type="file" accept="image/*" onchange="handleImageUpload('${block.id}', event)">
                <input type="text" placeholder="Label (e.g. Aviation and Airports)"
                    value="${escapeHtml(block.label || '')}"
                    oninput="updateBlockLabel('${block.id}', this.value)">
            </div>
        `;
    } else if (block.type === 'logo') {
        inner = `
            <div class="block-header">
                <span class="block-type-label">🏢 Logo</span>
                <button class="remove-btn" onclick="removeBlock('${block.id}')">✕</button>
            </div>
            <input type="file" accept="image/*" onchange="handleImageUpload('${block.id}', event)">
        `;
    }

    return `<div class="content-block" id="${block.id}">${inner}</div>`;
}

// ============================================
// 7. SLIDE PREVIEW HTML — one renderer per layout
// ============================================

function getSlidePreviewHTML(slide) {

    // Shared frame wrapper
    const frame = (content, hasHeader = true) => `
        <div class="slide-frame">
            ${hasHeader ? `
            <div class="sf-header">
                <div class="sf-title-bar">
                    <span class="sf-title-text" id="previewTitle">
                        ${escapeHtml(slide.title) || 'SLIDE TITLE'}
                    </span>
                </div>
                <img src="assets/logo.png" alt="Logo" class="sf-logo">
            </div>` : ''}
            <div class="sf-body">
                <div class="sf-content" style="flex:1; padding:8px;">
                    ${content}
                </div>
                ${hasHeader ? `
                <div class="sf-equip-sidebar">
                    <div class="sf-equip-icon"><img src="assets/icons/icon1.png"></div>
<div class="sf-equip-icon"><img src="assets/icons/icon2.png"></div>
<div class="sf-equip-icon"><img src="assets/icons/icon3.png"></div>
<div class="sf-equip-icon"><img src="assets/icons/icon4.png"></div>
<div class="sf-equip-icon"><img src="assets/icons/icon5.png"></div>
<div class="sf-equip-icon"><img src="assets/icons/icon6.png"></div>
                </div>` : ''}
            </div>
            <div class="sf-footer">
                <span class="sf-footer-text">
                    <span class="red">RENT</span>EASE LIMITED
                </span>
            </div>
        </div>
    `;

    switch (slide.layout) {

        // ---- 1. TITLE SLIDE ----
        case 'title-slide': {
            const f = slide.fields;
            return `
                <div class="slide-frame">
                    <div style="height:3px; background:var(--color-primary); margin-bottom:6px;"></div>
                    <div style="background:#DBEAFE; padding:12px; text-align:center; margin-bottom:10px;">
                        <img src="assets/logo.png" style="height:36px; margin-bottom:6px;">
                        <div style="font-size:1rem; font-weight:800; letter-spacing:1px;">
                            <span style="color:var(--color-primary);">RENT</span>
                            <span style="color:#1A1A1A;">EASE LIMITED</span>
                        </div>
                    </div>
                    <div style="text-align:center; padding:8px; flex:1;">
                        <p style="font-size:0.85rem; font-weight:700; color:#374151;" id="previewTitle">
                            ${escapeHtml(f.subtitle) || 'Corporate Presentation'}
                        </p>
                    </div>
                    <div style="border-top:1px solid #E5E7EB; padding:6px; text-align:center; margin-top:auto;">
                        <span style="font-size:0.6rem; font-weight:700; letter-spacing:2px; color:#374151;">
                            ${escapeHtml(f.tagline) || 'MAKE THE DIFFERENCE'}
                        </span>
                    </div>
                </div>
            `;
        }

        // ---- 2. IMAGE + TEXT ----
        case 'image-text': {
            const imageBlocks = slide.blocks.filter(b => b.type === 'image');
            const textBlocks = slide.blocks.filter(b => b.type !== 'image');

            const imagesHTML = imageBlocks.length === 0
                ? '<div class="sf-image-placeholder"><span>📷</span></div>'
                : imageBlocks.map(b => `
                    <div class="sf-image-item">
                        <div class="sf-img sf-img-${b.shape} ${b.src ? '' : 'sf-img-empty'}"
                            style="${b.src ? 'background-image:url('+b.src+')' : ''}">
                            ${b.src ? '' : '📷'}
                        </div>
                        ${b.caption ? `<span class="sf-img-caption">${escapeHtml(b.caption)}</span>` : ''}
                    </div>`).join('');

            const textHTML = textBlocks.length === 0
                ? '<p class="sf-text sf-placeholder-text">Content will appear here...</p>'
                : textBlocks.map(b => b.type === 'bullet'
                    ? `<p class="sf-text sf-bullet">• ${escapeHtml(b.text)}</p>`
                    : `<p class="sf-text">${escapeHtml(b.text)}</p>`).join('');

            return frame(`
                <div style="display:flex; gap:12px; height:100%; align-items:center;">
                    <div class="sf-left" id="previewImages" style="flex:0 0 38%;">${imagesHTML}</div>
                    <div class="sf-right" id="previewTextArea" style="flex:1;">${textHTML}</div>
                </div>
            `);
        }

        // ---- 3. ICON GRID ----
        case 'icon-grid': {
            const icons = slide.blocks.filter(b => b.type === 'icon');
            const iconsHTML = icons.length === 0
                ? '<p class="sf-placeholder-text" style="font-size:0.65rem; text-align:center;">Add icons using the editor below</p>'
                : `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(50px, 1fr)); gap:8px; padding:4px;">
                    ${icons.map(b => `
                        <div style="display:flex; flex-direction:column; align-items:center; gap:3px;">
                            ${b.src
                                ? `<img src="${b.src}" style="width:36px; height:36px; object-fit:contain; border:1px solid #E5E7EB; border-radius:4px;">`
                                : `<div style="width:36px; height:36px; background:#F3F4F6; border:1px solid #E5E7EB; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:1rem;">🔷</div>`
                            }
                            <span style="font-size:0.5rem; font-weight:600; color:#374151; text-align:center;">${escapeHtml(b.label || '')}</span>
                        </div>
                    `).join('')}
                  </div>`;

            return frame(iconsHTML);
        }

        // ---- 4. TEXT + IMAGE ----
        case 'text-image': {
            const imageBlocks = slide.blocks.filter(b => b.type === 'image');
            const textBlocks = slide.blocks.filter(b => b.type !== 'image');

            const imagesHTML = imageBlocks.length === 0
                ? '<div class="sf-image-placeholder"><span>📷</span></div>'
                : imageBlocks.map(b => `
                    <div class="sf-image-item">
                        <div class="sf-img sf-img-${b.shape} ${b.src ? '' : 'sf-img-empty'}"
                            style="${b.src ? 'background-image:url('+b.src+')' : ''}">
                            ${b.src ? '' : '📷'}
                        </div>
                        ${b.caption ? `<span class="sf-img-caption">${escapeHtml(b.caption)}</span>` : ''}
                    </div>`).join('');

            const textHTML = textBlocks.length === 0
                ? '<p class="sf-text sf-placeholder-text">Content will appear here...</p>'
                : textBlocks.map(b => b.type === 'bullet'
                    ? `<p class="sf-text sf-bullet">• ${escapeHtml(b.text)}</p>`
                    : `<p class="sf-text">${escapeHtml(b.text)}</p>`).join('');

            return frame(`
                <div style="display:flex; gap:12px; height:100%; align-items:center;">
                    <div class="sf-left" id="previewTextArea" style="flex:1;">${textHTML}</div>
                    <div class="sf-right" id="previewImages" style="flex:0 0 38%;">${imagesHTML}</div>
                </div>
            `);
        }

        // ---- 5. PROFILE / QUOTE ----
        case 'profile-quote': {
            const f = slide.fields;
            const textBlocks = slide.blocks;
            const textHTML = textBlocks.length === 0
                ? '<p class="sf-placeholder-text" style="font-size:0.6rem;">Add content using editor below...</p>'
                : textBlocks.map(b => b.type === 'bullet'
                    ? `<p class="sf-text sf-bullet">• ${escapeHtml(b.text)}</p>`
                    : `<p class="sf-text">${escapeHtml(b.text)}</p>`).join('');

            return frame(`
                ${f.quoteHighlight ? `
                    <div style="background:#FEF3C7; padding:5px 8px; border-radius:3px; margin-bottom:8px; font-size:0.6rem; font-style:italic; font-weight:600; color:#92400E;">
                        "${escapeHtml(f.quoteHighlight)}"
                    </div>` : ''}
                <div style="display:flex; gap:12px; align-items:flex-start; flex:1;">
                    <div style="flex:0 0 30%; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        ${f.photo
                            ? `<img src="${f.photo}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--color-primary);">`
                            : `<div style="width:60px; height:60px; border-radius:50%; background:#FEE2E2; border:2px solid var(--color-primary); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">👤</div>`
                        }
                        <span style="font-size:0.55rem; font-weight:700; text-align:center;">${escapeHtml(f.personName || '')}</span>
                        <span style="font-size:0.5rem; color:#6B7280; text-align:center;">${escapeHtml(f.personRole || '')}</span>
                    </div>
                    <div style="flex:1;" id="previewTextArea">${textHTML}</div>
                </div>
            `);
        }

        // ---- 6. IMAGE SHOWCASE ----
        case 'image-showcase': {
            const images = slide.blocks.filter(b => b.type === 'image');
            const showcaseHTML = images.length === 0
                ? '<p class="sf-placeholder-text" style="font-size:0.65rem; text-align:center;">Add images using the editor below</p>'
                : `<div style="display:flex; gap:8px; align-items:center; justify-content:center; height:100%;">
                    ${images.map(b => `
                        <div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex:1;">
                            ${b.src
                                ? `<img src="${b.src}" style="width:100%; height:80px; object-fit:cover; border-radius:6px; border:1px solid #E5E7EB;">`
                                : `<div style="width:100%; height:80px; background:#F3F4F6; border:1px solid #E5E7EB; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">📷</div>`
                            }
                            ${b.caption ? `<span style="font-size:0.5rem; font-weight:600; text-align:center;">${escapeHtml(b.caption)}</span>` : ''}
                        </div>
                    `).join('')}
                  </div>`;

            return frame(showcaseHTML);
        }

        // ---- 7. IMAGE GRID + LABELS ----
        case 'image-grid-labels': {
            const cells = slide.fields.cells || [{},{},{},{}];
            return frame(`
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; height:100%;">
                    ${cells.map(cell => `
                        <div style="display:flex; align-items:center; gap:6px; background:#F9FAFB; border-radius:4px; padding:6px; overflow:hidden;">
                            ${cell.src
                                ? `<img src="${cell.src}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; flex-shrink:0;">`
                                : `<div style="width:50px; height:50px; background:#E5E7EB; border-radius:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:1rem;">📷</div>`
                            }
                            <div style="background:#3B82F6; color:white; padding:4px 8px; border-radius:3px; font-size:0.55rem; font-weight:600;">
                                ${escapeHtml(cell.label || 'Label')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `);
        }

        // ---- 8. EQUIPMENT COMPARISON ----
        case 'equipment-comparison': {
            const f = slide.fields;
            const mkBullets = (arr) => (arr||[]).map(b =>
                b ? `<p style="font-size:0.55rem; color:#374151; margin-bottom:2px;">• ${escapeHtml(b)}</p>` : ''
            ).join('');

            return frame(`
                <div style="display:flex; gap:8px; height:100%; align-items:flex-start;">
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        ${f.leftImage
                            ? `<img src="${f.leftImage}" style="width:100%; height:60px; object-fit:cover; border-radius:4px;">`
                            : `<div style="width:100%; height:60px; background:#F3F4F6; border:1px solid #E5E7EB; border-radius:4px; display:flex; align-items:center; justify-content:center;">📷</div>`
                        }
                        ${mkBullets(f.leftBullets)}
                    </div>
                    <div style="flex:1.2; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        ${f.centerTitle ? `<div style="background:var(--color-primary); color:white; padding:3px 10px; border-radius:3px; font-size:0.6rem; font-weight:700;">${escapeHtml(f.centerTitle)}</div>` : ''}
                        ${f.centerDesc ? `<p style="font-size:0.55rem; color:#374151; text-align:center;">${escapeHtml(f.centerDesc)}</p>` : ''}
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        ${f.rightImage
                            ? `<img src="${f.rightImage}" style="width:100%; height:60px; object-fit:cover; border-radius:4px;">`
                            : `<div style="width:100%; height:60px; background:#F3F4F6; border:1px solid #E5E7EB; border-radius:4px; display:flex; align-items:center; justify-content:center;">📷</div>`
                        }
                        ${mkBullets(f.rightBullets)}
                    </div>
                </div>
            `);
        }

        // ---- 9. THANK YOU ----
        case 'thank-you': {
            const f = slide.fields;
            return `
                <div class="slide-frame">
                    <div style="height:2px; background:var(--color-primary); margin-bottom:8px;"></div>
                    <div style="display:flex; gap:16px; flex:1; align-items:center; padding:8px;">
                        <div style="flex:0 0 100px; height:80px; background:linear-gradient(135deg,#3B82F6,#1D4ED8); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:2rem;">🤝</div>
                        <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
                            <p style="font-size:0.7rem; color:#374151; display:flex; gap:6px; align-items:flex-start;">
                                <span>🏠</span>
                                <span>${escapeHtml(f.address || '705-706, The Landmark...')}</span>
                            </p>
                            <p style="font-size:0.7rem; color:#374151; display:flex; gap:6px;">
                                <span>📞</span>
                                <span>${escapeHtml(f.phone || '+91 22 2774 7458')}</span>
                            </p>
                            <p style="font-size:0.7rem; color:#374151; display:flex; gap:6px;">
                                <span>✉️</span>
                                <span>${escapeHtml(f.email || 'info@rentease.co')}</span>
                            </p>
                        </div>
                    </div>
                    <div style="border-top:1px dashed #93C5FD; padding-top:6px; margin-top:auto;">
                        <span class="sf-footer-text"><span class="red">RENT</span>EASE LIMITED</span>
                    </div>
                </div>
            `;
        }

        default:
            return '<div class="slide-frame"><p style="padding:20px; color:#9CA3AF;">Preview not available</p></div>';
    }
}

// ============================================
// 8. PREVIEW UPDATER (live update without re-render)
// ============================================

function updateSlidePreview() {
    const slide = getActiveSlide();
    if (!slide) return;

    // For complex layouts, just re-render the whole preview
    const previewEl = document.getElementById('slidePreview');
    if (previewEl) {
        previewEl.innerHTML = getSlidePreviewHTML(slide);
    }
}

// ============================================
// 9. STEP 2 RENDERER
// ============================================

function renderStep2() {
    if (presentation.slides.length === 0) {
        mainContent.innerHTML = `
            <h2>Edit Slides</h2>
            <p class="subtitle">Your presentation is empty</p>
            <div class="editor-placeholder">
                <div class="placeholder-icon">☝️</div>
                <p>Go to Step 1 and add some slides to your presentation.</p>
            </div>
        `;
        return;
    }

    let slideListHTML = '';
    presentation.slides.forEach(function(slide, index) {
        const isActive = slide.id === activeSlideId;
        slideListHTML += `
            <div class="slide-thumb ${isActive ? 'active' : ''}" onclick="selectSlide('${slide.id}')">
                <span class="slide-thumb-number">${index + 1}</span>
                <div class="slide-thumb-info">
                    <span class="slide-thumb-layout">${layoutNames[slide.layout]}</span>
                    <span class="slide-thumb-title">${escapeHtml(slide.title) || 'Untitled'}</span>
                </div>
                <div class="slide-thumb-actions">
                    <button class="thumb-btn" onclick="event.stopPropagation(); moveSlide('${slide.id}', -1)">▲</button>
                    <button class="thumb-btn" onclick="event.stopPropagation(); moveSlide('${slide.id}', 1)">▼</button>
                    <button class="thumb-btn thumb-btn-delete" onclick="event.stopPropagation(); removeSlide('${slide.id}')">✕</button>
                </div>
            </div>
        `;
    });

    const slide = getActiveSlide();

    mainContent.innerHTML = `
        <h2>Edit Slides</h2>
        <p class="subtitle">${presentation.slides.length} slide${presentation.slides.length > 1 ? 's' : ''} in your presentation</p>
        <div class="step2-layout">
            <div class="slide-list-panel">
                ${slideListHTML}
                <button class="add-slide-btn" onclick="goToStep1()">+ Add Slide</button>
            </div>
            <div class="editor-area">
                ${slide ? getEditorHTML(slide) : ''}
            </div>
        </div>
    `;

    // Restore field values
    if (slide) {
        const titleInput = document.getElementById('slideTitle');
        if (titleInput) titleInput.value = slide.title;

        if (slide.layout === 'title-slide') {
            setVal('f_companyName', slide.fields.companyName);
            setVal('f_subtitle', slide.fields.subtitle);
            setVal('f_tagline', slide.fields.tagline);
        }
        if (slide.layout === 'thank-you') {
            setVal('f_address', slide.fields.address);
            setVal('f_phone', slide.fields.phone);
            setVal('f_email', slide.fields.email);
        }
        if (slide.layout === 'profile-quote') {
            setVal('f_personName', slide.fields.personName);
            setVal('f_personRole', slide.fields.personRole);
            setVal('f_quoteHighlight', slide.fields.quoteHighlight);
        }
    }
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.value = value;
}

// ============================================
// 10. SIDEBAR STATUS
// ============================================

function updateSidebarStatus() {
    const count = presentation.slides.length;
    const badge = document.getElementById('slideBadge');
    const panel = document.getElementById('resumePanel');
    const info = document.getElementById('resumeInfo');

    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }
    }

    if (panel) {
        panel.style.display = count > 0 ? 'flex' : 'none';
    }

    if (info) {
        info.textContent = count + ' slide' + (count > 1 ? 's' : '');
    }
}

// ============================================
// 11. NAVIGATION
// ============================================

function goToStep1() {
    document.querySelector('[data-step="1"]').click();
}
// ============================================
// STEP 3: PREVIEW / SLIDESHOW
// ============================================

function renderStep3() {

    if (presentation.slides.length === 0) {
        mainContent.innerHTML = `
            <h2>Preview</h2>
            <p class="subtitle">No slides to preview</p>
            <div class="editor-placeholder">
                <div class="placeholder-icon">🖼️</div>
                <p>Add some slides in Step 2 first, then come back to preview.</p>
            </div>
        `;
        return;
    }

    currentPreviewIndex = Math.max(0, Math.min(currentPreviewIndex, presentation.slides.length - 1));

    const total = presentation.slides.length;
    const slide = presentation.slides[currentPreviewIndex];

    const dotsHTML = presentation.slides.map((s, i) => `
        <button 
            class="preview-dot ${i === currentPreviewIndex ? 'active' : ''}" 
            onclick="goToPreviewSlide(${i})"
            title="${layoutNames[s.layout]}"
        ></button>
    `).join('');

    mainContent.innerHTML = `
        <div class="preview-screen">

            <div class="preview-topbar">
                <div class="preview-counter">
                    Slide <strong>${currentPreviewIndex + 1}</strong> of <strong>${total}</strong>
                    &mdash; ${layoutNames[slide.layout]}
                </div>
                <div class="preview-nav-btns">
                    <button class="preview-nav-btn" onclick="previewMoveSlide(-1)"
                        title="Move slide left"
                        ${currentPreviewIndex === 0 ? 'disabled' : ''}>⬅ Move</button>

                    <button class="preview-nav-btn" onclick="previewMoveSlide(1)"
                        title="Move slide right"
                        ${currentPreviewIndex === total - 1 ? 'disabled' : ''}>Move ➡</button>

                    <div class="preview-btn-divider"></div>

                    <button class="preview-nav-btn danger" onclick="previewDeleteSlide()"
                        title="Delete this slide">🗑 Delete</button>

                    <div class="preview-btn-divider"></div>

                    <button class="preview-nav-btn" onclick="prevPreviewSlide()"
                        ${currentPreviewIndex === 0 ? 'disabled' : ''}>◀ Prev</button>

                    <button class="preview-nav-btn primary" onclick="nextPreviewSlide()"
                        ${currentPreviewIndex === total - 1 ? 'disabled' : ''}>Next ▶</button>
                </div>
            </div>

            <div class="preview-slide-wrapper">
                <div class="preview-slide-canvas">
                    ${getSlidePreviewHTML(slide)}
                </div>
            </div>

            <div class="preview-dots">
                ${dotsHTML}
            </div>

            <p class="preview-hint">💡 Use ← → arrow keys to navigate</p>

        </div>
    `;
}

function previewMoveSlide(direction) {
    const slide = presentation.slides[currentPreviewIndex];
    moveSlide(slide.id, direction);
    currentPreviewIndex = currentPreviewIndex + direction;
    renderStep3();
}

function previewDeleteSlide() {
    if (!confirm('Delete this slide? This cannot be undone.')) return;
    const slide = presentation.slides[currentPreviewIndex];
    removeSlide(slide.id);
    currentPreviewIndex = Math.max(0, currentPreviewIndex - 1);
    renderStep3();
}

function goToPreviewSlide(index) {
    currentPreviewIndex = index;
    renderStep3();
}

function nextPreviewSlide() {
    if (currentPreviewIndex < presentation.slides.length - 1) {
        currentPreviewIndex++;
        renderStep3();
    }
}

function prevPreviewSlide() {
    if (currentPreviewIndex > 0) {
        currentPreviewIndex--;
        renderStep3();
    }
}
function previewMoveSlide(direction) {
    const slide = presentation.slides[currentPreviewIndex];
    moveSlide(slide.id, direction);
    // Stay on the same slide after moving
    currentPreviewIndex = currentPreviewIndex + direction;
    renderStep3();
}

function previewDeleteSlide() {
    if (!confirm('Delete this slide? This cannot be undone.')) return;

    const slide = presentation.slides[currentPreviewIndex];
    removeSlide(slide.id);

    // After delete, stay on same index (now pointing to next slide)
    // removeSlide() already adjusts activeSlideId — we just re-render
    currentPreviewIndex = Math.max(0, currentPreviewIndex - 1);
    renderStep3();
}

// Keyboard navigation — arrow keys
// CONCEPT: document-level event listener
// We attach this once to the whole document.
// But we only respond when the user is on Step 3.
// We track this using a flag: isPreviewActive
let isPreviewActive = false;

document.addEventListener('keydown', function(event) {
    if (!isPreviewActive) return;

    if (event.key === 'ArrowRight') {
        nextPreviewSlide();
    } else if (event.key === 'ArrowLeft') {
        prevPreviewSlide();
    }
});

navItems.forEach(function(item) {
    item.addEventListener('click', function() {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        const step = item.getAttribute('data-step');

        if (step === '1') {
            isPreviewActive = false;
            mainContent.innerHTML = step1Content;
            mainContent.classList.add('gamma-step');
            initParticles(); // restart particle animation when returning to step 1
        } else if (step === '2') {
            isPreviewActive = false;          // ← ADD
            renderStep2();
        } else if (step === '3') {
            currentPreviewIndex = 0;          // ← ADD (always start from slide 1)
            isPreviewActive = true;           // ← ADD
            renderStep3();
        } else if (step === '4') {
            isPreviewActive = false;
            renderStep4();    // ← replace mainContent.innerHTML = stepContent[4];
        }
    });
});
mainContent.addEventListener('click', function(event) {
    const card = event.target.closest('.layout-card');
    if (!card) return;

    const allCards = mainContent.querySelectorAll('.layout-card');
    allCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    selectedLayout = card.getAttribute('data-layout');
    addSlide(selectedLayout);

    setTimeout(function() {
        document.querySelector('[data-step="2"]').click();
    }, 300);
});

// ============================================
// 12. UTILITIES
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}
// ============================================
// AUTO-SAVE & RESTORE
// ============================================

function savePresentation() {
    try {
        const toSave = JSON.parse(JSON.stringify(presentation));

        // Strip temporary blob URLs before saving
        toSave.slides.forEach(function(slide) {
            slide.blocks.forEach(function(block) {
                if (block.imageKey) block.src = '';
            });
            Object.keys(slide.fields).forEach(function(key) {
                if (key.endsWith('_key')) return;
                if (slide.fields[key + '_key']) slide.fields[key] = '';
            });
            if (slide.fields.cells) {
                slide.fields.cells.forEach(function(cell) {
                    if (cell.imageKey) cell.src = '';
                });
            }
        });

        localStorage.setItem('rentease_ppt', JSON.stringify(toSave));
        localStorage.setItem('rentease_counters', JSON.stringify({
            slideCounter: slideCounter,
            blockCounter: blockCounter,
            activeSlideId: activeSlideId
        }));

        showSaveIndicator();
    } catch(e) {
        console.warn('Save failed:', e);
    }
}

function loadPresentation() {
    try {
        const savedPPT = localStorage.getItem('rentease_ppt');
        const savedCounters = localStorage.getItem('rentease_counters');

        if (savedPPT) presentation = JSON.parse(savedPPT);

        if (savedCounters) {
            const c = JSON.parse(savedCounters);
            slideCounter = c.slideCounter || 0;
            blockCounter = c.blockCounter || 0;
            activeSlideId = c.activeSlideId || null;
        }

        restoreImages();
    } catch(e) {
        console.warn('Could not restore session:', e);
    }
}

function restoreImages() {
    const promises = [];

    presentation.slides.forEach(function(slide) {
        slide.blocks.forEach(function(block) {
            if (block.imageKey) {
                const p = dbLoadImage(block.imageKey).then(function(url) {
                    if (url) block.src = url;
                });
                promises.push(p);
            }
        });

        Object.keys(slide.fields).forEach(function(key) {
            if (key.endsWith('_key')) {
                const imageKey = slide.fields[key];
                const fieldName = key.replace('_key', '');
                const p = dbLoadImage(imageKey).then(function(url) {
                    if (url) slide.fields[fieldName] = url;
                });
                promises.push(p);
            }
        });

        if (slide.fields.cells) {
            slide.fields.cells.forEach(function(cell) {
                if (cell.imageKey) {
                    const p = dbLoadImage(cell.imageKey).then(function(url) {
                        if (url) cell.src = url;
                    });
                    promises.push(p);
                }
            });
        }
    });

    Promise.all(promises).then(function() {
        updateSidebarStatus();
    });
}

function clearPresentation() {
    if (!confirm('Start a new presentation? All current work will be lost.')) return;
    localStorage.removeItem('rentease_ppt');
    localStorage.removeItem('rentease_counters');
    dbClearAllImages();
    presentation = { slides: [] };
    activeSlideId = null;
    slideCounter = 0;
    blockCounter = 0;
    updateSidebarStatus();
    document.querySelector('[data-step="1"]').click();
}

function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (!indicator) return;
    indicator.classList.add('visible');
    setTimeout(function() {
        indicator.classList.remove('visible');
    }, 1500);
}

function updateSidebarStatus() {
    const count = presentation.slides.length;
    const badge = document.getElementById('slideBadge');
    const panel = document.getElementById('resumePanel');
    const info = document.getElementById('resumeInfo');

    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }
    }
    if (panel) panel.style.display = count > 0 ? 'flex' : 'none';
    if (info) info.textContent = count + ' slide' + (count > 1 ? 's' : '');
}
// ============================================
// STEP 4: EXPORT
// ============================================

function countImages() {
    let count = 0;
    presentation.slides.forEach(function(slide) {
        slide.blocks.forEach(function(block) {
            if (block.type === 'image' && block.src) count++;
        });
        if (slide.fields.photo) count++;
        if (slide.fields.leftImage) count++;
        if (slide.fields.rightImage) count++;
        if (slide.fields.cells) {
            slide.fields.cells.forEach(function(cell) {
                if (cell.src) count++;
            });
        }
    });
    return count;
}

function renderStep4() {
    if (presentation.slides.length === 0) {
        mainContent.innerHTML = `
            <h2>Export</h2>
            <p class="subtitle">Nothing to export yet</p>
            <div class="editor-placeholder">
                <div class="placeholder-icon">📊</div>
                <p>Add slides in Step 1 and 2 first, then come back to export.</p>
            </div>
        `
        return;
    }

    // Build slide list summary
    let slideSummaryHTML = '';
    presentation.slides.forEach(function(slide, i) {
        slideSummaryHTML += `
            <div class="export-slide-row">
                <span class="export-slide-num">${i + 1}</span>
                <span class="export-slide-layout">${layoutNames[slide.layout]}</span>
                <span class="export-slide-title">${escapeHtml(slide.title) || 'Untitled'}</span>
            </div>
        `;
    });

    mainContent.innerHTML = `
        <h2>Export</h2>
        <p class="subtitle">Download your presentation as a PowerPoint file</p>

        <div class="export-container">

            <!-- Summary panel -->
            <div class="export-summary-panel">
                <div class="export-stats">
                    <div class="export-stat">
                        <span class="export-stat-num">${presentation.slides.length}</span>
                        <span class="export-stat-label">Slides</span>
                    </div>
                    <div class="export-stat">
                        <span class="export-stat-num">${countImages()}</span>
                        <span class="export-stat-label">Images</span>
                    </div>
                </div>

                <div class="export-slide-list">
                    <h4>Slides in this presentation</h4>
                    ${slideSummaryHTML}
                </div>
            </div>

            <!-- Export action panel -->
            <div class="export-action-panel">
                <div class="export-formats">
    <div class="export-format-card active-format" id="formatPPTX"
        onclick="selectFormat('pptx')">
        <div class="export-format-icon">📊</div>
        <div class="export-format-info">
            <strong>PowerPoint (.pptx)</strong>
            <p>Opens in Microsoft PowerPoint, Google Slides, LibreOffice</p>
        </div>
        <span class="format-check" id="checkPPTX">✓</span>
    </div>

    <div class="export-format-card" id="formatPDF"
        onclick="selectFormat('pdf')">
        <div class="export-format-icon">📄</div>
        <div class="export-format-info">
            <strong>PDF (.pdf)</strong>
            <p>Universal format — opens on any device without PowerPoint</p>
        </div>
        <span class="format-check" id="checkPDF" style="display:none;">✓</span>
    </div>
</div>

                <div class="form-group">
                    <label>Presentation File Name</label>
                    <input type="text" id="exportFilename"
                        value="Rentease_Presentation"
                        placeholder="Rentease_Presentation">
                </div>

                <button class="export-btn" id="exportBtn" onclick="handleExport()">
                    ⬇ Download PowerPoint
                </button>


                <p class="export-hint">
                    💡 The file will download automatically to your Downloads folder
                </p>
            </div>

        </div>
    `;
}

// ============================================
// PPTX EXPORT ENGINE
// ============================================
// Track selected format
let selectedExportFormat = 'pptx';

function selectFormat(format) {
    selectedExportFormat = format;

    // Update card styles
    document.getElementById('formatPPTX').classList.toggle('active-format', format === 'pptx');
    document.getElementById('formatPDF').classList.toggle('active-format', format === 'pdf');

    // Update checkmarks
    document.getElementById('checkPPTX').style.display = format === 'pptx' ? 'block' : 'none';
    document.getElementById('checkPDF').style.display = format === 'pdf' ? 'block' : 'none';

    // Update button label
    const btn = document.getElementById('exportBtn');
    if (btn) {
        btn.textContent = format === 'pptx'
            ? '⬇ Download PowerPoint'
            : '⬇ Download PDF';
    }
}

function handleExport() {
    if (selectedExportFormat === 'pdf') {
        exportToPDF();
    } else {
        exportToPPTX();
    }
}
async function exportToPPTX() {

    const btn = document.getElementById('exportBtn');
    btn.textContent = '⏳ Generating...';
    btn.disabled = true;

    try {
        // Create new presentation
        const pres = new PptxGenJS();
        pres.layout = 'LAYOUT_WIDE'; // 16:9

        // Slide dimensions: 13.33" x 7.5"
        const SW = 13.33;  // slide width
        const SH = 7.5;    // slide height

        // Brand colors (hex without #)
        const RED = 'E32227';
        const DARK = '1A1A1A';
        const WHITE = 'FFFFFF';
        const BLUE_DASH = '93C5FD';

        // Load logo as base64
        const logoB64 = await fetchAsBase64('assets/logo.png');
        const icon1 = await fetchAsBase64('assets/icons/icon1.png');
const icon2 = await fetchAsBase64('assets/icons/icon2.png');
const icon3 = await fetchAsBase64('assets/icons/icon3.png');
const icon4 = await fetchAsBase64('assets/icons/icon4.png');
const icon5 = await fetchAsBase64('assets/icons/icon5.png');
const icon6 = await fetchAsBase64('assets/icons/icon6.png');

        // Process each slide
        for (let i = 0; i < presentation.slides.length; i++) {
            const slideData = presentation.slides[i];
            const slide = pres.addSlide();
                        // Add sidebar icons (skip Title and Thank You slides)
            if (slideData.layout !== 'title-slide' && slideData.layout !== 'thank-you') {
                const iconX = 12.6; // Right edge of the 13.33" wide slide
                if (icon1) slide.addImage({ data: icon1, x: iconX, y: 1.5, w: 0.5, h: 0.5 });
                if (icon2) slide.addImage({ data: icon2, x: iconX, y: 2.3, w: 0.5, h: 0.5 });
                if (icon3) slide.addImage({ data: icon3, x: iconX, y: 3.1, w: 0.5, h: 0.5 });
                if (icon4) slide.addImage({ data: icon4, x: iconX, y: 3.9, w: 0.5, h: 0.5 });
                if (icon5) slide.addImage({ data: icon5, x: iconX, y: 4.7, w: 0.5, h: 0.5 });
                if (icon6) slide.addImage({ data: icon6, x: iconX, y: 5.5, w: 0.5, h: 0.5 });
            }

            switch (slideData.layout) {

                case 'title-slide':
                    await buildTitleSlide(pres, slide, slideData, SW, SH, logoB64, RED, DARK, WHITE);
                    break;

                case 'thank-you':
                    await buildThankYouSlide(pres, slide, slideData, SW, SH, logoB64, RED, DARK, WHITE);
                    break;

                default:
                    // All layouts with the common frame
                    await buildCommonFrame(pres, slide, slideData, SW, SH, logoB64, RED, DARK, WHITE, BLUE_DASH);
                    await buildSlideContent(pres, slide, slideData, SW, SH, RED, DARK, WHITE);
                    break;
            }
        }

        // Get filename
        const filename = document.getElementById('exportFilename').value || 'Rentease_Presentation';

        // Save / download
        await pres.writeFile({ fileName: filename + '.pptx' });

        btn.textContent = '✅ Downloaded!';
        setTimeout(function() {
            btn.textContent = '⬇ Download PowerPoint';
            btn.disabled = false;
        }, 3000);

    } catch(err) {
        console.error('Export failed:', err);
        btn.textContent = '❌ Export Failed';
        btn.disabled = false;
        alert('Export failed: ' + err.message);
    }
}
// Convert all image src and background-image URLs to base64
// before passing to html2canvas — prevents canvas taint
async function preprocessSlideHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Fix <img> src attributes
    const images = doc.querySelectorAll('img');
    for (const img of images) {
        if (img.getAttribute('src')) {
            try {
                const b64 = await fetchAsBase64(img.getAttribute('src'));
                if (b64) img.setAttribute('src', b64);
            } catch(e) { /* skip */ }
        }
    }

    // Fix inline background-image styles (used for uploaded images)
    const styledEls = doc.querySelectorAll('[style]');
    for (const el of styledEls) {
        const style = el.getAttribute('style');
        const match = style && style.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && match[1]) {
            try {
                const b64 = await fetchAsBase64(match[1]);
                if (b64) {
                    el.setAttribute('style',
                        style.replace(match[0], 'url(' + b64 + ')')
                    );
                }
            } catch(e) { /* skip */ }
        }
    }

    return doc.body.innerHTML;
}
async function exportToPDF() {
    const btn = document.getElementById('exportBtn');
    btn.textContent = '⏳ Preparing...';
    btn.disabled = true;

    try {
        let inlineCSS = '';
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    inlineCSS += rule.cssText + '\n';
                }
            } catch(e) { /* skip */ }
        }

        let slidesHTML = '';
        for (let i = 0; i < presentation.slides.length; i++) {
            slidesHTML += '<div class="print-slide">' + getSlidePreviewHTML(presentation.slides[i]) + '</div>';
        }

        const filename = document.getElementById('exportFilename').value || 'Rentease_Presentation';

        const printHTML = '<!DOCTYPE html><html><head><base href="' + window.location.href + '"><meta charset="UTF-8"><title>' + filename + '</title><style>' + inlineCSS + ' * { margin:0; padding:0; box-sizing:border-box; } body { background:white; } .print-slide { width:960px; height:540px; overflow:hidden; position:relative; page-break-after:always; break-after:page; } .slide-frame { width:960px !important; height:540px !important; } @media print { @page { size: 960px 540px landscape; margin:0; } body { margin:0; } .print-slide { page-break-after:always; break-after:page; } }</style></head><body>' + slidesHTML + '<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script></body></html>';
        const blobURL = URL.createObjectURL(blob);
        window.open(blobURL, '_blank');

        btn.textContent = '✅ Print Dialog Opened';
        setTimeout(function() {
            btn.textContent = '⬇ Download PDF';
            btn.disabled = false;
        }, 3000);

    } catch(err) {
        console.error('PDF export failed:', err);
        btn.textContent = '❌ Failed';
        btn.disabled = false;
        alert('PDF export failed: ' + err.message);
    }
}

// ============================================
// HELPER: Fetch a URL and return base64
// ============================================

function fetchAsBase64(url) {
    if (!url) return Promise.resolve(null);

    return new Promise(function(resolve) {
        // XMLHttpRequest works on file:// protocol, fetch() does not
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';

        xhr.onload = function() {
            const reader = new FileReader();
            reader.onload = function() { resolve(reader.result); };
            reader.onerror = function() { resolve(null); };
            reader.readAsDataURL(xhr.response);
        };

        // Resolve null instead of rejecting — export continues
        // even if one image fails to load
        xhr.onerror = function() { resolve(null); };

        xhr.open('GET', url);
        xhr.send();
    });
}


// ============================================
// COMMON FRAME (used by most layouts)
// Red header + logo + sidebar + footer
// ============================================

async function buildCommonFrame(pres, slide, slideData, SW, SH, logoB64, RED, DARK, WHITE, BLUE_DASH) {

    // Red header bar
    slide.addShape(pres.ShapeType.rect, {
        x: 0.1, y: 0.1,
        w: 10.3, h: 0.7,
        fill: { color: RED }
    });

    // Slide title in header
    slide.addText(slideData.title || 'SLIDE TITLE', {
        x: 0.2, y: 0.15,
        w: 9.8, h: 0.55,
        fontSize: 18,
        bold: true,
        color: WHITE,
        valign: 'middle'
    });

    // Logo
    if (logoB64) {
        slide.addImage({
            data: logoB64,
            x: 10.6, y: 0.05,
            w: 2.5, h: 0.9
        });
    }

    // Equipment sidebar — 6 small red-tinted boxes
    for (let i = 0; i < 6; i++) {
        slide.addShape(pres.ShapeType.rect, {
            x: 10.6,
            y: 1.1 + (i * 0.78),
            w: 0.55, h: 0.65,
            fill: { color: 'FFF5F5' },
            line: { color: 'FECACA', width: 1 }
        });
    }

    // Blue dashed footer line
    slide.addShape(pres.ShapeType.line, {
        x: 0.1, y: 6.8,
        w: 10.3, h: 0,
        line: { color: BLUE_DASH, width: 1, dashType: 'dash' }
    });

    // Footer text: RENTEASE LIMITED
    slide.addText([
        { text: 'RENT', options: { color: RED, bold: true } },
        { text: 'EASE LIMITED', options: { color: DARK, bold: true } }
    ], {
        x: 0.1, y: 6.85,
        w: 5, h: 0.35,
        fontSize: 9
    });
}


// ============================================
// CONTENT BUILDERS — one per layout
// ============================================

async function buildSlideContent(pres, slide, slideData, SW, SH, RED, DARK, WHITE) {

    // Content area boundaries (inside the common frame)
    const CX = 0.2;   // content x start
    const CY = 1.0;   // content y start (below header)
    const CW = 10.2;  // content width (before sidebar)
    const CH = 5.6;   // content height (above footer)

    switch (slideData.layout) {

        // ---- IMAGE + TEXT ----
        case 'image-text': {
            const imageBlocks = slideData.blocks.filter(function(b) { return b.type === 'image'; });
            const textBlocks = slideData.blocks.filter(function(b) { return b.type !== 'image'; });

            const leftW = CW * 0.38;
            const rightX = CX + leftW + 0.2;
            const rightW = CW * 0.60;

            // Images on left
            let imgY = CY + 0.3;
            for (let i = 0; i < imageBlocks.length; i++) {
                const block = imageBlocks[i];
                const imgH = Math.min(2.2, (CH - 0.5) / imageBlocks.length);

                if (block.src) {
                    const imgData = await fetchAsBase64(block.src);
                    const shapeType = block.shape === 'circle' ? 'ellipse' : 'rect';

                    if (block.shape === 'circle') {
                        slide.addImage({
                            data: imgData,
                            x: CX + 0.2,
                            y: imgY,
                            w: imgH,
                            h: imgH,
                            rounding: true
                        });
                    } else {
                        slide.addImage({
                            data: imgData,
                            x: CX + 0.1,
                            y: imgY,
                            w: leftW - 0.2,
                            h: imgH
                        });
                    }
                }

                if (block.caption) {
                    slide.addText(block.caption, {
                        x: CX, y: imgY + imgH + 0.05,
                        w: leftW, h: 0.25,
                        fontSize: 8, bold: true,
                        color: DARK, align: 'center'
                    });
                }

                imgY += imgH + 0.4;
            }

            // Text on right
            let textY = CY + 0.2;
            for (let i = 0; i < textBlocks.length; i++) {
                const block = textBlocks[i];
                const prefix = block.type === 'bullet' ? '•  ' : '';
                slide.addText(prefix + (block.text || ''), {
                    x: rightX, y: textY,
                    w: rightW, h: 0.5,
                    fontSize: 11,
                    color: DARK,
                    wrap: true,
                    valign: 'top'
                });
                textY += 0.55;
            }
            break;
        }

        // ---- ICON GRID ----
        case 'icon-grid': {
            const icons = slideData.blocks.filter(function(b) { return b.type === 'icon'; });
            const cols = 4;
            const cellW = CW / cols;
            const cellH = 2.2;

            for (let i = 0; i < icons.length; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = CX + col * cellW + cellW * 0.25;
                const y = CY + row * (cellH + 0.3) + 0.3;

                if (icons[i].src) {
                    const imgData = await fetchAsBase64(icons[i].src);
                    slide.addImage({ data: imgData, x: x, y: y, w: 1.0, h: 1.0 });
                } else {
                    slide.addShape(pres.ShapeType.rect, {
                        x: x, y: y, w: 1.0, h: 1.0,
                        fill: { color: 'F3F4F6' },
                        line: { color: 'E5E7EB' }
                    });
                }

                slide.addText(icons[i].label || '', {
                    x: CX + col * cellW, y: y + 1.1,
                    w: cellW, h: 0.4,
                    fontSize: 9, bold: true,
                    color: DARK, align: 'center'
                });
            }
            break;
        }

        // ---- TEXT + IMAGE ----
        case 'text-image': {
            const imageBlocks = slideData.blocks.filter(function(b) { return b.type === 'image'; });
            const textBlocks = slideData.blocks.filter(function(b) { return b.type !== 'image'; });

            const textW = CW * 0.60;
            const textX = CX;
            const imgX = CX + textW + 0.2;
            const imgW = CW * 0.38;

            // Text on left
            let textY = CY + 0.2;
            for (let i = 0; i < textBlocks.length; i++) {
                const block = textBlocks[i];
                const prefix = block.type === 'bullet' ? '•  ' : '';
                slide.addText(prefix + (block.text || ''), {
                    x: textX, y: textY,
                    w: textW, h: 0.5,
                    fontSize: 11,
                    color: DARK,
                    wrap: true,
                    valign: 'top'
                });
                textY += 0.55;
            }

            // Images on right
            let imgY = CY + 0.3;
            for (let i = 0; i < imageBlocks.length; i++) {
                const block = imageBlocks[i];
                const imgH = Math.min(2.2, (CH - 0.5) / imageBlocks.length);

                if (block.src) {
                    const imgData = await fetchAsBase64(block.src);
                    if (block.shape === 'circle') {
                        slide.addImage({
                            data: imgData, x: imgX + 0.2, y: imgY, w: imgH, h: imgH, rounding: true
                        });
                    } else {
                        slide.addImage({
                            data: imgData, x: imgX + 0.1, y: imgY, w: imgW - 0.2, h: imgH
                        });
                    }
                }
                if (block.caption) {
                    slide.addText(block.caption, {
                        x: imgX, y: imgY + imgH + 0.05, w: imgW, h: 0.25, fontSize: 8, bold: true, color: DARK, align: 'center'
                    });
                }
                imgY += imgH + 0.4;
            }
            break;
        }

        // ---- PROFILE / QUOTE ----
        case 'profile-quote': {
            const f = slideData.fields;

            // Quote highlight box
            if (f.quoteHighlight) {
                slide.addShape(pres.ShapeType.rect, {
                    x: CX, y: CY,
                    w: CW, h: 0.55,
                    fill: { color: 'FEF3C7' }
                });
                slide.addText('"' + f.quoteHighlight + '"', {
                    x: CX + 0.2, y: CY + 0.05,
                    w: CW - 0.4, h: 0.45,
                    fontSize: 10, italic: true, bold: true,
                    color: '92400E'
                });
            }

            const contentY = f.quoteHighlight ? CY + 0.7 : CY + 0.2;

            // Photo on left
            if (f.photo) {
                const imgData = await fetchAsBase64(f.photo);
                slide.addImage({
                    data: imgData,
                    x: CX + 0.2, y: contentY,
                    w: 2.0, h: 2.0,
                    rounding: true
                });
            }

            slide.addText(f.personName || '', {
                x: CX, y: contentY + 2.1,
                w: 2.4, h: 0.35,
                fontSize: 10, bold: true,
                color: DARK, align: 'center'
            });

            slide.addText(f.personRole || '', {
                x: CX, y: contentY + 2.45,
                w: 2.4, h: 0.3,
                fontSize: 8, color: '6B7280', align: 'center'
            });

            // Text on right
            const rightX = CX + 2.7;
            let textY = contentY;
            slideData.blocks.forEach(function(block) {
                const prefix = block.type === 'bullet' ? '•  ' : '';
                slide.addText(prefix + (block.text || ''), {
                    x: rightX, y: textY,
                    w: CW - 2.9, h: 0.5,
                    fontSize: 11, color: DARK, wrap: true
                });
                textY += 0.55;
            });
            break;
        }

        // ---- IMAGE SHOWCASE ----
        case 'image-showcase': {
            const images = slideData.blocks.filter(function(b) { return b.type === 'image'; });
            const count = images.length || 1;
            const imgW = (CW - 0.2 * (count + 1)) / count;

            for (let i = 0; i < images.length; i++) {
                const x = CX + 0.2 + i * (imgW + 0.2);
                const y = CY + 0.3;
                const imgH = CH - 0.9;

                if (images[i].src) {
                    const imgData = await fetchAsBase64(images[i].src);
                    slide.addImage({ data: imgData, x: x, y: y, w: imgW, h: imgH });
                } else {
                    slide.addShape(pres.ShapeType.rect, {
                        x: x, y: y, w: imgW, h: imgH,
                        fill: { color: 'F3F4F6' }, line: { color: 'E5E7EB' }
                    });
                }

                if (images[i].caption) {
                    slide.addText(images[i].caption, {
                        x: x, y: y + imgH + 0.05,
                        w: imgW, h: 0.3,
                        fontSize: 9, bold: true,
                        color: DARK, align: 'center'
                    });
                }
            }
            break;
        }

        // ---- IMAGE GRID + LABELS ----
        case 'image-grid-labels': {
            const cells = slideData.fields.cells || [{},{},{},{}];
            const cellW = (CW - 0.3) / 2;
            const cellH = (CH - 0.4) / 2;

            for (let i = 0; i < 4; i++) {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const x = CX + col * (cellW + 0.2);
                const y = CY + row * (cellH + 0.2) + 0.1;
                const cell = cells[i] || {};

                if (cell.src) {
                    const imgData = await fetchAsBase64(cell.src);
                    slide.addImage({
                        data: imgData,
                        x: x, y: y,
                        w: cellW * 0.45, h: cellH - 0.1
                    });
                } else {
                    slide.addShape(pres.ShapeType.rect, {
                        x: x, y: y,
                        w: cellW * 0.45, h: cellH - 0.1,
                        fill: { color: 'E5E7EB' }
                    });
                }

                // Blue label tag
                slide.addShape(pres.ShapeType.rect, {
                    x: x + cellW * 0.48, y: y + cellH * 0.25,
                    w: cellW * 0.5, h: 0.45,
                    fill: { color: '3B82F6' }
                });
                slide.addText(cell.label || '', {
                    x: x + cellW * 0.48, y: y + cellH * 0.25,
                    w: cellW * 0.5, h: 0.45,
                    fontSize: 9, bold: true,
                    color: WHITE, valign: 'middle'
                });
            }
            break;
        }

        // ---- EQUIPMENT COMPARISON ----
        case 'equipment-comparison': {
            const f = slideData.fields;
            const colW = CW / 3;

            // Left image
            if (f.leftImage) {
                const imgData = await fetchAsBase64(f.leftImage);
                slide.addImage({ data: imgData, x: CX, y: CY + 0.2, w: colW - 0.2, h: 2.5 });
            }

            // Left bullets
            (f.leftBullets || []).forEach(function(b, i) {
                if (b) slide.addText('• ' + b, {
                    x: CX, y: CY + 2.9 + i * 0.45,
                    w: colW - 0.2, h: 0.4,
                    fontSize: 9, color: DARK
                });
            });

            // Center label
            const centerX = CX + colW + 0.1;
            if (f.centerTitle) {
                slide.addShape(pres.ShapeType.rect, {
                    x: centerX, y: CY + 0.2,
                    w: colW - 0.2, h: 0.5,
                    fill: { color: RED }
                });
                slide.addText(f.centerTitle, {
                    x: centerX, y: CY + 0.2,
                    w: colW - 0.2, h: 0.5,
                    fontSize: 11, bold: true,
                    color: WHITE, align: 'center', valign: 'middle'
                });
            }
            if (f.centerDesc) {
                slide.addText(f.centerDesc, {
                    x: centerX, y: CY + 0.8,
                    w: colW - 0.2, h: 1.5,
                    fontSize: 9, color: DARK, wrap: true, align: 'center'
                });
            }

            // Right image
            const rightX = CX + colW * 2 + 0.2;
            if (f.rightImage) {
                const imgData = await fetchAsBase64(f.rightImage);
                slide.addImage({ data: imgData, x: rightX, y: CY + 0.2, w: colW - 0.3, h: 2.5 });
            }

            // Right bullets
            (f.rightBullets || []).forEach(function(b, i) {
                if (b) slide.addText('• ' + b, {
                    x: rightX, y: CY + 2.9 + i * 0.45,
                    w: colW - 0.2, h: 0.4,
                    fontSize: 9, color: DARK
                });
            });
            break;
        }

        default:
            slide.addText('Content not available for this layout type', {
                x: CX, y: CY + 2,
                w: CW, h: 1,
                fontSize: 14, color: '9CA3AF', align: 'center'
            });
            break;
    }
}


// ============================================
// TITLE SLIDE builder
// ============================================

async function buildTitleSlide(pres, slide, slideData, SW, SH, logoB64, RED, DARK, WHITE) {
    const f = slideData.fields;

    // Top red line
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: SW, h: 0.12,
        fill: { color: RED }
    });

    // Blue banner
    slide.addShape(pres.ShapeType.rect, {
        x: 1.5, y: 0.5, w: SW - 3, h: 2.2,
        fill: { color: 'DBEAFE' }
    });

    // Logo inside banner
    if (logoB64) {
        slide.addImage({
            data: logoB64,
            x: SW / 2 - 1.0, y: 0.7,
            w: 2.0, h: 0.9
        });
    }

    // Company name
    slide.addText([
        { text: 'RENT', options: { color: RED } },
        { text: 'EASE LIMITED', options: { color: DARK } }
    ], {
        x: 1.5, y: 1.7,
        w: SW - 3, h: 0.7,
        fontSize: 28, bold: true,
        align: 'center'
    });

    // Subtitle
    slide.addText(f.subtitle || 'Corporate Presentation', {
        x: 1.5, y: 3.1,
        w: SW - 3, h: 0.7,
        fontSize: 20, bold: true,
        color: '374151', align: 'center'
    });

    // Tagline
    slide.addText(f.tagline || 'MAKE THE DIFFERENCE', {
        x: 2, y: 4.5,
        w: SW - 4, h: 0.5,
        fontSize: 14, bold: true,
        color: DARK, align: 'center',
        charSpacing: 4
    });

    // Bottom red line
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: SH - 0.12, w: SW, h: 0.12,
        fill: { color: RED }
    });
}


// ============================================
// THANK YOU slide builder
// ============================================

async function buildThankYouSlide(pres, slide, slideData, SW, SH, logoB64, RED, DARK, WHITE) {
    const f = slideData.fields;

    // Top red line
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: SW, h: 0.12,
        fill: { color: RED }
    });

    // Blue handshake box
    slide.addShape(pres.ShapeType.rect, {
        x: 1.0, y: 1.5,
        w: 2.5, h: 2.5,
        fill: { color: '3B82F6' }
    });
    slide.addText('🤝', {
        x: 1.0, y: 1.5, w: 2.5, h: 2.5,
        fontSize: 60, align: 'center', valign: 'middle'
    });

    // Contact info
    slide.addText('📍  ' + (f.address || ''), {
        x: 4.2, y: 2.0, w: 8.5, h: 0.8,
        fontSize: 12, color: DARK, wrap: true
    });
    slide.addText('📞  ' + (f.phone || ''), {
        x: 4.2, y: 3.0, w: 8.5, h: 0.5,
        fontSize: 12, color: DARK
    });
    slide.addText('✉   ' + (f.email || ''), {
        x: 4.2, y: 3.6, w: 8.5, h: 0.5,
        fontSize: 12, color: DARK
    });

    // Logo
    if (logoB64) {
        slide.addImage({
            data: logoB64,
            x: SW - 3.0, y: 0.2,
            w: 2.5, h: 0.9
        });
    }

    // Footer
    slide.addShape(pres.ShapeType.line, {
        x: 0.5, y: 6.8, w: SW - 1, h: 0,
        line: { color: '93C5FD', width: 1, dashType: 'dash' }
    });
    slide.addText([
        { text: 'RENT', options: { color: RED } },
        { text: 'EASE LIMITED', options: { color: DARK } }
    ], {
        x: 0.5, y: 6.85, w: 5, h: 0.35,
        fontSize: 9, bold: true
    });
}
// ============================================
// APP STARTUP
// ============================================

initDB().then(function() {
    loadPresentation();
}).catch(function(e) {
    console.warn('IndexedDB unavailable, loading without images:', e);
    loadPresentation();
});

// ============================================
// PARTICLE BACKGROUND — Ported from Gamma Clone's ParticleBackground.jsx
// (converted from React/useEffect to vanilla JS)
// ============================================

let particleAnimId = null;

function initParticles() {
    // Cancel any previous animation loop
    if (particleAnimId) cancelAnimationFrame(particleAnimId);

    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const numParticles = 200;

    // Ensure canvas fills the screen — same as resize() in the React version
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Track mouse — same as handleMouseMove in React version
    let mouse = { x: null, y: null, radius: 120 };
    function handleMouseMove(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }
    window.addEventListener('mousemove', handleMouseMove);

    // Particle class — copied directly from ParticleBackground.jsx
    function Particle() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
    }

    Particle.prototype.draw = function() {
        ctx.fillStyle = 'rgba(227, 34, 39, 0.6)'; // Rentease Red dots
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    };

    Particle.prototype.update = function() {
        var dx = mouse.x - this.x;
        var dy = mouse.y - this.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            var forceDirectionX = dx / distance;
            var forceDirectionY = dy / distance;
            var force = (mouse.radius - distance) / mouse.radius;
            this.x -= forceDirectionX * force * this.density;
            this.y -= forceDirectionY * force * this.density;
        } else {
            if (this.x !== this.baseX) { this.x -= (this.x - this.baseX) / 15; }
            if (this.y !== this.baseY) { this.y -= (this.y - this.baseY) / 15; }
        }
    };

    // init — same as init() in React version
    function init() {
        particles = [];
        for (var i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }

    // animate — same as animate() in React version
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < particles.length; i++) {
            particles[i].draw();
            particles[i].update();
        }
        particleAnimId = requestAnimationFrame(animate);
    }

    init();
    animate();
}

// Start particles immediately on page load
initParticles();

// ============================================
// AI GENERATION — Ported from Gamma Clone's ai.js
// (converted from ES module + @google/generative-ai SDK
//  to vanilla fetch against the Gemini REST API)
// ============================================

async function generateAIPresentation() {
    const promptInput = document.getElementById('aiPromptInput');
    const slideCountInput = document.getElementById('aiSlideCount');
    const generateBtn = document.getElementById('aiGenerateBtn');

    const userPrompt = promptInput ? promptInput.value.trim() : '';
    const slideCount = slideCountInput ? parseInt(slideCountInput.value) || 6 : 6;

    if (!userPrompt) {
        alert('Please enter a topic or prompt first!');
        return;
    }

    // Show loading state
    const loadingEl = document.getElementById('aiLoadingStatus');
    const statusText = document.getElementById('aiStatusText');
    if (loadingEl) loadingEl.style.display = 'block';
    if (statusText) statusText.textContent = 'AI is thinking...';
    if (generateBtn) { generateBtn.disabled = true; generateBtn.textContent = 'Generating...'; }

    // --- Gemini prompt — same system instruction as ai.js ---
    const systemInstruction = `You are a professional corporate presentation generator for "RENTEASE LIMITED", an equipment rental company.
Generate exactly ${slideCount} slides based on the user's topic.
CRITICAL RULE: Output ONLY a raw JSON array. No markdown, no \`\`\`json tags.
Each slide object MUST have: "layout" (string), "title" (string).

Available layouts and their extra required fields:
1. "title-slide"  — fields: subtitle, tagline
2. "image-text"   — fields: bullets (array of 3 strings), imageCaption (string)
3. "profile-quote"— fields: personName, personRole, quoteHighlight, bullets (array of 3 strings)
4. "icon-grid"    — fields: icons (array of 6 objects each with label and emoji)
5. "image-grid-labels" — fields: cells (array of 4 objects each with label)
6. "equipment-comparison" — fields: centerTitle, centerDesc, leftBullets (array of 3), rightBullets (array of 3)
7. "thank-you"    — fields: address, phone, email

Slide 1 MUST be "title-slide". Last slide MUST be "thank-you".
Use the most appropriate layouts for the middle slides.`;

    const API_KEY = 'AQ.Ab8RN6It7cDVPTg2ALV2adjclECJeAA3__KgoxEW6ttxoaZIgA'; // <-- paste your Gemini API key here
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
        if (statusText) statusText.textContent = 'Contacting Gemini AI...';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: systemInstruction + '\n\nUser Topic: ' + userPrompt }]
                }]
            })
        });

        if (!response.ok) {
            if (response.status === 429) throw new Error('Rate limit reached. Wait a moment and try again, or check your API quota at aistudio.google.com.');
            if (response.status === 400) throw new Error('Invalid API key. Paste your key from aistudio.google.com into app.js line 2437.');
            if (response.status === 403) throw new Error('API key does not have permission. Make sure it is a Gemini API key from aistudio.google.com.');
            throw new Error('Gemini API error: ' + response.status);
        }

        const data = await response.json();
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let aiSlides;
        try {
            aiSlides = JSON.parse(rawText);
        } catch (e) {
            throw new Error('AI returned invalid JSON. Try again.');
        }

        if (statusText) statusText.textContent = 'Building your presentation...';

        // Clear existing slides and populate from AI response
        presentation.slides = [];
        slideCounter = 0;
        blockCounter = 0;

        aiSlides.forEach(function(aiSlide) {
            const slide = addSlide(aiSlide.layout || 'image-text');
            if (!slide) return;

            slide.title = aiSlide.title || '';

            // Merge AI fields into slide.fields
            if (aiSlide.subtitle)       slide.fields.subtitle      = aiSlide.subtitle;
            if (aiSlide.tagline)        slide.fields.tagline       = aiSlide.tagline;
            if (aiSlide.centerTitle)    slide.fields.centerTitle   = aiSlide.centerTitle;
            if (aiSlide.centerDesc)     slide.fields.centerDesc    = aiSlide.centerDesc;
            if (aiSlide.personName)     slide.fields.personName    = aiSlide.personName;
            if (aiSlide.personRole)     slide.fields.personRole    = aiSlide.personRole;
            if (aiSlide.quoteHighlight) slide.fields.quoteHighlight = aiSlide.quoteHighlight;
            if (aiSlide.address)        slide.fields.address       = aiSlide.address;
            if (aiSlide.phone)          slide.fields.phone         = aiSlide.phone;
            if (aiSlide.email)          slide.fields.email         = aiSlide.email;

            // Bullets / text blocks
            if (Array.isArray(aiSlide.bullets)) {
                aiSlide.bullets.forEach(function(text) {
                    addBlock('text');
                    var lastBlock = slide.blocks[slide.blocks.length - 1];
                    if (lastBlock) lastBlock.text = text;
                });
            }
            if (Array.isArray(aiSlide.leftBullets))  slide.fields.leftBullets  = aiSlide.leftBullets;
            if (Array.isArray(aiSlide.rightBullets)) slide.fields.rightBullets = aiSlide.rightBullets;

            // Icon grid
            if (Array.isArray(aiSlide.icons)) {
                aiSlide.icons.forEach(function(iconData) {
                    addBlock('icon');
                    var lastBlock = slide.blocks[slide.blocks.length - 1];
                    if (lastBlock) { lastBlock.label = iconData.label || ''; lastBlock.src = iconData.emoji || ''; }
                });
            }

            // Image grid cells
            if (Array.isArray(aiSlide.cells)) {
                slide.fields.cells = aiSlide.cells.map(function(c) {
                    return { src: '', label: c.label || '' };
                });
            }
        });

        savePresentation();

        // Navigate to Step 2 — same as the layout-card click handler
        setTimeout(function() {
            document.querySelector('[data-step="2"]').click();
        }, 300);

    } catch (err) {
        console.error('AI generation error:', err);
        alert('Error: ' + err.message);
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
        if (generateBtn) { generateBtn.disabled = false; generateBtn.textContent = '✨ Generate'; }
    }
}

// ============================================
// ENTER KEY SUBMIT — lifted from App.jsx's handleKeyDown
// Enter submits, Shift+Enter adds a new line (same as Gamma Clone)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Use event delegation so it also works after innerHTML swaps on nav
    document.addEventListener('keydown', function(e) {
        if (e.target && e.target.id === 'aiPromptInput') {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // stop the newline
                var btn = document.getElementById('aiGenerateBtn');
                if (btn && !btn.disabled) generateAIPresentation();
            }
            // Shift+Enter falls through naturally — textarea inserts a newline
        }
    });
});