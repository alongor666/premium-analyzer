/**
 * 文件上传组件
 * 支持拖拽上传和点击选择
 */
class FileUploader {
  constructor(container, workerBridge) {
    this.container = container;
    this.workerBridge = workerBridge;
    this.fileInput = document.getElementById('fileInput');
    this.selectFileBtn = document.getElementById('selectFileBtn');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.loadingText = document.getElementById('loadingText');

    this.init();
  }

  init() {
    // 拖拽事件
    this.container.addEventListener('dragover', this.handleDragOver.bind(this));
    this.container.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.container.addEventListener('drop', this.handleDrop.bind(this));

    // 点击上传
    this.selectFileBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    // 文件选择
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFile(e.target.files[0]);
      }
    });

    console.log('[FileUploader] 初始化完成');
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.container.classList.add('drag-over');
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.container.classList.remove('drag-over');
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.container.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  async handleFile(file) {
    console.log('[FileUploader] 处理文件:', file.name);

    // 验证文件类型
    if (!validateFileType(file)) {
      this.showError('文件格式错误', '请上传 .csv, .xlsx 或 .xls 格式的文件');
      return;
    }

    // 验证文件大小
    if (!validateFileSize(file)) {
      this.showError('文件过大', '文件大小不能超过 10MB');
      return;
    }

    try {
      // 显示加载状态
      this.showLoading('正在解析文件...');

      // 监听Worker进度
      const cancelProgress = this.workerBridge.onProgress((progress) => {
        this.updateLoadingText(progress);
      });

      // 解析文件
      const result = await this.workerBridge.parseFile(file);

      // 取消进度监听
      cancelProgress();

      // 隐藏加载状态
      this.hideLoading();

      // 触发文件解析完成事件
      window.EventBus.emit('file:parsed', result);

      // 显示成功提示
      this.showToast(
        `成功加载 ${result.total} 条数据，总保费 ${formatPremium(result.premium)}`,
        'success'
      );

      // 隐藏上传区域，显示仪表盘
      this.showDashboard(result);

    } catch (error) {
      console.error('[FileUploader] 文件处理失败:', error);
      this.hideLoading();
      this.showError('文件解析失败', error.message);
    }
  }

  showLoading(text) {
    this.loadingText.textContent = text;
    this.loadingOverlay.style.display = 'flex';
  }

  hideLoading() {
    this.loadingOverlay.style.display = 'none';
  }

  updateLoadingText(progress) {
    const stageText = {
      parsing: '正在解析文件',
      filtering: '正在筛选数据',
      aggregating: '正在聚合数据'
    };

    this.loadingText.textContent = `${stageText[progress.stage] || '处理中'}... ${progress.percent}%`;
  }

  showDashboard(result) {
    // 隐藏上传区域
    document.getElementById('uploadSection').style.display = 'none';

    // 显示仪表盘
    document.getElementById('dashboardSection').style.display = 'flex';

    // 更新数据信息
    document.getElementById('dataCount').textContent = result.total;
    document.getElementById('dataInfo').style.display = 'inline';

    // 显示重新导入数据按钮
    document.getElementById('reloadDataBtn').style.display = 'inline-block';
  }

  showError(title, message) {
    const modal = document.getElementById('errorModal');
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    modal.style.display = 'flex';
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // 自动消失
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
  }
}

// 挂载到window
if (typeof window !== 'undefined') {
  window.FileUploader = FileUploader;
}
