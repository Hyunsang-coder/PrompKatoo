class PromptStorage {
    constructor() {
        this.storageKey = 'prompt_manager_data';
        this.foldersKey = 'prompt_manager_folders';
        this.migrationKey = 'prompt_manager_migration_v3_flat';
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
                    createdAt: Date.now(),
                    color: null
                };
                await chrome.storage.local.set({ [this.foldersKey]: [homeFolder] });
            }

            // Flat structure migration: remove parentId from existing folders
            if (existingFolders.length > 0) {
                const flatFolders = existingFolders.map(folder => {
                    const { parentId, ...flatFolder } = folder;
                    return flatFolder;
                });
                await chrome.storage.local.set({ [this.foldersKey]: flatFolders });
            }

            if (existingPrompts.length > 0) {
                const migratedPrompts = existingPrompts.map((prompt, index) => ({
                    ...prompt,
                    folderId: prompt.folderId || 'home',
                    order: prompt.order !== undefined ? prompt.order : index,
                    tags: prompt.tags || []
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
            // Flat structure: return all folders except home
            return folders.filter(folder => folder.id !== 'home');
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
                order: promptData.order || Date.now(),
                tags: promptData.tags || []
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

            const newFolder = {
                id: folderData.id || generateUUID(),
                name: this.validateFolderName(folderData.name),
                icon: folderData.icon || '📁',
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

            const prompts = await this.getPromptsByFolder(id);

            if (prompts.length > 0) {
                for (const prompt of prompts) {
                    await this.updatePrompt(prompt.id, { folderId: 'home' });
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

        return `Home > ${folder.name}`;
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
            const folders = await this.getAllFolders();
            const exportData = {
                prompts,
                folders,
                exportDate: new Date().toISOString(),
                version: '2.0',
                structure: 'flat'
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
                    createdAt: Date.now(),
                    color: null
                }]
            });
        } catch (error) {
            console.error('Failed to clear data:', error);
            throw new Error('Unable to clear data.');
        }
    }

    // Data integrity validation methods
    async validateFolderIntegrity() {
        try {
            const folders = await this.getAllFolders();
            const issues = [];

            // Check for home folder existence
            const homeFolder = folders.find(f => f.id === 'home');
            if (!homeFolder) {
                issues.push('Home folder missing');
            }

            // Check for duplicate folder IDs
            const folderIds = folders.map(f => f.id);
            const duplicateIds = folderIds.filter((id, index) => folderIds.indexOf(id) !== index);
            if (duplicateIds.length > 0) {
                issues.push(`Duplicate folder IDs: ${duplicateIds.join(', ')}`);
            }

            // Check for circular references
            for (const folder of folders) {
                if (this.hasCircularReference(folder, folders)) {
                    issues.push(`Circular reference detected for folder: ${folder.name} (${folder.id})`);
                }
            }

            // Flat structure: no parent relationships to validate

            return {
                isValid: issues.length === 0,
                issues: issues,
                folderCount: folders.length
            };
        } catch (error) {
            console.error('Failed to validate folder integrity:', error);
            return {
                isValid: false,
                issues: ['Failed to validate folder integrity: ' + error.message],
                folderCount: 0
            };
        }
    }

    async validatePromptIntegrity() {
        try {
            const prompts = await this.getAllPrompts();
            const folders = await this.getAllFolders();
            const issues = [];

            // Check for duplicate prompt IDs
            const promptIds = prompts.map(p => p.id);
            const duplicateIds = promptIds.filter((id, index) => promptIds.indexOf(id) !== index);
            if (duplicateIds.length > 0) {
                issues.push(`Duplicate prompt IDs: ${duplicateIds.join(', ')}`);
            }

            // Check for orphaned prompts (folder doesn't exist)
            const folderIds = folders.map(f => f.id);
            for (const prompt of prompts) {
                if (prompt.folderId && !folderIds.includes(prompt.folderId)) {
                    issues.push(`Orphaned prompt: ${prompt.title} (${prompt.id}) - folder ${prompt.folderId} not found`);
                }
            }

            // Check for invalid prompt data
            for (const prompt of prompts) {
                if (!prompt.id || !prompt.title || !prompt.content) {
                    issues.push(`Invalid prompt data: ${prompt.title || 'No title'} (${prompt.id || 'No ID'})`);
                }
            }

            return {
                isValid: issues.length === 0,
                issues: issues,
                promptCount: prompts.length
            };
        } catch (error) {
            console.error('Failed to validate prompt integrity:', error);
            return {
                isValid: false,
                issues: ['Failed to validate prompt integrity: ' + error.message],
                promptCount: 0
            };
        }
    }

    async validateDataIntegrity() {
        try {
            const [folderValidation, promptValidation] = await Promise.all([
                this.validateFolderIntegrity(),
                this.validatePromptIntegrity()
            ]);

            return {
                isValid: folderValidation.isValid && promptValidation.isValid,
                folders: folderValidation,
                prompts: promptValidation,
                summary: {
                    totalFolders: folderValidation.folderCount,
                    totalPrompts: promptValidation.promptCount,
                    totalIssues: folderValidation.issues.length + promptValidation.issues.length
                }
            };
        } catch (error) {
            console.error('Failed to validate data integrity:', error);
            return {
                isValid: false,
                folders: { isValid: false, issues: [], folderCount: 0 },
                prompts: { isValid: false, issues: [], promptCount: 0 },
                summary: { totalFolders: 0, totalPrompts: 0, totalIssues: 1 },
                error: error.message
            };
        }
    }

    hasCircularReference(folder, allFolders, visited = new Set()) {
        // Flat structure: no circular references possible
        return false;
    }

    async waitForStorageSync(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkSync = async () => {
                try {
                    // Test read/write to ensure storage is accessible
                    const testKey = '_storage_sync_test_' + Date.now();
                    const testValue = { timestamp: Date.now() };

                    await chrome.storage.local.set({ [testKey]: testValue });
                    const result = await chrome.storage.local.get([testKey]);
                    await chrome.storage.local.remove([testKey]);

                    if (result[testKey] && result[testKey].timestamp === testValue.timestamp) {
                        resolve(true);
                    } else {
                        throw new Error('Storage sync test failed');
                    }
                } catch (error) {
                    if (Date.now() - startTime > timeout) {
                        reject(new Error(`Storage sync timeout after ${timeout}ms: ${error.message}`));
                    } else {
                        // Retry after a short delay
                        setTimeout(checkSync, 100);
                    }
                }
            };

            checkSync();
        });
    }

    // Duplicate detection helpers
    isDuplicatePrompt(newPrompt, existingPrompts) {
        const newTitle = newPrompt.title.toLowerCase().trim();
        const newContent = newPrompt.content.toLowerCase().trim();
        
        return existingPrompts.some(existing => {
            const existingTitle = existing.title.toLowerCase().trim();
            const existingContent = existing.content.toLowerCase().trim();
            return existingTitle === newTitle && existingContent === newContent;
        });
    }

    isDuplicateFolder(newFolder, existingFolders) {
        const newName = newFolder.name.toLowerCase().trim();
        
        return existingFolders.some(existing => {
            const existingName = existing.name.toLowerCase().trim();
            // In flat structure, only check name (no parentId to compare)
            return existingName === newName;
        });
    }

    // Enhanced batch operations with better error handling
    async batchSavePromptsWithValidation(promptsData, options = {}) {
        try {
            console.log('🔄 Starting validated batch save for', promptsData.length, 'prompts');

            // Validate input data
            if (!Array.isArray(promptsData) || promptsData.length === 0) {
                throw new Error('Invalid prompts data provided');
            }

            // Wait for storage to be ready
            await this.waitForStorageSync();

            // Get current data
            const [currentPrompts, currentFolders] = await Promise.all([
                this.getAllPrompts(),
                this.getAllFolders()
            ]);

            console.log('📊 Current storage state:', {
                prompts: currentPrompts.length,
                folders: currentFolders.length
            });

            // Validate folder references and handle duplicates
            const folderIds = currentFolders.map(f => f.id);
            const validatedPrompts = [];
            const skippedDuplicates = [];
            const isMergeMode = options.mergeMode || false;
            
            for (const promptData of promptsData) {
                const newPrompt = {
                    id: promptData.id || generateUUID(), // Use existing ID if provided
                    title: this.validateTitle(promptData.title),
                    content: this.validateContent(promptData.content),
                    folderId: folderIds.includes(promptData.folderId) ? promptData.folderId : 'home',
                    isFavorite: promptData.isFavorite || false,
                    createdAt: promptData.createdAt || Date.now(),
                    usageCount: promptData.usageCount || 0,
                    variables: extractVariables(promptData.content),
                    updatedAt: Date.now(),
                    order: promptData.order || Date.now()
                };
                
                // Check for duplicates in merge mode
                if (isMergeMode && this.isDuplicatePrompt(newPrompt, currentPrompts)) {
                    console.log('⚠️ Skipping duplicate prompt:', newPrompt.title);
                    skippedDuplicates.push(newPrompt.title);
                    continue;
                }

                console.log('✨ Created validated prompt:', newPrompt.title, 'with ID:', newPrompt.id);
                validatedPrompts.push(newPrompt);
            }

            // Combine and save
            const allPrompts = [...currentPrompts, ...validatedPrompts];
            console.log('📦 Total prompts to save:', allPrompts.length);

            // Use a promise-based approach for storage
            return new Promise((resolve, reject) => {
                chrome.storage.local.set({ [this.storageKey]: allPrompts }, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(`Storage save failed: ${chrome.runtime.lastError.message}`));
                    } else {
                        console.log('✅ Validated batch save completed successfully');
                        resolve({
                            importedPrompts: validatedPrompts,
                            skippedDuplicates: skippedDuplicates
                        });
                    }
                });
            });
        } catch (error) {
            console.error('❌ Validated batch save failed:', error);
            throw new Error(`Failed to batch save prompts: ${error.message}`);
        }
    }

    async batchSaveFoldersWithValidation(foldersData, options = {}) {
        try {
            console.log('🔄 Starting validated batch save for', foldersData.length, 'folders');

            // Validate input data
            if (!Array.isArray(foldersData) || foldersData.length === 0) {
                throw new Error('Invalid folders data provided');
            }

            // Wait for storage to be ready
            await this.waitForStorageSync();

            // Get current folders
            const currentFolders = await this.getAllFolders();
            console.log('📊 Current folders in storage:', currentFolders.length);

            // Validate and process folder data with duplicate detection
            const validatedFolders = [];
            const skippedDuplicates = [];
            const isMergeMode = options.mergeMode || false;
            
            for (const folderData of foldersData) {
                const newFolder = {
                    id: folderData.id || generateUUID(), // Use existing ID if provided
                    name: this.validateFolderName(folderData.name),
                    icon: folderData.icon || '📁',
                    // Remove parentId for flat structure - convert legacy hierarchical imports
                    createdAt: folderData.createdAt || Date.now(),
                    color: folderData.color || null
                };
                
                // Check for duplicates in merge mode
                if (isMergeMode && this.isDuplicateFolder(newFolder, currentFolders)) {
                    console.log('⚠️ Skipping duplicate folder:', newFolder.name);
                    skippedDuplicates.push(newFolder.name);
                    continue;
                }

                console.log('✨ Created validated folder:', newFolder.name, 'with ID:', newFolder.id);
                validatedFolders.push(newFolder);
            }

            // Combine and save
            const allFolders = [...currentFolders, ...validatedFolders];
            console.log('📦 Total folders to save:', allFolders.length);

            // Use a promise-based approach for storage
            return new Promise((resolve, reject) => {
                chrome.storage.local.set({ [this.foldersKey]: allFolders }, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(`Storage save failed: ${chrome.runtime.lastError.message}`));
                    } else {
                        console.log('✅ Validated folder batch save completed successfully');
                        resolve({
                            importedFolders: validatedFolders,
                            skippedDuplicates: skippedDuplicates
                        });
                    }
                });
            });
        } catch (error) {
            console.error('❌ Validated folder batch save failed:', error);
            throw new Error(`Failed to batch save folders: ${error.message}`);
        }
    }
}

const promptStorage = new PromptStorage();