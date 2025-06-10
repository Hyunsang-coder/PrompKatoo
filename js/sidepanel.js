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
            showToast('앱 초기화에 실패했습니다.', 'error');
        }
    }

    async loadVariableDefaults() {
        try {
            const result = await chrome.storage.local.get(['variable_defaults']);
            this.variableDefaults = result.variable_defaults || {};
        } catch (error) {
            console.warn('변수 기본값 로딩 실패:', error);
            this.variableDefaults = {};
        }
    }

    async saveVariableDefaults() {
        try {
            await chrome.storage.local.set({ variable_defaults: this.variableDefaults });
        } catch (error) {
            console.warn('변수 기본값 저장 실패:', error);
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
        try {
            await this.updateBreadcrumb();
            await this.loadFolders();
            await this.loadPrompts();
        } catch (error) {
            console.error('Failed to load current view:', error);
            showToast('화면을 불러올 수 없습니다.', 'error');
        }
    }

    async updateBreadcrumb() {
        const folders = await promptStorage.getAllFolders();
        const breadcrumbItems = [];
        let currentFolder = folders.find(f => f.id === this.currentFolderId);
        
        if (this.currentFolderId === 'home' || !currentFolder) {
            breadcrumbItems.push({ id: 'home', name: 'Home', icon: '🏠' });
        } else {
            // Build path from current folder to home
            const path = [];
            while (currentFolder && currentFolder.id !== 'home') {
                path.unshift(currentFolder);
                // Handle null parentId (which means parent is home)
                if (currentFolder.parentId === null) {
                    break;
                }
                currentFolder = folders.find(f => f.id === currentFolder.parentId);
            }
            
            breadcrumbItems.push({ id: 'home', name: 'Home', icon: '🏠' });
            breadcrumbItems.push(...path);
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
            const subfolders = await promptStorage.getFoldersByParent(this.currentFolderId);
            
            if (subfolders.length === 0) {
                this.elements.foldersContainer.innerHTML = '';
                this.elements.foldersContainer.style.display = 'none';
                return;
            }

            this.elements.foldersContainer.style.display = 'block';
            
            // Get prompt counts for each folder
            const foldersWithCounts = await Promise.all(
                subfolders.map(async folder => {
                    const prompts = await promptStorage.getPromptsByFolder(folder.id);
                    return { ...folder, promptCount: prompts.length };
                })
            );

            const folderGridHtml = `
                <div class="folder-grid">
                    ${foldersWithCounts.map(folder => this.createFolderCard(folder)).join('')}
                </div>
            `;

            this.elements.foldersContainer.innerHTML = folderGridHtml;
            this.bindFolderEvents();
        } catch (error) {
            console.error('폴더 로딩 실패:', error);
            showToast('폴더를 불러올 수 없습니다.', 'error');
        }
    }

    createFolderCard(folder) {
        const promptText = folder.promptCount === 1 ? 'prompt' : 'prompts';
        
        return `
            <div class="folder-card" data-folder-id="${folder.id}" draggable="false">
                <div class="folder-actions">
                    <button class="folder-action-btn" data-action="context" data-folder-id="${folder.id}" aria-label="옵션">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

            // Setup drag and drop for folders
            this.setupFolderDragAndDrop(card);
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
        try {
            let prompts;
            
            if (this.currentFilter === 'favorites') {
                const allPrompts = await promptStorage.getFavoritePrompts();
                prompts = allPrompts.filter(p => p.folderId === this.currentFolderId);
            } else if (this.currentSearchTerm) {
                if (this.currentSearchTerm.length > 0) {
                    prompts = await promptStorage.searchPromptsWithFolderInfo(this.currentSearchTerm);
                } else {
                    prompts = await promptStorage.getPromptsByFolder(this.currentFolderId);
                }
            } else {
                prompts = await promptStorage.getPromptsByFolder(this.currentFolderId);
            }

            if (this.currentFilter === 'favorites' && this.currentSearchTerm) {
                prompts = prompts.filter(prompt => 
                    prompt.title.toLowerCase().includes(this.currentSearchTerm.toLowerCase()) ||
                    prompt.content.toLowerCase().includes(this.currentSearchTerm.toLowerCase())
                );
            }

            const sortedPrompts = this.sortPromptsForDisplay(prompts);
            this.renderPrompts(sortedPrompts);
        } catch (error) {
            console.error('프롬프트 로딩 실패:', error);
            showToast('프롬프트를 불러올 수 없습니다.', 'error');
        }
    }

    renderPrompts(prompts) {
        const folders = this.elements.foldersContainer.children.length > 0;
        
        if (prompts.length === 0 && !folders) {
            this.showEmptyState();
            return;
        } else if (prompts.length === 0) {
            this.elements.promptsContainer.innerHTML = '';
            return;
        }

        this.hideEmptyState();
        
        const promptsHtml = prompts.map(prompt => this.createPromptCard(prompt)).join('');
        this.elements.promptsContainer.innerHTML = promptsHtml;
        
        this.bindPromptEvents();
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

        const folderPathHtml = prompt.folderPath && this.currentSearchTerm ? 
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
                                aria-label="${prompt.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="${prompt.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                            </svg>
                        </button>
                        <button class="action-btn edit-btn" data-action="edit" data-id="${prompt.id}" aria-label="편집">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-btn delete-btn" data-action="delete" data-id="${prompt.id}" aria-label="삭제">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="prompt-content">${highlightedContent}</p>
                ${variablesHtml}
                <div class="prompt-meta">
                    <span class="date">${formatDate(prompt.updatedAt || prompt.createdAt)}</span>
                    <span class="usage-count">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        ${prompt.usageCount}
                    </span>
                </div>
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
        if (this.currentSearchTerm || this.currentFilter === 'favorites') {
            return sortPrompts(prompts, 'recent');
        }
        
        // For folder view, sort by custom order first, then by creation date
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
            
            e.dataTransfer.setData('text/plain', card.dataset.id);
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
            
            const promptId = e.dataTransfer.getData('text/plain');
            const targetFolderId = folderCard.dataset.folderId;
            
            if (promptId && targetFolderId) {
                await this.movePromptToFolder(promptId, targetFolderId);
            }
        });
    }

    async movePromptToFolder(promptId, targetFolderId) {
        try {
            await promptStorage.movePromptToFolder(promptId, targetFolderId);
            showToast('프롬프트가 이동되었습니다.');
            await this.loadCurrentView();
        } catch (error) {
            console.error('프롬프트 이동 실패:', error);
            showToast('프롬프트를 이동할 수 없습니다.', 'error');
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
            console.error('프롬프트 재정렬 실패:', error);
            showToast('프롬프트 순서를 변경할 수 없습니다.', 'error');
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
                    showToast('같은 폴더로는 이동할 수 없습니다.', 'error');
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
        this.elements.modalTitle.textContent = '새 프롬프트 추가';
        this.elements.promptForm.reset();
        this.elements.titleCharCount.textContent = '0';
        this.elements.variablesList.textContent = '없음';
    }

    resetFolderForm() {
        this.editingFolderId = null;
        this.elements.folderModalTitle.textContent = '새 폴더 생성';
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
            showToast('제목과 내용을 모두 입력해주세요.', 'error');
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
                showToast('프롬프트가 수정되었습니다.');
            } else {
                await promptStorage.savePrompt(promptData);
                showToast('프롬프트가 저장되었습니다.');
            }
            
            this.hidePromptModal();
            await this.loadCurrentView();
        } catch (error) {
            console.error('프롬프트 저장 실패:', error);
            showToast(error.message || '프롬프트를 저장할 수 없습니다.', 'error');
        }
    }

    async handleFolderSubmit(e) {
        e.preventDefault();
        
        const name = this.elements.folderName.value.trim();
        
        if (!name) {
            showToast('폴더명을 입력해주세요.', 'error');
            return;
        }

        try {
            const folderData = {
                name,
                icon: this.selectedIcon,
                parentId: this.currentFolderId === 'home' ? null : this.currentFolderId
            };

            if (this.editingFolderId) {
                await promptStorage.updateFolder(this.editingFolderId, folderData);
                showToast('폴더가 수정되었습니다.');
            } else {
                await promptStorage.saveFolder(folderData);
                showToast('폴더가 생성되었습니다.');
            }
            
            this.hideFolderModal();
            await this.loadCurrentView();
        } catch (error) {
            console.error('폴더 저장 실패:', error);
            showToast(error.message || '폴더를 저장할 수 없습니다.', 'error');
        }
    }

    // Action Handlers
    async handlePromptClick(promptId) {
        try {
            const prompt = await promptStorage.getPrompt(promptId);
            if (!prompt) {
                showToast('프롬프트를 찾을 수 없습니다.', 'error');
                return;
            }

            if (prompt.variables.length > 0) {
                this.showVariableModal(prompt);
            } else {
                await this.copyPromptToClipboard(prompt.content, promptId);
            }
        } catch (error) {
            console.error('프롬프트 처리 실패:', error);
            showToast('프롬프트를 처리할 수 없습니다.', 'error');
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
            console.error('즐겨찾기 토글 실패:', error);
            showToast('즐겨찾기를 변경할 수 없습니다.', 'error');
        }
    }

    async editPrompt(promptId) {
        try {
            const prompt = await promptStorage.getPrompt(promptId);
            if (!prompt) {
                showToast('프롬프트를 찾을 수 없습니다.', 'error');
                return;
            }

            this.editingPromptId = promptId;
            this.elements.modalTitle.textContent = '프롬프트 편집';
            this.elements.promptTitle.value = prompt.title;
            this.elements.promptContent.value = prompt.content;
            
            this.updateCharCount(this.elements.promptTitle);
            this.updateVariablesList(prompt.content);
            
            this.showPromptModal();
        } catch (error) {
            console.error('프롬프트 편집 실패:', error);
            showToast('프롬프트를 편집할 수 없습니다.', 'error');
        }
    }

    async deletePrompt(promptId) {
        if (!confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) {
            return;
        }

        try {
            await promptStorage.deletePrompt(promptId);
            showToast('프롬프트가 삭제되었습니다.');
            await this.loadCurrentView();
        } catch (error) {
            console.error('프롬프트 삭제 실패:', error);
            showToast('프롬프트를 삭제할 수 없습니다.', 'error');
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
                showToast('폴더를 찾을 수 없습니다.', 'error');
                return;
            }

            this.editingFolderId = this.contextFolderId;
            this.elements.folderModalTitle.textContent = '폴더 편집';
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
            console.error('폴더 편집 실패:', error);
            showToast('폴더를 편집할 수 없습니다.', 'error');
        }
    }

    async handleDeleteFolder() {
        if (!confirm('정말로 이 폴더를 삭제하시겠습니까? 폴더 안의 모든 프롬프트와 하위 폴더는 상위 폴더로 이동됩니다.')) {
            return;
        }

        try {
            await promptStorage.deleteFolder(this.contextFolderId);
            showToast('폴더가 삭제되었습니다.');
            this.hideContextMenu();
            await this.loadCurrentView();
        } catch (error) {
            console.error('폴더 삭제 실패:', error);
            showToast(error.message || '폴더를 삭제할 수 없습니다.', 'error');
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
        this.elements.variablesList.textContent = variables.length > 0 ? variables.join(', ') : '없음';
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
        this.elements.variableModalTitle.textContent = `변수 입력 - ${prompt.title}`;
        
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
            values[variable] = inputValue || defaultValue;
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
                showToast('클립보드에 복사되었습니다.');
                
                promptStorage.incrementUsageCount(promptId).catch(error => {
                    console.warn('사용 횟수 업데이트 실패:', error);
                });
                
                this.loadCurrentView().catch(error => {
                    console.warn('프롬프트 목록 새로고침 실패:', error);
                });
            } else {
                showToast('클립보드 복사에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('클립보드 복사 실패:', error);
            showToast('클립보드 복사에 실패했습니다.', 'error');
        }
    }

    async copyPromptToClipboard(content, promptId) {
        try {
            const success = await copyToClipboard(content);
            if (success) {
                await promptStorage.incrementUsageCount(promptId);
                showToast('클립보드에 복사되었습니다.');
                await this.loadCurrentView();
            } else {
                showToast('클립보드 복사에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('클립보드 복사 실패:', error);
            showToast('클립보드 복사에 실패했습니다.', 'error');
        }
    }

    // Settings Dropdown Methods
    toggleSettingsDropdown(e) {
        e.stopPropagation();
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
        this.elements.fileInput.value = '';
        this.elements.importOptions.style.display = 'none';
        this.elements.fileDropZone.classList.remove('dragover');
        const mergeOption = document.querySelector('input[name="importMode"][value="merge"]');
        if (mergeOption) mergeOption.checked = true;
        this.importData = null;
    }

    // File Handling Methods
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
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
        if (!file.type.includes('json') && !file.name.endsWith('.json')) {
            showToast('JSON 파일만 업로드할 수 있습니다.', 'error');
            return;
        }

        try {
            const text = await this.readFileAsText(file);
            const data = JSON.parse(text);
            
            if (this.validateImportData(data)) {
                this.importData = data;
                this.elements.importOptions.style.display = 'block';
                showToast('파일이 성공적으로 로드되었습니다.');
            } else {
                showToast('올바르지 않은 데이터 형식입니다.', 'error');
            }
        } catch (error) {
            console.error('파일 처리 실패:', error);
            showToast('파일을 읽을 수 없습니다.', 'error');
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
        // Basic validation for the expected data structure
        return data && 
               typeof data === 'object' && 
               (data.prompts || data.folders || Array.isArray(data));
    }

    async handleImport() {
        if (!this.importData) {
            showToast('가져올 데이터가 없습니다.', 'error');
            return;
        }

        const importMode = document.querySelector('input[name="importMode"]:checked').value;
        
        try {
            if (importMode === 'replace') {
                // Clear all existing data
                await promptStorage.clearAllData();
            }

            // Import the data
            await this.importDataToStorage(this.importData);
            
            showToast('데이터를 성공적으로 가져왔습니다.');
            this.hideImportModal();
            await this.loadCurrentView();
        } catch (error) {
            console.error('데이터 가져오기 실패:', error);
            showToast('데이터 가져오기에 실패했습니다.', 'error');
        }
    }

    async importDataToStorage(data) {
        // Handle different data formats
        if (Array.isArray(data)) {
            // Legacy format: array of prompts
            for (const prompt of data) {
                if (prompt.title && prompt.content) {
                    await promptStorage.savePrompt({
                        title: prompt.title,
                        content: prompt.content,
                        folderId: prompt.folderId || 'home',
                        isFavorite: prompt.isFavorite || false
                    });
                }
            }
        } else if (data.prompts || data.folders) {
            // New format: structured data
            if (data.folders) {
                for (const folder of data.folders) {
                    await promptStorage.saveFolder({
                        name: folder.name,
                        icon: folder.icon || '📁',
                        parentId: folder.parentId
                    });
                }
            }
            
            if (data.prompts) {
                for (const prompt of data.prompts) {
                    if (prompt.title && prompt.content) {
                        await promptStorage.savePrompt({
                            title: prompt.title,
                            content: prompt.content,
                            folderId: prompt.folderId || 'home',
                            isFavorite: prompt.isFavorite || false
                        });
                    }
                }
            }
        }
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
                version: '1.0'
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
            
            showToast('데이터를 성공적으로 내보냈습니다.');
        } catch (error) {
            console.error('데이터 내보내기 실패:', error);
            showToast('데이터 내보내기에 실패했습니다.', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FolderPromptManager();
});