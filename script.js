// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Program selection
    const programItems = document.querySelectorAll('.program-item');
    const programTabs = document.querySelector('.program-tabs');
    const closeTabButtons = document.querySelectorAll('.close-tab');
    
    // Modal elements
    const modal = document.getElementById('stimulusModal');
    const openModalButtons = document.querySelectorAll('.program-item');
    const closeModalButton = document.querySelector('.close-modal');
    const doneButton = document.querySelector('.done-btn');
    
    // Create a global reference to the New Target Modal
    let activeNewTargetModal = null;
    const iconItems = document.querySelectorAll('.icon-item');
    const selectTargetButton = document.querySelector('.select-target-btn');
    
    // State management
    let activeProgram = null;
    let selectedStimuli = [];
    let targetStimulus = null;
    let fieldSize = 2;
    
    // Store program configurations
    const programConfigs = {};
    
    // Available image assets and categories
    let availableImages = [];
    let categories = {};
    
    // Directly attach click handlers for program items
    programItems.forEach(item => {
        item.addEventListener('click', () => {
            activeProgram = item.querySelector('.program-details h3').textContent;
            openModal(activeProgram);
        });
    });

    // Fetch categories and images from server
    fetch('/api/categories')
        .then(response => response.json())
        .then(data => {
            categories = data;
            console.log('Categories loaded:', Object.keys(categories));
            
            // Load images from categories into icon grid
            populateIconGrid(categories);
        })
        .catch(error => console.error('Error loading categories:', error));
    
    // Function to populate the icon grid with categorized stimuli
    function populateIconGrid(categories) {
        const iconGrid = document.querySelector('.icon-grid');
        
        // Store reference to original DOM elements if any
        const originalItems = document.querySelectorAll('.icon-grid .icon-item');
        
        // Clear existing items for refresh
        iconGrid.innerHTML = '';
        
        // Check if we have categories data
        if (!categories || Object.keys(categories).length === 0) {
            console.error('No categories data available');
            
            if (originalItems.length > 0) {
                console.log('Using existing icon items as fallback');
                originalItems.forEach(item => iconGrid.appendChild(item));
                return;
            }
            
            // Show fallback message if no items exist
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Unable to load stimuli categories. Using default items.';
            iconGrid.appendChild(errorMessage);
            
            // Create default items as fallback
            const defaultItems = [
                { name: 'Apple', src: 'assets/Food/apple.png' },
                { name: 'Banana', src: 'assets/Food/banana.png' },
                { name: 'Cat', src: 'assets/Animals/cat.png' },
                { name: 'Dog', src: 'assets/Animals/dog.png' },
                { name: 'Book', src: 'assets/Everyday/book.png' }
            ];
            
            // Create and add default items
            defaultItems.forEach(item => {
                const iconItem = createIconItem(item.src, item.name);
                iconGrid.appendChild(iconItem);
            });
            
            return;
        }
        
        // Create category sections
        Object.entries(categories).forEach(([category, images]) => {
            // Skip the internal "_all" category or if no images in this category
            if (category === '_all' || !images || images.length === 0) return;
            
            // Create category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.innerHTML = `<h3>${category}</h3>`;
            iconGrid.appendChild(categoryHeader);
            
            // Create container for this category's images
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'category-container';
            
            // Add images from this category
            images.forEach(image => {
                // Extract name from filename (remove extension)
                let name = "";
                if (typeof image === 'string') {
                    // Simple string format from category folders
                    name = image.split('.')[0];
                    const imagePath = `assets/${category}/${image}`;
                    // Create the icon item using our helper function
                    const iconItem = createIconItem(imagePath, name);
                    categoryContainer.appendChild(iconItem);
                } else if (typeof image === 'object' && image.path) {
                    // Object format from _all category
                    name = image.fileName.split('.')[0];
                    // Create the icon item using our helper function
                    const iconItem = createIconItem(image.path, name);
                    categoryContainer.appendChild(iconItem);
                }
            });
            
            iconGrid.appendChild(categoryContainer);
        });
    }
    
    // Helper function to create icon items
    function createIconItem(src, alt) {
        const iconItem = document.createElement('div');
        iconItem.className = 'icon-item';
        
        // Create the image element
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        
        // Handle image load errors gracefully
        img.onerror = () => {
            console.warn(`Image failed to load: ${src}. Using fallback.`);
            // Try to determine which category this is from to use a specific fallback
            let fallbackSrc = 'assets/Food/apple.png';
            if (src.includes('Animal')) fallbackSrc = 'assets/Animals/cat.png';
            else if (src.includes('Food')) fallbackSrc = 'assets/Food/apple.png';
            else if (src.includes('Cloth')) fallbackSrc = 'assets/Clothing/hat.png';
            
            img.src = fallbackSrc;
            // Keep the original alt text but note it's a fallback
            img.alt = `${alt} (Fallback)`;
        };
        
        iconItem.appendChild(img);
        
        // Add click event for selection when not in target selection mode
        iconItem.addEventListener('click', () => {
            if (!document.body.classList.contains('selecting-target')) {
                iconItem.classList.toggle('selected');
                
                if (iconItem.classList.contains('selected')) {
                    // Get the current src and alt after potential fallback occurred
                    selectedStimuli.push({ src: img.src, alt: img.alt });
                    console.log('Selected stimulus:', img.alt, img.src);
                } else {
                    selectedStimuli = selectedStimuli.filter(stimulus => stimulus.src !== img.src);
                    
                    // If this was the target and it's been deselected, clear target
                    if (targetStimulus && targetStimulus.src === img.src) {
                        targetStimulus = null;
                        iconItem.classList.remove('target');
                    }
                }
            }
        });
        
        return iconItem;
    }
    
    // Initialize original hardcoded icon items before they get replaced
    document.querySelectorAll('.icon-item').forEach(item => {
        const img = item.querySelector('img');
        
        // Set up click handler for selection
        item.addEventListener('click', () => {
            if (!document.body.classList.contains('selecting-target')) {
                item.classList.toggle('selected');
                
                const imgSrc = img.src;
                const imgAlt = img.alt;
                
                if (item.classList.contains('selected')) {
                    selectedStimuli.push({ src: imgSrc, alt: imgAlt });
                    console.log(`Selected: ${imgAlt} (${imgSrc})`);
                } else {
                    selectedStimuli = selectedStimuli.filter(stimulus => stimulus.src !== imgSrc);
                    
                    // If this was the target and it's been deselected, clear target
                    if (targetStimulus && targetStimulus.src === imgSrc) {
                        targetStimulus = null;
                        item.classList.remove('target');
                    }
                }
            }
        });
    });
    
    // Function to update star indicators based on which programs are in the queue
    function updateProgramStars() {
        programItems.forEach(item => {
            const programName = item.querySelector('.program-details h3').textContent;
            // Check if this program type exists in any tab
            const programInQueue = Array.from(document.querySelectorAll('.tab')).some(tab => {
                const tabProgramType = tab.getAttribute('data-program');
                return programName.includes(tabProgramType);
            });
            
            // Update the starred status based on whether it's in the queue
            if (programInQueue) {
                item.classList.add('starred');
            } else {
                item.classList.remove('starred');
            }
        });
    }
    
    // Since we now have the setupProgramItemHandlers() function, 
    // we don't need this section anymore
    
    // Call initially to set up the correct stars
    updateProgramStars();
    
    // Modal functionality
    function openModal(programType) {
        // Update modal title based on program type
        const modalTitle = modal.querySelector('.modal-header h2');
        if (modalTitle && programType) {
            // Remove "Programs" suffix if present
            let displayName = programType;
            if (displayName.endsWith('Programs')) {
                displayName = displayName.replace('Programs', '');
            }
            modalTitle.textContent = displayName;
        }
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    }
    
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset target selection mode if active
        if (document.body.classList.contains('selecting-target')) {
            document.body.classList.remove('selecting-target');
            selectTargetButton.textContent = "Select Target Stimulus";
            selectTargetButton.style.backgroundColor = "#f44336";
        }
        
        // Clear search term
        const searchInput = document.querySelector('.search-icons input');
        if (searchInput) {
            searchInput.value = '';
            filterIconsBySearch(''); // Show all items
        }
        
        // Reset selections
        selectedStimuli = [];
        targetStimulus = null;
        
        // Remove selected and target classes from all items
        document.querySelectorAll('.icon-item.selected, .icon-item.target').forEach(item => {
            item.classList.remove('selected');
            item.classList.remove('target');
        });
        
        // Also clean up any edit modals that might be open
        document.querySelectorAll('[id^="editModal-"]').forEach(el => {
            document.body.removeChild(el);
        });
    }
    
    closeModalButton.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // We'll handle icon selection in the populateIconGrid function instead
    // since we're now dynamically creating the icon elements
    
    // Select target stimulus
    selectTargetButton.addEventListener('click', () => {
        // Change button appearance to indicate "selection mode"
        selectTargetButton.textContent = "Click an item to set as target";
        selectTargetButton.style.backgroundColor = "#4CAF50";
        document.body.classList.add('selecting-target');
        
        // Clear any existing target selections
        document.querySelectorAll('.icon-item.target').forEach(item => {
            item.classList.remove('target');
        });
        
        // Create one-time event listener for the document
        const selectTargetHandler = (e) => {
            // Find the clicked icon-item (if any)
            const iconItem = e.target.closest('.icon-item');
            if (!iconItem) return;
            
            // Remove selection mode
            document.body.classList.remove('selecting-target');
            document.removeEventListener('click', selectTargetHandler);
            
            // Reset button appearance
            selectTargetButton.textContent = "Select Target Stimulus";
            selectTargetButton.style.backgroundColor = "#f44336";
            
            // Clear any existing target
            document.querySelectorAll('.icon-item.target').forEach(item => {
                item.classList.remove('target');
            });
            
            // Set new target
            iconItem.classList.add('target');
            targetStimulus = {
                src: iconItem.querySelector('img').src,
                alt: iconItem.querySelector('img').alt
            };
            
            // Also select this item if it wasn't already selected
            if (!iconItem.classList.contains('selected')) {
                iconItem.classList.add('selected');
                selectedStimuli.push({ 
                    src: targetStimulus.src, 
                    alt: targetStimulus.alt 
                });
            }
            
            console.log('Target set:', targetStimulus.alt);
            
            // Prevent event bubbling
            e.stopPropagation();
        };
        
        // Add the one-time document click listener
        document.addEventListener('click', selectTargetHandler);
    });
    
    // Update field size
    const fieldSizeInput = document.querySelector('.field-size-selector input');
    fieldSizeInput.addEventListener('change', (e) => {
        fieldSize = parseInt(e.target.value);
        if (fieldSize < 1) fieldSize = 1;
        if (fieldSize > 6) fieldSize = 6;
        e.target.value = fieldSize;
    });
    
    // Complete program configuration and add to tabs
    doneButton.addEventListener('click', () => {
        if (selectedStimuli.length === 0) {
            alert('Please select at least one stimulus');
            return;
        }
        
        // Check if target stimulus is selected
        if (!targetStimulus && selectedStimuli.length > 1 && 
            (activeProgram.includes('Receptive ID') || activeProgram.includes('Tacting'))) {
            alert('Please select a target stimulus');
            return;
        }            // If no target is selected but only one stimulus, use it as target
            if (!targetStimulus && selectedStimuli.length === 1) {
                targetStimulus = selectedStimuli[0];
            }
            
            console.log('Creating program with stimuli:', selectedStimuli.length, 'target:', targetStimulus?.alt);
            
            // Create a new tab
            let programName = activeProgram;
            // Normalize to singular form and trim extra spaces
            if (programName.endsWith('Programs')) {
                programName = programName.replace('Programs', '');
            }
            programName = programName.trim();  // <-- Trim whitespace
            
            // Make sure program click handlers are still working
            //setupProgramItemHandlers();

        const tabCount = document.querySelectorAll(
            `.tab[data-program="${programName}"]`
        ).length + 1;
        const newTabName = `${programName} ${tabCount}`;
        const tabId = `${programName.toLowerCase().replace(/\s/g, '-')}-${tabCount}`;
        
        const newTab = document.createElement('div');
        newTab.className = 'tab';
        newTab.setAttribute('data-program', programName);
        newTab.setAttribute('id', tabId);
        newTab.innerHTML = `${newTabName}<span class="close-tab">×</span>`;
        
        // Store program configuration
        programConfigs[tabId] = {
            type: programName,
            stimuli: [...selectedStimuli],
            target: targetStimulus,
            fieldSize: fieldSize,
            currentIndex: 0,
            randomized: false
        };
        
        // Debug log to confirm program configuration was stored
        console.log('Stored program configuration:', {
            tabId,
            type: programName,
            stimuliCount: selectedStimuli.length,
            target: targetStimulus ? targetStimulus.alt : 'none'
        });
        
        // Add the tab to the tab bar
        programTabs.appendChild(newTab);
        
        // Activate the new tab
        activateTab(newTab);
        
        // Set up the tab's close button
        const newCloseButton = newTab.querySelector('.close-tab');
        newCloseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            // Clean up program configuration
            delete programConfigs[tabId];
            newTab.remove();
            
            // If this was the active tab, activate the first available tab
            if (newTab.classList.contains('active')) {
                const firstAvailableTab = document.querySelector('.tab');
                if (firstAvailableTab) {
                    activateTab(firstAvailableTab);
                }
            }
            
            // Update program stars since a program was removed from queue
            updateProgramStars();
        });
        
        // Make the tab clickable to activate it
        newTab.addEventListener('click', () => {
            activateTab(newTab);
        });
        
        // Close the modal
        closeModal();
        
        // Update program stars since a new program was added to queue
        updateProgramStars();
        
        // Reset selections for next time
        document.querySelectorAll('.icon-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        document.querySelectorAll('.icon-item.target').forEach(item => {
            item.classList.remove('target');
        });
        
        // Clear search term
        const searchInput = document.querySelector('.search-icons input');
        if (searchInput) {
            searchInput.value = '';
            filterIconsBySearch(''); // Reset filter to show all items
        }
        
        // Keep a copy of selected stimuli for the program
        const currentSelections = [...selectedStimuli];
        selectedStimuli = [];
        targetStimulus = null;
        
        // Update the main content area with the selected stimulus
        updateProgramContent();
    });
    
    // Tab functionality
    function activateTab(tab) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
        });
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Update the main content area based on the active tab
        updateProgramContent();
    }
    
    // Set up initial tab functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activateTab(tab);
        });
    });
    
    closeTabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const tab = button.parentElement;
            tab.remove();
            
            // If this was the active tab, activate the first available tab
            if (tab.classList.contains('active')) {
                const firstAvailableTab = document.querySelector('.tab');
                if (firstAvailableTab) {
                    activateTab(firstAvailableTab);
                }
            }
        });
    });
    
    // Cleanup function to remove bottom controls
    function cleanupBottomControls() {
        document.querySelectorAll('.bottom-controls').forEach(el => {
            el.remove();
        });
    }

    // Update the main content area based on the active tab
    function updateProgramContent() {
        // Clean up any existing controls first
        cleanupBottomControls();
        
        const activeTab = document.querySelector('.tab.active');
        const emptyMessage = document.getElementById('empty-program-message');
        const programDisplay = document.getElementById('program-display');
        
        // If no active tab exists, show the empty message
        if (!activeTab) {
            if (emptyMessage) emptyMessage.style.display = 'block';
            if (programDisplay) programDisplay.style.display = 'none';
            return;
        }
        
        // Hide the empty message and show program content
        if (emptyMessage) emptyMessage.style.display = 'none';
        if (programDisplay) programDisplay.style.display = 'block';
        
        const tabId = activeTab.id;
        let config = programConfigs[tabId];
        
        if (!config) {
            console.log('No configuration found for tab:', tabId);
            
            // For pre-existing tabs that don't have configurations
            const programName = activeTab.getAttribute('data-program') || activeTab.textContent.split('×')[0].trim();
            
            // Show the empty message instead of placeholder content
            if (emptyMessage) emptyMessage.style.display = 'block';
            if (programDisplay) programDisplay.style.display = 'none';
            return;
        }
        
        // Fix stimulus paths before displaying
        if (window.centralDebug && window.centralDebug.fixStimulusPaths) {
            config = window.centralDebug.fixStimulusPaths(config);
        }
        
        // Update based on the program type
        const programType = config.type;
        const stimulusDisplay = document.querySelector('.stimulus-display');
        console.log('updateProgramContent: tab', tabId, 'config', config);
        console.log('Rendering programType:', programType);
        
        if (programType === 'Tacting') {
            // Tacting: show a grid of target + distractors equal to fieldSize
            const stimuli = config.stimuli || [];
            const target = config.target || stimuli[0] || { src: 'assets/Food/apple.png', alt: 'Default' };
            const total = Math.max(1, config.fieldSize);
            // Filter out target for distractors and shuffle if needed
            let distractors = stimuli.filter(s => s.src !== target.src);
            if (config.randomized) distractors.sort(() => Math.random() - 0.5);
            // Select required number of distractors
            const needed = Math.max(0, total - 1);
            const selectedDistractors = distractors.slice(0, needed);
            // Combine and shuffle all items
            let displayStimuli = [...selectedDistractors, target];
            if (config.randomized) displayStimuli.sort(() => Math.random() - 0.5);

            // Hide any prompt text for Tacting
            const promptEl = document.querySelector('.prompt-text');
            if (promptEl) promptEl.style.display = 'none';

            // Render grid
            stimulusDisplay.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'receptive-grid';
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = `repeat(${total}, 1fr)`;
            grid.style.gap = '10px';
            grid.style.width = '100%';
            displayStimuli.forEach(item => {
                const img = document.createElement('img');
                img.src = item.src;
                img.alt = item.alt;
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.objectFit = 'contain';
                grid.appendChild(img);
            });
            stimulusDisplay.appendChild(grid);

            // Add static bottom controls
            renderBottomControls(config, tabId);
        } else if (programType === 'Receptive ID') {
            // Receptive ID: show a mix of distractors + target equal to fieldSize
            const stimuli = config.stimuli || [];
            const target = config.target || stimuli[0] || { src: 'assets/Food/apple.png', alt: 'Default' };
            const total = Math.max(1, config.fieldSize);
            // filter out target for distractors
            let distractors = stimuli.filter(s => s.src !== target.src);
            // shuffle if randomized
            if (config.randomized) distractors.sort(() => Math.random() - 0.5);
            // select needed distractors
            const needed = total - 1;
            const selectedDistractors = distractors.slice(0, needed);
            // combine and shuffle for display
            let displayStimuli = [...selectedDistractors, target];
            if (config.randomized) displayStimuli.sort(() => Math.random() - 0.5);

            // clear previous content
            stimulusDisplay.innerHTML = '';
            document.querySelector('.prompt-text').textContent = '';

            // render grid
            const grid = document.createElement('div');
            grid.className = 'receptive-grid';
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = `repeat(${total}, 1fr)`;
            grid.style.gap = '10px';
            grid.style.width = '100%';
            displayStimuli.forEach(item => {
                const img = document.createElement('img');
                img.src = item.src;
                img.alt = item.alt;
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.objectFit = 'contain';
                grid.appendChild(img);
            });
            stimulusDisplay.appendChild(grid);

            // Add static bottom controls
            renderBottomControls(config, tabId);
        } else if (programType === 'First/Then') {
            // Show two items - first one, then the other
            const promptElement = document.querySelector('.prompt-text');
            promptElement.textContent = '"First work, then play"';
            
            // Get the first two stimuli
            const firstStimulus = config.stimuli[0] || { src: 'assets/Everyday/book.png', alt: 'Work' };
            const thenStimulus = config.stimuli[1] || { src: 'assets/Emotions/happy.png', alt: 'Play' };
            
            stimulusDisplay.innerHTML = `
                <div class="first-then-container" style="display: flex; gap: 30px; align-items: center;">
                    <div class="first-container" style="text-align: center;">
                        <h3>First</h3>
                        <img src="${firstStimulus.src}" alt="${firstStimulus.alt}" style="width: 150px; height: 150px; object-fit: contain;">
                    </div>
                    <div style="font-size: 24px;">→</div>
                    <div class="then-container" style="text-align: center;">
                        <h3>Then</h3>
                        <img src="${thenStimulus.src}" alt="${thenStimulus.alt}" style="width: 150px; height: 150px; object-fit: contain;">
                    </div>
                </div>
            `;
            
        } else if (programType === 'Visual Schedule') {
            // Show a sequence of activities
            const promptElement = document.querySelector('.prompt-text');
            promptElement.textContent = '"Your schedule today"';
            
            stimulusDisplay.innerHTML = `<div class="schedule-container" style="display: flex; flex-direction: column; gap: 10px;"></div>`;
            const scheduleContainer = stimulusDisplay.querySelector('.schedule-container');
            
            // Create a schedule with all the selected stimuli
            config.stimuli.forEach((stimulus, index) => {
                const scheduleItem = document.createElement('div');
                scheduleItem.className = 'schedule-item';
                scheduleItem.style.display = 'flex';
                scheduleItem.style.alignItems = 'center';
                scheduleItem.style.gap = '10px';
                scheduleItem.style.marginBottom = '15px';
                
                const numberCircle = document.createElement('div');
                numberCircle.textContent = index + 1;
                numberCircle.style.width = '30px';
                numberCircle.style.height = '30px';
                numberCircle.style.borderRadius = '50%';
                numberCircle.style.backgroundColor = '#4caf50';
                numberCircle.style.color = 'white';
                numberCircle.style.display = 'flex';
                numberCircle.style.justifyContent = 'center';
                numberCircle.style.alignItems = 'center';
                
                const img = document.createElement('img');
                img.src = stimulus.src;
                img.alt = stimulus.alt;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'contain';
                
                const label = document.createElement('span');
                label.textContent = stimulus.alt;
                label.style.fontSize = '18px';
                
                scheduleItem.appendChild(numberCircle);
                scheduleItem.appendChild(img);
                scheduleItem.appendChild(label);
                
                scheduleContainer.appendChild(scheduleItem);
            });
        } else {
            console.warn('Unknown program type:', programType);
            stimulusDisplay.innerHTML = `<div class="error-message">Unknown program type: ${programType}</div>`;
        }
    }
    
    // Add navigation controls for advancing through stimuli
    function addNavControls(container, config, tabId) {
        const navControls = document.createElement('div');
        navControls.className = 'nav-controls';
        navControls.style.display = 'flex';
        navControls.style.justifyContent = 'center';
        navControls.style.marginTop = '30px';
        navControls.style.gap = '15px';
        
        // Status indicator for image loading
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        statusIndicator.style.marginBottom = '15px';
        statusIndicator.style.padding = '5px 10px';
        statusIndicator.style.fontSize = '14px';
        statusIndicator.style.borderRadius = '3px';
        statusIndicator.style.textAlign = 'center';
        
        // Check if current image loads successfully
        if (config.stimuli && config.stimuli.length > 0) {
            const currentIdx = config.currentIndex % config.stimuli.length;
            const stimulus = config.target || config.stimuli[currentIdx];
            
            if (stimulus && stimulus.src) {
                statusIndicator.textContent = `Loading image: ${stimulus.alt}`;
                statusIndicator.style.backgroundColor = '#fff3cd';
                statusIndicator.style.color = '#856404';
                
                const imageCheck = new Image();
                imageCheck.onload = () => {
                    statusIndicator.textContent = `Image loaded successfully: ${stimulus.alt}`;
                    statusIndicator.style.backgroundColor = '#d4edda';
                    statusIndicator.style.color = '#155724';
                    setTimeout(() => {
                        statusIndicator.style.display = 'none';
                    }, 2000);
                };
                
                imageCheck.onerror = () => {
                    statusIndicator.textContent = `Error loading image: ${stimulus.alt}. Using fallback.`;
                    statusIndicator.style.backgroundColor = '#f8d7da';
                    statusIndicator.style.color = '#721c24';
                    
                    // Try to fix the path
                    if (window.centralDebug && window.centralDebug.validateImagePath) {
                        stimulus.src = window.centralDebug.validateImagePath(stimulus.src);
                        updateProgramContent();
                    }
                };
                
                imageCheck.src = stimulus.src;
            }
        }
        
        // Add status indicator to container
        container.appendChild(statusIndicator);
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Previous';
        prevButton.style.padding = '10px 15px';
        prevButton.style.backgroundColor = '#2196F3';
        prevButton.style.color = 'white';
        prevButton.style.border = 'none';
        prevButton.style.borderRadius = '4px';
        prevButton.style.cursor = 'pointer';
        
        // Refresh button (new)
        const refreshButton = document.createElement('button');
        refreshButton.textContent = '↻ Refresh';
        refreshButton.style.padding = '10px 15px';
        refreshButton.style.backgroundColor = '#795548';
        refreshButton.style.color = 'white';
        refreshButton.style.border = 'none';
        refreshButton.style.borderRadius = '4px';
        refreshButton.style.cursor = 'pointer';
        
        // Random button
        const randomButton = document.createElement('button');
        randomButton.textContent = config.randomized ? 'Sequential' : 'Random';
        randomButton.style.padding = '10px 15px';
        randomButton.style.backgroundColor = config.randomized ? '#9c27b0' : '#ff9800';
        randomButton.style.color = 'white';
        randomButton.style.border = 'none';
        randomButton.style.borderRadius = '4px';
        randomButton.style.cursor = 'pointer';
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next →';
        nextButton.style.padding = '10px 15px';
        nextButton.style.backgroundColor = '#4caf50';
        nextButton.style.color = 'white';
        nextButton.style.border = 'none';
        nextButton.style.borderRadius = '4px';
        nextButton.style.cursor = 'pointer';
        
        // Button event handlers
        prevButton.addEventListener('click', () => {
            if (config.currentIndex > 0) {
                config.currentIndex--;
                updateProgramContent();
            }
        });
        
        refreshButton.addEventListener('click', () => {
            // Force a refresh of the current content
            updateProgramContent();
        });
        
        randomButton.addEventListener('click', () => {
            config.randomized = !config.randomized;
            randomButton.textContent = config.randomized ? 'Sequential' : 'Random';
            randomButton.style.backgroundColor = config.randomized ? '#9c27b0' : '#ff9800';
            updateProgramContent();
        });
        
        nextButton.addEventListener('click', () => {
            config.currentIndex++;
            updateProgramContent();
        });
        
        navControls.appendChild(prevButton);
        navControls.appendChild(refreshButton);
        navControls.appendChild(randomButton);
        navControls.appendChild(nextButton);
        
        container.appendChild(navControls);
    }
    
    // Add specific controls for Receptive ID programs
    function addReceptiveControls(container, config, tabId) {
        // Remove existing controls
        container.querySelectorAll('.receptive-controls')?.forEach(el => el.remove());
        
        // Create controls wrapper
        const controls = document.createElement('div');
        controls.className = 'receptive-controls';
        controls.style.position = 'absolute';
        controls.style.bottom = '20px';
        controls.style.right = '20px';
        controls.style.display = 'flex';
        controls.style.gap = '10px';
        
        // New Target button
        const newBtn = document.createElement('button');
        newBtn.textContent = 'New Target Stimuli';
        newBtn.style.backgroundColor = '#999';
        newBtn.style.color = 'white';
        newBtn.style.border = 'none';
        newBtn.style.padding = '10px 15px';
        newBtn.style.borderRadius = '4px';
        newBtn.style.cursor = 'pointer';
        newBtn.addEventListener('click', () => createNewTargetModal(config, tabId));
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.style.backgroundColor = '#4caf50';
        nextBtn.style.color = 'white';
        nextBtn.style.border = 'none';
        nextBtn.style.padding = '10px 15px';
        nextBtn.style.borderRadius = '4px';
        nextBtn.style.cursor = 'pointer';
        nextBtn.addEventListener('click', () => {
            // Advance to next trial with same config but new distractors
            config.randomized = true;
            updateProgramContent();
        });
        
        controls.appendChild(newBtn);
        controls.appendChild(nextBtn);
        container.appendChild(controls);
    }
    
    // Create modal for selecting a new target stimulus
    function createNewTargetModal(config, tabId) {
        // Use existing modal implementation to allow selection of a new target
        if (activeNewTargetModal) document.body.removeChild(activeNewTargetModal);
        
        // Populate and reuse the existing stimulusModal for new target
        const originalModal = document.getElementById('stimulusModal');
        const galleryModal = originalModal.cloneNode(true);
        galleryModal.id = `newTarget-${tabId}`;
        galleryModal.style.display = 'block';
        document.body.appendChild(galleryModal);
        
        // Override doneBtn behavior to set new target only
        const done = galleryModal.querySelector('.done-btn');
        done.textContent = 'Set Target';
        done.onclick = () => {
            // Get selected stimulus from gallery
            const selected = galleryModal.querySelector('.icon-item.selected');
            if (!selected) return alert('Select a stimulus to set as new target');
            const imgEl = selected.querySelector('img');
            config.target = { src: imgEl.src, alt: imgEl.alt };
            document.body.removeChild(galleryModal);
            activeNewTargetModal = null;
            updateProgramContent();
        };
        
        // Re-init icon selection logic within the cloned modal
        galleryModal.querySelectorAll('.icon-item').forEach(item => {
            item.addEventListener('click', () => {
                galleryModal.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
        });
        activeNewTargetModal = galleryModal;
    }
    
    // Function to open edit modal for an existing program
    function openEditModal(tabId) {
        const config = programConfigs[tabId];
        if (!config) return;
        
        // Create a clone of the original modal
        const originalModal = document.getElementById('stimulusModal');
        const editModal = originalModal.cloneNode(true);
        editModal.id = 'editModal-' + tabId;
        
        // Update the modal title
        const modalTitle = editModal.querySelector('.modal-header h2');
        modalTitle.textContent = 'Edit ' + config.type;
        
        // Set the field size
        const fieldSizeInput = editModal.querySelector('.field-size-selector input');
        fieldSizeInput.value = config.fieldSize;
        
        // Function to update the modal with current selections
        function updateSelections() {
            // Clear previous selections
            editModal.querySelectorAll('.icon-item').forEach(item => {
                item.classList.remove('selected', 'target');
            });
            
            // Mark selected stimuli and target
            config.stimuli.forEach(stimulus => {
                editModal.querySelectorAll('.icon-item img').forEach(img => {
                    if (img.src === stimulus.src) {
                        img.parentElement.classList.add('selected');
                        
                        // Mark as target if applicable
                        if (config.target && config.target.src === stimulus.src) {
                            img.parentElement.classList.add('target');
                        }
                    }
                });
            });
        }
        
        // Update initial selections
        document.body.appendChild(editModal);
        updateSelections();
        
        // Handle icon selection
        editModal.querySelectorAll('.icon-item').forEach(item => {
            item.addEventListener('click', () => {
                if (!document.body.classList.contains('selecting-target')) {
                    item.classList.toggle('selected');
                }
            });
        });
        
        // Set up target selection button
        const selectTargetBtn = editModal.querySelector('.select-target-btn');
        selectTargetBtn.addEventListener('click', () => {
            document.body.classList.add('selecting-target');
            selectTargetBtn.textContent = 'Click an item to set as target';
            selectTargetBtn.style.backgroundColor = '#4CAF50';
            
            const targetHandler = (e) => {
                const iconItem = e.target.closest('.icon-item');
                if (!iconItem) return;
                
                // Clear previous targets
                editModal.querySelectorAll('.icon-item.target').forEach(el => {
                    el.classList.remove('target');
                });
                
                // Set new target
                iconItem.classList.add('target');
                iconItem.classList.add('selected'); // Also select it
                
                // Reset button
                selectTargetBtn.textContent = 'Select Target Stimulus';
                selectTargetBtn.style.backgroundColor = '#f44336';
                document.body.classList.remove('selecting-target');
                
                // Cleanup
                document.removeEventListener('click', targetHandler);
            };
            
            // One-time click handler
            setTimeout(() => {
                document.addEventListener('click', targetHandler, {once: true});
            }, 0);
        });
        
        // Done button
        const doneBtn = editModal.querySelector('.done-btn');
        doneBtn.addEventListener('click', () => {
            // Get selected items
            const selectedItems = [];
            let targetItem = null;
            
            editModal.querySelectorAll('.icon-item').forEach(item => {
                if (item.classList.contains('selected')) {
                    const img = item.querySelector('img');
                    const stimulus = {
                        src: img.src,
                        alt: img.alt
                    };
                    selectedItems.push(stimulus);
                    
                    if (item.classList.contains('target')) {
                        targetItem = stimulus;
                    }
                }
            });
            
            // Validate selections
            if (selectedItems.length === 0) {
                alert('Please select at least one stimulus');
                return;
            }
            
            if (!targetItem && selectedItems.length > 1 && 
                (config.type === 'Receptive ID' || config.type === 'Tacting')) {
                alert('Please select a target stimulus');
                return;
            }
            
            // If only one item is selected, use it as target
            if (!targetItem && selectedItems.length === 1) {
                targetItem = selectedItems[0];
            }
            
            // Update configuration
            config.stimuli = selectedItems;
            config.target = targetItem;
            config.fieldSize = parseInt(fieldSizeInput.value) || 2;
            
            // Close modal and refresh view
            document.body.removeChild(editModal);
            updateProgramContent();
        });
        
        // Close button
        const closeBtn = editModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(editModal);
        });
        
        // Close on outside click
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                document.body.removeChild(editModal);
            }
        });
        
        // Show the modal
        editModal.style.display = 'block';
    }
    
    // Clear any pre-existing tabs (they should be added by the user through the queue)
    const existingTabs = document.querySelectorAll('.tab');
    existingTabs.forEach(tab => {
        // Set up the close functionality for existing tabs
        const closeButton = tab.querySelector('.close-tab');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const tabId = tab.id;
                if (programConfigs[tabId]) {
                    delete programConfigs[tabId];
                }
                tab.remove();
                
                // If this was the active tab, activate the first available tab
                if (tab.classList.contains('active')) {
                    const firstAvailableTab = document.querySelector('.tab');
                    if (firstAvailableTab) {
                        activateTab(firstAvailableTab);
                    }
                }
                
                // Update program stars since a program was removed from queue
                updateProgramStars();
            });
        }
        
        // Make existing tabs clickable
        tab.addEventListener('click', () => {
            activateTab(tab);
        });
        
        // Remove the tab (uncomment this line if you want to start with empty queue)
        // tab.remove();
    });
    
    // Initialize with first tab active if any exist
    const firstTab = document.querySelector('.tab');
    if (firstTab) {
        activateTab(firstTab);
    }
    
    // Initial update of program stars
    updateProgramStars();
    
    // Add static Edit and Next buttons fixed at bottom right
    function renderBottomControls(config, tabId) {
        // Remove any existing bottom controls
        document.querySelectorAll('.bottom-controls').forEach(el => el.remove());
        
        // Create controls container
        const controls = document.createElement('div');
        controls.className = 'bottom-controls';
        
        // Edit button - opens configuration modal
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
            // Open the edit modal with current configuration
            openEditModal(tabId);
        });
        
        // Next button - cycles through stimuli
        const nextBtn = document.createElement('button');
        nextBtn.className = 'next-btn';
        nextBtn.textContent = 'Next';
        nextBtn.addEventListener('click', () => {
            // Advance to next trial with random positioning
            config.currentIndex++;
            config.randomized = true;
            updateProgramContent();
        });
        
        // Add buttons to controls
        controls.appendChild(editBtn);
        controls.appendChild(nextBtn);
        
        // Append controls to body to ensure fixed positioning works
        document.body.appendChild(controls);
    }
    
    // Call renderBottomControls initially for any existing tab
    const initialActiveTab = document.querySelector('.tab.active');
    if (initialActiveTab) {
        const initialConfig = programConfigs[initialActiveTab.id];
        if (initialConfig) {
            renderBottomControls(initialConfig, initialActiveTab.id);
        }
    }
    
    // Observe tab changes to update bottom controls
    const tabObserver = new MutationObserver(() => {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            const config = programConfigs[activeTab.id];
            if (config) {
                cleanupBottomControls();
                renderBottomControls(config, activeTab.id);
            }
        }
    });
    
    // Start observing mutations on the tab container
    tabObserver.observe(programTabs, { childList: true });
});
