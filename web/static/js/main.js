// 主要JavaScript功能文件

// 全局变量
window.CryptoEvalSystem = {
    apiBase: '/api',
    currentUser: null,
    debug: true
};

// 工具函数
const Utils = {
    // 格式化日期
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // 格式化文件大小
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 获取文件图标
    getFileIcon: function(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'txt': 'fas fa-file-alt',
            'zip': 'fas fa-file-archive',
            'rar': 'fas fa-file-archive'
        };
        return iconMap[ext] || 'fas fa-file';
    },

    // 获取状态文本
    getStatusText: function(status) {
        const statusMap = {
            'pending': '待处理',
            'processing': '处理中',
            'completed': '已完成',
            'failed': '失败',
            'draft': '草稿',
            'reviewing': '审核中',
            'approved': '已通过',
            'rejected': '已拒绝'
        };
        return statusMap[status] || status;
    },

    // 获取状态颜色
    getStatusColor: function(status) {
        const colorMap = {
            'pending': 'warning',
            'processing': 'info',
            'completed': 'success',
            'failed': 'danger',
            'draft': 'secondary',
            'reviewing': 'info',
            'approved': 'success',
            'rejected': 'danger'
        };
        return colorMap[status] || 'secondary';
    },

    // 显示提示消息
    showToast: function(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert" id="${toastId}">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        // 创建toast容器（如果不存在）
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1055';
            document.body.appendChild(container);
        }
        
        // 添加toast
        container.insertAdjacentHTML('beforeend', toastHtml);
        const toast = new bootstrap.Toast(document.getElementById(toastId));
        toast.show();
        
        // 自动清理
        setTimeout(() => {
            const element = document.getElementById(toastId);
            if (element) {
                element.remove();
            }
        }, 5000);
    },

    // API请求包装器
    apiRequest: async function(endpoint, options = {}) {
        const url = window.CryptoEvalSystem.apiBase + endpoint;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();
            
            if (window.CryptoEvalSystem.debug) {
                console.log('API Request:', url, finalOptions);
                console.log('API Response:', data);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            Utils.showToast('网络请求失败', 'danger');
            throw error;
        }
    },

    // 防抖函数
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 复制到剪贴板
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                Utils.showToast('已复制到剪贴板', 'success');
            });
        } else {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                Utils.showToast('已复制到剪贴板', 'success');
            } catch (err) {
                console.error('复制失败:', err);
                Utils.showToast('复制失败', 'danger');
            }
            document.body.removeChild(textArea);
        }
    }
};

// 文件上传组件
class FileUploader {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            multiple: true,
            acceptTypes: ['image/*', '.pdf', '.docx', '.doc'],
            maxSize: 16 * 1024 * 1024, // 16MB
            onSuccess: null,
            onError: null,
            ...options
        };
        this.files = [];
        this.init();
    }

    init() {
        this.createUploadArea();
        this.bindEvents();
    }

    createUploadArea() {
        this.container.innerHTML = `
            <div class="upload-area" id="uploadArea">
                <div class="upload-content">
                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                    <h5>拖拽文件到此处或点击选择</h5>
                    <p class="text-muted">支持 PDF, Word, 图片等格式，最大 16MB</p>
                    <button type="button" class="btn btn-primary" id="selectBtn">
                        <i class="fas fa-folder-open"></i> 选择文件
                    </button>
                </div>
                <input type="file" id="fileInput" multiple accept="${this.options.acceptTypes.join(',')}" style="display: none;">
            </div>
            <div id="fileList" class="mt-3"></div>
        `;
    }

    bindEvents() {
        const uploadArea = this.container.querySelector('#uploadArea');
        const fileInput = this.container.querySelector('#fileInput');
        const selectBtn = this.container.querySelector('#selectBtn');

        // 点击选择文件
        selectBtn.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('click', () => fileInput.click());

        // 文件选择
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // 拖拽事件
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
    }

    handleFiles(fileList) {
        for (let file of fileList) {
            if (this.validateFile(file)) {
                this.addFile(file);
            }
        }
        this.renderFileList();
    }

    validateFile(file) {
        // 检查文件大小
        if (file.size > this.options.maxSize) {
            Utils.showToast(`文件 ${file.name} 超过大小限制`, 'warning');
            return false;
        }

        // 检查文件类型
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        const isValidType = this.options.acceptTypes.some(type => {
            if (type.includes('*')) {
                return file.type.startsWith(type.replace('*', ''));
            }
            return type === fileExt;
        });

        if (!isValidType) {
            Utils.showToast(`文件 ${file.name} 类型不支持`, 'warning');
            return false;
        }

        return true;
    }

    addFile(file) {
        const fileObj = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'pending'
        };
        this.files.push(fileObj);
    }

    renderFileList() {
        const fileList = this.container.querySelector('#fileList');
        if (this.files.length === 0) {
            fileList.innerHTML = '';
            return;
        }

        fileList.innerHTML = this.files.map(fileObj => `
            <div class="file-item" data-file-id="${fileObj.id}">
                <div class="d-flex align-items-center flex-grow-1">
                    <div class="file-icon ${this.getFileIconClass(fileObj.name)}">
                        <i class="${Utils.getFileIcon(fileObj.name)}"></i>
                    </div>
                    <div class="file-info flex-grow-1">
                        <div class="file-name">${fileObj.name}</div>
                        <small class="text-muted">${Utils.formatFileSize(fileObj.size)}</small>
                    </div>
                </div>
                <div class="file-actions">
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="fileUploader.removeFile('${fileObj.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFileIconClass(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (['doc', 'docx'].includes(ext)) return 'docx';
        return 'default';
    }

    removeFile(fileId) {
        this.files = this.files.filter(f => f.id != fileId);
        this.renderFileList();
    }

    async uploadFiles(evaluationId) {
        if (this.files.length === 0) {
            Utils.showToast('请先选择文件', 'warning');
            return;
        }

        const results = [];
        for (let fileObj of this.files) {
            try {
                const result = await this.uploadSingleFile(fileObj, evaluationId);
                results.push(result);
                fileObj.status = 'uploaded';
            } catch (error) {
                console.error('Upload error:', error);
                fileObj.status = 'error';
                Utils.showToast(`上传 ${fileObj.name} 失败`, 'danger');
            }
        }

        if (this.options.onSuccess) {
            this.options.onSuccess(results);
        }

        return results;
    }

    async uploadSingleFile(fileObj, evaluationId) {
        const formData = new FormData();
        formData.append('file', fileObj.file);

        const response = await fetch(`/api/evaluations/${evaluationId}/evidences`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有工具提示
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // 初始化所有弹出框
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // 全局错误处理
    window.addEventListener('error', function(e) {
        if (window.CryptoEvalSystem.debug) {
            console.error('Global error:', e.error);
        }
    });

    // 全局未处理的Promise拒绝
    window.addEventListener('unhandledrejection', function(e) {
        if (window.CryptoEvalSystem.debug) {
            console.error('Unhandled promise rejection:', e.reason);
        }
    });
});

// 暴露全局对象
window.Utils = Utils;
window.FileUploader = FileUploader;
