class PromptStorage {
    constructor() {
        this.storageKey = 'prompt_manager_data';
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

    async savePrompt(promptData) {
        try {
            const prompts = await this.getAllPrompts();
            
            const newPrompt = {
                id: promptData.id || generateUUID(),
                title: this.validateTitle(promptData.title),
                content: this.validateContent(promptData.content),
                isFavorite: promptData.isFavorite || false,
                createdAt: promptData.createdAt || Date.now(),
                usageCount: promptData.usageCount || 0,
                variables: extractVariables(promptData.content),
                updatedAt: Date.now()
            };

            prompts.push(newPrompt);
            await chrome.storage.local.set({ [this.storageKey]: prompts });
            
            return newPrompt;
        } catch (error) {
            console.error('프롬프트 저장 실패:', error);
            throw new Error('프롬프트를 저장할 수 없습니다.');
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

    async searchPrompts(query) {
        try {
            const prompts = await this.getAllPrompts();
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

    async getStorageStats() {
        try {
            const prompts = await this.getAllPrompts();
            const totalSize = JSON.stringify(prompts).length;
            const storageLimit = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB
            
            return {
                promptCount: prompts.length,
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
}

const promptStorage = new PromptStorage();