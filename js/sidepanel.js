class FolderPromptManager {
    constructor() {
        this.currentFolderId = 'home';
        this.currentFilter = 'all';
        this.currentSearchTerm = '';
        this.editingPromptId = null;
        this.editingFolderId = null;
        this.variableValues = {};
        this.variableDefaults = {};
        this.selectedIcon = '📁';

        this.initializeElements();
        this.bindEvents();
        this.loadVariableDefaults();
        this.initializeApp();
    }

    initializeElements() {
        this.elements = {
            // Header
            settingsBtn: document.getElementById('settingsBtn'),
            addBtn: document.getElementById('addBtn'),

            // Breadcrumb
            breadcrumbNav: document.getElementById('breadcrumbNav'),
            breadcrumbContainer: document.querySelector('.breadcrumb-container'),

            // Search
            searchInput: document.getElementById('searchInput'),
            filterBtns: document.querySelectorAll('.filter-btn'),

            // Containers
            foldersContainer: document.getElementById('foldersContainer'),
            promptsContainer: document.getElementById('promptsContainer'),
            emptyState: document.getElementById('emptyState'),

            // Dropdown and Import/Export
            settingsDropdown: document.getElementById('settingsDropdown'),
            exportBtn: document.getElementById('exportBtn'),
            importBtn: document.getElementById('importBtn'),
            importModal: document.getElementById('importModal'),
            closeImportModalBtn: document.getElementById('closeImportModalBtn'),
            fileDropZone: document.getElementById('fileDropZone'),
            fileInput: document.getElementById('fileInput'),
            selectFileBtn: document.getElementById('selectFileBtn'),
            importOptions: document.getElementById('importOptions'),
            cancelImportBtn: document.getElementById('cancelImportBtn'),
            confirmImportBtn: document.getElementById('confirmImportBtn'),

            // Add Modal
            addModal: document.getElementById('addModal'),
            closeAddModalBtn: document.getElementById('closeAddModalBtn'),
            addPromptBtn: document.getElementById('addPromptBtn'),
            addFolderBtn: document.getElementById('addFolderBtn'),

            // Prompt Modal
            promptModal: document.getElementById('promptModal'),
            modalTitle: document.getElementById('modalTitle'),
            promptForm: document.getElementById('promptForm'),
            promptTitle: document.getElementById('promptTitle'),
            promptContent: document.getElementById('promptContent'),
            titleCharCount: document.getElementById('titleCharCount'),
            variablesInfo: document.getElementById('variablesInfo'),
            variablesList: document.getElementById('variablesList'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            cancelBtn: document.getElementById('cancelBtn'),

            // Folder Modal
            folderModal: document.getElementById('folderModal'),
            folderModalTitle: document.getElementById('folderModalTitle'),
            folderForm: document.getElementById('folderForm'),
            folderName: document.getElementById('folderName'),
            folderNameCharCount: document.getElementById('folderNameCharCount'),
            iconSelector: document.getElementById('iconSelector'),
            closeFolderModalBtn: document.getElementById('closeFolderModalBtn'),
            cancelFolderBtn: document.getElementById('cancelFolderBtn'),

            // Variable Modal
            variableModal: document.getElementById('variableModal'),
            variableModalTitle: document.getElementById('variableModalTitle'),
            promptContentEditable: document.getElementById('promptContentEditable'),
            closeVariableModalBtn: document.getElementById('closeVariableModalBtn'),
            cancelVariableBtn: document.getElementById('cancelVariableBtn'),
            copyVariableBtn: document.getElementById('copyVariableBtn'),

            // Context Menu
            contextMenu: document.getElementById('contextMenu'),
            editFolderItem: document.getElementById('editFolderItem'),
            deleteFolderItem: document.getElementById('deleteFolderItem'),

            // Toast
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage')
        };
    }

    bindEvents() {
        // Header events
        this.elements.settingsBtn.addEventListener('click', (e) => this.toggleSettingsDropdown(e));
        this.elements.addBtn.addEventListener('click', () => this.showAddModal());

        // Export/Import events
        this.elements.exportBtn.addEventListener('click', () => this.handleExport());
        this.elements.importBtn.addEventListener('click', () => this.showImportModal());
        this.elements.closeImportModalBtn.addEventListener('click', () => this.hideImportModal());
        this.elements.selectFileBtn.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.cancelImportBtn.addEventListener('click', () => this.hideImportModal());
        this.elements.confirmImportBtn.addEventListener('click', () => this.handleImport());

        // File handling events
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.fileDropZone.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.fileDropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.fileDropZone.addEventListener('drop', (e) => this.handleFileDrop(e));

        // Add modal events
        this.elements.closeAddModalBtn.addEventListener('click', () => this.hideAddModal());
        this.elements.addPromptBtn.addEventListener('click', () => this.showPromptModal());
        this.elements.addFolderBtn.addEventListener('click', () => this.showFolderModal());

        // Search events
        this.elements.searchInput.addEventListener('input',
            debounce((e) => this.handleSearch(e.target.value), 300)
        );

        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e.target.dataset.filter));
        });

        // Prompt modal events
        this.elements.promptForm.addEventListener('submit', (e) => this.handlePromptSubmit(e));
        this.elements.closeModalBtn.addEventListener('click', () => this.hidePromptModal());
        this.elements.cancelBtn.addEventListener('click', () => this.hidePromptModal());
        this.elements.promptTitle.addEventListener('input', (e) => this.updateCharCount(e.target));
        this.elements.promptContent.addEventListener('input', (e) => this.updateVariablesList(e.target.value));

        // Folder modal events
        this.elements.folderForm.addEventListener('submit', (e) => this.handleFolderSubmit(e));
        this.elements.closeFolderModalBtn.addEventListener('click', () => this.hideFolderModal());
        this.elements.cancelFolderBtn.addEventListener('click', () => this.hideFolderModal());
        this.elements.folderName.addEventListener('input', (e) => this.updateFolderCharCount(e.target));

        // Icon selector events
        this.elements.iconSelector.addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-option')) {
                this.selectIcon(e.target);
            }
        });

        // Variable modal events
        this.elements.closeVariableModalBtn.addEventListener('click', () => this.hideVariableModal());
        this.elements.cancelVariableBtn.addEventListener('click', () => this.hideVariableModal());
        this.elements.copyVariableBtn.addEventListener('click', () => this.handleVariableCopy());

        // Context menu events
        this.elements.editFolderItem.addEventListener('click', () => this.handleEditFolder());
        this.elements.deleteFolderItem.addEventListener('click', () => this.handleDeleteFolder());

        // Modal backdrop events
        this.elements.addModal.addEventListener('click', (e) => {
            if (e.target === this.elements.addModal) this.hideAddModal();
        });
        this.elements.importModal.addEventListener('click', (e) => {
            if (e.target === this.elements.importModal) this.hideImportModal();
        });
        this.elements.promptModal.addEventListener('click', (e) => {
            if (e.target === this.elements.promptModal) this.hidePromptModal();
        });
        this.elements.folderModal.addEventListener('click', (e) => {
            if (e.target === this.elements.folderModal) this.hideFolderModal();
        });
        this.elements.variableModal.addEventListener('click', (e) => {
            if (e.target === this.elements.variableModal) this.hideVariableModal();
        });

        // Global events
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
    }

    async initializeApp() {
        try {
            await promptStorage.initializeStorage();
            await this.loadCurrentView();
        } catch (error) {
            console.error('App initialization failed:', error);
            showToast('Failed to initialize app.', 'error');
        }
    }

    async loadVariableDefaults() {
        try {
            const result = await chrome.storage.local.get(['variable_defaults']);
            this.variableDefaults = result.variable_defaults || {};
        } catch (error) {
            console.warn('Failed to load variable defaults:', error);
            this.variableDefaults = {};
        }
    }

    async saveVariableDefaults() {
        try {
            await chrome.storage.local.set({ variable_defaults: this.variableDefaults });
        } catch (error) {
            console.warn('Failed to save variable defaults:', error);
        }
    }

    // Navigation methods
    async navigateToFolder(folderId) {
        this.currentFolderId = folderId;
        this.currentSearchTerm = '';
        this.elements.searchInput.value = '';
        await this.loadCurrentView();
    }

    async loadCurrentView() {
        console.log('🔄 loadCurrentView() called');
        console.log('📍 Current folder ID:', this.currentFolderId);

        try {
            console.log('🍞 Updating breadcrumb...');
            await this.updateBreadcrumb();
            console.log('✅ Breadcrumb updated');

            console.log('📁 Loading folders...');
            await this.loadFolders();
            console.log('✅ Folders loaded');

            console.log('📝 Loading prompts...');
            await this.loadPrompts();
            console.log('✅ Prompts loaded');

            console.log('🎯 loadCurrentView() completed successfully');
        } catch (error) {
            console.error('❌ Failed to load current view:', error);
            showToast('Unable to load screen.', 'error');
        }
    }

    async updateBreadcrumb() {
        const folders = await promptStorage.getAllFolders();
        const breadcrumbItems = [];
        let currentFolder = folders.find(f => f.id === this.currentFolderId);

        // Flat structure: always show Home > Current Folder
        breadcrumbItems.push({ id: 'home', name: 'Home', icon: '🏠' });

        if (currentFolder && currentFolder.id !== 'home') {
            breadcrumbItems.push(currentFolder);
        }

        const breadcrumbHtml = breadcrumbItems.map((item, index) => {
            const isActive = item.id === this.currentFolderId;
            const separator = index < breadcrumbItems.length - 1 ? '<span class="breadcrumb-separator">></span>' : '';

            return `
                <button class="breadcrumb-item ${isActive ? 'active' : ''}" data-folder-id="${item.id}">
                    <span class="breadcrumb-icon">${item.icon}</span>
                    <span class="breadcrumb-text">${sanitizeHtml(item.name)}</span>
                </button>
                ${separator}
            `;
        }).join('');

        this.elements.breadcrumbContainer.innerHTML = breadcrumbHtml;

        // Bind breadcrumb navigation events
        this.elements.breadcrumbContainer.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', () => {
                const folderId = item.dataset.folderId;
                if (folderId !== this.currentFolderId) {
                    this.navigateToFolder(folderId);
                }
            });
        });
    }

    async loadFolders() {
        try {
            // Only show folders when in home view in flat structure
            if (this.currentFolderId !== 'home') {
                this.elements.foldersContainer.innerHTML = '';
                this.elements.foldersContainer.style.display = 'none';
                return;
            }

            const allFolders = await promptStorage.getFoldersByParent('home');

            if (allFolders.length === 0) {
                this.elements.foldersContainer.innerHTML = '';
                this.elements.foldersContainer.style.display = 'none';
                return;
            }

            this.elements.foldersContainer.style.display = 'block';

            // Get prompt counts for each folder and sort by order
            const foldersWithCounts = await Promise.all(
                allFolders.map(async folder => {
                    const prompts = await promptStorage.getPromptsByFolder(folder.id);
                    return { ...folder, promptCount: prompts.length };
                })
            );

            // Sort folders by order field (if it exists) or creation date
            foldersWithCounts.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return (a.createdAt || 0) - (b.createdAt || 0);
            });

            const folderGridHtml = `
                <div class="folder-grid">
                    ${foldersWithCounts.map(folder => this.createFolderCard(folder)).join('')}
                </div>
            `;

            this.elements.foldersContainer.innerHTML = folderGridHtml;
            this.bindFolderEvents();
        } catch (error) {
            console.error('Failed to load folders:', error);
            showToast('Unable to load folders.', 'error');
        }
    }

    createFolderCard(folder) {
        const promptText = folder.promptCount === 1 ? 'prompt' : 'prompts';

        return `
            <div class="folder-card" data-folder-id="${folder.id}" draggable="true">
                <div class="folder-actions">
                    <button class="folder-action-btn" data-action="context" data-folder-id="${folder.id}" aria-label="Options">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                </div>
                <span class="folder-icon">${folder.icon}</span>
                <div class="folder-info">
                    <div class="folder-name">${sanitizeHtml(folder.name)}</div>
                    <div class="folder-count">${folder.promptCount} ${promptText}</div>
                </div>
            </div>
        `;
    }

    bindFolderEvents() {
        const folderCards = this.elements.foldersContainer.querySelectorAll('.folder-card');

        folderCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.folder-actions')) {
                    const folderId = card.dataset.folderId;
                    this.navigateToFolder(folderId);
                }
            });

            // Setup drag and drop for folders (prompts moving into folders)
            this.setupFolderDragAndDrop(card);

            // Setup drag and drop for folder reordering
            this.setupFolderReorderDragAndDrop(card);
        });

        // Context menu events
        const contextBtns = this.elements.foldersContainer.querySelectorAll('[data-action="context"]');
        contextBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showContextMenu(e, btn.dataset.folderId);
            });
        });
    }

    async loadPrompts() {
        console.log('📝 loadPrompts() called - folder:', this.currentFolderId, 'filter:', this.currentFilter);

        try {
            let prompts;
            const isHomeFolder = this.currentFolderId === 'home';

            // New filtering logic based on context
            if (this.currentSearchTerm) {
                console.log('🔍 Loading search results for:', this.currentSearchTerm);
                if (isHomeFolder) {
                    // Global search across all folders
                    prompts = await promptStorage.searchPromptsWithFolderInfo(this.currentSearchTerm);
                } else {
                    // Search within current folder only
                    const folderPrompts = await promptStorage.getPromptsByFolder(this.currentFolderId);
                    prompts = folderPrompts.filter(prompt =>
                        prompt.title.toLowerCase().includes(this.currentSearchTerm.toLowerCase()) ||
                        prompt.content.toLowerCase().includes(this.currentSearchTerm.toLowerCase())
                    );
                }
                console.log('🔍 Search prompts found:', prompts.length);
            } else if (this.currentFilter === 'favorites') {
                console.log('⭐ Loading favorite prompts...');
                if (isHomeFolder) {
                    // Global favorites from all folders
                    prompts = await promptStorage.getFavoritePrompts();
                    // Add folder path info for global view
                    const folders = await promptStorage.getAllFolders();
                    prompts = prompts.map(prompt => {
                        const folder = folders.find(f => f.id === prompt.folderId);
                        return {
                            ...prompt,
                            folderPath: promptStorage.getFolderPath(folder, folders)
                        };
                    });
                } else {
                    // Favorites within current folder only
                    const folderPrompts = await promptStorage.getPromptsByFolder(this.currentFolderId);
                    prompts = folderPrompts.filter(p => p.isFavorite);
                }
                console.log('⭐ Favorite prompts found:', prompts.length);
            } else {
                // All prompts
                console.log('📂 Loading all prompts...');
                if (isHomeFolder) {
                    // Global view - all prompts from all folders
                    prompts = await promptStorage.getAllPrompts();
                    // Add folder path info for global view
                    const folders = await promptStorage.getAllFolders();
                    prompts = prompts.map(prompt => {
                        const folder = folders.find(f => f.id === prompt.folderId);
                        return {
                            ...prompt,
                            folderPath: promptStorage.getFolderPath(folder, folders)
                        };
                    });
                } else {
                    // Folder-specific view - prompts within current folder only
                    prompts = await promptStorage.getPromptsByFolder(this.currentFolderId);
                }
                console.log('📂 Prompts found:', prompts.length);
                console.log('📋 Prompt titles:', prompts.map(p => p.title).slice(0, 3).join(', ') + (prompts.length > 3 ? '...' : ''));
            }

            // Apply search filter to favorites if both are active
            if (this.currentFilter === 'favorites' && this.currentSearchTerm) {
                console.log('⭐🔍 Applying search filter to favorites...');
                prompts = prompts.filter(prompt =>
                    prompt.title.toLowerCase().includes(this.currentSearchTerm.toLowerCase()) ||
                    prompt.content.toLowerCase().includes(this.currentSearchTerm.toLowerCase())
                );
                console.log('⭐🔍 Filtered favorites:', prompts.length);
            }

            console.log('🔄 Sorting prompts for display...');
            const sortedPrompts = this.sortPromptsForDisplay(prompts);
            console.log('🎨 Rendering', sortedPrompts.length, 'prompts');
            this.renderPrompts(sortedPrompts);
            console.log('✅ loadPrompts() completed');
        } catch (error) {
            console.error('❌ Failed to load prompts:', error);
            showToast('Unable to load prompts.', 'error');
        }
    }

    renderPrompts(prompts) {
        console.log('🎨 renderPrompts() called with', prompts.length, 'prompts');

        const folders = this.elements.foldersContainer.children.length > 0;
        console.log('📁 Folders container has', this.elements.foldersContainer.children.length, 'children');

        if (prompts.length === 0 && !folders) {
            console.log('📋 No prompts and no folders - showing empty state');
            this.showEmptyState();
            return;
        } else if (prompts.length === 0) {
            console.log('📋 No prompts but folders exist - clearing prompts container');
            this.elements.promptsContainer.innerHTML = '';
            return;
        }

        console.log('✅ Hiding empty state and rendering prompts');
        this.hideEmptyState();

        console.log('🏗️ Creating HTML for', prompts.length, 'prompts');
        const promptsHtml = prompts.map(prompt => this.createPromptCard(prompt)).join('');
        console.log('📝 Generated HTML length:', promptsHtml.length);

        console.log('🎯 Setting innerHTML for prompts container');
        this.elements.promptsContainer.innerHTML = promptsHtml;

        console.log('🔗 Binding prompt events');
        this.bindPromptEvents();

        console.log('✅ renderPrompts() completed');
    }

    createPromptCard(prompt) {
        const highlightedTitle = this.currentSearchTerm ?
            highlightText(prompt.title, this.currentSearchTerm) : prompt.title;
        const highlightedContent = this.currentSearchTerm ?
            highlightText(prompt.content, this.currentSearchTerm) : prompt.content;

        const variablesHtml = prompt.variables.length > 0 ?
            `<div class="prompt-variables">
                ${prompt.variables.map(variable =>
                `<span class="variable-tag">[${sanitizeHtml(variable)}]</span>`
            ).join('')}
            </div>` : '';

        // Show folder path in global home view or during search
        const showFolderPath = prompt.folderPath && (this.currentFolderId === 'home' || this.currentSearchTerm);
        const folderPathHtml = showFolderPath ?
            `<span class="folder-path">${sanitizeHtml(prompt.folderPath)}</span>` : '';

        return `
            <div class="prompt-card ${prompt.isFavorite ? 'favorite' : ''}" data-id="${prompt.id}" draggable="true">
                <div class="prompt-header">
                    <h3 class="prompt-title">
                        ${highlightedTitle}
                        ${folderPathHtml}
                    </h3>
                    <div class="prompt-actions">
                        <button class="action-btn favorite-btn ${prompt.isFavorite ? 'active' : ''}" 
                                data-action="favorite" data-id="${prompt.id}" 
                                aria-label="${prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="${prompt.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                            </svg>
                        </button>
                        <button class="action-btn edit-btn" data-action="edit" data-id="${prompt.id}" aria-label="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-btn delete-btn" data-action="delete" data-id="${prompt.id}" aria-label="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="prompt-content">${highlightedContent}</p>
                ${variablesHtml}
            </div>
        `;
    }

    bindPromptEvents() {
        const promptCards = this.elements.promptsContainer.querySelectorAll('.prompt-card');

        promptCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.prompt-actions')) {
                    this.handlePromptClick(card.dataset.id);
                }
            });

            // Setup drag and drop for prompts
            this.setupPromptDragAndDrop(card);
        });

        const actionBtns = this.elements.promptsContainer.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleActionClick(btn.dataset.action, btn.dataset.id);
            });
        });
    }

    // Custom sorting for current folder view
    sortPromptsForDisplay(prompts) {
        const isHomeFolder = this.currentFolderId === 'home';

        if (this.currentSearchTerm || this.currentFilter === 'favorites' || isHomeFolder) {
            return sortPrompts(prompts, 'recent');
        }

        // For specific folder view, sort by custom order first, then by creation date
        return prompts.sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) {
                return b.isFavorite - a.isFavorite;
            }
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    }

    // Enhanced Drag and Drop Implementation
    setupPromptDragAndDrop(card) {
        card.addEventListener('dragstart', (e) => {
            this.draggedCard = card;
            card.classList.add('dragging');
            this.elements.promptsContainer.classList.add('drag-active');

            // Use specific data type for prompt moving
            e.dataTransfer.setData('application/x-prompt-id', card.dataset.id);
            e.dataTransfer.setData('text/plain', card.dataset.id); // Keep for compatibility
            e.dataTransfer.effectAllowed = 'move';

            // Setup breadcrumb drop zones
            this.setupBreadcrumbDropZones();

            // Create drop indicators
            this.createDropIndicators();
        });

        card.addEventListener('dragend', () => {
            this.draggedCard = null;
            card.classList.remove('dragging');
            this.elements.promptsContainer.classList.remove('drag-active');

            // Clean up visual feedback
            this.cleanupDragFeedback();
        });

        // Setup drag over for reordering
        card.addEventListener('dragover', (e) => {
            if (!this.draggedCard || this.draggedCard === card) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const isTop = e.clientY < midY;

            this.showReorderFeedback(card, isTop);
        });

        card.addEventListener('dragleave', (e) => {
            // Only clear feedback if we're actually leaving the card
            if (!card.contains(e.relatedTarget)) {
                this.clearReorderFeedback(card);
            }
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!this.draggedCard || this.draggedCard === card) return;

            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const isTop = e.clientY < midY;

            this.reorderPromptCard(this.draggedCard, card, isTop);
        });
    }

    setupFolderDragAndDrop(folderCard) {
        folderCard.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            folderCard.classList.add('drag-over');
        });

        folderCard.addEventListener('dragleave', () => {
            folderCard.classList.remove('drag-over');
        });

        folderCard.addEventListener('drop', async (e) => {
            e.preventDefault();
            folderCard.classList.remove('drag-over');

            // Check for prompt-specific data type to ensure we only handle prompt drops
            const promptId = e.dataTransfer.getData('application/x-prompt-id');
            const targetFolderId = folderCard.dataset.folderId;

            // Only process if it's a prompt being dropped (not a folder)
            if (promptId && targetFolderId) {
                await this.movePromptToFolder(promptId, targetFolderId);
            }
        });
    }

    setupFolderReorderDragAndDrop(folderCard) {
        folderCard.addEventListener('dragstart', (e) => {
            // Don't interfere with prompt drags
            if (e.target !== folderCard) return;

            this.draggedFolder = folderCard;
            folderCard.classList.add('dragging');

            // Get the folder grid container
            const folderGrid = this.elements.foldersContainer.querySelector('.folder-grid');
            if (folderGrid) {
                folderGrid.classList.add('drag-active');
            }

            // Use specific data type for folder reordering
            e.dataTransfer.setData('application/x-folder-id', folderCard.dataset.folderId);
            e.dataTransfer.setData('text/plain', folderCard.dataset.folderId); // Keep for compatibility
            e.dataTransfer.effectAllowed = 'move';
        });

        folderCard.addEventListener('dragend', () => {
            if (this.draggedFolder) {
                this.draggedFolder.classList.remove('dragging');
                this.draggedFolder = null;
            }

            // Clean up all drag feedback
            this.cleanupFolderDragFeedback();
        });

        // Handle drag over for reordering
        folderCard.addEventListener('dragover', (e) => {
            if (!this.draggedFolder || this.draggedFolder === folderCard) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const rect = folderCard.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            const midY = rect.top + rect.height / 2;

            // Determine drop position based on grid layout
            const isLeft = e.clientX < midX;
            const isTop = e.clientY < midY;

            this.showFolderReorderFeedback(folderCard, isLeft, isTop);
        });

        folderCard.addEventListener('dragleave', (e) => {
            if (!folderCard.contains(e.relatedTarget)) {
                this.clearFolderReorderFeedback(folderCard);
            }
        });

        folderCard.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!this.draggedFolder || this.draggedFolder === folderCard) return;

            const rect = folderCard.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            const midY = rect.top + rect.height / 2;

            const isLeft = e.clientX < midX;
            const isTop = e.clientY < midY;

            this.reorderFolderCard(this.draggedFolder, folderCard, isLeft, isTop);
        });
    }

    showFolderReorderFeedback(targetCard, isLeft, isTop) {
        this.clearAllFolderReorderFeedback();

        // For grid layout, use horizontal positioning as primary indicator
        if (isLeft) {
            targetCard.classList.add('drag-over-left');
        } else {
            targetCard.classList.add('drag-over-right');
        }

        // Add vertical feedback as secondary indicator
        if (isTop) {
            targetCard.classList.add('drag-over-top');
        } else {
            targetCard.classList.add('drag-over-bottom');
        }
    }

    clearFolderReorderFeedback(card) {
        card.classList.remove('drag-over-left', 'drag-over-right', 'drag-over-top', 'drag-over-bottom');
    }

    clearAllFolderReorderFeedback() {
        const cards = this.elements.foldersContainer.querySelectorAll('.folder-card');
        cards.forEach(card => {
            this.clearFolderReorderFeedback(card);
        });
    }

    cleanupFolderDragFeedback() {
        this.clearAllFolderReorderFeedback();

        const folderGrid = this.elements.foldersContainer.querySelector('.folder-grid');
        if (folderGrid) {
            folderGrid.classList.remove('drag-active');
        }
    }

    async reorderFolderCard(draggedCard, targetCard, insertLeft, insertTop) {
        try {
            const allCards = Array.from(this.elements.foldersContainer.querySelectorAll('.folder-card'));
            const draggedId = draggedCard.dataset.folderId;
            const targetIndex = allCards.indexOf(targetCard);

            // Create new order array
            const folderIds = [];

            allCards.forEach((card, index) => {
                if (card === draggedCard) return; // Skip dragged card initially

                if (card === targetCard) {
                    // Insert based on position
                    if (insertLeft || insertTop) {
                        folderIds.push(draggedId);
                        folderIds.push(card.dataset.folderId);
                    } else {
                        folderIds.push(card.dataset.folderId);
                        folderIds.push(draggedId);
                    }
                } else {
                    folderIds.push(card.dataset.folderId);
                }
            });

            // If draggedCard wasn't inserted yet, add it at the end
            if (!folderIds.includes(draggedId)) {
                folderIds.push(draggedId);
            }

            await this.reorderFolders(folderIds);
            await this.loadCurrentView();

        } catch (error) {
            console.error('Failed to reorder folders:', error);
            showToast('Unable to change folder order.', 'error');
        }
    }

    async reorderFolders(folderIds) {
        try {
            const folders = await promptStorage.getAllFolders();

            // Update order values based on new sequence
            folderIds.forEach((folderId, index) => {
                const folder = folders.find(f => f.id === folderId);
                if (folder && folder.id !== 'home') {
                    folder.order = index;
                    folder.updatedAt = Date.now();
                }
            });

            await chrome.storage.local.set({ 'prompt_manager_folders': folders });
            return true;
        } catch (error) {
            console.error('Failed to reorder folders:', error);
            throw new Error('Unable to change folder order.');
        }
    }

    async movePromptToFolder(promptId, targetFolderId) {
        try {
            await promptStorage.movePromptToFolder(promptId, targetFolderId);
            showToast('Prompt moved successfully.');
            await this.loadCurrentView();
        } catch (error) {
            console.error('Failed to move prompt:', error);
            showToast('Unable to move prompt.', 'error');
        }
    }

    // Drag & Drop Helper Methods
    createDropIndicators() {
        const cards = this.elements.promptsContainer.querySelectorAll('.prompt-card:not(.dragging)');
        cards.forEach((card, index) => {
            if (index === 0) {
                const topIndicator = document.createElement('div');
                topIndicator.className = 'drop-indicator drop-top';
                card.parentNode.insertBefore(topIndicator, card);
            }

            const bottomIndicator = document.createElement('div');
            bottomIndicator.className = 'drop-indicator drop-bottom';
            card.parentNode.insertBefore(bottomIndicator, card.nextSibling);
        });
    }

    showReorderFeedback(targetCard, isTop) {
        this.clearAllReorderFeedback();

        if (isTop) {
            targetCard.classList.add('drag-over-top');
            const indicator = targetCard.previousElementSibling;
            if (indicator && indicator.classList.contains('drop-indicator')) {
                indicator.classList.add('show');
            }
        } else {
            targetCard.classList.add('drag-over-bottom');
            const indicator = targetCard.nextElementSibling;
            if (indicator && indicator.classList.contains('drop-indicator')) {
                indicator.classList.add('show');
            }
        }
    }

    clearReorderFeedback(card) {
        card.classList.remove('drag-over-top', 'drag-over-bottom');
        const prevIndicator = card.previousElementSibling;
        const nextIndicator = card.nextElementSibling;

        if (prevIndicator && prevIndicator.classList.contains('drop-indicator')) {
            prevIndicator.classList.remove('show');
        }
        if (nextIndicator && nextIndicator.classList.contains('drop-indicator')) {
            nextIndicator.classList.remove('show');
        }
    }

    clearAllReorderFeedback() {
        const cards = this.elements.promptsContainer.querySelectorAll('.prompt-card');
        cards.forEach(card => {
            card.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        const indicators = this.elements.promptsContainer.querySelectorAll('.drop-indicator');
        indicators.forEach(indicator => {
            indicator.classList.remove('show');
        });
    }

    cleanupDragFeedback() {
        this.clearAllReorderFeedback();
        this.cleanupBreadcrumbDropZones();

        // Remove drop indicators
        const indicators = this.elements.promptsContainer.querySelectorAll('.drop-indicator');
        indicators.forEach(indicator => indicator.remove());
    }

    async reorderPromptCard(draggedCard, targetCard, insertBefore) {
        try {
            const cards = Array.from(this.elements.promptsContainer.querySelectorAll('.prompt-card:not(.dragging)'));
            const draggedId = draggedCard.dataset.id;
            const targetIndex = cards.indexOf(targetCard);

            // Get current order of all prompts in the folder
            const allCards = Array.from(this.elements.promptsContainer.querySelectorAll('.prompt-card'));
            const promptIds = [];

            allCards.forEach(card => {
                if (card === draggedCard) return; // Skip the dragged card initially

                if (card === targetCard) {
                    if (insertBefore) {
                        promptIds.push(draggedId);
                        promptIds.push(card.dataset.id);
                    } else {
                        promptIds.push(card.dataset.id);
                        promptIds.push(draggedId);
                    }
                } else {
                    promptIds.push(card.dataset.id);
                }
            });

            // If draggedCard wasn't inserted yet, add it at the end
            if (!promptIds.includes(draggedId)) {
                promptIds.push(draggedId);
            }

            await promptStorage.reorderPrompts(this.currentFolderId, promptIds);
            await this.loadCurrentView();

        } catch (error) {
            console.error('Failed to reorder prompts:', error);
            showToast('Unable to change prompt order.', 'error');
        }
    }

    // Breadcrumb Drop Zone Setup
    setupBreadcrumbDropZones() {
        const breadcrumbItems = this.elements.breadcrumbContainer.querySelectorAll('.breadcrumb-item');

        breadcrumbItems.forEach(item => {
            const folderId = item.dataset.folderId;

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                // Visual feedback
                if (folderId === this.currentFolderId) {
                    item.classList.add('drop-invalid');
                } else {
                    item.classList.add('drop-valid');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drop-valid', 'drop-invalid');
            });

            item.addEventListener('drop', async (e) => {
                e.preventDefault();

                if (folderId === this.currentFolderId) {
                    showToast('Cannot move to the same folder.', 'error');
                    return;
                }

                const promptId = e.dataTransfer.getData('text/plain');
                if (promptId) {
                    await this.movePromptToFolder(promptId, folderId);
                }
            });
        });
    }

    cleanupBreadcrumbDropZones() {
        const breadcrumbItems = this.elements.breadcrumbContainer.querySelectorAll('.breadcrumb-item');
        breadcrumbItems.forEach(item => {
            item.classList.remove('drop-target', 'drop-valid', 'drop-invalid');
        });
    }

    // Modal Management
    showAddModal() {
        this.elements.addModal.classList.add('show');
    }

    hideAddModal() {
        this.elements.addModal.classList.remove('show');
    }

    showPromptModal() {
        this.hideAddModal();
        this.elements.promptModal.classList.add('show');
        this.elements.promptTitle.focus();
    }

    hidePromptModal() {
        this.elements.promptModal.classList.remove('show');
        this.resetPromptForm();
    }

    showFolderModal() {
        this.hideAddModal();
        this.elements.folderModal.classList.add('show');
        this.elements.folderName.focus();
    }

    hideFolderModal() {
        this.elements.folderModal.classList.remove('show');
        this.resetFolderForm();
    }

    resetPromptForm() {
        this.editingPromptId = null;
        this.elements.modalTitle.textContent = 'Add New Prompt';
        this.elements.promptForm.reset();
        this.elements.titleCharCount.textContent = '0';
        this.elements.variablesList.textContent = '없음';
    }

    resetFolderForm() {
        this.editingFolderId = null;
        this.elements.folderModalTitle.textContent = 'Create New Folder';
        this.elements.folderForm.reset();
        this.elements.folderNameCharCount.textContent = '0';
        this.selectIcon(this.elements.iconSelector.querySelector('.icon-option'));
    }

    selectIcon(iconElement) {
        this.elements.iconSelector.querySelectorAll('.icon-option').forEach(option => {
            option.classList.remove('selected');
        });
        iconElement.classList.add('selected');
        this.selectedIcon = iconElement.dataset.icon;
    }

    // Form Handlers
    async handlePromptSubmit(e) {
        e.preventDefault();

        const title = this.elements.promptTitle.value.trim();
        const content = this.elements.promptContent.value.trim();

        if (!title || !content) {
            showToast('Please enter both title and content.', 'error');
            return;
        }

        try {
            const promptData = {
                title,
                content,
                folderId: this.currentFolderId
            };

            if (this.editingPromptId) {
                await promptStorage.updatePrompt(this.editingPromptId, promptData);
                showToast('Prompt updated successfully.');
            } else {
                await promptStorage.savePrompt(promptData);
                showToast('Prompt saved successfully.');
            }

            this.hidePromptModal();
            await this.loadCurrentView();
        } catch (error) {
            console.error('Failed to save prompt:', error);
            showToast(error.message || 'Unable to save prompt.', 'error');
        }
    }

    async handleFolderSubmit(e) {
        e.preventDefault();

        const name = this.elements.folderName.value.trim();

        if (!name) {
            showToast('Please enter a folder name.', 'error');
            return;
        }

        try {
            const folderData = {
                name,
                icon: this.selectedIcon
            };

            if (this.editingFolderId) {
                await promptStorage.updateFolder(this.editingFolderId, folderData);
                showToast('Folder updated successfully.');
            } else {
                await promptStorage.saveFolder(folderData);
                showToast('Folder created successfully.');
            }

            this.hideFolderModal();
            await this.loadCurrentView();
        } catch (error) {
            console.error('Failed to save folder:', error);
            showToast(error.message || 'Unable to save folder.', 'error');
        }
    }

    // Action Handlers
    async handlePromptClick(promptId) {
        try {
            const prompt = await promptStorage.getPrompt(promptId);
            if (!prompt) {
                showToast('Prompt not found.', 'error');
                return;
            }

            if (prompt.variables.length > 0) {
                this.showVariableModal(prompt);
            } else {
                await this.copyPromptToClipboard(prompt.content, promptId);
            }
        } catch (error) {
            console.error('Failed to process prompt:', error);
            showToast('Unable to process prompt.', 'error');
        }
    }

    async handleActionClick(action, promptId) {
        switch (action) {
            case 'favorite':
                await this.toggleFavorite(promptId);
                break;
            case 'edit':
                await this.editPrompt(promptId);
                break;
            case 'delete':
                await this.deletePrompt(promptId);
                break;
        }
    }

    async toggleFavorite(promptId) {
        try {
            await promptStorage.toggleFavorite(promptId);
            await this.loadCurrentView();
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            showToast('Unable to change favorite status.', 'error');
        }
    }

    async editPrompt(promptId) {
        try {
            const prompt = await promptStorage.getPrompt(promptId);
            if (!prompt) {
                showToast('Prompt not found.', 'error');
                return;
            }

            this.editingPromptId = promptId;
            this.elements.modalTitle.textContent = 'Edit Prompt';
            this.elements.promptTitle.value = prompt.title;
            this.elements.promptContent.value = prompt.content;

            this.updateCharCount(this.elements.promptTitle);
            this.updateVariablesList(prompt.content);

            this.showPromptModal();
        } catch (error) {
            console.error('Failed to edit prompt:', error);
            showToast('Unable to edit prompt.', 'error');
        }
    }

    async deletePrompt(promptId) {
        if (!confirm('Are you sure you want to delete this prompt?')) {
            return;
        }

        try {
            await promptStorage.deletePrompt(promptId);
            showToast('Prompt deleted successfully.');
            await this.loadCurrentView();
        } catch (error) {
            console.error('Failed to delete prompt:', error);
            showToast('Unable to delete prompt.', 'error');
        }
    }

    // Context Menu
    showContextMenu(event, folderId) {
        this.contextFolderId = folderId;

        const contextMenu = this.elements.contextMenu;
        contextMenu.classList.add('show');

        const rect = event.target.getBoundingClientRect();
        contextMenu.style.left = rect.left + 'px';
        contextMenu.style.top = (rect.bottom + 5) + 'px';
    }

    hideContextMenu() {
        this.elements.contextMenu.classList.remove('show');
        this.contextFolderId = null;
    }

    async handleEditFolder() {
        try {
            const folder = await promptStorage.getFolder(this.contextFolderId);
            if (!folder) {
                showToast('Folder not found.', 'error');
                return;
            }

            this.editingFolderId = this.contextFolderId;
            this.elements.folderModalTitle.textContent = 'Edit Folder';
            this.elements.folderName.value = folder.name;

            // Select the current icon
            const iconOption = this.elements.iconSelector.querySelector(`[data-icon="${folder.icon}"]`);
            if (iconOption) {
                this.selectIcon(iconOption);
            }

            this.updateFolderCharCount(this.elements.folderName);
            this.hideContextMenu();
            this.showFolderModal();
        } catch (error) {
            console.error('Failed to edit folder:', error);
            showToast('Unable to edit folder.', 'error');
        }
    }

    async handleDeleteFolder() {
        if (!confirm('Are you sure you want to delete this folder? All prompts and subfolders will be moved to the parent folder.')) {
            return;
        }

        try {
            await promptStorage.deleteFolder(this.contextFolderId);
            showToast('Folder deleted successfully.');
            this.hideContextMenu();
            await this.loadCurrentView();
        } catch (error) {
            console.error('Failed to delete folder:', error);
            showToast(error.message || 'Unable to delete folder.', 'error');
        }
    }

    // Search and Filter
    handleSearch(searchTerm) {
        this.currentSearchTerm = searchTerm.toLowerCase().trim();
        this.loadPrompts();
    }

    handleFilterChange(filter) {
        this.elements.filterBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.currentFilter = filter;
        this.loadPrompts();
    }

    // Utility methods
    updateCharCount(input) {
        const count = input.value.length;
        this.elements.titleCharCount.textContent = count;

        if (count > 100) {
            this.elements.titleCharCount.style.color = '#ef4444';
        } else {
            this.elements.titleCharCount.style.color = '#6b7280';
        }
    }

    updateFolderCharCount(input) {
        const count = input.value.length;
        this.elements.folderNameCharCount.textContent = count;

        if (count > 50) {
            this.elements.folderNameCharCount.style.color = '#ef4444';
        } else {
            this.elements.folderNameCharCount.style.color = '#6b7280';
        }
    }

    updateVariablesList(content) {
        const variables = extractVariables(content);
        this.elements.variablesList.textContent = variables.length > 0 ? variables.join(', ') : 'None';
    }

    showEmptyState() {
        this.elements.emptyState.style.display = 'block';
        this.elements.promptsContainer.innerHTML = '';
    }

    hideEmptyState() {
        this.elements.emptyState.style.display = 'none';
    }

    handleGlobalClick(e) {
        if (!e.target.closest('.context-menu') && !e.target.closest('[data-action="context"]')) {
            this.hideContextMenu();
        }
        if (!e.target.closest('.dropdown-menu') && !e.target.closest('#settingsBtn')) {
            this.hideSettingsDropdown();
        }
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            if (this.elements.addModal.classList.contains('show')) {
                this.hideAddModal();
            } else if (this.elements.importModal.classList.contains('show')) {
                this.hideImportModal();
            } else if (this.elements.promptModal.classList.contains('show')) {
                this.hidePromptModal();
            } else if (this.elements.folderModal.classList.contains('show')) {
                this.hideFolderModal();
            } else if (this.elements.variableModal.classList.contains('show')) {
                this.hideVariableModal();
            } else if (this.elements.contextMenu.classList.contains('show')) {
                this.hideContextMenu();
            } else if (this.elements.settingsDropdown.classList.contains('show')) {
                this.hideSettingsDropdown();
            }
        }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'n') {
                e.preventDefault();
                this.showAddModal();
            } else if (e.key === 'f') {
                e.preventDefault();
                this.elements.searchInput.focus();
            }
        }
    }

    // Variable Modal (keeping existing functionality)
    showVariableModal(prompt) {
        this.currentPrompt = prompt;
        this.elements.variableModalTitle.textContent = `Enter Variables - ${prompt.title}`;

        this.renderPromptContent();

        this.elements.variableModal.classList.add('show');

        const firstInput = this.elements.promptContentEditable.querySelector('.variable-input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    hideVariableModal() {
        this.elements.variableModal.classList.remove('show');
        this.currentPrompt = null;
        this.variableValues = {};
    }

    renderPromptContent() {
        if (!this.currentPrompt) return;

        const content = this.currentPrompt.content;
        const variables = this.currentPrompt.variables;

        let html = sanitizeHtml(content);

        variables.forEach(variable => {
            const defaultValue = this.variableDefaults[variable] || '';
            const displayValue = defaultValue;
            const placeholder = variable;

            const variableHtml = `<span class="variable-inline"><input type="text" class="variable-input" data-variable="${variable}" data-original="${variable}" value="${sanitizeHtml(displayValue)}" placeholder="${sanitizeHtml(placeholder)}" autocomplete="off"></span>`;

            const regex = new RegExp(`\\[${escapeRegExp(variable)}\\]`, 'g');
            html = html.replace(regex, variableHtml);
        });

        this.elements.promptContentEditable.innerHTML = html;

        this.elements.promptContentEditable.querySelectorAll('.variable-input').forEach(input => {
            input.addEventListener('input', () => this.autoResizeInput(input));
            input.addEventListener('focus', () => this.onVariableFocus(input));
            input.addEventListener('blur', () => this.onVariableBlur(input));
            this.autoResizeInput(input);
        });
    }

    onVariableFocus(input) {
        input.style.backgroundColor = 'white';
        input.style.borderRadius = '4px';
    }

    onVariableBlur(input) {
        if (!input.value.trim()) {
            input.style.backgroundColor = 'transparent';
            input.style.borderRadius = '0';
        }
    }

    autoResizeInput(input) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        const text = input.value || input.placeholder;
        const width = context.measureText(text).width;

        input.style.width = Math.max(20, width + 16) + 'px';
    }

    getVariableValues() {
        const values = {};
        if (!this.currentPrompt) return values;

        this.elements.promptContentEditable.querySelectorAll('.variable-input').forEach(input => {
            const variable = input.dataset.variable;
            const inputValue = input.value.trim();
            const defaultValue = this.variableDefaults[variable] || '';
            const placeholderValue = input.placeholder || '';
            
            // 우선순위: 입력값 > 기본값 > 플레이스홀더 > 변수명
            values[variable] = inputValue || defaultValue || placeholderValue || variable;
        });

        return values;
    }

    async handleVariableCopy() {
        if (!this.currentPrompt) return;

        const variableValues = this.getVariableValues();

        Object.entries(variableValues).forEach(([variable, value]) => {
            if (value.trim()) {
                this.variableDefaults[variable] = value.trim();
            }
        });

        this.saveVariableDefaults();

        const finalContent = replaceVariables(this.currentPrompt.content, variableValues);
        const promptId = this.currentPrompt.id;

        this.hideVariableModal();

        try {
            const success = await copyToClipboard(finalContent);
            if (success) {
                showToast('Copied to clipboard.');

                promptStorage.incrementUsageCount(promptId).catch(error => {
                    console.warn('Failed to update usage count:', error);
                });

                this.loadCurrentView().catch(error => {
                    console.warn('Failed to refresh prompt list:', error);
                });
            } else {
                showToast('Failed to copy to clipboard.', 'error');
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            showToast('Failed to copy to clipboard.', 'error');
        }
    }

    async copyPromptToClipboard(content, promptId) {
        try {
            const success = await copyToClipboard(content);
            if (success) {
                await promptStorage.incrementUsageCount(promptId);
                showToast('Copied to clipboard.');
                await this.loadCurrentView();
            } else {
                showToast('Failed to copy to clipboard.', 'error');
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            showToast('Failed to copy to clipboard.', 'error');
        }
    }

    // Force complete UI refresh method
    async forceCompleteRefresh() {
        console.log('🔥 forceCompleteRefresh() - Performing complete UI reset and refresh');

        try {
            // Clear current UI state
            console.log('🧹 Clearing current UI elements...');
            this.elements.foldersContainer.innerHTML = '';
            this.elements.promptsContainer.innerHTML = '';
            this.elements.breadcrumbContainer.innerHTML = '';

            // Reset containers to initial state
            this.elements.foldersContainer.style.display = 'none';
            this.elements.emptyState.style.display = 'none';

            console.log('📊 Fetching fresh data from storage...');
            // Verify we can read from storage
            const allPrompts = await promptStorage.getAllPrompts();
            const allFolders = await promptStorage.getAllFolders();
            console.log('📊 Fresh storage data:', {
                prompts: allPrompts.length,
                folders: allFolders.length,
                promptsInHome: allPrompts.filter(p => p.folderId === 'home').length
            });

            // Force reload of current view with fresh data
            console.log('🔄 Loading fresh view...');
            await this.loadCurrentView();

            console.log('✅ forceCompleteRefresh() completed');
        } catch (error) {
            console.error('❌ forceCompleteRefresh() failed:', error);
            throw error;
        }
    }

    // Settings Dropdown Methods
    toggleSettingsDropdown(e) {
        e.stopPropagation();
        if (!this.elements.settingsDropdown) {
            console.error('Settings dropdown element not found');
            return;
        }
        const isVisible = this.elements.settingsDropdown.classList.contains('show');
        if (isVisible) {
            this.hideSettingsDropdown();
        } else {
            this.showSettingsDropdown();
        }
    }

    showSettingsDropdown() {
        this.elements.settingsDropdown.classList.add('show');
    }

    hideSettingsDropdown() {
        this.elements.settingsDropdown.classList.remove('show');
    }

    // Import Modal Methods
    showImportModal() {
        this.hideAddModal();
        this.hideSettingsDropdown();
        this.elements.importModal.classList.add('show');
        this.resetImportForm();
    }

    hideImportModal() {
        this.elements.importModal.classList.remove('show');
        this.resetImportForm();
    }

    resetImportForm() {
        console.log('🔄 Resetting import form...');
        this.elements.fileInput.value = '';
        this.elements.importOptions.style.display = 'none';
        this.elements.fileDropZone.classList.remove('dragover');
        const mergeOption = document.querySelector('input[name="importMode"][value="merge"]');
        if (mergeOption) mergeOption.checked = true;
        this.importData = null;
        console.log('✅ Import form reset completed');
    }

    // File Handling Methods
    handleFileSelect(e) {
        console.log('📂 File input change event triggered');
        const file = e.target.files[0];

        // Immediately clear the input value to allow re-selection of same file
        e.target.value = '';
        console.log('🔄 File input cleared immediately');

        if (file) {
            console.log('📄 File selected:', file.name, 'Size:', file.size);
            this.processFile(file);
        } else {
            console.log('❌ No file selected');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.fileDropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.elements.fileDropZone.contains(e.relatedTarget)) {
            this.elements.fileDropZone.classList.remove('dragover');
        }
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.elements.fileDropZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    async processFile(file) {
        console.log('🔍 Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

        if (!file.type.includes('json') && !file.name.endsWith('.json')) {
            console.error('❌ Invalid file type:', file.type);
            showToast('Only JSON files can be uploaded.', 'error');
            return;
        }

        try {
            console.log('📖 Reading file as text...');
            const text = await this.readFileAsText(file);
            console.log('📄 File content length:', text.length);
            console.log('📄 File content preview:', text.substring(0, 200) + '...');

            console.log('🔄 Parsing JSON...');
            const data = JSON.parse(text);
            console.log('✅ JSON parsed successfully:', data);
            console.log('📊 Data structure:', {
                hasPrompts: !!data.prompts,
                hasFolders: !!data.folders,
                isArray: Array.isArray(data),
                promptCount: data.prompts ? data.prompts.length : 'N/A',
                folderCount: data.folders ? data.folders.length : 'N/A'
            });

            console.log('🔍 Validating import data...');
            const isValid = this.validateImportData(data);
            console.log('✅ Validation result:', isValid);

            if (isValid) {
                this.importData = data;
                console.log('💾 Import data stored:', this.importData);
                this.elements.importOptions.style.display = 'block';
                showToast('File loaded successfully.');
            } else {
                console.error('❌ Data validation failed');
                showToast('Invalid data format.', 'error');
            }
        } catch (error) {
            console.error('❌ Failed to process file:', error);
            showToast('Unable to read file.', 'error');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsText(file);
        });
    }

    validateImportData(data) {
        console.log('🔍 Validating import data structure...');

        if (!data) {
            console.error('❌ Data is null or undefined');
            return false;
        }

        if (typeof data !== 'object') {
            console.error('❌ Data is not an object, type:', typeof data);
            return false;
        }

        // Check for legacy format (array of prompts)
        if (Array.isArray(data)) {
            console.log('✅ Legacy format detected: array of prompts');
            if (data.length === 0) {
                console.warn('⚠️ Array is empty but valid');
                return true;
            }
            // Check if first item looks like a prompt
            const firstItem = data[0];
            if (firstItem && (firstItem.title || firstItem.content)) {
                console.log('✅ First array item looks like a prompt');
                return true;
            }
            console.error('❌ Array items don\'t look like prompts');
            return false;
        }

        // Check for new structured format
        const hasPrompts = data.prompts && Array.isArray(data.prompts);
        const hasFolders = data.folders && Array.isArray(data.folders);

        console.log('📊 Structure check:', {
            hasPrompts,
            hasFolders,
            promptCount: hasPrompts ? data.prompts.length : 0,
            folderCount: hasFolders ? data.folders.length : 0
        });

        if (hasPrompts || hasFolders) {
            console.log('✅ Valid structured format detected');
            return true;
        }

        console.error('❌ Data doesn\'t match any expected format');
        console.log('Data keys:', Object.keys(data));
        return false;
    }

    async handleImport() {
        console.log('🚀 Starting import process...');
        console.log('⏰ Timestamp:', new Date().toISOString());

        if (!this.importData) {
            console.error('❌ No import data available');
            showToast('No data to import.', 'error');
            return;
        }

        const importMode = document.querySelector('input[name="importMode"]:checked').value;
        console.log('📋 Import mode:', importMode);
        console.log('📦 Import data structure:', {
            type: Array.isArray(this.importData) ? 'array' : 'object',
            keys: Array.isArray(this.importData) ? ['length: ' + this.importData.length] : Object.keys(this.importData),
            promptCount: this.importData.prompts ? this.importData.prompts.length : 'N/A',
            folderCount: this.importData.folders ? this.importData.folders.length : 'N/A'
        });

        try {
            // Check current storage state before import
            const currentPrompts = await promptStorage.getAllPrompts();
            const currentFolders = await promptStorage.getAllFolders();
            console.log('📊 Pre-import storage state:', {
                existingPrompts: currentPrompts.length,
                existingFolders: currentFolders.length
            });

            if (importMode === 'replace') {
                const confirmed = window.confirm('⚠️ WARNING: Replace mode will permanently delete ALL existing prompts and folders. This action cannot be undone. Are you sure you want to continue?');
                if (!confirmed) {
                    console.log('🚫 User cancelled replace operation');
                    return;
                }
                console.log('🗑️ Clearing all existing data...');
                await promptStorage.clearAllData();
                console.log('✅ Existing data cleared');
            }

            console.log('💾 Importing data to storage...');
            const importResult = await this.importDataToStorage(this.importData, importMode);
            console.log('✅ Data imported to storage successfully');

            // Check storage state after import
            const newPrompts = await promptStorage.getAllPrompts();
            const newFolders = await promptStorage.getAllFolders();
            console.log('📊 Post-import storage state:', {
                totalPrompts: newPrompts.length,
                totalFolders: newFolders.length,
                promptTitles: newPrompts.map(p => p.title).slice(0, 3).join(', ') + (newPrompts.length > 3 ? '...' : ''),
                folderNames: newFolders.filter(f => f.id !== 'home').map(f => f.name).slice(0, 3).join(', ')
            });

            console.log('🧹 Clearing any cached state...');
            // Clear any cached state that might prevent refresh
            this.currentSearchTerm = '';
            this.currentFilter = 'all';

            // Reset filter UI
            this.elements.searchInput.value = '';
            this.elements.filterBtns.forEach(btn => btn.classList.remove('active'));
            document.querySelector('[data-filter="all"]').classList.add('active');

            // Small delay to ensure all storage operations are complete
            await new Promise(resolve => setTimeout(resolve, 300));

            console.log('🏠 Forcing navigation to home folder...');
            // Force navigation to home to ensure we see imported data
            this.currentFolderId = 'home';

            console.log('🔄 Performing complete UI refresh...');
            await this.forceCompleteRefresh();
            console.log('✅ Complete UI refresh finished');

            // Show appropriate success message
            let message = 'Data imported successfully.';
            if (importResult) {
                const skippedPrompts = importResult.totalSkippedDuplicates ? importResult.totalSkippedDuplicates.length : 0;
                const skippedFolders = importResult.totalSkippedFolders ? importResult.totalSkippedFolders.length : 0;
                const totalSkipped = skippedPrompts + skippedFolders;

                if (totalSkipped > 0) {
                    const details = [];
                    if (skippedPrompts > 0) details.push(`${skippedPrompts} prompt(s)`);
                    if (skippedFolders > 0) details.push(`${skippedFolders} folder(s)`);
                    message = `Data imported successfully. ${details.join(' and ')} skipped as duplicate(s).`;
                }
            }
            showToast(message);
            this.hideImportModal();

            console.log('🎉 Import process completed successfully');
            console.log('⏰ Completion timestamp:', new Date().toISOString());
        } catch (error) {
            console.error('❌ Failed to import data:', error);
            console.error('Error details:', error.stack);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            showToast('Failed to import data.', 'error');
        }
    }

    async importDataToStorage(data, importMode = 'merge') {
        console.log('📂 Starting enhanced import process...');
        console.log('⏰ Import timestamp:', new Date().toISOString());

        try {
            // Validate storage is ready
            console.log('🔄 Waiting for storage sync...');
            await promptStorage.waitForStorageSync();
            console.log('✅ Storage sync confirmed');

            // Pre-import data integrity check
            console.log('🔍 Pre-import integrity check...');
            const preImportValidation = await promptStorage.validateDataIntegrity();
            console.log('📊 Pre-import state:', preImportValidation.summary);

            if (!preImportValidation.isValid) {
                console.warn('⚠️ Pre-import validation issues found:', preImportValidation);
            }

            // Create folder ID mapping for import process
            const folderIdMapping = new Map();
            let importedFolders = [];
            let importedPrompts = [];
            let totalSkippedDuplicates = [];
            let totalSkippedFolders = [];

            // Handle different data formats
            if (Array.isArray(data)) {
                console.log('📜 Legacy format detected: array of prompts');
                console.log('📊 Processing', data.length, 'legacy prompts');

                const legacyResult = await this.processLegacyPrompts(data, importMode);
                importedPrompts = legacyResult.importedPrompts;
                totalSkippedDuplicates = [...totalSkippedDuplicates, ...legacyResult.skippedDuplicates];

            } else if (data.prompts || data.folders) {
                console.log('🏗️ New structured format detected');

                // Import folders first with ID mapping
                if (data.folders) {
                    console.log('📁 Processing', data.folders.length, 'folders');
                    const folderResult = await this.processFoldersWithMapping(data.folders, folderIdMapping, importMode);
                    importedFolders = folderResult.folders;
                    totalSkippedFolders = [...totalSkippedFolders, ...folderResult.skippedDuplicates];
                }

                // Import prompts with updated folder IDs
                if (data.prompts) {
                    console.log('📝 Processing', data.prompts.length, 'prompts');
                    const promptResult = await this.processPromptsWithMapping(data.prompts, folderIdMapping, importMode);
                    importedPrompts = promptResult.importedPrompts;
                    totalSkippedDuplicates = [...totalSkippedDuplicates, ...promptResult.skippedDuplicates];
                }
            } else {
                console.error('❌ Unknown data format:', data);
                throw new Error('Unknown data format');
            }

            // Post-import validation and verification
            console.log('🔍 Post-import integrity check...');
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for storage to sync

            const postImportValidation = await promptStorage.validateDataIntegrity();
            console.log('📊 Post-import state:', postImportValidation.summary);

            if (!postImportValidation.isValid) {
                console.error('❌ Post-import validation failed:', postImportValidation);
                throw new Error('Import validation failed: ' + postImportValidation.folders.issues.concat(postImportValidation.prompts.issues).join(', '));
            }

            // Verify the actual data is accessible
            console.log('🔍 Verifying imported data accessibility...');
            const allPrompts = await promptStorage.getAllPrompts();
            const allFolders = await promptStorage.getAllFolders();

            console.log('✅ Import verification complete:', {
                totalPrompts: allPrompts.length,
                totalFolders: allFolders.length,
                importedPrompts: importedPrompts.length,
                importedFolders: importedFolders.length,
                promptsInHome: allPrompts.filter(p => p.folderId === 'home').length
            });

            console.log('🎯 Enhanced import process completed successfully');

            return {
                totalSkippedDuplicates,
                totalSkippedFolders
            };

        } catch (error) {
            console.error('❌ Enhanced import process failed:', error);
            throw error;
        }
    }

    async processLegacyPrompts(legacyData, importMode = 'merge') {
        const validPrompts = [];

        for (const prompt of legacyData) {
            if (prompt.title && prompt.content) {
                console.log('📋 Processing legacy prompt:', prompt.title);

                const promptData = {
                    title: prompt.title,
                    content: prompt.content,
                    folderId: prompt.folderId || 'home',
                    isFavorite: prompt.isFavorite || false,
                    usageCount: prompt.usageCount || 0,
                    createdAt: prompt.createdAt || Date.now()
                };

                // Add optional fields if they exist
                if (prompt.order !== undefined) promptData.order = prompt.order;
                if (prompt.updatedAt !== undefined) promptData.updatedAt = prompt.updatedAt;
                if (prompt.variables !== undefined) promptData.variables = prompt.variables;

                validPrompts.push(promptData);
            } else {
                console.warn('⚠️ Skipping invalid legacy prompt:', prompt);
            }
        }

        let skippedDuplicates = [];
        if (validPrompts.length > 0) {
            console.log('💾 Batch saving', validPrompts.length, 'legacy prompts with validation...');
            const result = await promptStorage.batchSavePromptsWithValidation(validPrompts, { mergeMode: importMode === 'merge' });
            if (result.skippedDuplicates && result.skippedDuplicates.length > 0) {
                console.log('⚠️ Skipped', result.skippedDuplicates.length, 'duplicate prompts:', result.skippedDuplicates);
                skippedDuplicates = result.skippedDuplicates;
            }
        }

        return { importedPrompts: validPrompts, skippedDuplicates };
    }

    async processFoldersWithMapping(foldersData, folderIdMapping, importMode = 'merge') {
        console.log('🗺️ Creating folder ID mapping...');
        const validFolders = [];

        // First pass: create new IDs for all folders and build mapping
        for (const folder of foldersData) {
            if (folder.name && folder.id !== 'home') {
                const newId = generateUUID();
                folderIdMapping.set(folder.id, newId);
                console.log('🔗 Folder ID mapping:', folder.id, '->', newId);

                const folderData = {
                    name: folder.name,
                    icon: folder.icon || '📁',
                    createdAt: folder.createdAt || Date.now()
                };

                if (folder.color !== undefined) folderData.color = folder.color;

                validFolders.push({ ...folderData, originalId: folder.id, newId: newId });
            }
        }

        // Flat structure: convert any hierarchical imports to flat and remove parent relationships
        const finalFolders = validFolders.map(folder => {
            // Assign the new ID and remove parentId for flat structure (handles legacy hierarchical imports)
            const { originalId, parentId, ...cleanFolder } = folder;
            cleanFolder.id = folder.newId; // Assign the mapped ID
            return cleanFolder;
        });

        let skippedDuplicates = [];
        if (finalFolders.length > 0) {
            console.log('💾 Batch saving', finalFolders.length, 'folders with validation...');
            const result = await promptStorage.batchSaveFoldersWithValidation(finalFolders, { mergeMode: importMode === 'merge' });
            if (result.skippedDuplicates && result.skippedDuplicates.length > 0) {
                console.log('⚠️ Skipped', result.skippedDuplicates.length, 'duplicate folders:', result.skippedDuplicates);
                skippedDuplicates = result.skippedDuplicates;
            }
        }

        return { folders: finalFolders, mapping: folderIdMapping, skippedDuplicates };
    }

    async processPromptsWithMapping(promptsData, folderIdMapping, importMode = 'merge') {
        console.log('🗺️ Processing prompts with folder ID mapping...');
        const validPrompts = [];

        for (const prompt of promptsData) {
            if (prompt.title && prompt.content) {
                console.log('📋 Processing prompt:', prompt.title);

                let folderId = prompt.folderId || 'home';

                // Map folder ID if it exists in our mapping
                if (folderId !== 'home' && folderIdMapping.has(folderId)) {
                    const mappedFolderId = folderIdMapping.get(folderId);
                    console.log('🔗 Mapped folder ID for prompt', prompt.title, ':', folderId, '->', mappedFolderId);
                    folderId = mappedFolderId;
                } else if (folderId !== 'home') {
                    console.warn('⚠️ Folder ID not found in mapping, using home:', folderId);
                    folderId = 'home';
                }

                const promptData = {
                    title: prompt.title,
                    content: prompt.content,
                    folderId: folderId,
                    isFavorite: prompt.isFavorite || false,
                    usageCount: prompt.usageCount || 0,
                    createdAt: prompt.createdAt || Date.now()
                };

                // Add optional fields if they exist
                if (prompt.order !== undefined) promptData.order = prompt.order;
                if (prompt.updatedAt !== undefined) promptData.updatedAt = prompt.updatedAt;
                if (prompt.variables !== undefined) promptData.variables = prompt.variables;

                validPrompts.push(promptData);
            } else {
                console.warn('⚠️ Skipping invalid prompt:', prompt);
            }
        }

        let skippedDuplicates = [];
        if (validPrompts.length > 0) {
            console.log('💾 Batch saving', validPrompts.length, 'prompts with validation...');
            const result = await promptStorage.batchSavePromptsWithValidation(validPrompts, { mergeMode: importMode === 'merge' });
            if (result.skippedDuplicates && result.skippedDuplicates.length > 0) {
                console.log('⚠️ Skipped', result.skippedDuplicates.length, 'duplicate prompts:', result.skippedDuplicates);
                skippedDuplicates = result.skippedDuplicates;
            }
        }

        return { importedPrompts: validPrompts, skippedDuplicates };
    }

    // Legacy batch save methods (kept for compatibility, now delegate to validated versions)
    async batchSavePrompts(promptsData) {
        console.log('📢 Using legacy batchSavePrompts, delegating to validated version...');
        const result = await promptStorage.batchSavePromptsWithValidation(promptsData);
        return result.importedPrompts || result; // Handle both old and new return formats
    }

    async batchSaveFolders(foldersData) {
        console.log('📢 Using legacy batchSaveFolders, delegating to validated version...');
        const result = await promptStorage.batchSaveFoldersWithValidation(foldersData);
        return result.importedFolders || result; // Handle both old and new return formats
    }

    // Export Methods
    async handleExport() {
        this.hideSettingsDropdown();

        try {
            const allPrompts = await promptStorage.getAllPrompts();
            const allFolders = await promptStorage.getAllFolders();

            const exportData = {
                prompts: allPrompts,
                folders: allFolders,
                exportDate: new Date().toISOString(),
                version: '2.0',
                structure: 'flat'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });

            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            const filename = `pocket-prompt-backup-${dateStr}.json`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Data exported successfully.');
        } catch (error) {
            console.error('Failed to export data:', error);
            showToast('Failed to export data.', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FolderPromptManager();
});