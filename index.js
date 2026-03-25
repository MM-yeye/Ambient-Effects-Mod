// Ambient-Effects Mod - 支持自定义特效导入/删除
import { getContext, extension_settings, loadExtensionSettings, saveExtensionSettings } from '../../../extensions.js';
import { debounce, getApiUrl, doExtrasFetch } from '../../../utils.js';

const MODULE_NAME = 'ambient-effects-mod';
let settings = {
    enabled: false,
    effectType: 'particle',
    currentUserEffect: null
};

let effectContainer = null;

// 获取扩展路径
function getExtensionPath() {
    return `extensions/${MODULE_NAME}`;
}

// 获取用户特效存储路径
function getUserEffectsPath() {
    return `${getExtensionPath()}/user_effects/`;
}

// 加载用户特效列表
async function loadUserEffects() {
    try {
        const response = await fetch('/api/plugins/list-dir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: getUserEffectsPath() })
        });
        const files = await response.json();
        return files.filter(f => f.isDirectory || f.name.endsWith('.json') || f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.mp4') || f.name.endsWith('.webm'));
    } catch (e) {
        console.warn('无法加载用户特效', e);
        return [];
    }
}

// 导入特效文件
async function importEffect(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', getUserEffectsPath());
    
    const response = await fetch('/api/plugins/upload-file', {
        method: 'POST',
        body: formData
    });
    
    if (response.ok) {
        toastr.success(`特效 "${file.name}" 导入成功！`);
        refreshEffectList();
        return true;
    } else {
        toastr.error(`导入 "${file.name}" 失败`);
        return false;
    }
}

// 删除特效
async function deleteEffect(effectName) {
    if (!confirm(`确定要删除特效 "${effectName}" 吗？`)) return;
    
    const path = `${getUserEffectsPath()}${effectName}`;
    const response = await fetch('/api/plugins/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
    });
    
    if (response.ok) {
        toastr.success(`特效 "${effectName}" 已删除`);
        refreshEffectList();
    } else {
        toastr.error('删除失败');
    }
}

// 刷新特效列表显示
async function refreshEffectList() {
    const effects = await loadUserEffects();
    const container = document.getElementById('ambient-effect-list');
    if (!container) return;
    
    if (effects.length === 0) {
        container.innerHTML = '<div class="text_muted" style="padding: 10px;">暂无自定义特效，点击"导入特效"添加</div>';
        return;
    }
    
    container.innerHTML = effects.map(effect => `
        <div class="effect-item" data-name="${effect.name}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #ccc;">
            <span class="effect-name" style="flex:1; word-break: break-all;">${effect.name}</span>
            <button class="menu_button select-effect" style="margin:0 5px; padding: 4px 8px;">✨ 使用</button>
            <button class="menu_button red_button delete-effect" style="margin:0; padding: 4px 8px;">🗑️ 删除</button>
        </div>
    `).join('');
    
    container.querySelectorAll('.select-effect').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.closest('.effect-item').dataset.name;
            selectUserEffect(name);
        });
    });
    
    container.querySelectorAll('.delete-effect').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.closest('.effect-item').dataset.name;
            deleteEffect(name);
        });
    });
}

// 选择用户特效
function selectUserEffect(effectName) {
    settings.currentUserEffect = effectName;
    settings.enabled = true;
    saveSettings();
    toastr.info(`已切换到特效: ${effectName}`);
    applyEffect();
}

// 特效渲染逻辑
function applyEffect() {
    if (!effectContainer) return;
    
    if (settings.enabled === false) {
        effectContainer.style.opacity = '0';
        return;
    }
    
    effectContainer.style.opacity = '1';
    
    if (settings.currentUserEffect) {
        const effectPath = `${getUserEffectsPath()}${settings.currentUserEffect}`;
        if (settings.currentUserEffect.endsWith('.mp4') || settings.currentUserEffect.endsWith('.webm')) {
            effectContainer.innerHTML = `<video src="${effectPath}" autoplay loop muted style="width:100%; height:100%; object-fit:cover;"></video>`;
        } else {
            effectContainer.style.background = `url('${effectPath}') center/cover no-repeat`;
            effectContainer.innerHTML = '';
        }
    }
}

// 创建设置面板UI
function createSettingsUI() {
    const container = document.getElementById('ambient-effects-mod-settings');
    if (!container) return;
    
    container.innerHTML = `
        <div class="ambient-effects-settings" style="padding: 10px;">
            <h3 style="margin-bottom: 10px;">✨ 环境特效设置</h3>
            <div class="flex-container" style="margin-bottom: 15px;">
                <label class="checkbox_label">
                    <input type="checkbox" id="ambient-enabled" ${settings.enabled ? 'checked' : ''}>
                    <span>启用特效</span>
                </label>
            </div>
            
            <div class="ambient-effects-user-effects" style="margin-top: 15px; padding: 10px; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc;">
                <h4 style="margin: 0 0 10px 0;">📦 自定义特效管理</h4>
                <div style="margin-bottom: 10px;">
                    <input type="file" id="ambient-upload-effect" multiple style="display: none;" accept=".json,.zip,.png,.jpg,.jpeg,.gif,.mp4,.webm">
                    <button id="ambient-upload-btn" class="menu_button" style="padding: 6px 12px;">📁 导入特效文件</button>
                    <span style="margin-left: 10px; font-size: 12px; color: #888;">支持: 图片、视频、JSON、ZIP</span>
                </div>
                <div id="ambient-effect-list" class="user-effects-list" style="max-height: 250px; overflow-y: auto;">
                    加载中...
                </div>
            </div>
        </div>
    `;
    
    const enabledCheck = document.getElementById('ambient-enabled');
    if (enabledCheck) {
        enabledCheck.addEventListener('change', (e) => {
            settings.enabled = e.target.checked;
            saveSettings();
            applyEffect();
        });
    }
    
    const uploadBtn = document.getElementById('ambient-upload-btn');
    const fileInput = document.getElementById('ambient-upload-effect');
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            for (const file of e.target.files) {
                await importEffect(file);
            }
            fileInput.value = '';
        });
    }
    
    refreshEffectList();
}

function saveSettings() {
    saveExtensionSettings(MODULE_NAME, settings);
}

function loadSettings() {
    if (extension_settings[MODULE_NAME]) {
        settings = { ...settings, ...extension_settings[MODULE_NAME] };
    }
}

function init() {
    loadSettings();
    createSettingsUI();
    
    if (!document.getElementById('ambient-effects-mod-container')) {
        effectContainer = document.createElement('div');
        effectContainer.id = 'ambient-effects-mod-container';
        effectContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(effectContainer);
    } else {
        effectContainer = document.getElementById('ambient-effects-mod-container');
    }
    
    applyEffect();
}

setTimeout(init, 1000);
