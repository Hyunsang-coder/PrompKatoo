function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    
    if (diff < minute) {
        return 'Just now';
    } else if (diff < hour) {
        return `${Math.floor(diff / minute)} min ago`;
    } else if (diff < day) {
        return `${Math.floor(diff / hour)}h ago`;
    } else if (diff < week) {
        return `${Math.floor(diff / day)}d ago`;
    } else if (diff < month) {
        return `${Math.floor(diff / week)}w ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

function extractVariables(content) {
    if (!content) return [];
    
    const variableRegex = /\[([^\[\]]+)\]/g;
    const variables = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
        const variable = match[1].trim();
        if (variable && !variables.includes(variable)) {
            variables.push(variable);
        }
    }
    
    return variables;
}

function replaceVariables(content, variableValues) {
    if (!content || !variableValues) return content;
    
    let result = content;
    
    Object.entries(variableValues).forEach(([variable, value]) => {
        const regex = new RegExp(`\\[${escapeRegExp(variable)}\\]`, 'g');
        result = result.replace(regex, value || '');
    });
    
    return result;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const result = document.execCommand('copy');
            document.body.removeChild(textArea);
            return result;
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

function showToast(message, type = 'success', duration = 2000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function validateVariableName(name) {
    if (!name || typeof name !== 'string') return false;
    
    const trimmed = name.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.length > 50) return false;
    
    const validNameRegex = /^[a-zA-Z가-힣][a-zA-Z0-9가-힣_\s]*$/;
    return validNameRegex.test(trimmed);
}

function parseVariableInput(input) {
    if (!input) return '';
    return input.trim();
}

function sortPrompts(prompts, sortBy = 'recent') {
    const sortedPrompts = [...prompts];
    
    switch (sortBy) {
        case 'recent':
            return sortedPrompts.sort((a, b) => {
                if (a.isFavorite !== b.isFavorite) {
                    return b.isFavorite - a.isFavorite;
                }
                return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
            });
            
        case 'alphabetical':
            return sortedPrompts.sort((a, b) => {
                if (a.isFavorite !== b.isFavorite) {
                    return b.isFavorite - a.isFavorite;
                }
                return a.title.localeCompare(b.title, 'en');
            });
            
        case 'usage':
            return sortedPrompts.sort((a, b) => {
                if (a.isFavorite !== b.isFavorite) {
                    return b.isFavorite - a.isFavorite;
                }
                return b.usageCount - a.usageCount;
            });
            
        case 'favorites':
            return sortedPrompts.filter(p => p.isFavorite)
                .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
            
        default:
            return sortedPrompts;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function exportToFile(data, filename = 'prompt-manager-backup.json') {
    try {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Failed to export file:', error);
        return false;
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        
        reader.readAsText(file);
    });
}

function getVariableInputHtml(variables, defaults = {}) {
    return variables.map(variable => {
        const defaultValue = defaults[variable] || '';
        const placeholder = defaultValue ? `Default: ${defaultValue}` : 'Enter value...';
        
        return `
            <div class="variable-input-group">
                <label for="var_${variable}">[${sanitizeHtml(variable)}]</label>
                <input 
                    type="text" 
                    id="var_${variable}" 
                    name="${variable}" 
                    value="${sanitizeHtml(defaultValue)}"
                    placeholder="${sanitizeHtml(placeholder)}"
                    autocomplete="off"
                >
            </div>
        `;
    }).join('');
}

function extractTextFromElement(element) {
    if (!element) return '';
    
    const clone = element.cloneNode(true);
    const highlights = clone.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        highlight.replaceWith(highlight.textContent);
    });
    
    return clone.textContent || clone.innerText || '';
}

function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

function createElementFromHTML(htmlString) {
    const template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function setElementVisibility(element, visible) {
    if (!element) return;
    
    if (visible) {
        element.style.display = '';
        element.removeAttribute('hidden');
    } else {
        element.style.display = 'none';
        element.setAttribute('hidden', '');
    }
}

// ============================
// DEBUGGING TOOLS
// ============================

/**
 * Debugging utilities for Pocket Prompt import troubleshooting
 * Use these functions in the browser console for diagnostics
 */

async function debugStorageState() {
    console.log('🔍 ===== STORAGE STATE DEBUG =====');
    
    try {
        // Get all storage data
        const prompts = await promptStorage.getAllPrompts();
        const folders = await promptStorage.getAllFolders();
        
        console.log('📊 Storage Summary:');
        console.log('  - Total Prompts:', prompts.length);
        console.log('  - Total Folders:', folders.length);
        console.log('  - Prompts in Home:', prompts.filter(p => p.folderId === 'home').length);
        
        // Validate data integrity
        const validation = await promptStorage.validateDataIntegrity();
        console.log('✅ Data Integrity:', validation.isValid ? 'VALID' : 'INVALID');
        
        if (!validation.isValid) {
            console.log('❌ Issues Found:');
            validation.folders.issues.forEach(issue => console.log('  - Folder:', issue));
            validation.prompts.issues.forEach(issue => console.log('  - Prompt:', issue));
        }
        
        // Group prompts by folder
        const promptsByFolder = {};
        prompts.forEach(prompt => {
            if (!promptsByFolder[prompt.folderId]) {
                promptsByFolder[prompt.folderId] = [];
            }
            promptsByFolder[prompt.folderId].push(prompt);
        });
        
        console.log('📁 Prompts by Folder:');
        Object.entries(promptsByFolder).forEach(([folderId, folderPrompts]) => {
            const folder = folders.find(f => f.id === folderId) || { name: folderId === 'home' ? 'Home' : 'Unknown' };
            console.log(`  - ${folder.name} (${folderId}): ${folderPrompts.length} prompts`);
        });
        
        return { prompts, folders, validation, promptsByFolder };
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
        return { error: error.message };
    }
}

async function debugImportProcess(jsonData) {
    console.log('🔍 ===== IMPORT PROCESS DEBUG =====');
    
    try {
        // Parse JSON if string
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        console.log('📄 Import Data Analysis:');
        console.log('  - Data Type:', Array.isArray(data) ? 'Array (Legacy)' : 'Object (Structured)');
        
        if (Array.isArray(data)) {
            console.log('  - Item Count:', data.length);
            console.log('  - Valid Items:', data.filter(item => item.title && item.content).length);
            console.log('  - Sample Item:', data[0]);
        } else {
            console.log('  - Has Prompts:', !!data.prompts, data.prompts ? `(${data.prompts.length})` : '');
            console.log('  - Has Folders:', !!data.folders, data.folders ? `(${data.folders.length})` : '');
            
            if (data.prompts) {
                console.log('  - Valid Prompts:', data.prompts.filter(p => p.title && p.content).length);
                console.log('  - Sample Prompt:', data.prompts[0]);
            }
            
            if (data.folders) {
                console.log('  - Valid Folders:', data.folders.filter(f => f.name).length);
                console.log('  - Sample Folder:', data.folders[0]);
            }
        }
        
        // Check for potential issues
        const issues = [];
        
        if (Array.isArray(data)) {
            const invalidItems = data.filter(item => !item.title || !item.content);
            if (invalidItems.length > 0) {
                issues.push(`${invalidItems.length} invalid items without title/content`);
            }
        } else {
            if (data.folders) {
                const invalidFolders = data.folders.filter(f => !f.name);
                if (invalidFolders.length > 0) {
                    issues.push(`${invalidFolders.length} invalid folders without name`);
                }
                
                // Check for circular references
                const folderIds = data.folders.map(f => f.id);
                const duplicateIds = folderIds.filter((id, index) => folderIds.indexOf(id) !== index);
                if (duplicateIds.length > 0) {
                    issues.push(`Duplicate folder IDs: ${duplicateIds.join(', ')}`);
                }
            }
            
            if (data.prompts) {
                const invalidPrompts = data.prompts.filter(p => !p.title || !p.content);
                if (invalidPrompts.length > 0) {
                    issues.push(`${invalidPrompts.length} invalid prompts without title/content`);
                }
            }
        }
        
        if (issues.length > 0) {
            console.log('⚠️ Potential Issues:');
            issues.forEach(issue => console.log('  -', issue));
        } else {
            console.log('✅ No obvious issues detected');
        }
        
        return { data, issues, isValid: issues.length === 0 };
        
    } catch (error) {
        console.error('❌ Import debug failed:', error);
        return { error: error.message };
    }
}

async function debugClearStorage() {
    console.log('🧹 ===== CLEARING STORAGE =====');
    console.warn('⚠️ This will delete ALL data! Type debugClearStorageConfirm() to proceed.');
}

async function debugClearStorageConfirm() {
    console.log('🧹 Clearing all storage data...');
    
    try {
        await promptStorage.clearAllData();
        console.log('✅ Storage cleared successfully');
        
        // Verify it's cleared
        const prompts = await promptStorage.getAllPrompts();
        const folders = await promptStorage.getAllFolders();
        
        console.log('📊 Post-clear state:');
        console.log('  - Prompts:', prompts.length);
        console.log('  - Folders:', folders.length);
        
        return { success: true, prompts: prompts.length, folders: folders.length };
        
    } catch (error) {
        console.error('❌ Clear failed:', error);
        return { error: error.message };
    }
}

async function debugTestImport(sampleData = null) {
    console.log('🧪 ===== TEST IMPORT =====');
    
    const testData = sampleData || {
        prompts: [
            {
                id: 'test-1',
                title: 'Test Prompt 1',
                content: 'This is a test prompt with [variable]',
                folderId: 'home',
                isFavorite: false,
                createdAt: Date.now()
            },
            {
                id: 'test-2', 
                title: 'Test Prompt 2',
                content: 'Another test prompt',
                folderId: 'test-folder',
                isFavorite: true,
                createdAt: Date.now()
            }
        ],
        folders: [
            {
                id: 'test-folder',
                name: 'Test Folder',
                icon: '🧪',
                parentId: null,
                createdAt: Date.now()
            }
        ]
    };
    
    try {
        console.log('📄 Using test data:', testData);
        
        // Get state before
        const beforeState = await debugStorageState();
        console.log('📊 Before import:', beforeState.prompts.length, 'prompts,', beforeState.folders.length, 'folders');
        
        // Simulate import process
        console.log('🔄 Starting test import...');
        
        // Create a test instance to access import methods
        const manager = new FolderPromptManager();
        await manager.importDataToStorage(testData);
        
        // Get state after
        const afterState = await debugStorageState();
        console.log('📊 After import:', afterState.prompts.length, 'prompts,', afterState.folders.length, 'folders');
        
        console.log('✅ Test import completed');
        return { success: true, before: beforeState, after: afterState };
        
    } catch (error) {
        console.error('❌ Test import failed:', error);
        return { error: error.message };
    }
}

function debugStorageWatch() {
    console.log('👁️ ===== STORAGE WATCHER =====');
    console.log('Listening for storage changes... (Check console for updates)');
    
    if (chrome?.storage?.onChanged) {
        const listener = (changes, areaName) => {
            if (areaName === 'local') {
                console.log('🔄 Storage changed:', Object.keys(changes));
                Object.entries(changes).forEach(([key, change]) => {
                    if (key.includes('prompt_manager')) {
                        const oldLength = change.oldValue ? (Array.isArray(change.oldValue) ? change.oldValue.length : Object.keys(change.oldValue).length) : 0;
                        const newLength = change.newValue ? (Array.isArray(change.newValue) ? change.newValue.length : Object.keys(change.newValue).length) : 0;
                        console.log(`  - ${key}: ${oldLength} → ${newLength} items`);
                    }
                });
            }
        };
        
        chrome.storage.onChanged.addListener(listener);
        
        // Return function to stop watching
        return () => {
            chrome.storage.onChanged.removeListener(listener);
            console.log('👁️ Storage watching stopped');
        };
    } else {
        console.log('⚠️ Chrome storage API not available');
        return null;
    }
}

// Make debugging functions globally available
if (typeof window !== 'undefined') {
    window.debugStorageState = debugStorageState;
    window.debugImportProcess = debugImportProcess;
    window.debugClearStorage = debugClearStorage;
    window.debugClearStorageConfirm = debugClearStorageConfirm;
    window.debugTestImport = debugTestImport;
    window.debugStorageWatch = debugStorageWatch;
    
    console.log('🔧 Debug tools loaded! Available functions:');
    console.log('  - debugStorageState() - Check current storage state');
    console.log('  - debugImportProcess(jsonData) - Analyze import data');
    console.log('  - debugClearStorage() - Clear all data (with confirmation)');
    console.log('  - debugTestImport() - Run test import');
    console.log('  - debugStorageWatch() - Watch storage changes');
}