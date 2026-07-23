/* ========================================
   App - 主应用逻辑
   ======================================== */

class ASMRApp {
  constructor() {
    this.engine = new AudioEngine();
    this.currentTab = 'sleep';
    this.activeSounds = {};     // id -> { volume: number, def: object }
    this.customSounds = {};    // id -> { name, icon, file, objectURL }
    this.timerId = null;
    this.timerEndTime = null;
    this.timerInterval = null;
    this.customIdCounter = 0;

    this._bindElements();
    this._bindEvents();
    this._loadCustomSounds();
    this._renderCategory('sleep');
  }

  // =============================================
  // DOM 引用
  // =============================================
  _bindElements() {
    this.$soundGrid = document.getElementById('soundGrid');
    this.$emptyState = document.getElementById('emptyState');
    this.$customUploadBar = document.getElementById('customUploadBar');
    this.$mixerChannels = document.getElementById('mixerChannels');
    this.$mixerEmpty = document.getElementById('mixerEmpty');
    this.$activeCount = document.getElementById('activeCount');
    this.$timerBtn = document.getElementById('timerBtn');
    this.$timerDisplay = document.getElementById('timerDisplay');
    this.$masterStopBtn = document.getElementById('masterStopBtn');
    this.$masterVolume = document.getElementById('masterVolume');
    this.$masterVolumeVal = document.getElementById('masterVolumeVal');
    this.$timerModal = document.getElementById('timerModal');
    this.$timerModalClose = document.getElementById('timerModalClose');
    this.$customTimerInput = document.getElementById('customTimerMinutes');
    this.$toastContainer = document.getElementById('toastContainer');
    this.$customFileInput = document.getElementById('customFileInput');
    this.$customFileInput2 = document.getElementById('customFileInput2');
  }

  // =============================================
  // 事件绑定
  // =============================================
  _bindEvents() {
    // 标签切换
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTab = btn.dataset.tab;
        this._renderCategory(this.currentTab);
      });
    });

    // 主音量
    this.$masterVolume.addEventListener('input', () => {
      const val = parseInt(this.$masterVolume.value);
      this.$masterVolumeVal.textContent = val + '%';
      this.engine.setMasterVolume(val);
    });

    // 全部停止
    this.$masterStopBtn.addEventListener('click', () => this.stopAll());

    // 定时器
    this.$timerBtn.addEventListener('click', () => this._openTimerModal());
    this.$timerModalClose.addEventListener('click', () => this._closeTimerModal());
    this.$timerModal.addEventListener('click', (e) => {
      if (e.target === this.$timerModal) this._closeTimerModal();
    });

    document.querySelectorAll('.timer-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        if (minutes === 0) {
          this._clearTimer();
        } else {
          this._setTimer(minutes);
        }
        this._closeTimerModal();
      });
    });

    document.getElementById('setCustomTimer').addEventListener('click', () => {
      const minutes = parseInt(this.$customTimerInput.value);
      if (minutes && minutes > 0 && minutes <= 480) {
        this._setTimer(minutes);
        this._closeTimerModal();
      } else {
        this._toast('请输入 1-480 之间的分钟数');
      }
    });

    // 自定义文件上传
    this.$customFileInput.addEventListener('change', (e) => this._handleFileUpload(e));
    this.$customFileInput2.addEventListener('change', (e) => this._handleFileUpload(e));

    // 拖拽上传
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.currentTab === 'custom' && e.dataTransfer.files.length > 0) {
        this._processFiles(e.dataTransfer.files);
      }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.stopAll();
        this._toast('已停止全部声音');
      }
    });
  }

  // =============================================
  // 标签切换与渲染
  // =============================================
  _renderCategory(categoryId) {
    this.$soundGrid.innerHTML = '';

    if (categoryId === 'custom') {
      this._renderCustomSounds();
      return;
    }

    this.$emptyState.style.display = 'none';
    this.$customUploadBar.style.display = 'none';

    const sounds = ASMRPresets.getCategorySounds(categoryId);
    sounds.forEach(def => {
      const card = this._createSoundCard(def);
      this.$soundGrid.appendChild(card);
    });

    // 显示推荐组合
    if (this.currentTab === 'sleep') {
      this._addComboCard('sleep', '💤 深度睡眠组合');
      this._addComboCard('stormy_night', '⚡ 暴风雨夜');
      this._addComboCard('cozy_cabin', '🏠 温馨小屋');
    } else if (this.currentTab === 'focus') {
      this._addComboCard('focus', '📝 深度专注组合');
      this._addComboCard('writing_corner', '✍️ 写作角落');
    } else if (this.currentTab === 'nature') {
      this._addComboCard('nature_walk', '🚶 林中漫步');
      this._addComboCard('stormy_night', '⚡ 暴风雨夜');
    } else if (this.currentTab === 'meditation') {
      this._addComboCard('meditation_combo', '🧘 冥想入定');
    }
  }

  _renderCustomSounds() {
    this.$soundGrid.innerHTML = '';
    const customIds = Object.keys(this.customSounds);

    if (customIds.length === 0) {
      this.$emptyState.style.display = 'flex';
      this.$customUploadBar.style.display = 'none';
    } else {
      this.$emptyState.style.display = 'none';
      this.$customUploadBar.style.display = 'flex';
      customIds.forEach(id => {
        const cs = this.customSounds[id];
        const def = {
          id: id,
          type: 'custom',
          icon: cs.icon || '🎵',
          name: cs.name,
          desc: cs.file.name,
          isCustom: true
        };
        const card = this._createSoundCard(def);

        // 自定义素材卡片添加删除按钮
        const delBtn = document.createElement('button');
        delBtn.className = 'custom-delete-btn';
        delBtn.title = '删除此素材';
        delBtn.innerHTML = '✕';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._deleteCustomSound(id);
        });
        card.appendChild(delBtn);

        this.$soundGrid.appendChild(card);
      });
    }
  }

  async _deleteCustomSound(id) {
    // 先停止播放
    if (this.activeSounds[id]) {
      this._stopSound(id);
    }

    // 释放 objectURL
    const cs = this.customSounds[id];
    if (cs && cs.objectURL) {
      URL.revokeObjectURL(cs.objectURL);
    }

    delete this.customSounds[id];

    // 从 IndexedDB 中删除
    try {
      const db = await this._openDB();
      const tx = db.transaction('sounds', 'readwrite');
      tx.objectStore('sounds').delete(id);
      await new Promise(res => { tx.oncomplete = res; });
      db.close();
    } catch (e) { /* ignore */ }

    this._renderCustomSounds();
    this._toast('素材已删除');
  }

  _addComboCard(comboId, label) {
    const combo = ASMRPresets.combos[comboId];
    if (!combo) return;

    const card = document.createElement('div');
    card.className = 'sound-card combo-card';
    card.style.borderColor = 'rgba(124, 111, 247, 0.25)';
    card.style.background = 'linear-gradient(135deg, rgba(124,111,247,0.08), rgba(96,165,250,0.05))';
    card.innerHTML = `
      <div class="sound-card-icon">🌟</div>
      <div class="sound-card-name">${label}</div>
    `;
    card.addEventListener('click', async () => {
      await this.engine.resume();
      for (const s of combo.sounds) {
        const def = ASMRPresets.sounds[s.id];
        if (!this.activeSounds[s.id] && def) {
          this._playSound(def, s.vol);
        }
      }
      this._toast(`已启动：${label}`);
    });
    this.$soundGrid.appendChild(card);
  }

  // =============================================
  // 声音卡片创建
  // =============================================
  _createSoundCard(def) {
    const isActive = !!this.activeSounds[def.id];
    const vol = isActive ? this.activeSounds[def.id].volume : 50;

    const card = document.createElement('div');
    card.className = 'sound-card' + (isActive ? ' active' : '');
    card.dataset.soundId = def.id;
    card.innerHTML = `
      <div class="sound-card-icon">${def.icon}</div>
      <div class="sound-card-name">${def.name}</div>
      <div class="sound-card-volume" title="音量调节">
        <input type="range" min="0" max="100" value="${vol}" step="1" data-sound-id="${def.id}">
      </div>
    `;

    // 点击卡片切换播放
    card.addEventListener('click', async (e) => {
      if (e.target.tagName === 'INPUT') return;
      await this.engine.resume();

      if (this.activeSounds[def.id]) {
        this._stopSound(def.id);
      } else {
        this._playSound(def, vol);
      }
    });

    // 音量滑块
    const slider = card.querySelector('input[type="range"]');
    slider.addEventListener('input', (e) => {
      e.stopPropagation();
      const newVol = parseInt(e.target.value);
      const entry = this.activeSounds[def.id];
      if (entry) {
        entry.volume = newVol;
        // 通用音量设置
        if (entry.sound && entry.sound.setVolume) {
          entry.sound.setVolume(newVol);
        }
        this.engine.setVolume(def.id, newVol);
        this._updateMixerChannel(def.id, newVol);
      }
    });

    // 存储引用以便更新
    card._def = def;
    card._slider = slider;

    return card;
  }

  // =============================================
  // 播放控制
  // =============================================
  _playSound(def, vol = 50) {
    const id = def.id;
    if (this.activeSounds[id]) return;

    // 自定义上传的声音
    if (def.type === 'custom' || def.isCustom) {
      this._playCustomSound(id, vol);
      return;
    }

    const sound = this.engine.play(id, def.type, vol, def.extra || {});
    if (!sound) return;

    this.activeSounds[id] = { volume: vol, def, sound };
    this._updateCardState(id, true);
    this._addMixerChannel(id, def, vol);
    this._updateMixerUI();
  }

  _stopSound(id) {
    const entry = this.activeSounds[id];
    if (entry && entry.sound && entry.sound.stop) {
      entry.sound.stop();
    }
    // 也尝试从引擎中移除
    this.engine.stop(id);
    delete this.activeSounds[id];
    this._updateCardState(id, false);
    this._removeMixerChannel(id);
    this._updateMixerUI();
  }

  stopAll() {
    const ids = Object.keys(this.activeSounds);
    ids.forEach(id => this._stopSound(id));
    if (ids.length > 0) this._toast('已停止全部声音');
  }

  _updateCardState(id, isActive) {
    const cards = this.$soundGrid.querySelectorAll(`[data-sound-id="${id}"]`);
    cards.forEach(card => {
      if (isActive) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  // =============================================
  // 混音台 UI
  // =============================================
  _addMixerChannel(id, def, vol) {
    const existing = document.getElementById(`mixer-${id}`);
    if (existing) return;

    const ch = document.createElement('div');
    ch.className = 'mixer-channel';
    ch.id = `mixer-${id}`;
    ch.innerHTML = `
      <div class="mixer-channel-icon">${def.icon}</div>
      <div class="mixer-channel-name">${def.name}</div>
      <input type="range" class="mixer-channel-volume" min="0" max="100" value="${vol}" step="1" orient="vertical">
      <button class="mixer-channel-remove" title="移除">✕</button>
    `;

    ch.querySelector('input').addEventListener('input', (e) => {
      const newVol = parseInt(e.target.value);
      const entry = this.activeSounds[id];
      if (entry) {
        entry.volume = newVol;
        if (entry.sound && entry.sound.setVolume) {
          entry.sound.setVolume(newVol);
        }
        this.engine.setVolume(id, newVol);
        this._syncCardSlider(id, newVol);
      }
    });

    ch.querySelector('button').addEventListener('click', () => {
      this._stopSound(id);
    });

    this.$mixerChannels.appendChild(ch);
  }

  _removeMixerChannel(id) {
    const ch = document.getElementById(`mixer-${id}`);
    if (ch) ch.remove();
  }

  _updateMixerChannel(id, vol) {
    const ch = document.getElementById(`mixer-${id}`);
    if (ch) {
      const slider = ch.querySelector('input');
      if (slider) slider.value = vol;
    }
  }

  _syncCardSlider(id, vol) {
    const slider = this.$soundGrid.querySelector(`input[data-sound-id="${id}"]`);
    if (slider) slider.value = vol;
  }

  _updateMixerUI() {
    const count = Object.keys(this.activeSounds).length;
    this.$activeCount.textContent = count + ' 个声音';
    this.$mixerEmpty.style.display = count === 0 ? 'block' : 'none';
  }

  // =============================================
  // 定时器
  // =============================================
  _openTimerModal() {
    this.$timerModal.classList.add('show');
    if (this.timerEndTime) {
      const remaining = Math.max(0, Math.ceil((this.timerEndTime - Date.now()) / 60000));
      this.$customTimerInput.value = remaining || 25;
    }
  }

  _closeTimerModal() {
    this.$timerModal.classList.remove('show');
  }

  _setTimer(minutes) {
    this._clearTimer();
    this.timerEndTime = Date.now() + minutes * 60000;

    this.timerId = setTimeout(() => {
      this.stopAll();
      this._toast('⏰ 定时结束，已停止所有声音');
      this._clearTimer();
    }, minutes * 60000);

    this._updateTimerDisplay();
    this.timerInterval = setInterval(() => this._updateTimerDisplay(), 10000);

    this.$timerBtn.classList.add('has-timer');
    this._toast(`已设置 ${minutes} 分钟后自动停止`);
  }

  _clearTimer() {
    if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    this.timerEndTime = null;
    this.$timerBtn.classList.remove('has-timer');
    this.$timerDisplay.textContent = '定时';
  }

  _updateTimerDisplay() {
    if (!this.timerEndTime) {
      this.$timerDisplay.textContent = '定时';
      return;
    }
    const remaining = Math.max(0, Math.ceil((this.timerEndTime - Date.now()) / 60000));
    if (remaining <= 0) {
      this.$timerDisplay.textContent = '定时';
      this._clearTimer();
      return;
    }
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    this.$timerDisplay.textContent = h > 0 ? `${h}时${m}分` : `${m}分钟`;
  }

  // =============================================
  // 自定义文件上传
  // =============================================
  _handleFileUpload(e) {
    if (e.target.files.length > 0) {
      this._processFiles(e.target.files);
    }
    e.target.value = '';
  }

  _processFiles(fileList) {
    Array.from(fileList).forEach(file => {
      if (!file.type.startsWith('audio/')) {
        this._toast(`${file.name} 不是音频文件`);
        return;
      }

      this.customIdCounter++;
      const id = `custom_${this.customIdCounter}`;
      const objectURL = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^.]+$/, '');

      this.customSounds[id] = {
        name,
        file,
        objectURL,
        icon: '🎵',
        addedAt: Date.now()
      };

      this._saveCustomSounds();
    });

    if (this.currentTab === 'custom') {
      this._renderCustomSounds();
    }
    this._toast(`已添加 ${fileList.length} 个音频文件`);
  }

  _playCustomSound(id, vol = 50) {
    const cs = this.customSounds[id];
    if (!cs || this.activeSounds[id]) return;

    const audio = new Audio(cs.objectURL);
    audio.loop = true;
    audio.volume = vol / 100;
    audio.play().catch(e => {
      console.warn('Audio playback failed:', e);
    });

    const sound = {
      type: 'custom',
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
      },
      setVolume: (v) => {
        audio.volume = v / 100;
      }
    };

    this.activeSounds[id] = {
      volume: vol,
      def: {
        id,
        type: 'custom',
        icon: cs.icon,
        name: cs.name,
        desc: cs.file.name,
        isCustom: true
      },
      sound
    };

    this._updateCardState(id, true);
    this._addMixerChannel(id, this.activeSounds[id].def, vol);
    this._updateMixerUI();
  }

  // =============================================
  // 持久化 - 自定义素材存储（IndexedDB）
  // =============================================
  _openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('asmr-custom-sounds', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('sounds')) {
          db.createObjectStore('sounds', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async _saveCustomSounds() {
    try {
      const db = await this._openDB();
      const tx = db.transaction('sounds', 'readwrite');
      const store = tx.objectStore('sounds');

      // 清空旧数据
      await new Promise((res, rej) => {
        const clearReq = store.clear();
        clearReq.onsuccess = res;
        clearReq.onerror = rej;
      });

      // 存储新数据
      for (const [id, cs] of Object.entries(this.customSounds)) {
        const reader = new FileReader();
        const arrayBuffer = await new Promise((res, rej) => {
          reader.onload = () => res(reader.result);
          reader.onerror = rej;
          reader.readAsArrayBuffer(cs.file);
        });

        await new Promise((res, rej) => {
          const putReq = store.put({
            id,
            name: cs.name,
            icon: cs.icon,
            fileName: cs.file.name,
            fileType: cs.file.type,
            audioData: arrayBuffer,
            addedAt: cs.addedAt
          });
          putReq.onsuccess = res;
          putReq.onerror = rej;
        });
      }

      await new Promise(res => { tx.oncomplete = res; });
      db.close();
    } catch (e) {
      console.warn('Failed to save to IndexedDB:', e);
    }
  }

  async _loadCustomSounds() {
    try {
      const db = await this._openDB();
      const tx = db.transaction('sounds', 'readonly');
      const store = tx.objectStore('sounds');
      const items = await new Promise((res, rej) => {
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => res(getAllReq.result);
        getAllReq.onerror = rej;
      });

      for (const item of items) {
        const blob = new Blob([item.audioData], { type: item.fileType });
        const file = new File([blob], item.fileName, { type: item.fileType });
        const objectURL = URL.createObjectURL(file);

        this.customSounds[item.id] = {
          name: item.name,
          file,
          objectURL,
          icon: item.icon || '🎵',
          addedAt: item.addedAt
        };
        // 更新 counter
        const num = parseInt(item.id.replace('custom_', ''));
        if (!isNaN(num) && num > this.customIdCounter) {
          this.customIdCounter = num;
        }
      }

      db.close();

      if (items.length > 0) {
        this._toast(`已加载 ${items.length} 个自定义素材`, true);
      }
    } catch (e) {
      console.warn('Failed to load from IndexedDB:', e);
    }
  }

  // =============================================
  // Toast 通知
  // =============================================
  _toast(message, long = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.animationDuration = long ? '0.3s, 0.3s 4.7s' : '';
    this.$toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, long ? 5000 : 3000);
  }
}

// =============================================
// 启动应用
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ASMRApp();

  // 首次用户交互时初始化音频引擎
  const initOnInteraction = async () => {
    await window.app.engine.resume();
  };
  document.addEventListener('click', initOnInteraction, { once: true });
  document.addEventListener('keydown', initOnInteraction, { once: true });
  document.addEventListener('touchstart', initOnInteraction, { once: true });
});
