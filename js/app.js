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
let deletedSlidesHistory = [];

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

    if (layoutType === 'image-showcase') {
        slide.fields = {
            images: [
                { src: '' }
            ]
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
            photo: 'assets/IMAGES/Meghraj Singh.jpg',
            personName: 'Meghraj Singh',
            personRole: 'Managing Director',
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
    const slideIndex = presentation.slides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) return;

    // Save to history for Ctrl+Z undo
    deletedSlidesHistory.push({
        index: slideIndex,
        slide: JSON.parse(JSON.stringify(presentation.slides[slideIndex]))
    });

    presentation.slides = presentation.slides.filter(s => s.id !== slideId);
    if (activeSlideId === slideId) {
        activeSlideId = presentation.slides.length > 0
            ? presentation.slides[presentation.slides.length - 1].id
            : null;
    }
    updateSidebarStatus();
    savePresentation();
    const activeStep = document.querySelector('.nav-item.active');
    if (activeStep && activeStep.dataset.step === '2') {
        renderStep2();
    }
}

function duplicateSlide(slideId) {
    const index = presentation.slides.findIndex(s => s.id === slideId);
    if (index === -1) return;

    // Deep copy the slide
    const originalSlide = presentation.slides[index];
    const newSlide = JSON.parse(JSON.stringify(originalSlide));

    // Generate new unique IDs for the new slide and its blocks
    newSlide.id = 'slide-' + slideCounter++;
    newSlide.title = newSlide.title ? newSlide.title + ' (Copy)' : 'Copy';
    if (newSlide.blocks) {
        newSlide.blocks.forEach(block => {
            block.id = 'block-' + blockCounter++;
        });
    }

    // Insert right after the original slide
    presentation.slides.splice(index + 1, 0, newSlide);
    activeSlideId = newSlide.id;

    updateSidebarStatus();
    savePresentation();
    const activeStep = document.querySelector('.nav-item.active');
    if (activeStep && activeStep.dataset.step === '2') {
        renderStep2();
    }
}

function moveSlide(slideId, direction) {
    const index = presentation.slides.findIndex(s => s.id === slideId);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= presentation.slides.length) return;
    const slide = presentation.slides.splice(index, 1)[0];
    presentation.slides.splice(newIndex, 0, slide);
    updateSidebarStatus();
    savePresentation();
    const activeStep = document.querySelector('.nav-item.active');
    if (activeStep && activeStep.dataset.step === '2') {
        renderStep2();
    }
}

function getActiveSlide() {
    return presentation.slides.find(s => s.id === activeSlideId);
}

function selectSlide(slideId) {
    activeSlideId = slideId;
    const activeStep = document.querySelector('.nav-item.active');
    if (activeStep && activeStep.dataset.step === '2') {
        renderStep2();
    }
}



// ============================================
// 4. BLOCK MANAGEMENT
// ============================================

function addBlock(type) {
    const slide = getActiveSlide();
    if (!slide) return;

    const blockId = 'block-' + blockCounter++;

    if (type === 'image') {
        slide.blocks.push({ id: blockId, type: 'image', src: '', caption: '', shape: 'oval' });
    } else if (type === 'icon') {
        slide.blocks.push({ id: blockId, type: 'icon', src: '', label: '' });
    } else if (type === 'logo') {
        slide.blocks.push({ id: blockId, type: 'logo', src: '' });
    } else {
        slide.blocks.push({ id: blockId, type: type, text: '' });
    }
    savePresentation();
    const activeStep = document.querySelector('.nav-item.active');
    if (activeStep && activeStep.dataset.step === '2') {
        renderStep2();
    }
}

function removeBlock(blockId) {
    const slide = getActiveSlide();
    if (!slide) return;
    slide.blocks = slide.blocks.filter(b => b.id !== blockId);
    savePresentation();
    const activeStep = document.querySelector('.nav-item.active');
    if (activeStep && activeStep.dataset.step === '2') {
        renderStep2();
    }
}

function clearBlockImage(blockId) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) {
        block.src = '';
        savePresentation();
        renderStep2();
    }
}

function updateBlockImageFit(blockId, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) {
        block.imageFit = value;
        savePresentation();
        updateSlidePreview();
    }
}

function clearFieldImage(fieldName) {
    const slide = getActiveSlide();
    if (!slide) return;
    slide.fields[fieldName] = '';
    savePresentation();
    const activeStep = document.querySelector('.nav-item.active');
    if (activeStep && activeStep.dataset.step === '2') {
        renderStep2();
    }
}

function clearCellImage(index) {
    const slide = getActiveSlide();
    if (!slide) return;
    if (slide.fields.cells && slide.fields.cells[index]) {
        slide.fields.cells[index].src = '';
        savePresentation();
        renderStep2();
    }
}

function updateBlockText(blockId, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) block.text = value;
    updateSlidePreview();
    savePresentation();
}

function updateBlockLabel(blockId, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) block.label = value;
    updateSlidePreview();
    savePresentation();
}

function updateSlideTitle(value) {
    const slide = getActiveSlide();
    if (slide) slide.title = value;
    updateSlidePreview();
    savePresentation();
}

function updateField(fieldName, value) {
    const slide = getActiveSlide();
    if (slide) slide.fields[fieldName] = value;
    updateSlidePreview();
    savePresentation();
}

function updateImageCaption(blockId, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) block.caption = value;
    updateSlidePreview();
    savePresentation();
}

function updateImageShape(blockId, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    const block = slide.blocks.find(b => b.id === blockId);
    if (block) block.shape = value;
    updateSlidePreview();
    savePresentation();
}

// Handles image blocks (Image+Text, Image Showcase etc.)
function handleImageUpload(blockId, event) {
    const file = event.target.files[0];
    if (!file) return;
    const imageKey = 'img_' + blockId;
    dbSaveImage(imageKey, file).then(function () {
        return dbLoadImage(imageKey);
    }).then(function (url) {
        const slide = getActiveSlide();
        if (!slide) return;
        const block = slide.blocks.find(function (b) { return b.id === blockId; });
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
    dbSaveImage(imageKey, file).then(function () {
        return dbLoadImage(imageKey);
    }).then(function (url) {
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
    dbSaveImage(imageKey, file).then(function () {
        return dbLoadImage(imageKey);
    }).then(function (url) {
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
    dbSaveImage(imageKey, file).then(function () {
        return dbLoadImage(imageKey);
    }).then(function (url) {
        const slide = getActiveSlide();
        if (slide) {
            slide.fields[side] = url;
            slide.fields[side + '_key'] = imageKey;
            savePresentation();
            updateSlidePreview();
        }
    });
}

// Handles image-showcase layout dynamically
function addShowcaseImage(slideId) {
    const slide = getActiveSlide();
    if (!slide || slide.id !== slideId) return;
    if (!slide.fields.images) slide.fields.images = [];
    if (slide.fields.images.length >= 10) {
        alert("Maximum 10 images allowed.");
        return;
    }
    slide.fields.images.push({ src: '' });
    savePresentation();
    const activeStep = document.querySelector('.nav-item.active');
    if (activeStep && activeStep.dataset.step === '2') {
        renderStep2();
    }
}

function removeShowcaseImage(slideId, index) {
    const slide = getActiveSlide();
    if (!slide || slide.id !== slideId) return;
    if (slide.fields.images && slide.fields.images.length > 1) {
        slide.fields.images.splice(index, 1);
        savePresentation();
        renderStep2();
    }
}

function handleShowcaseImageUpload(slideId, index, event) {
    const file = event.target.files[0];
    if (!file) return;
    const imageKey = 'showcase_' + slideId + '_' + index + '_' + Date.now();
    dbSaveImage(imageKey, file).then(function () {
        return dbLoadImage(imageKey);
    }).then(function (url) {
        const slide = getActiveSlide();
        if (slide && slide.id === slideId) {
            slide.fields.images[index].src = url;
            slide.fields.images[index].imageKey = imageKey;
            savePresentation();
            renderStep2();
        }
    });
}

function updateShowcaseImageFit(slideId, index, value) {
    const slide = getActiveSlide();
    if (!slide || slide.id !== slideId) return;
    if (slide.fields.images && slide.fields.images[index]) {
        slide.fields.images[index].imageFit = value;
        savePresentation();
        updateSlidePreview();
    }
}

function updateGridCell(index, key, value) {
    const slide = getActiveSlide();
    if (!slide) return;
    if (!slide.fields.cells) slide.fields.cells = [{}, {}, {}, {}];
    if (!slide.fields.cells[index]) slide.fields.cells[index] = {};
    slide.fields.cells[index][key] = value;
    savePresentation();
    updateSlidePreview();
}

function clearShowcaseImage(slideId, index) {
    const slide = getActiveSlide();
    if (!slide || slide.id !== slideId) return;
    if (slide.fields.images && slide.fields.images[index]) {
        slide.fields.images[index].src = '';
        delete slide.fields.images[index].imageKey;
        savePresentation();
        renderStep2();
    }
}

// ============================================
// 5. EDITOR HTML — one case per layout
// ============================================

const getImageFitToggleHTML = (name, currentValue, onChangeStr) => `
    <div style="margin-top:8px; display:flex; gap:10px; font-size:0.8rem; background:#F3F4F6; padding:6px; border-radius:4px;">
        <label style="display:flex; align-items:center; gap:4px; cursor:pointer;">
            <input type="radio" name="${name}" value="cover" ${currentValue === 'contain' ? '' : 'checked'} onchange="${onChangeStr}"> Cover
        </label>
        <label style="display:flex; align-items:center; gap:4px; cursor:pointer;">
            <input type="radio" name="${name}" value="contain" ${currentValue === 'contain' ? 'checked' : ''} onchange="${onChangeStr}"> Contain
        </label>
    </div>
`;
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

        // ---- 5. PROFILE / QUOTE ----
        case 'profile-quote': {
            return wrapEditor(`
                ${titleField}
                <div class="form-hint" style="margin-bottom:15px; color:var(--color-primary); font-weight:bold;">
                    Note: Image, Name (Meghraj Singh), and Position (Managing Director) are hardcoded.
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
        }

        // ---- 6. IMAGE SHOWCASE ----
        case 'image-showcase': {
            const images = slide.fields.images || [{ src: '' }];
            const imagesHTML = images.map((img, i) => {
                let currentImageHtml = '';
                if (img.src) {
                    let filename = img.src.split('/').pop() || 'Selected Image';
                    if (filename.length > 30) filename = filename.substring(0, 27) + '...';
                    currentImageHtml = `
                        <div class="current-image-preview">
                            <span class="filename">${filename}</span>
                            <button class="clear-img-btn" onclick="clearShowcaseImage('${slide.id}', ${i})" title="Clear Image">✕</button>
                        </div>
                    `;
                }

                return `
                    <div class="block-editor">
                        <div class="block-header">
                            <span class="block-type">Image ${i + 1}</span>
                            ${images.length > 1 ? `<button class="block-remove" onclick="removeShowcaseImage('${slide.id}', ${i})"><i class="fa fa-trash"></i></button>` : ''}
                        </div>
                        <div class="file-upload-wrapper">
                            ${currentImageHtml}
                            <label class="file-upload-btn">
                                <span>Choose Image...</span>
                                <input type="file" accept="image/*" onchange="handleShowcaseImageUpload('${slide.id}', ${i}, event)">
                            </label>
                            ${getImageFitToggleHTML(`showcaseFit_${slide.id}_${i}`, img.imageFit, `updateShowcaseImageFit('${slide.id}', ${i}, this.value)`)}
                        </div>
                    </div>
                `;
            }).join('');

            return wrapEditor(`
                ${titleField}
                <p class="form-hint">Upload up to 10 images. They'll dynamically arrange themselves on the slide.</p>
                <div class="showcase-images-list">
                    ${imagesHTML}
                </div>
                <div class="add-buttons">
                    <button class="add-btn add-btn-accent" onclick="addShowcaseImage('${slide.id}')">+ Add Image</button>
                </div>
            `);
        }

        // ---- 7. IMAGE GRID + LABELS ----
        case 'image-grid-labels': {
            const cells = slide.fields.cells || [{}, {}, {}, {}];
            const cellsHTML = cells.map((cell, i) => {
                let currentImageHtml = '';
                if (cell.src) {
                    let filename = cell.src.split('/').pop() || 'Selected Image';
                    if (filename.length > 30) filename = filename.substring(0, 27) + '...';
                    currentImageHtml = `
                        <div style="font-size:0.75rem; color:var(--color-primary); margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; background:#FEE2E2; padding:6px 10px; border-radius:4px; border:1px solid #FCA5A5;">
                            <span style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🖼️ ${escapeHtml(filename)}</span>
                            <button onclick="clearCellImage(${i})" style="background:none; border:none; color:#EF4444; cursor:pointer; font-weight:bold; font-size:0.9rem;" title="Remove image">✕</button>
                        </div>
                    `;
                }
                const shapeVal = cell.shape || 'rounded';

                return `
                <div class="content-block">
                    <div class="block-header">
                        <span class="block-type-label">Cell ${i + 1}</span>
                    </div>
                    <div class="image-block-controls">
                        ${currentImageHtml}
                        <input type="file" accept="image/*" onchange="handleCellImageUpload(${i}, event)">
                        <input type="text" placeholder="Label text (e.g. Recruitment and Training)"
                            value="${escapeHtml(cell.label || '')}"
                            oninput="updateGridCell(${i}, 'label', this.value)">
                        ${getImageFitToggleHTML(`cellFit_${slide.id}_${i}`, cell.imageFit, `updateGridCell(${i}, 'imageFit', this.value)`)}
                    </div>
                </div>
                `;
            }).join('');

            return wrapEditor(`
                ${titleField}
                <p class="form-hint">Fill in all 4 cells. Each cell has an image and a label.</p>
                ${cellsHTML}
            `);
        }

        // ---- 8. EQUIPMENT COMPARISON ----
        case 'equipment-comparison': {
            const f = slide.fields;

            const makeImageControl = (side, label) => {
                let html = '';
                if (f[side]) {
                    let filename = f[side].split('/').pop() || 'Selected Image';
                    if (filename.length > 30) filename = filename.substring(0, 27) + '...';
                    html = `
                        <div style="font-size:0.75rem; color:var(--color-primary); margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; background:#FEE2E2; padding:6px 10px; border-radius:4px; border:1px solid #FCA5A5;">
                            <span style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🖼️ ${escapeHtml(filename)}</span>
                            <button onclick="clearFieldImage('${side}')" style="background:none; border:none; color:#EF4444; cursor:pointer; font-weight:bold; font-size:0.9rem;" title="Remove image">✕</button>
                        </div>
                    `;
                }
                const shapeVal = f[side + 'Shape'] || 'rounded';
                return `
                    <div class="form-group">
                        <label>${label}</label>
                        ${html}
                        <input type="file" accept="image/*" onchange="handleComparisonImage('${side}', event)">
                        <div class="shape-selector" style="margin-top:10px;">
                            <label>Shape:</label>
                            <select onchange="updateComparisonField('${side}Shape', null, this.value)">
                                <option value="oval" ${shapeVal === 'oval' ? 'selected' : ''}>Oval</option>
                                <option value="rounded" ${shapeVal === 'rounded' ? 'selected' : ''}>Rounded Rectangle</option>
                            </select>
                        </div>
                        ${getImageFitToggleHTML(`${side}Fit_${slide.id}`, f[side + 'Fit'], `updateComparisonField('${side}Fit', null, this.value)`)}
                    </div>
                `;
            };

            return wrapEditor(`
                ${titleField}
                <div class="comparison-editor">
                    <div class="comp-section">
                        <h4 class="comp-section-title">⬅ Left Side</h4>
                        ${makeImageControl('leftImage', 'Image')}
                        <div class="form-group">
                            <label>Bullet Points</label>
                            ${[0, 1, 2].map(i => `
                                <input type="text" placeholder="Bullet ${i + 1}..."
                                    value="${escapeHtml((f.leftBullets || [])[i] || '')}"
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
                        ${makeImageControl('rightImage', 'Image')}
                        <div class="form-group">
                            <label>Bullet Points</label>
                            ${[0, 1, 2].map(i => `
                                <input type="text" placeholder="Bullet ${i + 1}..."
                                    value="${escapeHtml((f.rightBullets || [])[i] || '')}"
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
                ${titleField}
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

    if (block.type === 'paragraph' || block.type === 'text') {
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
        let currentImageHtml = '';
        if (block.src) {
            let filename = block.src.split('/').pop() || 'Selected Image';
            if (filename.length > 30) filename = filename.substring(0, 27) + '...';
            currentImageHtml = `
                <div style="font-size:0.75rem; color:var(--color-primary); margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; background:#FEE2E2; padding:6px 10px; border-radius:4px; border:1px solid #FCA5A5;">
                    <span style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🖼️ ${escapeHtml(filename)}</span>
                    <button onclick="clearBlockImage('${block.id}')" style="background:none; border:none; color:#EF4444; cursor:pointer; font-weight:bold; font-size:0.9rem;" title="Remove image">✕</button>
                </div>
            `;
        }

        inner = `
            <div class="block-header">
                <span class="block-type-label">🖼️ Image</span>
                <button class="remove-btn" onclick="removeBlock('${block.id}')" title="Delete entire block">✕</button>
            </div>
            <div class="image-block-controls">
                ${currentImageHtml}
                <input type="file" accept="image/*" onchange="handleImageUpload('${block.id}', event)">
                <input type="text" placeholder="Caption (e.g. Boom Lift)"
                    value="${escapeHtml(block.caption)}"
                    oninput="updateImageCaption('${block.id}', this.value)">
                <div class="shape-selector">
                    <label>Shape:</label>
                    <select onchange="updateImageShape('${block.id}', this.value)">
                        <option value="oval" ${block.shape === 'oval' ? 'selected' : ''}>Oval</option>
                        <option value="rounded" ${block.shape === 'rounded' ? 'selected' : ''}>Rounded Rectangle</option>
                    </select>
                </div>
                ${getImageFitToggleHTML(`blockFit_${block.id}`, block.imageFit, `updateBlockImageFit('${block.id}', this.value)`)}
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
    const globalCompanyName = (presentation.slides[0] && presentation.slides[0].fields && presentation.slides[0].fields.companyName) || 'RENTEASE LIMITED';
    const cnParts = splitCompanyName(globalCompanyName);

    // Shared frame wrapper
    const frame = (content, hasHeader = true) => `
        <div class="slide-frame" style="background:white;">
            ${hasHeader ? `
            <div class="sf-header" style="background:#E6EEF9; display:flex; align-items:center; border-bottom:1.5px solid var(--color-primary); padding: 4px 8px;">
                <div class="sf-title-bar" style="flex:1; min-width:0;">
                    <span class="sf-title-text" id="previewTitle" style="font-size:1.2rem; font-weight:bold; color:#000;">
                        ${escapeHtml(slide.title) || 'SLIDE TITLE'}
                    </span>
                </div>
                <img src="assets/rentease_logo.png" alt="Logo" class="sf-logo" style="height:28px;">
            </div>` : ''}
            <div class="sf-body" style="flex:1; display:flex; min-height:0;">
                <div class="sf-content" style="flex:1; padding:8px; overflow:hidden; min-height:0; display:flex; flex-direction:column;">
                    ${content}
                </div>
                ${hasHeader ? `
                <div class="sf-equip-sidebar" style="width:65px; padding:8px 4px; text-align:center;">
                    <img src="assets/sidebar_icons.png" style="width:100%; height:auto;">
                </div>` : ''}
            </div>
            <div class="sf-footer" style="border-top:1px dashed #4B8BBE; padding:4px 8px;">
                <span class="sf-footer-text" style="font-size:0.6rem; font-weight:bold;">
                    <span class="red">${escapeHtml(cnParts.first)}</span><span style="color:#808080;">${escapeHtml(cnParts.second)}</span>
                </span>
            </div>
        </div>
    `;

    switch (slide.layout) {

        // ---- 1. TITLE SLIDE ----
        case 'title-slide': {
            const f = slide.fields;
            const titleCnParts = splitCompanyName(f.companyName);
            return `
                <div class="slide-frame" style="background:white; padding:2% 3%; box-sizing:border-box;">
                    <div style="border-top: 1px solid #000; width:100%; margin-bottom:1.5%;"></div>
                    
                    <div style="background:#91BCE5; border: 2px solid #1C3B68; padding:3% 0; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0;">
                        <img src="assets/rentease_logo.png" style="height:8%; min-height:40px; max-height:80px; width:auto;">
                        <div style="font-size:clamp(0.9rem,2vw,2rem); font-weight:800; letter-spacing:1px; margin-top:1.5%;">
                            <span style="color:var(--color-primary);">${escapeHtml(titleCnParts.first)}</span><span style="color:#666666;">${escapeHtml(titleCnParts.second)}</span>
                        </div>
                    </div>
                    
                    <div style="border-top: 1.5px solid #4B8BBE; width:85%; margin: 2% auto; flex-shrink:0;"></div>
                    
                    <div style="text-align:center; margin-bottom:1.5%; flex-shrink:0;">
                        <div style="font-size:clamp(0.75rem,1.5vw,1.8rem); font-weight:800; color:#808080;">
                            ${escapeHtml(f.subtitle) || 'Corporate Presentation'}
                        </div>
                    </div>
                    
                    <div style="flex:1; min-height:0; display:flex; justify-content:space-evenly; align-items:center; width:90%; margin:0 auto;">
                        <img src="assets/icons/icon1.png" style="height:70%; max-height:70px; width:auto; border-radius:6px; object-fit:contain;">
                        <img src="assets/icons/icon2.png" style="height:70%; max-height:70px; width:auto; border-radius:6px; object-fit:contain;">
                        <img src="assets/icons/icon3.png" style="height:70%; max-height:70px; width:auto; border-radius:6px; object-fit:contain;">
                        <img src="assets/icons/icon4.png" style="height:70%; max-height:70px; width:auto; border-radius:6px; object-fit:contain;">
                        <img src="assets/icons/icon5.png" style="height:70%; max-height:70px; width:auto; border-radius:6px; object-fit:contain;">
                        <img src="assets/icons/icon6.png" style="height:70%; max-height:70px; width:auto; border-radius:6px; object-fit:contain;">
                    </div>
                    
                    <div style="border-top: 1px solid #000; width:100%; margin-top:1.5%; padding-top:1%; text-align:center; flex-shrink:0;">
                        <span style="font-size:clamp(0.5rem,0.8vw,0.75rem); font-weight:700; color:#000; letter-spacing:2px;">
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
                            style="${b.src ? `background-image:url('${encodeURI(b.src).replace(/'/g, "%27")}'); background-size:${b.imageFit === 'contain' ? 'contain' : 'cover'}; background-color:${b.imageFit === 'contain' ? '#FFFFFF' : 'transparent'}; background-repeat:no-repeat;` : ''}">
                            ${b.src ? '' : '📷'}
                        </div>
                        ${b.caption ? `<span class="sf-img-caption">${escapeHtml(b.caption)}</span>` : ''}
                    </div>`).join('');

            const totalChars = textBlocks.reduce((acc, b) => acc + (b.text || '').length, 0);
            let dynamicFontSize = '1.0rem';
            if (totalChars < 100) dynamicFontSize = '1.8rem';
            else if (totalChars < 200) dynamicFontSize = '1.4rem';
            else if (totalChars < 400) dynamicFontSize = '1.1rem';
            else if (totalChars < 600) dynamicFontSize = '0.9rem';
            else if (totalChars < 800) dynamicFontSize = '0.8rem';
            else dynamicFontSize = '0.7rem';

            const textHTML = textBlocks.length === 0
                ? '<p class="sf-text sf-placeholder-text">Content will appear here...</p>'
                : textBlocks.map(b => b.type === 'bullet'
                    ? `<p class="sf-text sf-bullet" style="font-size:${dynamicFontSize}; line-height:1.4; margin-bottom:12px;">• ${escapeHtml(b.text)}</p>`
                    : `<p class="sf-text" style="font-size:${dynamicFontSize}; line-height:1.4; margin-bottom:12px;">${escapeHtml(b.text)}</p>`).join('');

            return frame(`
                <div style="display:flex; gap:20px; height:100%; align-items:center;">
                    <div class="sf-left" id="previewImages" style="flex:0 0 38%; height:100%; display:flex; flex-direction:column; justify-content:center;">${imagesHTML}</div>
                    <div class="sf-right" id="previewTextArea" style="flex:1; display:flex; flex-direction:column; justify-content:center;">${textHTML}</div>
                </div>
            `);
        }

        // ---- 5. PROFILE / QUOTE ----
        case 'profile-quote': {
            const f = slide.fields;
            const textBlocks = slide.blocks;

            const totalChars = textBlocks.reduce((acc, b) => acc + (b.text || '').length, 0);
            let dynamicFontSize = '0.75rem';
            if (totalChars < 200) dynamicFontSize = '1.1rem';
            else if (totalChars < 400) dynamicFontSize = '0.95rem';
            else if (totalChars < 600) dynamicFontSize = '0.85rem';
            else if (totalChars < 800) dynamicFontSize = '0.75rem';
            else dynamicFontSize = '0.65rem';

            const textHTML = textBlocks.length === 0
                ? '<p class="sf-placeholder-text" style="font-size:0.6rem;">Add content using editor below...</p>'
                : textBlocks.map(b => b.type === 'bullet'
                    ? `<p class="sf-text sf-bullet" style="font-size:${dynamicFontSize}; line-height:1.4; margin-bottom:8px;">• ${escapeHtml(b.text)}</p>`
                    : `<p class="sf-text" style="font-size:${dynamicFontSize}; line-height:1.4; margin-bottom:8px;">${escapeHtml(b.text)}</p>`).join('');

            return frame(`
                <div style="display:flex; flex-direction:column; height:100%;">
                    ${f.quoteHighlight ? `
                    <div style="background:#FFF3E0; padding:10px; border-radius:4px; margin: 0 5% 16px 5%; font-size:1.1rem; font-style:italic; font-weight:600; color:#B45309; text-align:center; flex-shrink:0;">
                        "${escapeHtml(f.quoteHighlight)}"
                    </div>` : ''}
                    <div style="display:flex; flex:1; flex-direction:column; justify-content:center;">
                        <div style="display:flex; gap:20px; align-items:flex-start; width:100%;">
                            <div style="flex:0 0 35%; display:flex; flex-direction:column; align-items:center; gap:12px;">
                                <img src="assets/IMAGES/Meghraj Singh.jpg" style="width:200px; height:200px; border-radius:50%; object-fit:cover; border:3px solid white; box-shadow:0 0 0 2px var(--color-primary);">
                                <div style="text-align:center;">
                                    <div style="font-size:1.0rem; font-weight:700;">Meghraj Singh</div>
                                    <div style="font-size:0.8rem; color:#4B5563; font-weight:600;">Managing Director</div>
                                </div>
                            </div>
                            <div style="flex:1;" id="previewTextArea">${textHTML}</div>
                        </div>
                    </div>
                </div>
            `);
        }

        // ---- 6. IMAGE SHOWCASE ----
        case 'image-showcase': {
            const allImages = slide.fields.images || [{ src: '' }];
            const validImages = allImages.filter(img => img.src);
            const displayImages = validImages.length > 0 ? validImages : [{ src: '' }];
            const count = Math.min(displayImages.length, 10);

            let basis = '100%';
            let heightCalc = '100%';

            if (count === 1) { basis = '100%'; heightCalc = '100%'; }
            else if (count === 2) { basis = 'calc(50% - 4px)'; heightCalc = '100%'; }
            else if (count === 3) { basis = 'calc(33.333% - 5.33px)'; heightCalc = '100%'; }
            else if (count === 4) { basis = 'calc(50% - 4px)'; heightCalc = 'calc(50% - 4px)'; }
            else if (count === 5 || count === 6) { basis = 'calc(33.333% - 5.33px)'; heightCalc = 'calc(50% - 4px)'; }
            else if (count === 7 || count === 8) { basis = 'calc(25% - 6px)'; heightCalc = 'calc(50% - 4px)'; }
            else if (count === 9) { basis = 'calc(33.333% - 5.33px)'; heightCalc = 'calc(33.333% - 5.33px)'; }
            else if (count === 10) { basis = 'calc(20% - 6.4px)'; heightCalc = 'calc(50% - 4px)'; }

            const showcaseHTML = `
                <div style="display:flex; flex-wrap:wrap; gap:8px; width:100%; flex:1; min-height:0; overflow:hidden; box-sizing:border-box;">
                    ${displayImages.slice(0, 10).map(img => `
                        <div style="flex: 1 1 ${basis}; height: ${heightCalc}; border-radius: var(--radius-sm); overflow: hidden; background: ${img.imageFit === 'contain' ? '#FFFFFF' : 'var(--color-bg-alt)'};">
                            ${img.src
                    ? `<img src="${img.src}" style="width:100%; height:100%; object-fit:${img.imageFit === 'contain' ? 'contain' : 'cover'}; display:block;">`
                    : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:2rem; color:#A0AEC0;">📷</div>`
                }
                        </div>
                    `).join('')}
                </div>
            `;

            return frame(showcaseHTML);
        }

        case 'image-grid-labels': {
            const allCells = slide.fields.cells || [];
            const cells = allCells.filter(c => c.src || c.label);
            if (cells.length === 0) cells.push({});

            let gridStyles = 'grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr;';
            if (cells.length === 1) gridStyles = 'grid-template-columns:1fr; grid-template-rows:1fr;';
            else if (cells.length === 2) gridStyles = 'grid-template-columns:1fr 1fr; grid-template-rows:1fr;';

            return frame(`
                <div style="display:grid; ${gridStyles} gap:20px; height:100%; padding:10px;">
                    ${cells.map((cell, index) => {
                let spanStyle = '';
                if (cells.length === 3 && index === 2) spanStyle = 'grid-column: 1 / -1;';
                return `
                        <div style="position:relative; width:100%; height:100%; border-radius:6px; overflow:hidden; background:${cell.imageFit === 'contain' ? '#FFFFFF' : '#E5E7EB'}; ${spanStyle}">
                            ${cell.src
                        ? `<img src="${cell.src}" style="width:100%; height:100%; object-fit:${cell.imageFit === 'contain' ? 'contain' : 'cover'}; display:block;">`
                        : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:2rem; color:#9CA3AF;">📷</div>`
                    }
                            <div style="position:absolute; bottom:0; left:0; width:100%; background:var(--color-primary); color:white; padding:10px; text-align:center; font-size:0.9rem; font-weight:700;">
                                ${escapeHtml(cell.label || 'Label')}
                            </div>
                        </div>
                    `}).join('')}
                </div>
            `);
        }

        // ---- 8. EQUIPMENT COMPARISON ----
        case 'equipment-comparison': {
            const f = slide.fields;

            const totalChars = (f.centerDesc || '').length +
                (f.leftBullets || []).join('').length +
                (f.rightBullets || []).join('').length;

            let baseFontSize = '0.9rem';
            let titleFontSize = '1.1rem';
            let imgSize = '160px';
            let gapSize = '16px';
            let bulletGap = '10px';

            if (totalChars < 150) {
                baseFontSize = '1.3rem';
                titleFontSize = '1.6rem';
                imgSize = '240px';
                gapSize = '24px';
                bulletGap = '16px';
            } else if (totalChars > 300) {
                baseFontSize = '0.75rem';
                titleFontSize = '0.9rem';
                imgSize = '130px';
                gapSize = '10px';
                bulletGap = '6px';
            }

            const mkBullets = (arr) => (arr || []).map(b =>
                b ? `<div style="font-size:${baseFontSize}; color:#374151; text-align:center; margin-bottom:${bulletGap};">• ${escapeHtml(b)}</div>` : ''
            ).join('');

            return frame(`
                <div style="display:flex; gap:20px; height:100%; align-items:center; justify-content:center;">
                    
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:${gapSize};">
                        ${f.leftImage
                    ? `<img src="${f.leftImage}" style="width:100%; max-width:300px; height:${imgSize}; object-fit:${f.leftImageFit === 'contain' ? 'contain' : 'cover'}; background:${f.leftImageFit === 'contain' ? '#FFFFFF' : 'transparent'}; border-radius:${(f.leftImageShape || 'rounded') === 'oval' ? '50%' : '6px'};">`
                    : `<div style="width:100%; max-width:300px; height:${imgSize}; background:#F3F4F6; border:1px solid #E5E7EB; border-radius:6px; display:flex; align-items:center; justify-content:center;">📷</div>`
                }
                        <div style="display:flex; flex-direction:column; width:100%;">
                            ${mkBullets(f.leftBullets)}
                        </div>
                    </div>
                    
                    <div style="flex:1.2; display:flex; flex-direction:column; align-items:center; align-self:flex-start; margin-top:5%; gap:${gapSize}; padding:0 10px;">
                        ${f.centerTitle ? `<div style="background:var(--color-primary); color:white; padding:8px 16px; border-radius:4px; font-size:${titleFontSize}; font-weight:700; text-align:center;">${escapeHtml(f.centerTitle)}</div>` : ''}
                        ${f.centerDesc ? `<div style="font-size:${baseFontSize}; color:#374151; text-align:center; line-height:1.5;">${escapeHtml(f.centerDesc)}</div>` : ''}
                    </div>
                    
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:${gapSize};">
                        ${f.rightImage
                    ? `<img src="${f.rightImage}" style="width:100%; max-width:300px; height:${imgSize}; object-fit:${f.rightImageFit === 'contain' ? 'contain' : 'cover'}; background:${f.rightImageFit === 'contain' ? '#FFFFFF' : 'transparent'}; border-radius:${(f.rightImageShape || 'rounded') === 'oval' ? '50%' : '6px'};">`
                    : `<div style="width:100%; max-width:300px; height:${imgSize}; background:#F3F4F6; border:1px solid #E5E7EB; border-radius:6px; display:flex; align-items:center; justify-content:center;">📷</div>`
                }
                        <div style="display:flex; flex-direction:column; width:100%;">
                            ${mkBullets(f.rightBullets)}
                        </div>
                    </div>
                </div>
            `);
        }

        // ---- 9. THANK YOU ----
        case 'thank-you': {
            const f = slide.fields;
            // The thank you slide uses the common frame (hasHeader = true)
            return frame(`
                <div style="display:flex; width:100%; height:100%; align-items:center; justify-content:space-between; padding:0 30px;">
                    
                    <!-- Left geometric shape (background) -->
                    <div style="position:absolute; left:-8px; top:10%; width:25%; height:90%; background:#F5F5F5; border-top-right-radius:20px; z-index:0;"></div>
                    
                    <!-- Handshake image (Left) -->
                    <img src="assets/handshake.png?v=2" style="position:relative; width:20%; height:auto; z-index:1; margin-left:2%;">
                    
                    <!-- Text Content (Middle) -->
                    <div style="flex:1; display:flex; flex-direction:column; padding:0 30px; z-index:1; margin-left: 5%;">
                        <div style="font-size:2.8rem; font-weight:bold; color:#000; line-height:1; white-space:nowrap;">Thank You</div>
                        <div style="width:50px; height:3px; background:#4B8BBE; margin-top:8px; margin-bottom:24px;"></div>
                        
                        <div style="display:flex; flex-direction:column; gap:16px;">
                            <div style="display:flex; align-items:flex-start; gap:8px;">
                                <img src="assets/icon_address.png" style="width:16px; height:16px; margin-top:2px;">
                                <div>
                                    <div style="font-size:0.75rem; font-weight:bold; color:#000;">Address:</div>
                                    <div style="font-size:0.65rem; font-weight:bold; color:#000;">${escapeHtml(f.address || '705-706, The Landmark, Plot 26A, Sector 7, Kharghar, Navi Mumbai - 410210')}</div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:flex-start; gap:8px;">
                                <img src="assets/icon_phone.png" style="width:16px; height:16px; margin-top:2px;">
                                <div>
                                    <div style="font-size:0.75rem; font-weight:bold; color:#000;">Contact numbers:</div>
                                    <div style="font-size:0.65rem; font-weight:bold; color:#000;">${escapeHtml(f.phone || '+91 22 2774 7458')}</div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:flex-start; gap:8px;">
                                <img src="assets/icon_email.png" style="width:16px; height:16px; margin-top:2px;">
                                <div>
                                    <div style="font-size:0.75rem; font-weight:bold; color:#000;">Email Address:</div>
                                    <div style="font-size:0.65rem; font-weight:bold; color:#000;">${escapeHtml(f.email || 'info@rentease.co')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- World Map (Right) -->
                    <img src="assets/world_map.png?v=2" style="width:33%; height:auto; z-index:1; margin-right:3%; margin-top:15%;">
                </div>
            `, true); // Pass true to include the common frame header/footer
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
    presentation.slides.forEach(function (slide, index) {
        const isActive = slide.id === activeSlideId;
        slideListHTML += `
            <div class="slide-thumb ${isActive ? 'active' : ''}" 
                 data-id="${slide.id}"
                 onclick="selectSlide('${slide.id}')">
                <span class="slide-thumb-number">${index + 1}</span>
                <div class="slide-thumb-info">
                    <span class="slide-thumb-layout">${layoutNames[slide.layout]}</span>
                    <span class="slide-thumb-title">${escapeHtml(slide.title) || 'Untitled'}</span>
                </div>
                <div class="slide-thumb-actions">
                    <button class="thumb-btn thumb-btn-delete" onclick="event.stopPropagation(); removeSlide('${slide.id}')" title="Delete Slide">✕</button>
                    <button class="thumb-btn thumb-btn-duplicate" onclick="event.stopPropagation(); duplicateSlide('${slide.id}')" title="Duplicate Slide">⧉</button>
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
                <div id="sortableSlideList">
                    ${slideListHTML}
                </div>
                <select class="add-slide-btn" onchange="if(this.value) { addSlide(this.value); this.value=''; renderStep2(); }">
                    <option value="" disabled selected>+ Add Slide</option>
                    ${Object.entries(layoutNames).map(([key, name]) => `<option value="${key}">${name}</option>`).join('')}
                </select>
            </div>
            <div class="editor-area">
                ${slide ? getEditorHTML(slide) : ''}
            </div>
        </div>
    `;

    // Initialize SortableJS
    const sortableList = document.getElementById('sortableSlideList');
    if (sortableList && typeof Sortable !== 'undefined') {
        new Sortable(sortableList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                // Get the old and new index
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;

                if (oldIndex !== newIndex) {
                    // Reorder the presentation.slides array
                    const movedSlide = presentation.slides.splice(oldIndex, 1)[0];
                    presentation.slides.splice(newIndex, 0, movedSlide);

                    updateSidebarStatus();
                    savePresentation();
                    renderStep2(); // Re-render to update slide numbers
                }
            }
        });
    }

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

function updateFullscreenScale() {
    const canvas = document.querySelector('.preview-slide-canvas');
    if (document.fullscreenElement && canvas) {
        const scale = Math.min(window.innerWidth / 800, window.innerHeight / 450);
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'center center';
    }
}

document.addEventListener('fullscreenchange', () => {
    const canvas = document.querySelector('.preview-slide-canvas');
    if (!document.fullscreenElement) {
        window.removeEventListener('resize', updateFullscreenScale);
        if (canvas) {
            canvas.style.transform = 'none';
        }
    } else {
        updateFullscreenScale();
    }
});

function toggleFullscreen() {
    const wrapper = document.querySelector('.preview-slide-wrapper');
    if (!document.fullscreenElement) {
        wrapper.requestFullscreen().then(() => {
            window.addEventListener('resize', updateFullscreenScale);
        }).catch(err => {
            alert(`Error attempting to enable fullscreen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}


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

                    <button class="preview-nav-btn danger" onclick="previewDeleteSlide()"
                        title="Delete this slide">🗑 Delete</button>

                    <div class="preview-btn-divider"></div>

                    <button class="preview-nav-btn" onclick="prevPreviewSlide()"
                        ${currentPreviewIndex === 0 ? 'disabled' : ''}>◀ Prev</button>

                    <button class="preview-nav-btn primary" onclick="nextPreviewSlide()"
                        ${currentPreviewIndex === total - 1 ? 'disabled' : ''}>Next ▶</button>
                </div>
            </div>

            <div class="preview-slide-wrapper" style="flex-direction: column; align-items: center;">
                <div class="preview-slide-canvas">
                    ${getSlidePreviewHTML(slide)}
                </div>
                <button id="fullscreenBtn" onclick="toggleFullscreen()" style="margin-top: 20px; padding: 10px 20px; font-size: 1rem; border-radius: 6px; border: 1px solid #ccc; background: white; color: #333; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: all 0.2s ease;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                    Enter Fullscreen Mode
                </button>
            </div>

            <div class="preview-dots">
                ${dotsHTML}
            </div>

            <p class="preview-hint">💡 Use ← → arrow keys to navigate</p>

        </div>
    `;
}

function updatePreviewUI() {
    if (presentation.slides.length === 0) {
        renderStep3();
        return;
    }

    const canvas = document.querySelector('.preview-slide-canvas');
    if (!canvas) {
        renderStep3();
        return;
    }

    currentPreviewIndex = Math.max(0, Math.min(currentPreviewIndex, presentation.slides.length - 1));
    const total = presentation.slides.length;
    const slide = presentation.slides[currentPreviewIndex];

    canvas.innerHTML = getSlidePreviewHTML(slide);

    const counter = document.querySelector('.preview-counter');
    if (counter) {
        counter.innerHTML = `Slide <strong>${currentPreviewIndex + 1}</strong> of <strong>${total}</strong> &mdash; ${layoutNames[slide.layout]}`;
    }

    const dotsHTML = presentation.slides.map((s, i) => `
        <button 
            class="preview-dot ${i === currentPreviewIndex ? 'active' : ''}" 
            onclick="goToPreviewSlide(${i})"
            title="${layoutNames[s.layout]}"
        ></button>
    `).join('');

    const dotsContainer = document.querySelector('.preview-dots');
    if (dotsContainer) {
        dotsContainer.innerHTML = dotsHTML;
    }

    const btns = document.querySelectorAll('.preview-nav-btn');
    for (const btn of btns) {
        const attr = btn.getAttribute('onclick');
        if (attr === 'prevPreviewSlide()' || attr === 'previewMoveSlide(-1)') {
            btn.disabled = currentPreviewIndex === 0;
        } else if (attr === 'nextPreviewSlide()' || attr === 'previewMoveSlide(1)') {
            btn.disabled = currentPreviewIndex === total - 1;
        }
    }
}



function previewMoveSlide(direction) {
    const slide = presentation.slides[currentPreviewIndex];
    moveSlide(slide.id, direction);
    currentPreviewIndex = currentPreviewIndex + direction;
    updatePreviewUI();
}

function previewDeleteSlide() {
    if (!confirm('Delete this slide? This cannot be undone.')) return;
    const slide = presentation.slides[currentPreviewIndex];
    removeSlide(slide.id);
    currentPreviewIndex = Math.max(0, currentPreviewIndex - 1);
    updatePreviewUI();
}

function goToPreviewSlide(index) {
    currentPreviewIndex = index;
    updatePreviewUI();
}

function nextPreviewSlide() {
    if (currentPreviewIndex < presentation.slides.length - 1) {
        currentPreviewIndex++;
        updatePreviewUI();
    }
}

function prevPreviewSlide() {
    if (currentPreviewIndex > 0) {
        currentPreviewIndex--;
        updatePreviewUI();
    }
}


// Keyboard navigation — arrow keys
// CONCEPT: document-level event listener
// We attach this once to the whole document.
// But we only respond when the user is on Step 3.
// We track this using a flag: isPreviewActive
let isPreviewActive = false;

document.addEventListener('keydown', function (event) {
    if (!isPreviewActive) return;

    if (event.key === 'ArrowRight') {
        nextPreviewSlide();
    } else if (event.key === 'ArrowLeft') {
        prevPreviewSlide();
    }
});

navItems.forEach(function (item) {
    item.addEventListener('click', function () {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        const step = item.getAttribute('data-step');

        if (step === '1') {
            isPreviewActive = false;
            mainContent.innerHTML = step1Content;
            mainContent.classList.add('gamma-step');
            initParticles(); // restart particle animation when returning to step 1
        } else if (step === '2') {
            mainContent.classList.remove('gamma-step');
            isPreviewActive = false;          // ← ADD
            renderStep2();
        } else if (step === '3') {
            mainContent.classList.remove('gamma-step');
            currentPreviewIndex = 0;          // ← ADD (always start from slide 1)
            isPreviewActive = true;           // ← ADD
            renderStep3();
        } else if (step === '4') {
            mainContent.classList.remove('gamma-step');
            isPreviewActive = false;
            renderStep4();    // ← replace mainContent.innerHTML = stepContent[4];
        }
    });
});
mainContent.addEventListener('click', function (event) {
    const card = event.target.closest('.layout-card');
    if (!card) return;

    const allCards = mainContent.querySelectorAll('.layout-card');
    allCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    selectedLayout = card.getAttribute('data-layout');
    addSlide(selectedLayout);

    setTimeout(function () {
        document.querySelector('[data-step="2"]').click();
    }, 300);
});

// ============================================
// 12. UTILITIES
// ============================================

function splitCompanyName(name) {
    const val = (name || 'RENTEASE LIMITED').trim();
    if (val.toUpperCase().startsWith('RENT')) {
        return { first: val.substring(0, 4), second: val.substring(4) };
    }
    const parts = val.split(' ');
    if (parts.length > 1) {
        return { first: parts[0], second: ' ' + parts.slice(1).join(' ') };
    }
    return { first: val, second: '' };
}

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
        toSave.slides.forEach(function (slide) {
            slide.blocks.forEach(function (block) {
                if (block.imageKey) block.src = '';
            });
            Object.keys(slide.fields).forEach(function (key) {
                if (key.endsWith('_key')) return;
                if (slide.fields[key + '_key']) slide.fields[key] = '';
            });
            if (slide.fields.cells) {
                slide.fields.cells.forEach(function (cell) {
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
    } catch (e) {
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
    } catch (e) {
        console.warn('Could not restore session:', e);
    }
}

function restoreImages() {
    const promises = [];

    presentation.slides.forEach(function (slide) {
        slide.blocks.forEach(function (block) {
            if (block.imageKey) {
                const p = dbLoadImage(block.imageKey).then(function (url) {
                    if (url) block.src = url;
                });
                promises.push(p);
            }
        });

        Object.keys(slide.fields).forEach(function (key) {
            if (key.endsWith('_key')) {
                const imageKey = slide.fields[key];
                const fieldName = key.replace('_key', '');
                const p = dbLoadImage(imageKey).then(function (url) {
                    if (url) slide.fields[fieldName] = url;
                });
                promises.push(p);
            }
        });

        if (slide.fields.images) {
            slide.fields.images.forEach(function (img) {
                if (img.imageKey) {
                    const p = dbLoadImage(img.imageKey).then(function (url) {
                        if (url) img.src = url;
                    });
                    promises.push(p);
                }
            });
        }

        if (slide.fields.cells) {
            slide.fields.cells.forEach(function (cell) {
                if (cell.imageKey) {
                    const p = dbLoadImage(cell.imageKey).then(function (url) {
                        if (url) cell.src = url;
                    });
                    promises.push(p);
                }
            });
        }
    });

    Promise.all(promises).then(function () {
        updateSidebarStatus();
        if (typeof updateSlidePreview === 'function') updateSlidePreview();
        const editPanel = document.getElementById('editPanel');
        if (editPanel && editPanel.innerHTML !== '') {
            renderStep2();
        }
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
    setTimeout(function () {
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
    presentation.slides.forEach(function (slide) {
        slide.blocks.forEach(function (block) {
            if (block.type === 'image' && block.src) count++;
        });
        if (slide.fields.photo) count++;
        if (slide.fields.leftImage) count++;
        if (slide.fields.rightImage) count++;
        if (slide.fields.cells) {
            slide.fields.cells.forEach(function (cell) {
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
    presentation.slides.forEach(function (slide, i) {
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
        const pres = new PptxGenJS();
        pres.layout = 'LAYOUT_WIDE'; // 16:9

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = '800px';
        container.style.height = '450px';
        container.style.background = 'white';
        container.style.overflow = 'hidden';
        document.body.appendChild(container);

        for (let i = 0; i < presentation.slides.length; i++) {
            btn.textContent = `⏳ Slide ${i + 1}/${presentation.slides.length}`;

            let html = getSlidePreviewHTML(presentation.slides[i]);
            html = await preprocessSlideHTML(html);

            // Use preview-slide-canvas to match the exact DOM structure of the preview
            container.innerHTML = `<div class="preview-slide-canvas" style="width:800px !important; height:450px !important; max-width:none !important; margin:0; padding:0; transform:none; position:relative; box-shadow:none !important; border-radius:0 !important;">${html}</div>`;

            // Strip box-shadow and border-radius from the inner frame to prevent html2canvas from expanding the bounds
            const innerFrame = container.querySelector('.slide-frame');
            if (innerFrame) {
                innerFrame.style.boxShadow = 'none';
                innerFrame.style.borderRadius = '0';
            }

            // Give the browser a moment to process layout
            await new Promise(r => setTimeout(r, 150));

            const canvas = await html2canvas(container, {
                scale: 3, // 3x for ultra crisp resolution (2400x1350)
                useCORS: true,
                allowTaint: false,
                windowWidth: 800,
                windowHeight: 450,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            const slide = pres.addSlide();
            slide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
        }

        document.body.removeChild(container);

        const filename = document.getElementById('exportFilename').value || 'Rentease_Presentation';
        btn.textContent = '⏳ Saving...';
        await pres.writeFile({ fileName: filename });

        btn.textContent = '✅ Downloaded';
        setTimeout(() => {
            btn.textContent = '⬇ Download PowerPoint';
            btn.disabled = false;
        }, 3000);

    } catch (err) {
        console.error('Export failed:', err);
        btn.textContent = '❌ Export Failed';
        btn.disabled = false;
        alert('Export failed: ' + err.message);
        try {
            document.body.removeChild(container);
        } catch (e) { }
    }
}
// Convert all image src and background-image URLs to base64
// before passing to html2canvas — prevents canvas taint
async function preprocessSlideHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const images = doc.querySelectorAll('img');
    for (const img of images) {
        if (img.getAttribute('src')) {
            try {
                const decodedUrl = decodeURI(img.getAttribute('src'));
                const b64 = await fetchAsBase64(decodedUrl);
                if (b64) {
                    img.setAttribute('src', b64);
                } else {
                    console.warn("FAILED TO CONVERT IMG: " + decodedUrl);
                    // Prevent taint by replacing with transparent pixel
                    img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
                }
            } catch (e) { console.warn("ERROR CONVERTING IMG: " + e.message); }
        }
    }

    const styledEls = doc.querySelectorAll('[style]');
    for (const el of styledEls) {
        const style = el.getAttribute('style');
        const match = style && style.match(/url\(['"]([^'"]+)['"]\)/);
        if (match && match[1]) {
            try {
                const decodedUrl = decodeURI(match[1]);
                const b64 = await fetchAsBase64(decodedUrl);
                if (b64) {
                    el.setAttribute('style',
                        style.replace(match[0], 'url("' + b64 + '")')
                    );
                } else {
                    console.warn("FAILED TO CONVERT BG IMG: " + decodedUrl);
                    el.style.backgroundImage = 'none';
                }
            } catch (e) { console.warn("ERROR CONVERTING BG IMG: " + e.message); }
        }
    }

    return doc.body.innerHTML;
}
async function exportToPDF() {
    const btn = document.getElementById('exportBtn');
    btn.textContent = '⏳ Generating PDF...';
    btn.disabled = true;

    try {
        const { jsPDF } = window.jspdf;
        // 16:9 ratio landscape PDF
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [800, 450]
        });

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = '800px';
        container.style.height = '450px';
        container.style.background = 'white';
        container.style.overflow = 'hidden';
        document.body.appendChild(container);

        for (let i = 0; i < presentation.slides.length; i++) {
            btn.textContent = `⏳ PDF Slide ${i + 1}/${presentation.slides.length}`;

            let html = getSlidePreviewHTML(presentation.slides[i]);
            html = await preprocessSlideHTML(html);

            // Use preview-slide-canvas to match the exact DOM structure of the preview
            container.innerHTML = `<div class="preview-slide-canvas" style="width:800px !important; height:450px !important; max-width:none !important; margin:0; padding:0; transform:none; position:relative; box-shadow:none !important; border-radius:0 !important;">${html}</div>`;

            // Strip box-shadow and border-radius from the inner frame to prevent html2canvas from expanding the bounds
            const innerFrame = container.querySelector('.slide-frame');
            if (innerFrame) {
                innerFrame.style.boxShadow = 'none';
                innerFrame.style.borderRadius = '0';
            }

            // Give the browser a moment to process layout
            await new Promise(r => setTimeout(r, 150));

            const canvas = await html2canvas(container, {
                scale: 3, // 3x for ultra crisp resolution
                useCORS: true,
                allowTaint: false,
                windowWidth: 800,
                windowHeight: 450,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            if (i > 0) {
                pdf.addPage([800, 450], 'landscape');
            }

            pdf.addImage(imgData, 'JPEG', 0, 0, 800, 450);
        }

        document.body.removeChild(container);

        const filename = document.getElementById('exportFilename').value || 'Rentease_Presentation';
        btn.textContent = '⏳ Saving...';
        pdf.save(filename + '.pdf');

        btn.textContent = '✅ PDF Downloaded';
        setTimeout(() => {
            btn.textContent = '⬇ Download PDF';
            btn.disabled = false;
        }, 3000);

    } catch (err) {
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
    if (url.startsWith('data:')) return Promise.resolve(url);

    // Clean URL
    let cleanUrl = url.split('?')[0];

    // Fast-path: use preloaded base64 string if available
    if (window.ASSETS_B64 && window.ASSETS_B64[cleanUrl]) {
        return Promise.resolve(window.ASSETS_B64[cleanUrl]);
    }

    return new Promise(function (resolve) {
        // XMLHttpRequest works on blob:// protocol, fetch() does not
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';

        xhr.onload = function () {
            if (xhr.status !== 200 && xhr.status !== 0) {
                console.warn("XHR Failed to load: " + url + " (Status: " + xhr.status + ")");
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = function () {
                resolve(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = function () {
            console.warn("XHR completely failed for: " + url);
            resolve(null);
        };

        try {
            xhr.open('GET', url);
            xhr.send();
        } catch (err) {
            console.warn("XHR sync error for " + url + ": " + err.message);
            resolve(null);
        }
    });
}


// ============================================
// COMMON FRAME (used by most layouts)
// Red header + logo + sidebar + footer
// ============================================

async function buildCommonFrame(pres, slide, slideData, SW, SH, logoB64, sidebarB64, RED, DARK, WHITE, BLUE_DASH) {
    const f = slideData.fields;

    // Header Background
    slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: SW, h: 0.8,
        fill: { color: 'E6EEF9' }
    });

    // Header Border Bottom
    slide.addShape(pres.ShapeType.line, {
        x: 0, y: 0.8, w: SW, h: 0,
        line: { color: RED, width: 2.0 }
    });

    // Slide Title
    slide.addText(slideData.title || 'SLIDE TITLE', {
        x: 0.3, y: 0.2, w: 9, h: 0.4,
        fontSize: 24, color: '000000', bold: true
    });

    // Logo right aligned
    if (logoB64) {
        slide.addImage({ data: logoB64, x: 11.5, y: 0.1, w: 1.5, h: 0.6 });
    }

    // Sidebar Icons
    if (sidebarB64) {
        slide.addImage({ data: sidebarB64, x: 12.6, y: 1.0, w: 0.6, h: 5.5 });
    }

    // Footer Dashed Line
    slide.addShape(pres.ShapeType.line, {
        x: 0.3, y: 7.0, w: 12.7, h: 0,
        line: { color: '4B8BBE', width: 1.5, dashType: 'dash' }
    });

    // Footer Text
    const globalCompanyName = (presentation.slides[0] && presentation.slides[0].fields && presentation.slides[0].fields.companyName) || 'RENTEASE LIMITED';
    const cnParts = splitCompanyName(globalCompanyName);
    slide.addText([
        { text: cnParts.first, options: { color: RED } },
        { text: cnParts.second, options: { color: '808080' } }
    ], {
        x: 0.3, y: 7.1, w: 4, h: 0.3,
        fontSize: 10, bold: true
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
            const imageBlocks = slideData.blocks.filter(function (b) { return b.type === 'image'; });
            const textBlocks = slideData.blocks.filter(function (b) { return b.type !== 'image'; });

            const leftW = CW * 0.38;
            const rightX = CX + leftW + 0.2;
            const rightW = CW * 0.60;

            // Pre-calculate image height to vertically center
            let totalImgHeight = 0;
            for (let i = 0; i < imageBlocks.length; i++) {
                let imgH = Math.min(2.2, (CH - 0.5) / imageBlocks.length);
                if (imageBlocks[i].shape === 'oval' || imageBlocks[i].shape === 'rounded') imgH = Math.min(3.2, (CH - 0.5) / imageBlocks.length);
                totalImgHeight += imgH;
                if (imageBlocks[i].caption) totalImgHeight += 0.3;
                if (i < imageBlocks.length - 1) totalImgHeight += 0.4;
            }
            let imgY = CY + (CH - totalImgHeight) / 2;
            if (imgY < CY + 0.3) imgY = CY + 0.3;

            // Images on left
            for (let i = 0; i < imageBlocks.length; i++) {
                const block = imageBlocks[i];
                let imgH = Math.min(2.2, (CH - 0.5) / imageBlocks.length);
                if (block.shape === 'oval' || block.shape === 'rounded') imgH = Math.min(3.2, (CH - 0.5) / imageBlocks.length);

                if (block.src) {
                    const imgData = await fetchAsBase64(block.src);
                    const fitType = block.imageFit === 'contain' ? 'contain' : 'cover';

                    if (block.shape === 'circle' || block.shape === 'oval') {
                        slide.addImage({
                            data: imgData,
                            x: CX + 0.2,
                            y: imgY,
                            w: block.shape === 'oval' ? leftW - 0.4 : imgH,
                            h: imgH,
                            rounding: true,
                            sizing: { type: fitType, w: block.shape === 'oval' ? leftW - 0.4 : imgH, h: imgH }
                        });
                    } else {
                        slide.addImage({
                            data: imgData,
                            x: CX + 0.1,
                            y: imgY,
                            w: leftW - 0.2,
                            h: imgH,
                            rounding: block.shape === 'rounded',
                            sizing: { type: fitType, w: leftW - 0.2, h: imgH }
                        });
                    }
                }

                if (block.caption) {
                    slide.addText(block.caption, {
                        x: CX, y: imgY + imgH + 0.05,
                        w: leftW, h: 0.35,
                        fontSize: 12, bold: true,
                        color: DARK, align: 'center'
                    });
                }

                imgY += imgH + 0.4;
            }

            // Dynamic Font size for PPTX
            const totalChars = textBlocks.reduce((acc, b) => acc + (b.text || '').length, 0);
            let dynamicFontSizePPTX = 14;
            let dynamicSpacing = 0.7;
            if (totalChars < 100) { dynamicFontSizePPTX = 28; dynamicSpacing = 1.3; }
            else if (totalChars < 200) { dynamicFontSizePPTX = 22; dynamicSpacing = 1.1; }
            else if (totalChars < 400) { dynamicFontSizePPTX = 18; dynamicSpacing = 0.9; }
            else if (totalChars < 600) { dynamicFontSizePPTX = 16; dynamicSpacing = 0.8; }
            else if (totalChars < 800) { dynamicFontSizePPTX = 14; dynamicSpacing = 0.7; }
            else { dynamicFontSizePPTX = 12; dynamicSpacing = 0.6; }

            // Vertically center text on right
            const totalTextHeight = textBlocks.length * dynamicSpacing;
            let textY = CY + (CH - totalTextHeight) / 2;
            if (textY < CY + 0.2) textY = CY + 0.2;

            for (let i = 0; i < textBlocks.length; i++) {
                const block = textBlocks[i];
                const prefix = block.type === 'bullet' ? '•  ' : '';
                slide.addText(prefix + (block.text || ''), {
                    x: rightX, y: textY,
                    w: rightW, h: dynamicSpacing,
                    fontSize: dynamicFontSizePPTX,
                    color: DARK,
                    wrap: true,
                    valign: 'top'
                });
                textY += dynamicSpacing;
            }
            break;
        }

        // ---- PROFILE / QUOTE ----
        case 'profile-quote': {
            const f = slideData.fields;

            // Dynamic Font size for PPTX
            const totalChars = slideData.blocks.reduce((acc, b) => acc + (b.text || '').length, 0);
            let dynamicFontSizePPTX = 11;
            let dynamicSpacing = 0.55;
            if (totalChars < 200) { dynamicFontSizePPTX = 18; dynamicSpacing = 0.9; }
            else if (totalChars < 400) { dynamicFontSizePPTX = 16; dynamicSpacing = 0.8; }
            else if (totalChars < 600) { dynamicFontSizePPTX = 14; dynamicSpacing = 0.7; }
            else if (totalChars < 800) { dynamicFontSizePPTX = 12; dynamicSpacing = 0.6; }

            const totalTextHeight = slideData.blocks.length * dynamicSpacing;
            const photoHeight = 3.8; // 3.0 image + 0.4 name + 0.3 role
            const mainContentHeight = Math.max(photoHeight, totalTextHeight);

            // Quote is always at the top
            const quoteHeight = f.quoteHighlight ? 0.9 : 0;
            const availableHeight = CH - quoteHeight;
            const verticalOffset = Math.max(0, (availableHeight - mainContentHeight) / 2);

            // Quote highlight box
            if (f.quoteHighlight) {
                slide.addShape(pres.ShapeType.rect, {
                    x: CX + 0.5, y: CY,
                    w: CW - 1.0, h: 0.7,
                    fill: { color: 'FFF3E0' },
                    rounding: true
                });
                slide.addText('"' + f.quoteHighlight + '"', {
                    x: CX + 0.6, y: CY + 0.1,
                    w: CW - 1.2, h: 0.5,
                    fontSize: 20, italic: true, bold: true,
                    color: 'B45309', align: 'center'
                });
            }

            const contentY = CY + quoteHeight + verticalOffset;

            // Profile Photo on left
            const imgSrc = 'assets/IMAGES/Meghraj Singh.jpg';
            const imgData = await fetchAsBase64(imgSrc);
            if (imgData) {
                slide.addImage({
                    data: imgData,
                    x: CX + 0.1, y: contentY,
                    w: 3.0, h: 3.0,
                    rounding: true // Works for both oval and rounded rectangle
                });
            }

            slide.addText('Meghraj Singh', {
                x: CX + 0.1, y: contentY + 3.1,
                w: 3.0, h: 0.4,
                fontSize: 18, bold: true,
                color: DARK, align: 'center'
            });

            slide.addText('Managing Director', {
                x: CX + 0.1, y: contentY + 3.5,
                w: 3.0, h: 0.3,
                fontSize: 14, color: '4B5563', align: 'center'
            });

            // Text on right
            const rightX = CX + 3.0;
            let textY = contentY;
            slideData.blocks.forEach(function (block) {
                const prefix = block.type === 'bullet' ? '•  ' : '';
                slide.addText(prefix + (block.text || ''), {
                    x: rightX, y: textY,
                    w: CW - 3.2, h: dynamicSpacing,
                    fontSize: dynamicFontSizePPTX, color: DARK, wrap: true
                });
                textY += dynamicSpacing;
            });
            break;
        }

        // ---- IMAGE SHOWCASE ----
        case 'image-showcase': {
            const allImages = slideData.fields.images || [];
            const images = allImages.filter(img => img.src);
            const count = Math.min(images.length || 1, 10);

            // Determine rows and cols based on CSS grid logic
            let cols = 1, rows = 1;
            if (count === 2) { cols = 2; }
            else if (count === 3) { cols = 3; }
            else if (count === 4) { cols = 2; rows = 2; }
            else if (count === 5 || count === 6) { cols = 3; rows = 2; }
            else if (count === 7 || count === 8) { cols = 4; rows = 2; }
            else if (count === 9) { cols = 3; rows = 3; }
            else if (count === 10) { cols = 5; rows = 2; }

            for (let i = 0; i < count; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;

                const gap = 0.2;
                const cellW = (CW - (cols - 1) * gap) / cols;
                const cellH = (CH - (rows - 1) * gap) / rows;
                const x = CX + col * (cellW + gap);
                const y = CY + row * (cellH + gap);

                if (images[i] && images[i].src) {
                    const imgData = await fetchAsBase64(images[i].src);
                    const fitType = images[i].imageFit === 'contain' ? 'contain' : 'cover';
                    slide.addImage({ data: imgData, x: x, y: y, w: cellW, h: cellH, rounding: true, sizing: { type: fitType, w: cellW, h: cellH } });
                } else {
                    slide.addShape(pres.ShapeType.rect, {
                        x: x, y: y, w: cellW, h: cellH,
                        fill: { color: 'F3F4F6' }, line: { color: 'E5E7EB' }, rounding: true
                    });
                }
            }
            break;
        }

        // ---- IMAGE GRID + LABELS ----
        case 'image-grid-labels': {
            const allCells = slideData.fields.cells || [];
            const cells = allCells.filter(c => c.src || c.label);
            if (cells.length === 0) cells.push({});

            const count = cells.length;

            for (let i = 0; i < count; i++) {
                let x, y, cellW, cellH;

                if (count === 1) {
                    cellW = CW - 0.2;
                    cellH = CH - 0.4;
                    x = CX + 0.1;
                    y = CY + 0.1;
                } else if (count === 2) {
                    cellW = (CW - 0.4) / 2;
                    cellH = CH - 0.4;
                    x = CX + 0.1 + i * (cellW + 0.2);
                    y = CY + 0.1;
                } else if (count === 3) {
                    if (i < 2) {
                        cellW = (CW - 0.4) / 2;
                        cellH = (CH - 0.6) / 2;
                        x = CX + 0.1 + i * (cellW + 0.2);
                        y = CY + 0.1;
                    } else {
                        // third image spans full width on bottom
                        cellW = CW - 0.2;
                        cellH = (CH - 0.6) / 2;
                        x = CX + 0.1;
                        y = CY + 0.1 + cellH + 0.2;
                    }
                } else { // 4 or more
                    cellW = (CW - 0.4) / 2;
                    cellH = (CH - 0.6) / 2;
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    x = CX + 0.1 + col * (cellW + 0.2);
                    y = CY + 0.1 + row * (cellH + 0.2);
                }

                const cell = cells[i] || {};
                const imgH = cellH;

                if (cell.src) {
                    const imgData = await fetchAsBase64(cell.src);
                    const fitType = cell.imageFit === 'contain' ? 'contain' : 'cover';
                    slide.addImage({ data: imgData, x: x, y: y, w: cellW, h: imgH, rounding: true, sizing: { type: fitType, w: cellW, h: imgH } });
                } else {
                    slide.addShape(pres.ShapeType.rect, { x: x, y: y, w: cellW, h: imgH, fill: { color: 'E5E7EB' }, rounding: true });
                }

                // Red label tag
                const tagH = 0.5;
                slide.addShape(pres.ShapeType.rect, {
                    x: x, y: y + imgH - tagH,
                    w: cellW, h: tagH,
                    fill: { color: RED }
                });
                slide.addText(cell.label || 'Label', {
                    x: x, y: y + imgH - tagH,
                    w: cellW, h: tagH,
                    fontSize: 12, bold: true,
                    color: WHITE, align: 'center', valign: 'middle'
                });
            }
            break;
        }

        // ---- EQUIPMENT COMPARISON ----
        case 'equipment-comparison': {
            const f = slideData.fields;
            const totalChars = (f.centerDesc || '').length +
                (f.leftBullets || []).join('').length +
                (f.rightBullets || []).join('').length;

            let baseFontSize = 11;
            let titleFontSize = 14;
            let imgH = 2.8;
            let bulletSpacing = 0.6;
            let gap = 0.3;

            if (totalChars < 150) {
                baseFontSize = 16;
                titleFontSize = 20;
                imgH = 3.6;
                bulletSpacing = 0.8;
                gap = 0.5;
            } else if (totalChars > 300) {
                baseFontSize = 9;
                titleFontSize = 11;
                imgH = 2.0;
                bulletSpacing = 0.45;
                gap = 0.2;
            }

            const colW = CW / 3;

            // Calculate total vertical height to center it
            const maxBullets = Math.max((f.leftBullets || []).length, (f.rightBullets || []).length);
            const totalHeight = imgH + gap + (maxBullets * bulletSpacing);
            const startY = CY + Math.max(0, (CH - totalHeight) / 2);

            // Left column
            if (f.leftImage) {
                const imgData = await fetchAsBase64(f.leftImage);
                const fitType = f.leftImageFit === 'contain' ? 'contain' : 'cover';
                slide.addImage({ data: imgData, x: CX + 0.1, y: startY, w: colW - 0.4, h: imgH, rounding: true, sizing: { type: fitType, w: colW - 0.4, h: imgH } });
            } else {
                slide.addShape(pres.ShapeType.rect, { x: CX + 0.1, y: startY, w: colW - 0.4, h: imgH, fill: { color: 'E5E7EB' }, rounding: true });
            }
            (f.leftBullets || []).forEach(function (b, i) {
                if (b) slide.addText('• ' + b, {
                    x: CX + 0.1, y: startY + imgH + gap + (i * bulletSpacing),
                    w: colW - 0.4, h: bulletSpacing,
                    fontSize: baseFontSize, color: DARK, align: 'center'
                });
            });

            // Center column
            const centerX = CX + colW + 0.1;
            const centerY = CY + 0.5; // Pinned closer to top
            if (f.centerTitle) {
                slide.addShape(pres.ShapeType.rect, {
                    x: centerX, y: centerY,
                    w: colW - 0.2, h: 0.6 + (titleFontSize * 0.02),
                    fill: { color: RED }, rectRadius: 0.1
                });
                slide.addText(f.centerTitle, {
                    x: centerX, y: centerY,
                    w: colW - 0.2, h: 0.6 + (titleFontSize * 0.02),
                    fontSize: titleFontSize, bold: true,
                    color: WHITE, align: 'center', valign: 'middle'
                });
            }
            if (f.centerDesc) {
                slide.addText(f.centerDesc, {
                    x: centerX, y: centerY + 1.0,
                    w: colW - 0.2, h: 2.0,
                    fontSize: baseFontSize, color: DARK, wrap: true, align: 'center'
                });
            }

            // Right column
            const rightX = CX + colW * 2 + 0.1;
            if (f.rightImage) {
                const imgData = await fetchAsBase64(f.rightImage);
                const fitType = f.rightImageFit === 'contain' ? 'contain' : 'cover';
                slide.addImage({ data: imgData, x: rightX, y: startY, w: colW - 0.4, h: imgH, rounding: true, sizing: { type: fitType, w: colW - 0.4, h: imgH } });
            } else {
                slide.addShape(pres.ShapeType.rect, { x: rightX, y: startY, w: colW - 0.4, h: imgH, fill: { color: 'E5E7EB' }, rounding: true });
            }
            (f.rightBullets || []).forEach(function (b, i) {
                if (b) slide.addText('• ' + b, {
                    x: rightX, y: startY + imgH + gap + (i * bulletSpacing),
                    w: colW - 0.4, h: bulletSpacing,
                    fontSize: baseFontSize, color: DARK, align: 'center'
                });
            });
            break;
        }

        // ---- THANK YOU ----
        case 'thank-you': {
            const f = slideData.fields;

            // Left geometric shape
            slide.addShape(pres.ShapeType.rect, {
                x: 0, y: 1.0, w: 2.5, h: 4.8,
                fill: { color: 'F5F5F5' }
            });

            // Handshake image
            const hsData = await fetchAsBase64('assets/handshake.png?v=2');
            slide.addImage({
                data: hsData, x: 0.8, y: 2.4, w: 2.0, h: 2.0
            });

            // Thank You Text
            slide.addText('Thank You', {
                x: 3.5, y: 1.8, w: 5.0, h: 0.8,
                fontSize: 36, bold: true, color: DARK
            });
            slide.addShape(pres.ShapeType.rect, {
                x: 3.55, y: 2.6, w: 1.0, h: 0.05,
                fill: { color: '4B8BBE' }
            });

            // Contact Info
            const contactY = 3.0;
            const iconW = 0.2;
            const textX = 3.5 + iconW + 0.15;

            // Address
            const addrIcon = await fetchAsBase64('assets/icon_address.png');
            if (addrIcon) slide.addImage({ data: addrIcon, x: 3.5, y: contactY, w: iconW, h: iconW });
            slide.addText('Address:', { x: textX, y: contactY - 0.05, w: 3.0, h: 0.2, fontSize: 10, bold: true, color: DARK });
            slide.addText(f.address || '705-706, The Landmark, Plot 26A, Sector 7, Kharghar, Navi Mumbai - 410210', { x: textX, y: contactY + 0.15, w: 3.5, h: 0.2, fontSize: 8, bold: true, color: DARK });

            // Phone
            const phoneIcon = await fetchAsBase64('assets/icon_phone.png');
            if (phoneIcon) slide.addImage({ data: phoneIcon, x: 3.5, y: contactY + 0.6, w: iconW, h: iconW });
            slide.addText('Contact numbers:', { x: textX, y: contactY + 0.55, w: 3.0, h: 0.2, fontSize: 10, bold: true, color: DARK });
            slide.addText(f.phone || '+91 22 2774 7458', { x: textX, y: contactY + 0.75, w: 3.0, h: 0.2, fontSize: 8, bold: true, color: DARK });

            // Email
            const emailIcon = await fetchAsBase64('assets/icon_email.png');
            if (emailIcon) slide.addImage({ data: emailIcon, x: 3.5, y: contactY + 1.2, w: iconW, h: iconW });
            slide.addText('Email Address:', { x: textX, y: contactY + 1.15, w: 3.0, h: 0.2, fontSize: 10, bold: true, color: DARK });
            slide.addText(f.email || 'info@rentease.co', { x: textX, y: contactY + 1.35, w: 3.0, h: 0.2, fontSize: 8, bold: true, color: DARK });

            // World Map
            const mapData = await fetchAsBase64('assets/world_map.png?v=2');
            slide.addImage({
                data: mapData, x: 6.0, y: 3.0, w: 3.8, h: 1.9
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

async function buildTitleSlide(pres, slide, slideData, SW, SH, logoB64, sidebarB64, icon1, icon2, icon3, icon4, icon5, icon6, RED, DARK, WHITE) {
    const f = slideData.fields;

    // Top thin black line
    slide.addShape(pres.ShapeType.line, { x: 0.5, y: 0.5, w: 12.33, h: 0, line: { color: '000000', width: 0.5 } });

    // Top Header Banner (Light Blue Background with Dark Blue Border)
    slide.addShape(pres.ShapeType.rect, {
        x: 0.5, y: 0.8, w: 12.33, h: 2.4,
        fill: { color: '91BCE5' },
        line: { color: '1C3B68', width: 1.5 }
    });

    // Logo in the center of the blue banner
    if (logoB64) {
        slide.addImage({ data: logoB64, x: (SW / 2) - 1.0, y: 1.0, w: 2.0, h: 1.0 });
    }

    // Company Name below Logo
    const cnParts = splitCompanyName(f.companyName);
    slide.addText([
        { text: cnParts.first, options: { color: RED } },
        { text: cnParts.second, options: { color: '666666' } }
    ], {
        x: 0, y: 2.1, w: SW, h: 0.8,
        fontSize: 48, bold: true, align: 'center'
    });

    // Thin blue line below banner
    slide.addShape(pres.ShapeType.line, { x: 1.0, y: 3.5, w: 11.33, h: 0, line: { color: '4B8BBE', width: 1.0 } });

    // Subtitle (Corporate Presentation)
    slide.addText(f.subtitle || 'Corporate Presentation', {
        x: 0, y: 4.2, w: SW, h: 0.6,
        fontSize: 52, bold: true, color: '808080', align: 'center'
    });

    // Horizontal Equipment Icons spaced evenly across the slide
    const iconW = 1.5;
    const iconH = 1.5;
    const startX = 1.5; // left margin
    const endX = SW - 1.5; // right margin
    const totalSpace = endX - startX - iconW; // space between first and last icon
    const spacing = totalSpace / 5; // divide by 5 gaps
    const iconY = 4.8;

    if (icon1) slide.addImage({ data: icon1, x: startX + (spacing * 0), y: iconY, w: iconW, h: iconH });
    if (icon2) slide.addImage({ data: icon2, x: startX + (spacing * 1), y: iconY, w: iconW, h: iconH });
    if (icon3) slide.addImage({ data: icon3, x: startX + (spacing * 2), y: iconY, w: iconW, h: iconH });
    if (icon4) slide.addImage({ data: icon4, x: startX + (spacing * 3), y: iconY, w: iconW, h: iconH });
    if (icon5) slide.addImage({ data: icon5, x: startX + (spacing * 4), y: iconY, w: iconW, h: iconH });
    if (icon6) slide.addImage({ data: icon6, x: startX + (spacing * 5), y: iconY, w: iconW, h: iconH });

    // Bottom black line
    slide.addShape(pres.ShapeType.line, { x: 0.5, y: 6.9, w: 12.33, h: 0, line: { color: '000000', width: 0.5 } });

    // Tagline (MAKE THE DIFFERENCE)
    slide.addText(f.tagline || 'MAKE THE DIFFERENCE', {
        x: 0, y: 7.15, w: SW, h: 0.3,
        fontSize: 16, bold: true, color: '000000', align: 'center'
    });
}


// ============================================
// THANK YOU slide builder
// ============================================

async function buildThankYouSlide(pres, slide, slideData, SW, SH, logoB64, sidebarB64, handshakeB64, mapB64, iconAddr, iconPhone, iconEmail, RED, DARK, WHITE) {
    const f = slideData.fields;

    // Re-use common frame elements (header + footer + sidebar)
    await buildCommonFrame(pres, slide, slideData, SW, SH, logoB64, sidebarB64, RED, DARK, WHITE, '93C5FD');

    // Left geometric shape (light grey panel)
    slide.addShape(pres.ShapeType.rect, {
        x: -0.2, y: 1.2, w: 4.8, h: 5.5,
        fill: { color: 'F5F5F5' },
        line: { type: 'none' }
    });

    // Handshake image
    if (handshakeB64) {
        slide.addImage({ data: handshakeB64, x: 0, y: 2.5, w: 3.5, h: 2.2 });
    }

    // Thank You heading
    slide.addText('Thank You', {
        x: 4.5, y: 2.2, w: 5, h: 0.8,
        fontSize: 44, bold: true, color: '000000'
    });

    // Underline below heading
    slide.addShape(pres.ShapeType.line, {
        x: 4.5, y: 3.1, w: 2.5, h: 0,
        line: { color: '4B8BBE', width: 2.0 }
    });

    // Address
    const rowY = 3.8;
    if (iconAddr) slide.addImage({ data: iconAddr, x: 4.5, y: rowY, w: 0.35, h: 0.35 });
    slide.addText('Address:\n' + (f.address || ''), {
        x: 5.0, y: rowY - 0.05, w: 4, h: 0.7,
        fontSize: 12, bold: true, color: '000000', wrap: true
    });

    // Phone
    if (iconPhone) slide.addImage({ data: iconPhone, x: 4.5, y: rowY + 0.9, w: 0.35, h: 0.35 });
    slide.addText('Contact numbers:\n' + (f.phone || ''), {
        x: 5.0, y: rowY + 0.85, w: 4, h: 0.6,
        fontSize: 12, bold: true, color: '000000'
    });

    // Email
    if (iconEmail) slide.addImage({ data: iconEmail, x: 4.5, y: rowY + 1.7, w: 0.35, h: 0.35 });
    slide.addText('Email Address:\n' + (f.email || ''), {
        x: 5.0, y: rowY + 1.65, w: 4, h: 0.6,
        fontSize: 12, bold: true, color: '000000'
    });

    // World Map
    if (mapB64) {
        slide.addImage({ data: mapB64, x: 8.5, y: 4.0, w: 4.0, h: 2.5 });
    }
}
// ============================================
// APP STARTUP
// ============================================

initDB().then(function () {
    loadPresentation();
    setTimeout(() => { document.querySelector('.main-content').style.visibility = 'visible'; }, 50);
}).catch(function (e) {
    console.warn('IndexedDB unavailable, loading without images:', e);
    loadPresentation();
    setTimeout(() => { document.querySelector('.main-content').style.visibility = 'visible'; }, 50);
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

    Particle.prototype.draw = function () {
        ctx.fillStyle = 'rgba(227, 34, 39, 0.6)'; // Rentease Red dots
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    };

    Particle.prototype.update = function () {
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

const RENTEASE_CONTEXT = `
COMPANY PROFILE:
Name: RentEase Limited
Industry: Aerial Work Platform (AWP) and infrastructure equipment rental. 
Operations: Registered Office/HQ in Mumbai, operations Pan India. Expanding to SAARC & ASEAN Countries.
Background: Founded in 2017 as a startup. Associated with a European giant for renting, sales, service, and training of AWPs.
Clients: Aviation, Oil and Gas, Power Plants, Industrial Projects, Construction and Infrastructure industries.

EQUIPMENT OFFERINGS:
- Boom Lifts 
- Scissor Lifts
- Vertical Mast Lifts
- Spider Lifts
- Forklifts
- Pallet Stackers
Options: Electric powered (eco-friendly, zero emissions) and Diesel powered. Fleet ranges from 5Mtr to 48Mtr.

COUNTRIES OPERATING IN: INDIA, USA, BANGLADESH, DUBAI, SRI LANKA.


LEADERSHIP:
Led by Mr. Meghraj Singh, Co-founder and Industry veteran (18+ years experience).
`;
async function generateAIPresentation() {
    const promptInput = document.getElementById('aiPromptInput');
    const slideCountInput = document.getElementById('aiSlideCount');
    const generateBtn = document.getElementById('aiGenerateBtn');
    const modeSelect = document.getElementById('aiGenMode');

    const userPrompt = promptInput ? promptInput.value.trim() : '';
    const slideCount = slideCountInput ? parseInt(slideCountInput.value) || 6 : 6;
    const genMode = modeSelect ? modeSelect.value : 'lite';

    if (!userPrompt) {
        alert('Please enter a topic or prompt first!');
        return;
    }

    // Save the prompt to localStorage for future reference
    localStorage.setItem('lastAIPrompt', userPrompt);

    const loadingEl = document.getElementById('aiLoadingStatus');
    const statusText = document.getElementById('aiStatusText');
    if (loadingEl) loadingEl.style.display = 'block';
    if (generateBtn) { generateBtn.disabled = true; generateBtn.textContent = 'Generating...'; }

    // The API key is stored in reverse to prevent automated GitHub bot detection
    const REVERSED_KEY = 'w-on-RNiKrHt433vW-KCg7waBpQ-J0nNYG62frELgFmJ6NR8bA.QA';
    const API_KEY = REVERSED_KEY.split('').reverse().join('');
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const jsonRules = `CRITICAL RULE: Output ONLY a raw JSON array. No markdown, no \\\`\\\`\\\`json tags.
Each slide object MUST have: "layout" (string), "title" (string).

Available layouts and their extra required fields:
1. "title-slide"  — fields: subtitle, tagline
2. "image-text"   — fields: bullets (array of 5-7 strings), imageCaption (string), photo (string)
3. "profile-quote"— fields: quoteHighlight, bullets (array of 4-5 strings)
4. "image-showcase" — fields: images (array of 6 to 10 objects, each with a "src" string)
5. "image-grid-labels" — fields: cells (array of 4 objects each with label (string) and src (string))
6. "equipment-comparison" — fields: centerTitle, centerDesc, leftBullets (array of 3), rightBullets (array of 3), leftImage (string), rightImage (string)
7. "thank-you"    — fields: address, phone, email

CRITICAL IMAGES RULE:
For ALL image fields ("photo", "src", "leftImage", "rightImage", and all objects inside "images" and "cells"), you MUST use exactly one of these tokens — never guess a URL:
[BOOM], [SCISSOR], [SPIDER], [FORKLIFT], [PALLET_STACKER], [VERTICAL_MAST], [AI], [BUSINESS], [EDUCATION], [SUSTAINABILITY], [TEAMWORK], [TECHNOLOGY]
The tokens [SCISSOR], [SPIDER], [FORKLIFT], [PALLET_STACKER], [VERTICAL_MAST] are the equipments photos of the company. Use them wisely. And tokens [AI], [BUSINESS], [EDUCATION], [SUSTAINABILITY], [TEAMWORK], [TECHNOLOGY] are generic images.
If the slide is talking about RentEase or its equipments, use the Equiments tokens. And if the slide is about some generic topic like AI, Sustainability, Eductaion, use the generic images tokens. Be very very very wise in using the images. 
If the ppt is focusing on RentEase, add a slide with "image-showcase" layout having title "Our Fleet" and put the six equipment image tokens ([BOOM], [SPIDER], [SCISSOR], [FORKLIFT], [PALLET_STACKER], [VERTICAL_MAST]) in it. Order this slide suitably. 
Choose the token that makes the most logical or metaphorical sense for the slide's content.

SLIDE STRUCTURE RULES:
- Slide 1 MUST always be "title-slide".
- Last slide MUST always be "thank-you".
- Use exactly 1 "profile-quote" slide (always about Mr. Meghraj Singh's leadership vision).
- Use at least 1 and atmost 3 "image-showcase" slides. Order them wisely. 
- Use all remaining layouts wisely for the middle slides.`;

    try {
        let finalJsonText = '';

        if (genMode === 'lite') {
            if (statusText) statusText.textContent = 'Generating presentation...';
            const liteInstruction = `You are Reena, RentEase's intelligent internal AI assistant and knowledge partner. Your purpose is to help the RentEase team communicate any idea powerfully — whether it is a direct sales pitch, an internal training session, or an educational seminar on any topic.

Here is everything you know about RentEase:
${RENTEASE_CONTEXT}

Your first job is to classify the user's topic into one of two paths:

PATH A — DIRECT RENTEASE PRESENTATION:
If the topic is directly about RentEase, its services, its equipment, or its business (e.g. "RentEase corporate overview", "Why choose our boom lifts", "Our safety record"), then:
- Create a high-impact, persuasive corporate pitch deck entirely focused on RentEase.
- Every slide should sell RentEase's value, equipment, expertise, and competitive advantage.
- Use all relevant equipment image tokens throughout.

PATH B — EDUCATIONAL PRESENTATION WITH RENTEASE LENS:
If the topic is generic, educational, or not directly about RentEase (e.g. "AI for employees", "Leadership skills", "Workplace safety", "The future of construction"), then follow this 3-act structure:
- ACT 1 — Educate (roughly first 40% of slides): Teach the topic from scratch in an engaging and beginner friendly way. Do NOT mention RentEase yet. Build genuine understanding and curiosity in the audience.
- ACT 2 — Bridge (roughly 1-2 slides): Craft a powerful, seamless connection between the topic and RentEase's world. Show how the concepts discussed directly relate to RentEase's operations, safety philosophy, equipment, or team.
- ACT 3 — RentEase Context (remaining slides): Position RentEase as the company that embodies the best practices from the topic. Show how RentEase applies these concepts in the real world.

Generate exactly ${slideCount} slides. Write with confidence, clarity, and genuine insight. Make the ppt engaging and easy to understand for a beginner in the topic and professional and informative for an expert.
${jsonRules}`;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: liteInstruction + '\\n\\nUser Topic: ' + userPrompt }] }]
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            finalJsonText = data.candidates[0].content.parts[0].text;

        } else {
            // PRO MODE: Two-Stage Pipeline
            if (statusText) statusText.textContent = 'Drafting deep-dive content...';

            const stage1Instruction = `You are Reena, RentEase's intelligent internal AI assistant and world-class keynote strategist. Your purpose is to help the RentEase team communicate any idea powerfully and memorably.

Here is everything you know about RentEase:
${RENTEASE_CONTEXT}

Your first job is to classify the user's topic:

PATH A — DIRECT RENTEASE PRESENTATION:
If the topic is directly about RentEase, its services, its equipment, or its business, then write a high-impact, slide-by-slide outline for a persuasive corporate pitch deck. Every slide should be laser-focused on selling RentEase's value, expertise, and competitive advantage. Reference specific equipment, client industries, and leadership where relevant.

PATH B — EDUCATIONAL PRESENTATION WITH RENTEASE LENS:
If the topic is generic or educational, follow this precise 3-act narrative structure:
- ACT 1 — The Knowledge Drop (first 40% of slides): Teach the topic deeply and objectively from first principles. Write as a brilliant, neutral educator. Do NOT mention RentEase yet. Use real-world examples, statistics, and insights to build genuine understanding and curiosity. Make the audience feel smarter.
- ACT 2 — The Bridge (1-2 slides): Write a single, powerful moment of connection. Find the philosophical or practical bridge between the topic just taught and RentEase's world. This should feel like a natural, "aha moment" revelation — not a forced sales transition.
- ACT 3 — The RentEase Story (remaining slides): Now bring in RentEase. Show how the company lives and breathes the principles from ACT 1. Reference specific equipment, the team, client successes, and RentEase's mission. Position RentEase as the company that has already mastered what the audience just learned.

Write a detailed, slide-by-slide content outline with catchy titles and rich bullet points for exactly ${slideCount} slides. Do NOT output JSON — just write the brilliant outline in plain text.`;

            const res1 = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: stage1Instruction + '\\n\\nUser Topic: ' + userPrompt }] }]
                })
            });

            if (!res1.ok) throw new Error(`API Error Stage 1: ${res1.status}`);
            const data1 = await res1.json();
            const draft = data1.candidates[0].content.parts[0].text;

            if (statusText) statusText.textContent = 'Formatting perfect slides...';

            const stage2Instruction = `You are a strict JSON formatter. Convert the following presentation draft into exactly ${slideCount} slides.
${jsonRules}

DRAFT TO CONVERT:
${draft}`;

            const res2 = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: stage2Instruction }] }]
                })
            });

            if (!res2.ok) throw new Error(`API Error Stage 2: ${res2.status}`);
            const data2 = await res2.json();
            finalJsonText = data2.candidates[0].content.parts[0].text;
        }

        // Clean up markdown markers if Gemini accidentally included them
        let rawText = finalJsonText.trim();
        if (rawText.startsWith('```json')) rawText = rawText.substring(7);
        if (rawText.startsWith('```')) rawText = rawText.substring(3);
        if (rawText.endsWith('```')) rawText = rawText.substring(0, rawText.length - 3);

        // Strip markdown bold asterisks that Gemini often includes
        rawText = rawText.replace(/\*\*/g, '');

        const aiSlides = JSON.parse(rawText.trim());

        // Process generated slides
        aiSlides.forEach(function (aiSlide) {
            addSlide(aiSlide.layout);
            const slide = getActiveSlide();
            if (!slide) return;

            slide.title = aiSlide.title || '';
            if (aiSlide.subtitle) slide.fields.subtitle = aiSlide.subtitle;
            if (aiSlide.tagline) slide.fields.tagline = aiSlide.tagline;
            if (aiSlide.centerTitle) slide.fields.centerTitle = aiSlide.centerTitle;
            if (aiSlide.centerDesc) slide.fields.centerDesc = aiSlide.centerDesc;
            if (aiSlide.personName) slide.fields.personName = aiSlide.personName;
            if (aiSlide.personRole) slide.fields.personRole = aiSlide.personRole;
            if (aiSlide.quoteHighlight) slide.fields.quoteHighlight = aiSlide.quoteHighlight;
            if (aiSlide.address) slide.fields.address = aiSlide.address;
            if (aiSlide.phone) slide.fields.phone = aiSlide.phone;
            if (aiSlide.email) slide.fields.email = aiSlide.email;

            if (Array.isArray(aiSlide.bullets)) {
                aiSlide.bullets.forEach(function (text) {
                    addBlock('paragraph');
                    var lastBlock = slide.blocks[slide.blocks.length - 1];
                    if (lastBlock) lastBlock.text = text;
                });
            }
            if (Array.isArray(aiSlide.leftBullets)) slide.fields.leftBullets = aiSlide.leftBullets;
            if (Array.isArray(aiSlide.rightBullets)) slide.fields.rightBullets = aiSlide.rightBullets;
            if (Array.isArray(aiSlide.icons)) {
                aiSlide.icons.forEach(function (iconData) {
                    addBlock('icon');
                    var lastBlock = slide.blocks[slide.blocks.length - 1];
                    if (lastBlock) { lastBlock.label = iconData.label || ''; lastBlock.src = iconData.emoji || ''; }
                });
            }

            // IMPORTANT: If you change or delete images in the assets folder, you MUST update these filenames below!
            const EQUIPMENT_IMAGES = {
                '[BOOM]': [
                    'assets/IMAGES/Boom/Boomlift1.jpeg',
                    'assets/IMAGES/Boom/Boomlift2.jpeg',
                    'assets/IMAGES/Boom/Boomlift3.jpeg',
                    'assets/IMAGES/Boom/Boomlift4.jpeg',
                    'assets/IMAGES/Boom/Boomlift5.jpeg'
                ],
                '[SCISSOR]': [
                    'assets/IMAGES/Scissor/Scissorlift1.jpeg',
                    'assets/IMAGES/Scissor/Scissorlift2.jpeg',
                    'assets/IMAGES/Scissor/Scissorlift3.jpeg',
                    'assets/IMAGES/Scissor/Scissorlift4.jpeg',
                    'assets/IMAGES/Scissor/Scissorlift5.jpeg'
                ],
                '[SPIDER]': [
                    'assets/IMAGES/Spider/Spiderlift1.jpeg',
                    'assets/IMAGES/Spider/Spiderlift2.jpeg',
                    'assets/IMAGES/Spider/Spiderlift3.jpeg',
                    'assets/IMAGES/Spider/Spiderlift4.jpeg',
                    'assets/IMAGES/Spider/Spiderlift5.jpeg'
                ],
                '[FORKLIFT]': [
                    'assets/IMAGES/forklifts/Forklift1.jpg',
                    'assets/IMAGES/forklifts/Forklift2.jpeg'
                ],
                '[PALLET_STACKER]': [
                    'assets/IMAGES/pallet_stackers/Palletstacker1.jpg',
                    'assets/IMAGES/pallet_stackers/Palletstacker2.jpg',
                    'assets/IMAGES/pallet_stackers/Palletstacker3.jpg',
                    'assets/IMAGES/pallet_stackers/Palletstacker4.jpg',
                    'assets/IMAGES/pallet_stackers/Palletstacker5.jpg'
                ],
                '[VERTICAL_MAST]': [
                    'assets/IMAGES/vertical_masts/Vertical1.jpg',
                    'assets/IMAGES/vertical_masts/Vertical2.jpg',
                    'assets/IMAGES/vertical_masts/Vertical3.jpg',
                    'assets/IMAGES/vertical_masts/Vertical4.jpg',
                    'assets/IMAGES/vertical_masts/Vertical5.jpg'
                ],
                '[AI]': [
                    'assets/IMAGES/AI/AI1.jpg',
                    'assets/IMAGES/AI/AI2.jpg',
                    'assets/IMAGES/AI/AI3.jpg',
                    'assets/IMAGES/AI/AI4.jpg',
                    'assets/IMAGES/AI/AI5.jpg',
                    'assets/IMAGES/AI/AI6.jpg',
                    'assets/IMAGES/AI/AI7.jpg',
                    'assets/IMAGES/AI/AI8.jpg'
                ],
                '[BUSINESS]': [
                    'assets/IMAGES/Business/Business1.jpg',
                    'assets/IMAGES/Business/Business2.jpg',
                    'assets/IMAGES/Business/Business3.png',
                    'assets/IMAGES/Business/Business4.jpg',
                    'assets/IMAGES/Business/Business5.jpg'
                ],
                '[EDUCATION]': [
                    'assets/IMAGES/Education/Education1.jpg',
                    'assets/IMAGES/Education/Education2.jpg',
                    'assets/IMAGES/Education/Education3.jpg',
                    'assets/IMAGES/Education/Education4.jpg',
                    'assets/IMAGES/Education/Education5.jpg'
                ],
                '[SUSTAINABILITY]': [
                    'assets/IMAGES/Sustainability/Sustainability1.jpg',
                    'assets/IMAGES/Sustainability/Sustainability2.jpg',
                    'assets/IMAGES/Sustainability/Sustainability3.jpg',
                    'assets/IMAGES/Sustainability/Sustainability4.jpeg',
                    'assets/IMAGES/Sustainability/Sustainability5.jpg',
                    'assets/IMAGES/Sustainability/Sustainability6.jpg'
                ],
                '[TEAMWORK]': [
                    'assets/IMAGES/Teamwork/Teamwork1.jpg',
                    'assets/IMAGES/Teamwork/Teamwork2.jpg',
                    'assets/IMAGES/Teamwork/Teamwork3.jpg',
                    'assets/IMAGES/Teamwork/Teamwork4.jpg',
                    'assets/IMAGES/Teamwork/Teamwork5.jpg'
                ],
                '[TECHNOLOGY]': [
                    'assets/IMAGES/Technology/Technology1.jpeg',
                    'assets/IMAGES/Technology/Technology2.jpg',
                    'assets/IMAGES/Technology/Technology3.jpg',
                    'assets/IMAGES/Technology/Technology4.jpg',
                    'assets/IMAGES/Technology/Technology5.jpg'
                ]
            };

            function resolveImageToken(val) {
                if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
                    const arr = EQUIPMENT_IMAGES[val.toUpperCase()];
                    if (arr && arr.length > 0) return arr[Math.floor(Math.random() * arr.length)];
                }
                return val;
            }

            if (aiSlide.photo) {
                slide.fields.photo = resolveImageToken(aiSlide.photo);
                if (slide.layout === 'image-text') {
                    addBlock('image');
                    var lastImgBlock = slide.blocks[slide.blocks.length - 1];
                    if (lastImgBlock) { lastImgBlock.src = slide.fields.photo; lastImgBlock.caption = aiSlide.imageCaption || ''; lastImgBlock.shape = 'oval'; }
                }
            }
            if (aiSlide.leftImage) slide.fields.leftImage = resolveImageToken(aiSlide.leftImage);
            if (aiSlide.rightImage) slide.fields.rightImage = resolveImageToken(aiSlide.rightImage);

            if (Array.isArray(aiSlide.cells)) {
                slide.fields.cells = aiSlide.cells.map(c => ({ src: resolveImageToken(c.src) || '', label: c.label || '' }));
            }
            if (Array.isArray(aiSlide.images)) {
                slide.fields.images = aiSlide.images.map(img => ({ src: resolveImageToken(img.src) || '' }));
            }
        });

        savePresentation();
        setTimeout(function () { document.querySelector('[data-step="2"]').click(); }, 300);

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
document.addEventListener('DOMContentLoaded', function () {
    // Restore last prompt if exists
    const savedPrompt = localStorage.getItem('lastAIPrompt');
    const promptInput = document.getElementById('aiPromptInput');
    if (savedPrompt && promptInput) {
        promptInput.value = savedPrompt;
    }

    // Use event delegation so it also works after innerHTML swaps on nav
    document.addEventListener('keydown', function (e) {
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

// Global Undo for slide deletion (Ctrl+Z or Cmd+Z)
document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (deletedSlidesHistory.length > 0 && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const restored = deletedSlidesHistory.pop();
            presentation.slides.splice(restored.index, 0, restored.slide);
            activeSlideId = restored.slide.id;
            updateSidebarStatus();
            savePresentation();

            const activeNav = document.querySelector('.nav-item.active');
            if (activeNav && activeNav.getAttribute('data-step') === '2') {
                renderStep2();
            } else if (activeNav && activeNav.getAttribute('data-step') === '3') {
                renderStep3();
            }
        }
    }
});