const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Get list of available assets including category folders
const assetsPath = path.join(__dirname, 'assets');
let availableAssets = [];
let categorizedAssets = {};

try {
  // Get all top-level directories (categories)
  const items = fs.readdirSync(assetsPath);
  
  // Create a flat list of all images for backward compatibility
  const allImages = [];
  
  items.forEach(item => {
    const itemPath = path.join(assetsPath, item);
    const stats = fs.statSync(itemPath);
    
    // If it's a directory, treat it as a category
    if (stats.isDirectory()) {
      try {
        const categoryImages = fs.readdirSync(itemPath)
          .filter(file => !file.startsWith('.') && 
            (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.webp')));
        
        // Only add categories that have images
        if (categoryImages.length > 0) {
          // Store category and its images
          categorizedAssets[item] = categoryImages;
          
          // Add to overall available assets
          availableAssets.push(item);
          
          // Also add to flat list for compatibility
          categoryImages.forEach(img => {
            allImages.push({
              fileName: img,
              category: item,
              path: `assets/${item}/${img}`
            });
          });
          
          console.log(`Found category: ${item} with ${categoryImages.length} images`);
        }
      } catch (err) {
        console.error(`Error reading category directory ${item}:`, err.message);
      }
    }
  });
  
  // Add flat list to categorized assets for backward compatibility
  categorizedAssets['_all'] = allImages;
  
  if (Object.keys(categorizedAssets).length <= 1) {
    console.error('No valid categories with images found in the assets directory');
  }
} catch (err) {
  console.error('Error reading assets directory:', err.message);
}

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Endpoint to get all categories and their stimuli
app.get('/api/categories', (req, res) => {
  if (Object.keys(categorizedAssets).length === 0) {
    res.status(404).json({ 
      error: 'No categories found',
      message: 'Unable to locate image categories in the assets directory'
    });
  } else {
    res.json(categorizedAssets);
  }
});

// Log all asset requests
app.use((req, res, next) => {
  if (req.path.startsWith('/assets/')) {
    console.log(`Loading asset: ${req.path}`);
  }
  next();
});

// Start the server
app.listen(PORT, () => {
  console.log(`\x1b[32m✓ CentralTeach app running on port ${PORT}\x1b[0m`);
  console.log(`\x1b[36m• Open http://localhost:${PORT} in your browser\x1b[0m`);
  console.log(`\x1b[33m• Available program types: Tacting, Receptive ID, Safety, First/Then, Visual Schedule\x1b[0m`);
  
  // Log available assets and categories
  const categoryCount = Object.keys(categorizedAssets).length;
  let totalImageCount = 0;
  
  Object.values(categorizedAssets).forEach(images => {
    totalImageCount += images.length;
  });
  
  console.log(`\x1b[36m• ${categoryCount} categories with ${totalImageCount} stimulus images available\x1b[0m`);
  
  // Log each category
  Object.entries(categorizedAssets).forEach(([category, images]) => {
    console.log(`\x1b[36m  - ${category}: ${images.length} images\x1b[0m`);
  });
});
