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
            console.error('Failed to load prompts:', error);
            return [];
        }
    }

    async getPromptsByFolder(folderId) {
        try {
            const prompts = await this.getAllPrompts();
            return prompts.filter(prompt => prompt.folderId === folderId);
        } catch (error) {
            console.error('Failed to query folder prompts:', error);
            return [];
        }
    }

    async getAllFolders() {
        try {
            const result = await chrome.storage.local.get([this.foldersKey]);
            return result[this.foldersKey] || [];
        } catch (error) {
            console.error('Failed to load folders:', error);
            return [];
        }
    }

    async getFolder(folderId) {
        try {
            const folders = await this.getAllFolders();
            return folders.find(f => f.id === folderId) || null;
        } catch (error) {
            console.error('Failed to query folder:', error);
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
            console.error('Failed to query subfolders:', error);
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
            console.error('Failed to save prompt:', error);
            throw new Error('Unable to save prompt.');
        }
    }

    async saveFolder(folderData) {
        try {
            const folders = await this.getAllFolders();
            
            if (folderData.parentId && folderData.parentId !== 'home') {
                const parent = await this.getFolder(folderData.parentId);
                if (!parent) {
                    throw new Error('Parent folder not found.');
                }
                if (parent.parentId !== 'home' && parent.parentId !== null) {
                    throw new Error('Folder structures deeper than 3 levels are not supported.');
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
            console.error('Failed to save folder:', error);
            throw new Error(error.message || 'Unable to save folder.');
        }
    }

    async updatePrompt(id, updates) {
        try {
            const prompts = await this.getAllPrompts();
            const index = prompts.findIndex(p => p.id === id);
            
            if (index === -1) {
                throw new Error('Prompt not found.');
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
            console.error('Failed to update prompt:', error);
            throw new Error('Unable to update prompt.');
        }
    }

    async updateFolder(id, updates) {
        try {
            const folders = await this.getAllFolders();
            const index = folders.findIndex(f => f.id === id);
            
            if (index === -1) {
                throw new Error('Folder not found.');
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
            console.error('Failed to update folder:', error);
            throw new Error('Unable to update folder.');
        }
    }

    async deletePrompt(id) {
        try {
            const prompts = await this.getAllPrompts();
            const filteredPrompts = prompts.filter(p => p.id !== id);
            
            if (prompts.length === filteredPrompts.length) {
                throw new Error('Prompt not found.');
            }
            
            await chrome.storage.local.set({ [this.storageKey]: filteredPrompts });
            return true;
        } catch (error) {
            console.error('Failed to delete prompt:', error);
            throw new Error('Unable to delete prompt.');
        }
    }

    async deleteFolder(id) {
        try {
            if (id === 'home') {
                throw new Error('Home folder cannot be deleted.');
            }
            
            const folders = await this.getAllFolders();
            const folderToDelete = folders.find(f => f.id === id);
            
            if (!folderToDelete) {
                throw new Error('Folder not found.');
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
            console.error('Failed to delete folder:', error);
            throw new Error(error.message || 'Unable to delete folder.');
        }
    }

    async movePromptToFolder(promptId, targetFolderId) {
        try {
            const targetFolder = await this.getFolder(targetFolderId);
            if (!targetFolder && targetFolderId !== 'home') {
                throw new Error('Target folder not found.');
            }
            
            return await this.updatePrompt(promptId, { folderId: targetFolderId });
        } catch (error) {
            console.error('Failed to move prompt:', error);
            throw new Error('Unable to move prompt.');
        }
    }

    async reorderPrompts(folderId, promptIds) {
        try {
            const prompts = await this.getAllPrompts();
            const folderPrompts = prompts.filter(p => p.folderId === folderId);
            
            // Validate that all provided IDs exist in the folder
            const folderPromptIds = folderPrompts.map(p => p.id);
            if (!promptIds.every(id => folderPromptIds.includes(id))) {
                throw new Error('Some prompts do not exist in the specified folder.');
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
            console.error('Failed to reorder prompts:', error);
            throw new Error('Unable to change prompt order.');
        }
    }

    async getPrompt(id) {
        try {
            const prompts = await this.getAllPrompts();
            return prompts.find(p => p.id === id) || null;
        } catch (error) {
            console.error('Failed to query prompt:', error);
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
            console.error('Failed to update usage count:', error);
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
            throw new Error('Prompt not found.');
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
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
            console.error('Failed to search prompts:', error);
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
            console.error('Failed to search prompts with folder info:', error);
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
            console.error('Failed to query favorite prompts:', error);
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
            console.error('Failed to export data:', error);
            throw new Error('Unable to export data.');
        }
    }

    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data.prompts || !Array.isArray(data.prompts)) {
                throw new Error('Invalid data format.');
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
            console.error('Failed to import data:', error);
            throw new Error('Unable to import data.');
        }
    }

    async clearAllData() {
        try {
            await chrome.storage.local.remove([this.storageKey]);
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            throw new Error('Unable to clear data.');
        }
    }

    validateTitle(title) {
        if (!title || typeof title !== 'string') {
            throw new Error('Title is required.');
        }
        
        const trimmed = title.trim();
        if (trimmed.length === 0) {
            throw new Error('Please enter a title.');
        }
        
        if (trimmed.length > 100) {
            throw new Error('Title must be 100 characters or less.');
        }
        
        return trimmed;
    }

    validateContent(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Content is required.');
        }
        
        const trimmed = content.trim();
        if (trimmed.length === 0) {
            throw new Error('Please enter content.');
        }
        
        const wordCount = trimmed.split(/\s+/).length;
        if (wordCount > 5000) {
            throw new Error('Content must be 5000 words or less.');
        }
        
        return trimmed;
    }

    validateFolderName(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('Folder name is required.');
        }
        
        const trimmed = name.trim();
        if (trimmed.length === 0) {
            throw new Error('Please enter a folder name.');
        }
        
        if (trimmed.length > 50) {
            throw new Error('Folder name must be 50 characters or less.');
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
            console.error('Failed to query storage stats:', error);
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
            console.error('Failed to clear data:', error);
            throw new Error('Unable to clear data.');
        }
    }
}

const promptStorage = new PromptStorage();