// Debug utilities for CentralTeach application
// This script helps diagnose and fix path issues with stimuli

// Function to check image path and provide alternatives when needed
function validateImagePath(path) {
    // Handle null or undefined paths
    if (!path) {
        console.error('Invalid image path: path is null or undefined');
        return 'assets/Food/apple.png';
    }
    
    // Handle complete URLs (likely from fetch operations)
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path; // Return external URLs as-is
    }
    
    // Fix double slash issues that might occur
    path = path.replace(/\/\//g, '/');
    if (!path.startsWith('assets/') && !path.startsWith('/assets/')) {
        path = path.replace('assets/', '/assets/');
    }
    
    // Fix path if it has a URL origin in front
    if (path.includes('localhost') || path.includes('127.0.0.1')) {
        const matches = path.match(/\/assets\/.*/);
        if (matches && matches[0]) {
            path = matches[0];
        }
    }
    
    // Check if the path is already valid with categories
    if (path.includes('assets/Food/') || 
        path.includes('assets/Animals/') || 
        path.includes('assets/Clothing/') || 
        path.includes('assets/Emotions/') || 
        path.includes('assets/Everyday/') || 
        path.includes('assets/Transportation/')) {
        // Clean up any leading slashes for consistency
        return path.replace(/^\//, '');
    }
    
    // Try to map older non-categorized paths to new category structure
    if (path.includes('assets/')) {
        const filename = path.split('/').pop();
        
        // Map to correct categories - expanded mapping
        if (['apple.png', 'banana.png', 'cookie.png'].includes(filename)) {
            return `assets/Food/${filename}`;
        } else if (['cat.png', 'dog.png'].includes(filename)) {
            return `assets/Animals/${filename}`;
        } else if (['hat.png', 'shirt.webp', 'shoes.png'].includes(filename)) {
            return `assets/Clothing/${filename}`;
        } else if (['happy.png', 'sad.png'].includes(filename)) {
            return `assets/Emotions/${filename}`;
        } else if (['book.png', 'chair.webp', 'cup.png', 'table.webp'].includes(filename)) {
            return `assets/Everyday/${filename}`;
        } else if (['bus.webp', 'car.webp', 'plane.png'].includes(filename)) {
            return `assets/Transportation/${filename}`;
        }
    }
    
    console.warn(`Image path not recognized: ${path}. Using fallback.`);
    return 'assets/Food/apple.png';
}

// Function to fix stored stimulus objects
function fixStimulusPaths(config) {
    if (!config) {
        console.error('Invalid config provided to fixStimulusPaths');
        return config;
    }
    
    console.log('Fixing stimulus paths for config:', config.type);
    
    // Fix stimuli array paths
    if (config.stimuli && Array.isArray(config.stimuli)) {
        config.stimuli.forEach((stimulus, index) => {
            if (stimulus && typeof stimulus === 'object') {
                if (stimulus.src) {
                    const oldPath = stimulus.src;
                    stimulus.src = validateImagePath(stimulus.src);
                    if (oldPath !== stimulus.src) {
                        console.log(`Fixed path [${index}]: ${oldPath} -> ${stimulus.src}`);
                    }
                } else {
                    console.error(`Missing src in stimulus [${index}]:`, stimulus);
                    // Create a default src if missing
                    stimulus.src = 'assets/Food/apple.png';
                    stimulus.alt = stimulus.alt || 'Default Image';
                }
            } else {
                console.error(`Invalid stimulus object at index ${index}:`, stimulus);
                config.stimuli[index] = {
                    src: 'assets/Food/apple.png',
                    alt: 'Default Image'
                };
            }
        });
    } else {
        console.error('No stimuli array found in config or not an array:', config.stimuli);
        config.stimuli = [{
            src: 'assets/Food/apple.png',
            alt: 'Default Apple'
        }];
    }
    
    // Fix target stimulus path
    if (config.target) {
        if (config.target.src) {
            const oldPath = config.target.src;
            config.target.src = validateImagePath(config.target.src);
            if (oldPath !== config.target.src) {
                console.log(`Fixed target path: ${oldPath} -> ${config.target.src}`);
            }
        } else {
            console.error('Missing src in target stimulus:', config.target);
            // Use the first stimulus as target if available, otherwise use default
            if (config.stimuli && config.stimuli.length > 0) {
                config.target = {
                    src: config.stimuli[0].src,
                    alt: config.stimuli[0].alt
                };
            } else {
                config.target = {
                    src: 'assets/Food/apple.png',
                    alt: 'Default Target'
                };
            }
        }
    }
    
    return config;
}

// Function to check if an image exists at a given path
function checkImageExists(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = path;
    });
}

// Function to get a working image path
async function getWorkingImagePath(path) {
    // Try the original path
    const originalExists = await checkImageExists(path);
    if (originalExists) return path;
    
    // Try the fixed path
    const fixedPath = validateImagePath(path);
    if (fixedPath !== path) {
        const fixedExists = await checkImageExists(fixedPath);
        if (fixedExists) return fixedPath;
    }
    
    // Return a guaranteed fallback
    console.error('Failed to find working image for:', path);
    return 'assets/Food/apple.png';
}

// Export utils
window.centralDebug = {
    validateImagePath,
    fixStimulusPaths,
    checkImageExists,
    getWorkingImagePath
};
