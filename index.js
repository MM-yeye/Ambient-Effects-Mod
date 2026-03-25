// Ambient Effects - 修复内置特效形状
(function() {
    setTimeout(() => {
        try {
            initPlugin();
        } catch (e) {
            console.warn("氛围特效插件启动失败:", e);
        }
    }, 500);

    function initPlugin() {
        const CANVAS_ID = 'st-ambient-canvas';
        const MENU_ID = 'ambient-effects-menu';
        const STYLE_ID = 'ambient-custom-style';
        
        // 配置
        let config = {
            enabled: false,
            type: 'snow',
            speed: 2,
            size: 3,
            count: 100,
            color: '#ffffff'
        };

        // 内置特效列表
        const builtInEffects = [
            { id: 'snow', name: '柔光雪花', type: 'builtin' },
            { id: 'star', name: '闪烁星光', type: 'builtin' },
            { id: 'leaf', name: '飘落树叶', type: 'builtin' },
            { id: 'flower', name: '飞舞花瓣', type: 'builtin' }
        ];
        
        // 用户特效库
        let userEffects = [];

        // 读取存储
        try {
            const saved = localStorage.getItem('st_ambient_config');
            if (saved) config = { ...config, ...JSON.parse(saved) };
            const savedEffects = localStorage.getItem('st_ambient_effects');
            if (savedEffects) userEffects = JSON.parse(savedEffects);
        } catch (err) {}

        function saveEffects() { localStorage.setItem('st_ambient_effects', JSON.stringify(userEffects)); }
        function saveConfig() { localStorage.setItem('st_ambient_config', JSON.stringify(config)); }

        // --- CSS特效管理 ---
        let styleElement = null;
        function generateCSS() {
            const effect = getAllEffectsForSelect().find(e => e.id === config.type);
            if (!effect || effect.type !== 'css' || !config.enabled) return '';
            let css = effect.code || '';
            css = css.replace(/{{size}}/g, config.size);
            css = css.replace(/{{speed}}/g, config.speed);
            css = css.replace(/{{color}}/g, config.color);
            css = css.replace(/{{count}}/g, config.count);
            return css;
        }
        
        function applyEffect() {
            if (!styleElement) {
                styleElement = document.getElementById(STYLE_ID);
                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.id = STYLE_ID;
                    document.head.appendChild(styleElement);
                }
            }
            styleElement.textContent = generateCSS();
        }

        // 添加特效
        function addEffect(name, type, codeOrImage) {
            const id = 'eff_' + Date.now();
            userEffects.push({ id, name, type, code: type === 'css' ? codeOrImage : null, imageData: type === 'image' ? codeOrImage : null });
            saveEffects();
            refreshAll();
            toastr.success(`特效 "${name}" 已添加`);
        }

        // 更新CSS
        function updateCSS(id, newCode) {
            const effect = userEffects.find(e => e.id === id);
            if (effect && effect.type === 'css') {
                effect.code = newCode;
                saveEffects();
                if (config.type === effect.name && config.enabled) applyEffect();
                refreshAll();
                toastr.success('已更新');
            }
        }

        // 删除特效
        function deleteEffect(id) {
            const effect = userEffects.find(e => e.id === id);
            if (effect && config.type === effect.name) config.type = 'snow';
            userEffects = userEffects.filter(e => e.id !== id);
            saveEffects();
            saveConfig();
            refreshAll();
            if (config.enabled) applyEffect();
            toastr.success('已删除');
        }

        function getAllEffectsForSelect() {
            return [...builtInEffects, ...userEffects];
        }

        function refreshAll() {
            refreshTypeSelect();
            refreshEffectList();
            if (config.enabled) applyEffect();
        }

        function refreshTypeSelect() {
            const select = document.getElementById('ambient_type');
            if (!select) return;
            const current = select.value;
            const allEffects = getAllEffectsForSelect();
            select.innerHTML = allEffects.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
            select.value = current;
        }

        function refreshEffectList() {
            const container = document.getElementById('ambient-effect-list');
            if (!container) return;
            
            if (userEffects.length === 0) {
                container.innerHTML = '<div class="ambient-desc">暂无自定义特效，点击上方按钮添加</div>';
                return;
            }
            
            container.innerHTML = userEffects.map(effect => {
                const isCss = effect.type === 'css';
                const preview = isCss ? (effect.code ? effect.code.substring(0, 80) : '') : '图片特效';
                
                return `
                    <div style="border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; margin-bottom: 6px;">
                        <div class="effect-header" style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; cursor: pointer; background: var(--SmartThemeBlurTintColor); border-radius: 6px;">
                            <span style="font-size: 13px;">${effect.name}</span>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button class="menu_button use-effect" data-id="${effect.id}" style="padding: 2px 8px; font-size: 12px;">使用</button>
                                <button class="menu_button red_button delete-effect" data-id="${effect.id}" style="padding: 2px 8px; font-size: 12px;">删除</button>
                                <span class="effect-toggle" style="font-size: 12px; cursor: pointer; padding: 0 4px;">▼</span>
                            </div>
                        </div>
                        <div class="effect-body" style="display: none; padding: 8px; border-top: 1px solid var(--SmartThemeBorderColor);">
                            ${isCss ? `
                                <textarea id="css-edit-${effect.id}" rows="5" style="width: 100%; font-family: monospace; font-size: 11px; background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 4px; padding: 6px; margin-bottom: 6px;">${escapeHtml(effect.code || '')}</textarea>
                                <button class="menu_button save-css" data-id="${effect.id}" style="padding: 3px 12px; font-size: 12px;">保存</button>
                                <div class="ambient-desc" style="margin-top: 6px; font-size: 11px;">提示：CSS代码中可使用 {{size}} {{speed}} {{color}} {{count}} 变量，下方滑块会自动替换</div>
                            ` : `
                                <div style="font-size: 11px; color: var(--SmartThemeBodyColor); opacity: 0.7;">${preview}</div>
                            `}
                        </div>
                    </div>
                `;
            }).join('');
            
            container.querySelectorAll('.effect-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    const body = header.nextElementSibling;
                    const toggle = header.querySelector('.effect-toggle');
                    if (body.style.display === 'none') {
                        body.style.display = 'block';
                        toggle.textContent = '▲';
                    } else {
                        body.style.display = 'none';
                        toggle.textContent = '▼';
                    }
                });
            });
            
            container.querySelectorAll('.use-effect').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const effect = userEffects.find(e => e.id === id);
                    if (effect) {
                        config.type = effect.id;
                        saveConfig();
                        if (config.enabled) applyEffect();
                        toastr.info(`已切换到: ${effect.name}`);
                        document.getElementById('ambient_type').value = effect.id;
                    }
                });
            });
            
            container.querySelectorAll('.delete-effect').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteEffect(btn.dataset.id);
                });
            });
            
            container.querySelectorAll('.save-css').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const textarea = document.getElementById(`css-edit-${id}`);
                    if (textarea) updateCSS(id, textarea.value);
                });
            });
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }

        function createNewCSS() {
            const name = prompt('给CSS特效起个名字:');
            if (!name) return;
            const defaultCode = `/* ${name} - 使用变量控制效果 */\n/* 可用变量: {{size}} {{speed}} {{color}} {{count}} */\n\nbody::before {\n    content: "";\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    pointer-events: none;\n    z-index: 9999;\n    background: radial-gradient(circle, {{color}}80, transparent);\n    animation: glow {{speed}}s infinite;\n}\n@keyframes glow {\n    0% { opacity: 0.3; }\n    50% { opacity: 0.8; }\n    100% { opacity: 0.3; }\n}`;
            addEffect(name, 'css', defaultCode);
        }

        function importCSSFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.css';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const name = prompt('给导入的CSS起个名字:', file.name.split('.')[0]);
                    if (name) addEffect(name, 'css', ev.target.result);
                };
                reader.readAsText(file);
            };
            input.click();
        }

        function importImageFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const name = prompt('给图片特效起个名字:', file.name.split('.')[0]);
                    if (name) addEffect(name, 'image', ev.target.result);
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }

        // --- 粒子系统（修复形状）---
        let ctx, particles = [], w, h, animFrame;
        
        // 绘制函数
        function drawParticle(ctx, type, size, color, opacity) {
            ctx.fillStyle = color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = color;
            ctx.globalAlpha = opacity;
            
            switch(type) {
                case 'star':
                    // 星形
                    ctx.beginPath();
                    const spikes = 5;
                    const outerR = size;
                    const innerR = size * 0.5;
                    for (let i = 0; i < spikes * 2; i++) {
                        const radius = i % 2 === 0 ? outerR : innerR;
                        const angle = (Math.PI * 2 * i) / (spikes * 2);
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.fill();
                    break;
                case 'leaf':
                    // 树叶形
                    ctx.beginPath();
                    ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    ctx.moveTo(-size, 0);
                    ctx.lineTo(size, 0);
                    ctx.stroke();
                    break;
                case 'flower':
                    // 花瓣形
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.bezierCurveTo(size, -size, size * 1.5, 0, 0, size);
                    ctx.bezierCurveTo(-size * 1.5, 0, -size, -size, 0, 0);
                    ctx.fill();
                    break;
                default: // snow 或其他
                    ctx.beginPath();
                    ctx.arc(0, 0, size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            ctx.shadowBlur = 0;
        }
        
        class Particle {
            constructor() { this.reset(true); }
            reset(init) {
                this.x = Math.random() * w;
                this.y = init ? Math.random() * h : -20;
                this.size = Math.random() * config.size + (config.size/2);
                this.speedY = (Math.random() * 0.5 + 0.5) * config.speed;
                this.speedX = (Math.random() - 0.5) * (config.speed * 0.5);
                this.angle = Math.random() * 360;
                this.spin = (Math.random() - 0.5) * 2;
                this.opacity = Math.random() * 0.5 + 0.3;
                this.type = config.type;  // 记录粒子类型
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
                this.angle += this.spin;
                if (this.y > h + 20 || this.x > w + 20 || this.x < -20) this.reset();
                this.type = config.type;  // 更新类型
            }
            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle * Math.PI / 180);
                
                const imgEffect = userEffects.find(e => e.name === config.type && e.type === 'image');
                if (imgEffect && imgEffect.imageData) {
                    const img = new Image();
                    img.src = imgEffect.imageData;
                    ctx.drawImage(img, -this.size, -this.size, this.size * 2, this.size * 2);
                } else {
                    drawParticle(ctx, config.type, this.size, config.color, this.opacity);
                }
                ctx.restore();
            }
        }

        function initCanvas() {
            if (document.getElementById(CANVAS_ID)) return;
            let canvas = document.createElement('canvas');
            canvas.id = CANVAS_ID;
            document.body.appendChild(canvas);
            ctx = canvas.getContext('2d');
            const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
            window.addEventListener('resize', resize);
            resize();
            function loop() {
                if (!ctx) return;
                ctx.clearRect(0, 0, w, h);
                const currentEffect = getAllEffectsForSelect().find(e => e.id === config.type);
                const isParticle = config.enabled && currentEffect && currentEffect.type !== 'css';
                if (isParticle) {
                    if (particles.length < config.count) {
                        while(particles.length < config.count) particles.push(new Particle());
                    } else if (particles.length > config.count) {
                        particles.splice(config.count);
                    }
                    particles.forEach(p => { p.update(); p.draw(); });
                } else {
                    particles = [];
                }
                animFrame = requestAnimationFrame(loop);
            }
            loop();
        }
        function resetParticles() { particles = []; }

        function setEnabled(enabled) {
            config.enabled = enabled;
            saveConfig();
            if (enabled) applyEffect();
            else if (styleElement) styleElement.textContent = '';
            resetParticles();
        }

        function updateParticleSettings() {
            saveConfig();
            if (config.enabled) {
                const currentEffect = getAllEffectsForSelect().find(e => e.id === config.type);
                if (currentEffect && currentEffect.type === 'css') applyEffect();
                else resetParticles();
            }
        }

        // 菜单注入
        function injectMenu() {
            const container = jQuery('#extensions_settings');
            if (!container.length || jQuery(`#${MENU_ID}`).length) return;

            const html = `
                <div id="${MENU_ID}" class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>氛围特效</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                    </div>
                    <div class="inline-drawer-content ambient-settings-box">
                        <div class="ambient-control-row" style="margin-bottom: 10px;">
                            <label style="font-weight: bold;">全局开关</label>
                            <input type="checkbox" id="ambient_master_switch" ${config.enabled ? 'checked' : ''}>
                        </div>
                        
                        <div class="ambient-control-row">
                            <label>特效类型</label>
                            <select id="ambient_type"></select>
                        </div>
                        
                        <div id="ambient-particle-controls">
                            <div class="ambient-control-row"><label>颜色</label><input type="color" id="ambient_color" value="${config.color}"></div>
                            <div class="ambient-control-row"><label>粒子大小</label><input type="range" id="ambient_size" min="1" max="10" step="0.5" value="${config.size}"></div>
                            <div class="ambient-control-row"><label>飘落速度</label><input type="range" id="ambient_speed" min="0.5" max="10" step="0.5" value="${config.speed}"></div>
                            <div class="ambient-control-row"><label>粒子密度</label><input type="range" id="ambient_count" min="10" max="300" step="10" value="${config.count}"></div>
                        </div>
                        
                        <div style="border-top: 1px solid var(--SmartThemeBorderColor); margin: 12px 0;"></div>
                        
                        <div style="margin-bottom: 8px;">
                            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                                <button id="ambient-new-css" class="menu_button">新建CSS特效</button>
                                <button id="ambient-import-css" class="menu_button">导入CSS文件</button>
                                <button id="ambient-import-img" class="menu_button">添加图片特效</button>
                            </div>
                            <div id="ambient-effect-list"></div>
                        </div>
                    </div>
                </div>
            `;
            container.append(html);

            jQuery('#ambient_master_switch').on('change', function() { setEnabled(jQuery(this).is(':checked')); });
            jQuery('#ambient_type').on('change', function() {
                const val = jQuery(this).val();
                config.type = val;
                saveConfig();
                if (config.enabled) {
                    const effect = getAllEffectsForSelect().find(e => e.id === val);
                    if (effect && effect.type === 'css') applyEffect();
                    resetParticles();
                }
            });
            jQuery('#ambient_color').on('input', function() { config.color = jQuery(this).val(); updateParticleSettings(); });
            jQuery('#ambient_size').on('input', function() { config.size = parseFloat(jQuery(this).val()); updateParticleSettings(); });
            jQuery('#ambient_speed').on('input', function() { config.speed = parseFloat(jQuery(this).val()); updateParticleSettings(); });
            jQuery('#ambient_count').on('input', function() { config.count = parseInt(jQuery(this).val()); updateParticleSettings(); });
            jQuery('#ambient-new-css').on('click', createNewCSS);
            jQuery('#ambient-import-css').on('click', importCSSFile);
            jQuery('#ambient-import-img').on('click', importImageFile);
            
            refreshAll();
        }

        initCanvas();
        const interval = setInterval(() => {
            if (jQuery('#extensions_settings').length) {
                injectMenu();
                clearInterval(interval);
            }
        }, 1000);
    }
})();
