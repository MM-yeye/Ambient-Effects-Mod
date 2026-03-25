// Ambient Effects - 简洁版（折叠式特效库）
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

        // 内置特效列表（可删除）
        let builtInEffects = [
            { id: 'snow', name: '柔光雪花', type: 'builtin', deletable: false },
            { id: 'star', name: '闪烁星光', type: 'builtin', deletable: false },
            { id: 'leaf', name: '飘落树叶', type: 'builtin', deletable: false },
            { id: 'flower', name: '飞舞花瓣', type: 'builtin', deletable: false }
        ];
        
        // 用户特效库
        let userEffects = [];  // { id, name, type, code, imageData }

        // 读取存储
        try {
            const saved = localStorage.getItem('st_ambient_config');
            if (saved) config = { ...config, ...JSON.parse(saved) };
            const savedBuiltin = localStorage.getItem('st_ambient_builtin');
            if (savedBuiltin) builtInEffects = JSON.parse(savedBuiltin);
            const savedEffects = localStorage.getItem('st_ambient_effects');
            if (savedEffects) userEffects = JSON.parse(savedEffects);
        } catch (err) {}

        // 保存数据
        function saveBuiltin() { localStorage.setItem('st_ambient_builtin', JSON.stringify(builtInEffects)); }
        function saveEffects() { localStorage.setItem('st_ambient_effects', JSON.stringify(userEffects)); }
        function saveConfig() { localStorage.setItem('st_ambient_config', JSON.stringify(config)); }

        // --- CSS特效管理 ---
        let styleElement = null;
        function applyCSS(cssCode) {
            if (!styleElement) {
                styleElement = document.getElementById(STYLE_ID);
                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.id = STYLE_ID;
                    document.head.appendChild(styleElement);
                }
            }
            styleElement.textContent = (cssCode && config.enabled) ? cssCode : '';
        }

        // 添加特效
        function addEffect(name, type, codeOrImage) {
            const id = 'eff_' + Date.now();
            userEffects.push({ id, name, type, code: type === 'css' ? codeOrImage : null, imageData: type === 'image' ? codeOrImage : null });
            saveEffects();
            refreshAll();
            toastr.success(`特效 "${name}" 已添加`);
        }

        // 更新CSS特效
        function updateCSS(id, newCode) {
            const effect = userEffects.find(e => e.id === id);
            if (effect && effect.type === 'css') {
                effect.code = newCode;
                saveEffects();
                if (config.type === effect.name && config.enabled) applyCSS(newCode);
                refreshAll();
                toastr.success('已更新');
            }
        }

        // 删除特效
        function deleteEffect(id, isBuiltin = false, builtinId = null) {
            if (isBuiltin && builtinId) {
                builtInEffects = builtInEffects.filter(e => e.id !== builtinId);
                saveBuiltin();
                if (config.type === builtinId) config.type = 'snow';
                saveConfig();
                refreshAll();
                toastr.success('已删除内置特效');
            } else {
                const effect = userEffects.find(e => e.id === id);
                if (effect && config.type === effect.name) config.type = 'snow';
                userEffects = userEffects.filter(e => e.id !== id);
                saveEffects();
                saveConfig();
                refreshAll();
                toastr.success('已删除');
            }
            if (config.enabled) applyCSS(null);
        }

        // 获取所有特效（内置+用户）
        function getAllEffects() {
            const builtinList = builtInEffects.map(e => ({ ...e, source: 'builtin' }));
            const userList = userEffects.map(e => ({ ...e, source: 'user' }));
            return [...builtinList, ...userList];
        }

        // 刷新所有UI
        function refreshAll() {
            refreshTypeSelect();
            refreshEffectList();
        }

        // 刷新特效类型下拉框
        function refreshTypeSelect() {
            const select = document.getElementById('ambient_type');
            if (!select) return;
            const current = select.value;
            const allEffects = getAllEffects();
            select.innerHTML = allEffects.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
            select.value = current;
        }

        // 刷新特效列表（折叠式）
        function refreshEffectList() {
            const container = document.getElementById('ambient-effect-list');
            if (!container) return;
            
            const allEffects = getAllEffects();
            if (allEffects.length === 0) {
                container.innerHTML = '<div class="ambient-desc">暂无特效，点击下方按钮添加</div>';
                return;
            }
            
            container.innerHTML = allEffects.map(effect => {
                const isBuiltin = effect.source === 'builtin';
                const isCss = effect.type === 'css';
                const preview = isCss ? (effect.code ? effect.code.substring(0, 100) + (effect.code.length > 100 ? '...' : '') : '暂无代码') : (isBuiltin ? '内置粒子特效' : '图片特效');
                const deletable = isBuiltin ? effect.deletable !== false : true;
                
                return `
                    <div class="effect-folder" style="border: 1px solid var(--SmartThemeBorderColor); border-radius: 6px; margin-bottom: 8px;">
                        <div class="effect-header" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; cursor: pointer; background: var(--SmartThemeBlurTintColor); border-radius: 6px;">
                            <span style="font-weight: 500;">${effect.name}</span>
                            <span style="display: flex; gap: 8px;">
                                <button class="menu_button use-effect" data-id="${effect.id}" data-source="${effect.source}" style="padding: 2px 8px;">使用</button>
                                ${deletable ? `<button class="menu_button red_button delete-effect" data-id="${effect.id}" data-source="${effect.source}" data-builtin-id="${effect.id}" style="padding: 2px 8px;">删除</button>` : ''}
                                <span class="effect-toggle" style="font-size: 12px;">▼</span>
                            </span>
                        </div>
                        <div class="effect-body" style="display: none; padding: 12px; border-top: 1px solid var(--SmartThemeBorderColor);">
                            ${isCss ? `
                                <textarea id="css-edit-${effect.id}" rows="6" style="width: 100%; font-family: monospace; font-size: 12px; background: var(--SmartThemeBlurTintColor); color: var(--SmartThemeBodyColor); border: 1px solid var(--SmartThemeBorderColor); border-radius: 4px; padding: 8px; margin-bottom: 8px;">${escapeHtml(effect.code || '')}</textarea>
                                <div style="display: flex; gap: 8px;">
                                    <button class="menu_button save-css" data-id="${effect.id}" style="padding: 4px 12px;">保存修改</button>
                                </div>
                            ` : `
                                <div class="ambient-desc" style="margin-bottom: 8px;">${isBuiltin ? '内置粒子特效，无法编辑' : '图片特效，无法编辑'}</div>
                                <div class="ambient-desc" style="font-size: 11px;">${preview}</div>
                            `}
                        </div>
                    </div>
                `;
            }).join('');
            
            // 折叠/展开
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
            
            // 使用特效
            container.querySelectorAll('.use-effect').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const source = btn.dataset.source;
                    let effect;
                    if (source === 'builtin') {
                        effect = builtInEffects.find(e => e.id === id);
                    } else {
                        effect = userEffects.find(e => e.id === id);
                    }
                    if (effect) {
                        config.type = effect.id;
                        saveConfig();
                        if (config.enabled) {
                            if (effect.type === 'css') applyCSS(effect.code);
                            else applyCSS(null);
                        }
                        toastr.info(`已切换到: ${effect.name}`);
                    }
                });
            });
            
            // 删除特效
            container.querySelectorAll('.delete-effect').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const source = btn.dataset.source;
                    const builtinId = btn.dataset.builtinId;
                    deleteEffect(id, source === 'builtin', builtinId);
                });
            });
            
            // 保存CSS
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

        // 新建CSS特效
        function createNewCSS() {
            const name = prompt('给CSS特效起个名字:');
            if (!name) return;
            const defaultCode = `/* ${name} */\nbody::before {\n    content: "";\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    pointer-events: none;\n    z-index: 9999;\n    background: radial-gradient(circle, rgba(255,255,255,0.2), transparent);\n    animation: glow 3s infinite;\n}\n@keyframes glow {\n    0% { opacity: 0.3; }\n    50% { opacity: 0.8; }\n    100% { opacity: 0.3; }\n}`;
            addEffect(name, 'css', defaultCode);
        }

        // 导入CSS文件
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

        // 添加图片特效
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

        // --- 粒子系统 ---
        let ctx, particles = [], w, h, animFrame;
        class Particle {
            constructor() { this.reset(true); }
            reset(init) {
                this.x = Math.random() * w;
                this.y = init ? Math.random() * h : -20;
                this.size = Math.random() * config.size + (config.size/2);
                this.speedY = (Math.random()*0.5+0.5) * config.speed;
                this.speedX = (Math.random()-0.5) * (config.speed*0.5);
                this.angle = Math.random()*360;
                this.spin = (Math.random()-0.5)*2;
                this.opacity = Math.random()*0.5+0.3;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y*0.01)*0.5;
                this.angle += this.spin;
                if (this.y > h+20 || this.x > w+20 || this.x < -20) this.reset();
            }
            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle*Math.PI/180);
                ctx.globalAlpha = this.opacity;
                const imgEffect = userEffects.find(e => e.name === config.type && e.type === 'image');
                if (imgEffect && imgEffect.imageData) {
                    const img = new Image();
                    img.src = imgEffect.imageData;
                    ctx.drawImage(img, -this.size, -this.size, this.size*2, this.size*2);
                } else {
                    ctx.fillStyle = config.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI*2);
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = config.color;
                    ctx.fill();
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
                const currentEffect = getAllEffects().find(e => e.id === config.type);
                const isParticle = config.enabled && currentEffect && currentEffect.type !== 'css';
                if (isParticle) {
                    if (particles.length < config.count) while(particles.length < config.count) particles.push(new Particle());
                    else if (particles.length > config.count) particles.splice(config.count);
                    particles.forEach(p => { p.update(); p.draw(); });
                } else particles = [];
                animFrame = requestAnimationFrame(loop);
            }
            loop();
        }
        function resetParticles() { particles = []; }

        // 主开关
        function setEnabled(enabled) {
            config.enabled = enabled;
            saveConfig();
            const currentEffect = getAllEffects().find(e => e.id === config.type);
            if (enabled && currentEffect && currentEffect.type === 'css') applyCSS(currentEffect.code);
            else applyCSS(null);
            resetParticles();
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
                        <div class="ambient-control-row" style="background: rgba(0,0,0,0.05); border-radius: 6px; margin-bottom: 10px;">
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
                            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
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
                const effect = getAllEffects().find(e => e.id === val);
                if (effect && effect.type === 'css') applyCSS(effect.code);
                else applyCSS(null);
                resetParticles();
                jQuery('#ambient-particle-controls').toggle(!(effect && effect.type === 'css'));
            });
            jQuery('#ambient_color').on('input', function() { config.color = jQuery(this).val(); saveConfig(); });
            jQuery('#ambient_size').on('input', function() { config.size = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_speed').on('input', function() { config.speed = parseFloat(jQuery(this).val()); saveConfig(); resetParticles(); });
            jQuery('#ambient_count').on('input', function() { config.count = parseInt(jQuery(this).val()); saveConfig(); });
            jQuery('#ambient-new-css').on('click', createNewCSS);
            jQuery('#ambient-import-css').on('click', importCSSFile);
            jQuery('#ambient-import-img').on('click', importImageFile);
            
            refreshAll();
            const currentEffect = getAllEffects().find(e => e.id === config.type);
            jQuery('#ambient-particle-controls').toggle(!(currentEffect && currentEffect.type === 'css'));
        }

        initCanvas();
        const currentEffect = getAllEffects().find(e => e.id === config.type);
        if (config.enabled && currentEffect && currentEffect.type === 'css') applyCSS(currentEffect.code);
        const interval = setInterval(() => {
            if (jQuery('#extensions_settings').length) {
                injectMenu();
                clearInterval(interval);
            }
        }, 1000);
    }
})();
