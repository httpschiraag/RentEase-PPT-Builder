// ============================================
// RENTEASE PPT BUILDER — IndexedDB Manager
// Handles persistent image storage
// ============================================

const DB_NAME = 'rentease_ppt_db';
const DB_VERSION = 1;
let db = null;

// Open / create the database
// Returns a Promise that resolves when DB is ready
function initDB() {
    return new Promise(function(resolve, reject) {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Runs when DB is created for the first time
        // or when DB_VERSION increases
        request.onupgradeneeded = function(event) {
            const database = event.target.result;
            if (!database.objectStoreNames.contains('images')) {
                database.createObjectStore('images');
            }
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

// Save an image Blob with a given key
function dbSaveImage(key, blob) {
    return new Promise(function(resolve, reject) {
        const tx = db.transaction('images', 'readwrite');
        tx.objectStore('images').put(blob, key);
        tx.oncomplete = resolve;
        tx.onerror = function() { reject(tx.error); };
    });
}

// Load an image by key — returns an object URL for display
function dbLoadImage(key) {
    return new Promise(function(resolve, reject) {
        const tx = db.transaction('images', 'readonly');
        const request = tx.objectStore('images').get(key);
        request.onsuccess = function() {
            if (request.result) {
                // Convert Blob → temporary URL the browser can display
                resolve(URL.createObjectURL(request.result));
            } else {
                resolve(null);
            }
        };
        request.onerror = function() { reject(request.error); };
    });
}

// Delete a single image
function dbDeleteImage(key) {
    return new Promise(function(resolve, reject) {
        const tx = db.transaction('images', 'readwrite');
        tx.objectStore('images').delete(key);
        tx.oncomplete = resolve;
        tx.onerror = function() { reject(tx.error); };
    });
}

// Delete ALL images (used when starting a new presentation)
function dbClearAllImages() {
    return new Promise(function(resolve, reject) {
        const tx = db.transaction('images', 'readwrite');
        tx.objectStore('images').clear();
        tx.oncomplete = resolve;
        tx.onerror = function() { reject(tx.error); };
    });
}