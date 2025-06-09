class PromptManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentSearchTerm = '';
        this.editingPromptId = null;
        this.variableValues = {};
        
        this.initializeElements();
        this.bindEvents();
        this.loadPrompts();
    }

    initializeElements() {
        this.elements = {
            addBtn: document.getElementById('addBtn'),
            searchInput: document.getElementById('searchInput'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            promptsContainer: document.getElementById('promptsContainer'),
            emptyState: document.getElementById('emptyState'),
            
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
            
            variableModal: document.getElementById('variableModal'),
            variableForm: document.getElementById('variableForm'),
            variableInputs: document.getElementById('variableInputs'),
            closeVariableModalBtn: document.getElementById('closeVariableModalBtn'),
            cancelVariableBtn: document.getElementById('cancelVariableBtn'),
            
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage')
        };
    }

    bindEvents() {
        this.elements.addBtn.addEventListener('click', () => this.showPromptModal());
        
        this.elements.searchInput.addEventListener('input', 
            debounce((e) => this.handleSearch(e.target.value), 300)
        );
        
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e.target.dataset.filter));
        });

        this.elements.promptForm.addEventListener('submit', (e) => this.handlePromptSubmit(e));
        this.elements.closeModalBtn.addEventListener('click', () => this.hidePromptModal());
        this.elements.cancelBtn.addEventListener('click', () => this.hidePromptModal());
        
        this.elements.promptTitle.addEventListener('input', (e) => this.updateCharCount(e.target));
        this.elements.promptContent.addEventListener('input', (e) => this.updateVariablesList(e.target.value));

        this.elements.variableForm.addEventListener('submit', (e) => this.handleVariableSubmit(e));
        this.elements.closeVariableModalBtn.addEventListener('click', () => this.hideVariableModal());
        this.elements.cancelVariableBtn.addEventListener('click', () => this.hideVariableModal());

        this.elements.promptModal.addEventListener('click', (e) => {
            if (e.target === this.elements.promptModal) this.hidePromptModal();
        });
        
        this.elements.variableModal.addEventListener('click', (e) => {
            if (e.target === this.elements.variableModal) this.hideVariableModal();
        });

        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    async loadPrompts() {
        try {
            let prompts;
            
            if (this.currentFilter === 'favorites') {
                prompts = await promptStorage.getFavoritePrompts();
            } else if (this.currentSearchTerm) {
                prompts = await promptStorage.searchPrompts(this.currentSearchTerm);
            } else {
                prompts = await promptStorage.getAllPrompts();
            }

            if (this.currentFilter === 'favorites' && this.currentSearchTerm) {
                prompts = prompts.filter(prompt => 
                    prompt.title.toLowerCase().includes(this.currentSearchTerm.toLowerCase()) ||
                    prompt.content.toLowerCase().includes(this.currentSearchTerm.toLowerCase())
                );
            }

            const sortedPrompts = sortPrompts(prompts, 'recent');
            this.renderPrompts(sortedPrompts);
        } catch (error) {
            console.error('프롬프트 로딩 실패:', error);
            showToast('프롬프트를 불러올 수 없습니다.', 'error');
        }
    }

    renderPrompts(prompts) {
        if (prompts.length === 0) {
            this.showEmptyState();
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

        return `
            <div class="prompt-card ${prompt.isFavorite ? 'favorite' : ''}" data-id="${prompt.id}">
                <div class="prompt-header">
                    <h3 class="prompt-title">${highlightedTitle}</h3>
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
        });

        const actionBtns = this.elements.promptsContainer.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleActionClick(btn.dataset.action, btn.dataset.id);
            });
        });
    }

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
            await this.loadPrompts();
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
            await this.loadPrompts();
        } catch (error) {
            console.error('프롬프트 삭제 실패:', error);
            showToast('프롬프트를 삭제할 수 없습니다.', 'error');
        }
    }

    async copyPromptToClipboard(content, promptId) {
        try {
            const success = await copyToClipboard(content);
            if (success) {
                await promptStorage.incrementUsageCount(promptId);
                showToast('클립보드에 복사되었습니다.');
                await this.loadPrompts();
            } else {
                showToast('클립보드 복사에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('클립보드 복사 실패:', error);
            showToast('클립보드 복사에 실패했습니다.', 'error');
        }
    }

    showPromptModal() {
        this.elements.promptModal.classList.add('show');
        this.elements.promptTitle.focus();
    }

    hidePromptModal() {
        this.elements.promptModal.classList.remove('show');
        this.resetPromptForm();
    }

    resetPromptForm() {
        this.editingPromptId = null;
        this.elements.modalTitle.textContent = '새 프롬프트 추가';
        this.elements.promptForm.reset();
        this.elements.titleCharCount.textContent = '0';
        this.elements.variablesList.textContent = '없음';
    }

    async handlePromptSubmit(e) {
        e.preventDefault();
        
        const title = this.elements.promptTitle.value.trim();
        const content = this.elements.promptContent.value.trim();
        
        if (!title || !content) {
            showToast('제목과 내용을 모두 입력해주세요.', 'error');
            return;
        }

        try {
            if (this.editingPromptId) {
                await promptStorage.updatePrompt(this.editingPromptId, { title, content });
                showToast('프롬프트가 수정되었습니다.');
            } else {
                await promptStorage.savePrompt({ title, content });
                showToast('프롬프트가 저장되었습니다.');
            }
            
            this.hidePromptModal();
            await this.loadPrompts();
        } catch (error) {
            console.error('프롬프트 저장 실패:', error);
            showToast(error.message || '프롬프트를 저장할 수 없습니다.', 'error');
        }
    }

    updateCharCount(input) {
        const count = input.value.length;
        this.elements.titleCharCount.textContent = count;
        
        if (count > 100) {
            this.elements.titleCharCount.style.color = '#ef4444';
        } else {
            this.elements.titleCharCount.style.color = '#6b7280';
        }
    }

    updateVariablesList(content) {
        const variables = extractVariables(content);
        this.elements.variablesList.textContent = variables.length > 0 ? variables.join(', ') : '없음';
    }

    showVariableModal(prompt) {
        this.currentPrompt = prompt;
        this.elements.variableInputs.innerHTML = getVariableInputHtml(prompt.variables);
        this.elements.variableModal.classList.add('show');
        
        const firstInput = this.elements.variableInputs.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    hideVariableModal() {
        this.elements.variableModal.classList.remove('show');
        this.currentPrompt = null;
        this.variableValues = {};
    }

    async handleVariableSubmit(e) {
        e.preventDefault();
        
        if (!this.currentPrompt) return;

        const formData = new FormData(this.elements.variableForm);
        const variableValues = {};
        
        this.currentPrompt.variables.forEach(variable => {
            variableValues[variable] = parseVariableInput(formData.get(variable) || '');
        });

        const finalContent = replaceVariables(this.currentPrompt.content, variableValues);
        
        this.hideVariableModal();
        await this.copyPromptToClipboard(finalContent, this.currentPrompt.id);
    }

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

    showEmptyState() {
        this.elements.emptyState.style.display = 'block';
        this.elements.promptsContainer.innerHTML = '';
    }

    hideEmptyState() {
        this.elements.emptyState.style.display = 'none';
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            if (this.elements.promptModal.classList.contains('show')) {
                this.hidePromptModal();
            } else if (this.elements.variableModal.classList.contains('show')) {
                this.hideVariableModal();
            }
        }
        
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'n') {
                e.preventDefault();
                this.showPromptModal();
            } else if (e.key === 'f') {
                e.preventDefault();
                this.elements.searchInput.focus();
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PromptManager();
});