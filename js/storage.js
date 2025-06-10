class PromptStorage {
    constructor() {
        this.storageKey = 'prompt_manager_data';
        this.foldersKey = 'prompt_manager_folders';
        this.migrationKey = 'prompt_manager_migration_v2';
        this.initializeStorage();
    }

    async initializeStorage() {
        try {
            const migration = await chrome.storage.local.get([this.migrationKey]);
            if (!migration[this.migrationKey]) {
                await this.migrateToFolderSystem();
                await chrome.storage.local.set({ [this.migrationKey]: true });
            }
        } catch (error) {
            console.error('Storage initialization failed:', error);
        }
    }

    async migrateToFolderSystem() {
        try {
            const existingPrompts = await this.getAllPrompts();
            const existingFolders = await this.getAllFolders();
            
            if (existingFolders.length === 0) {
                const homeFolder = {
                    id: 'home',
                    name: 'Home',
                    icon: '🏠',
                    parentId: null,
                    createdAt: Date.now(),
                    color: null
                };
                await chrome.storage.local.set({ [this.foldersKey]: [homeFolder] });
            }
            
            if (existingPrompts.length > 0) {
                const migratedPrompts = existingPrompts.map((prompt, index) => ({
                    ...prompt,
                    folderId: prompt.folderId || 'home',
                    order: prompt.order !== undefined ? prompt.order : index
                }));
                await chrome.storage.local.set({ [this.storageKey]: migratedPrompts });
            }
        } catch (error) {
            console.error('Migration failed:', error);
        }
    }

    async getAllPrompts() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            return result[this.storageKey] || [];
        } catch (error) {
            console.error('프롬프트 로딩 실패:', error);
            return [];
        }
    }

    async getPromptsByFolder(folderId) {
        try {
            const prompts = await this.getAllPrompts();
            return prompts.filter(prompt => prompt.folderId === folderId);
        } catch (error) {
            console.error('폴더별 프롬프트 조회 실패:', error);
            return [];
        }
    }

    async getAllFolders() {
        try {
            const result = await chrome.storage.local.get([this.foldersKey]);
            return result[this.foldersKey] || [];
        } catch (error) {
            console.error('폴더 로딩 실패:', error);
            return [];
        }
    }

    async getFolder(folderId) {
        try {
            const folders = await this.getAllFolders();
            return folders.find(f => f.id === folderId) || null;
        } catch (error) {
            console.error('폴더 조회 실패:', error);
            return null;
        }
    }

    async getFoldersByParent(parentId) {
        try {
            const folders = await this.getAllFolders();
            // Handle 'home' parentId by looking for null parentId
            const targetParentId = parentId === 'home' ? null : parentId;
            return folders.filter(folder => folder.parentId === targetParentId);
        } catch (error) {
            console.error('하위 폴더 조회 실패:', error);
            return [];
        }
    }

    async savePrompt(promptData) {
        try {
            const prompts = await this.getAllPrompts();
            
            const newPrompt = {
                id: promptData.id || generateUUID(),
                title: this.validateTitle(promptData.title),
                content: this.validateContent(promptData.content),
                folderId: promptData.folderId || 'home',
                isFavorite: promptData.isFavorite || false,
                createdAt: promptData.createdAt || Date.now(),
                usageCount: promptData.usageCount || 0,
                variables: extractVariables(promptData.content),
                updatedAt: Date.now(),
                order: promptData.order || Date.now() // Use timestamp as default order
            };

            prompts.push(newPrompt);
            await chrome.storage.local.set({ [this.storageKey]: prompts });
            
            return newPrompt;
        } catch (error) {
            console.error('프롬프트 저장 실패:', error);
            throw new Error('프롬프트를 저장할 수 없습니다.');
        }
    }

    async saveFolder(folderData) {
        try {
            const folders = await this.getAllFolders();
            
            if (folderData.parentId && folderData.parentId !== 'home') {
                const parent = await this.getFolder(folderData.parentId);
                if (!parent) {
                    throw new Error('상위 폴더를 찾을 수 없습니다.');
                }
                if (parent.parentId !== 'home' && parent.parentId !== null) {
                    throw new Error('3단계 이상의 폴더 구조는 지원되지 않습니다.');
                }
            }
            
            const newFolder = {
                id: folderData.id || generateUUID(),
                name: this.validateFolderName(folderData.name),
                icon: folderData.icon || '📁',
                parentId: folderData.parentId || null,
                createdAt: folderData.createdAt || Date.now(),
                color: folderData.color || null
            };

            folders.push(newFolder);
            await chrome.storage.local.set({ [this.foldersKey]: folders });
            
            return newFolder;
        } catch (error) {
            console.error('폴더 저장 실패:', error);
            throw new Error(error.message || '폴더를 저장할 수 없습니다.');
        }
    }

    async updatePrompt(id, updates) {
        try {
            const prompts = await this.getAllPrompts();
            const index = prompts.findIndex(p => p.id === id);
            
            if (index === -1) {
                throw new Error('프롬프트를 찾을 수 없습니다.');
            }

            if (updates.title !== undefined) {
                updates.title = this.validateTitle(updates.title);
            }
            
            if (updates.content !== undefined) {
                updates.content = this.validateContent(updates.content);
                updates.variables = extractVariables(updates.content);
            }

            prompts[index] = {
                ...prompts[index],
                ...updates,
                updatedAt: Date.now()
            };

            await chrome.storage.local.set({ [this.storageKey]: prompts });
            return prompts[index];
        } catch (error) {
            console.error('프롬프트 업데이트 실패:', error);
            throw new Error('프롬프트를 업데이트할 수 없습니다.');
        }
    }

    async updateFolder(id, updates) {
        try {
            const folders = await this.getAllFolders();
            const index = folders.findIndex(f => f.id === id);
            
            if (index === -1) {
                throw new Error('폴더를 찾을 수 없습니다.');
            }
            
            if (updates.name !== undefined) {
                updates.name = this.validateFolderName(updates.name);
            }

            folders[index] = {
                ...folders[index],
                ...updates
            };

            await chrome.storage.local.set({ [this.foldersKey]: folders });
            return folders[index];
        } catch (error) {
            console.error('폴더 업데이트 실패:', error);
            throw new Error('폴더를 업데이트할 수 없습니다.');
        }
    }

    async deletePrompt(id) {
        try {
            const prompts = await this.getAllPrompts();
            const filteredPrompts = prompts.filter(p => p.id !== id);
            
            if (prompts.length === filteredPrompts.length) {
                throw new Error('프롬프트를 찾을 수 없습니다.');
            }
            
            await chrome.storage.local.set({ [this.storageKey]: filteredPrompts });
            return true;
        } catch (error) {
            console.error('프롬프트 삭제 실패:', error);
            throw new Error('프롬프트를 삭제할 수 없습니다.');
        }
    }

    async deleteFolder(id) {
        try {
            if (id === 'home') {
                throw new Error('홈 폴더는 삭제할 수 없습니다.');
            }
            
            const folders = await this.getAllFolders();
            const folderToDelete = folders.find(f => f.id === id);
            
            if (!folderToDelete) {
                throw new Error('폴더를 찾을 수 없습니다.');
            }
            
            const subfolders = await this.getFoldersByParent(id);
            const prompts = await this.getPromptsByFolder(id);
            
            const parentId = folderToDelete.parentId || 'home';
            
            if (subfolders.length > 0) {
                for (const subfolder of subfolders) {
                    await this.updateFolder(subfolder.id, { parentId });
                }
            }
            
            if (prompts.length > 0) {
                for (const prompt of prompts) {
                    await this.updatePrompt(prompt.id, { folderId: parentId });
                }
            }
            
            const filteredFolders = folders.filter(f => f.id !== id);
            await chrome.storage.local.set({ [this.foldersKey]: filteredFolders });
            
            return true;
        } catch (error) {
            console.error('폴더 삭제 실패:', error);
            throw new Error(error.message || '폴더를 삭제할 수 없습니다.');
        }
    }

    async movePromptToFolder(promptId, targetFolderId) {
        try {
            const targetFolder = await this.getFolder(targetFolderId);
            if (!targetFolder && targetFolderId !== 'home') {
                throw new Error('대상 폴더를 찾을 수 없습니다.');
            }
            
            return await this.updatePrompt(promptId, { folderId: targetFolderId });
        } catch (error) {
            console.error('프롬프트 이동 실패:', error);
            throw new Error('프롬프트를 이동할 수 없습니다.');
        }
    }

    async reorderPrompts(folderId, promptIds) {
        try {
            const prompts = await this.getAllPrompts();
            const folderPrompts = prompts.filter(p => p.folderId === folderId);
            
            // Validate that all provided IDs exist in the folder
            const folderPromptIds = folderPrompts.map(p => p.id);
            if (!promptIds.every(id => folderPromptIds.includes(id))) {
                throw new Error('일부 프롬프트가 해당 폴더에 존재하지 않습니다.');
            }
            
            // Update order values based on new sequence
            promptIds.forEach((promptId, index) => {
                const prompt = prompts.find(p => p.id === promptId);
                if (prompt) {
                    prompt.order = index;
                    prompt.updatedAt = Date.now();
                }
            });
            
            await chrome.storage.local.set({ [this.storageKey]: prompts });
            return true;
        } catch (error) {
            console.error('프롬프트 재정렬 실패:', error);
            throw new Error('프롬프트 순서를 변경할 수 없습니다.');
        }
    }

    async getPrompt(id) {
        try {
            const prompts = await this.getAllPrompts();
            return prompts.find(p => p.id === id) || null;
        } catch (error) {
            console.error('프롬프트 조회 실패:', error);
            return null;
        }
    }

    async incrementUsageCount(id) {
        try {
            const prompt = await this.getPrompt(id);
            if (prompt) {
                await this.updatePrompt(id, { 
                    usageCount: prompt.usageCount + 1 
                });
            }
        } catch (error) {
            console.error('사용 횟수 업데이트 실패:', error);
        }
    }

    async toggleFavorite(id) {
        try {
            const prompt = await this.getPrompt(id);
            if (prompt) {
                return await this.updatePrompt(id, { 
                    isFavorite: !prompt.isFavorite 
                });
            }
            throw new Error('프롬프트를 찾을 수 없습니다.');
        } catch (error) {
            console.error('즐겨찾기 토글 실패:', error);
            throw error;
        }
    }

    async searchPrompts(query, folderId = null) {
        try {
            let prompts;
            if (folderId) {
                prompts = await this.getPromptsByFolder(folderId);
            } else {
                prompts = await this.getAllPrompts();
            }
            
            if (!query.trim()) {
                return prompts;
            }

            const searchTerm = query.toLowerCase();
            return prompts.filter(prompt => 
                prompt.title.toLowerCase().includes(searchTerm) ||
                prompt.content.toLowerCase().includes(searchTerm)
            );
        } catch (error) {
            console.error('프롬프트 검색 실패:', error);
            return [];
        }
    }

    async searchPromptsWithFolderInfo(query) {
        try {
            const prompts = await this.searchPrompts(query);
            const folders = await this.getAllFolders();
            
            return prompts.map(prompt => {
                const folder = folders.find(f => f.id === prompt.folderId);
                return {
                    ...prompt,
                    folderPath: this.getFolderPath(folder, folders)
                };
            });
        } catch (error) {
            console.error('프롬프트 검색 (폴더 정보 포함) 실패:', error);
            return [];
        }
    }

    getFolderPath(folder, allFolders) {
        if (!folder || folder.id === 'home') {
            return 'Home';
        }
        
        const path = [folder.name];
        let current = folder;
        
        while (current.parentId && current.parentId !== 'home' && current.parentId !== null) {
            const parent = allFolders.find(f => f.id === current.parentId);
            if (!parent) break;
            path.unshift(parent.name);
            current = parent;
        }
        
        path.unshift('Home');
        return path.join(' > ');
    }

    async getFavoritePrompts() {
        try {
            const prompts = await this.getAllPrompts();
            return prompts.filter(prompt => prompt.isFavorite);
        } catch (error) {
            console.error('즐겨찾기 프롬프트 조회 실패:', error);
            return [];
        }
    }

    async exportData() {
        try {
            const prompts = await this.getAllPrompts();
            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                prompts: prompts
            };
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('데이터 내보내기 실패:', error);
            throw new Error('데이터를 내보낼 수 없습니다.');
        }
    }

    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data.prompts || !Array.isArray(data.prompts)) {
                throw new Error('올바르지 않은 데이터 형식입니다.');
            }

            const validPrompts = data.prompts.filter(prompt => {
                return prompt.title && prompt.content && 
                       typeof prompt.title === 'string' && 
                       typeof prompt.content === 'string';
            }).map(prompt => ({
                ...prompt,
                id: prompt.id || generateUUID(),
                variables: extractVariables(prompt.content),
                importedAt: Date.now()
            }));

            await chrome.storage.local.set({ [this.storageKey]: validPrompts });
            return validPrompts.length;
        } catch (error) {
            console.error('데이터 가져오기 실패:', error);
            throw new Error('데이터를 가져올 수 없습니다.');
        }
    }

    async clearAllData() {
        try {
            await chrome.storage.local.remove([this.storageKey]);
            return true;
        } catch (error) {
            console.error('데이터 초기화 실패:', error);
            throw new Error('데이터를 초기화할 수 없습니다.');
        }
    }

    validateTitle(title) {
        if (!title || typeof title !== 'string') {
            throw new Error('제목이 필요합니다.');
        }
        
        const trimmed = title.trim();
        if (trimmed.length === 0) {
            throw new Error('제목을 입력해주세요.');
        }
        
        if (trimmed.length > 100) {
            throw new Error('제목은 100자 이하로 입력해주세요.');
        }
        
        return trimmed;
    }

    validateContent(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('내용이 필요합니다.');
        }
        
        const trimmed = content.trim();
        if (trimmed.length === 0) {
            throw new Error('내용을 입력해주세요.');
        }
        
        const wordCount = trimmed.split(/\s+/).length;
        if (wordCount > 5000) {
            throw new Error('내용은 5000단어 이하로 입력해주세요.');
        }
        
        return trimmed;
    }

    validateFolderName(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('폴더명이 필요합니다.');
        }
        
        const trimmed = name.trim();
        if (trimmed.length === 0) {
            throw new Error('폴더명을 입력해주세요.');
        }
        
        if (trimmed.length > 50) {
            throw new Error('폴더명은 50자 이하로 입력해주세요.');
        }
        
        return trimmed;
    }

    async getStorageStats() {
        try {
            const prompts = await this.getAllPrompts();
            const folders = await this.getAllFolders();
            const totalSize = JSON.stringify({ prompts, folders }).length;
            const storageLimit = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB
            
            return {
                promptCount: prompts.length,
                folderCount: folders.length,
                totalSize: totalSize,
                usagePercentage: (totalSize / storageLimit * 100).toFixed(2),
                favoriteCount: prompts.filter(p => p.isFavorite).length,
                totalUsage: prompts.reduce((sum, p) => sum + p.usageCount, 0)
            };
        } catch (error) {
            console.error('저장소 통계 조회 실패:', error);
            return null;
        }
    }

    async clearAllData() {
        try {
            // Clear all prompts and folders, but keep home folder
            await chrome.storage.local.set({
                [this.storageKey]: [],
                [this.foldersKey]: [{
                    id: 'home',
                    name: 'Home',
                    icon: '🏠',
                    parentId: null,
                    createdAt: Date.now(),
                    color: null
                }]
            });
        } catch (error) {
            console.error('데이터 초기화 실패:', error);
            throw new Error('데이터를 초기화할 수 없습니다.');
        }
    }
}

const promptStorage = new PromptStorage();