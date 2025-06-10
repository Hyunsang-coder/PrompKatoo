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