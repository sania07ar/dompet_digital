/**
 * PinkWallet - Web Aplikasi Pencatatan Keuangan Pribadi Mobile-First
 * Pure JavaScript (ES6+), LocalStorage, Chart.js
 */

// ===================================================================
// CONSTANTS & DEFINITIONS
// ===================================================================

const STORAGE_KEYS = {
  TRANSACTIONS: 'pinkwallet_transactions_v1',
  BUDGETS: 'pinkwallet_budgets_v1',
  GOALS: 'pinkwallet_goals_v1',
  SETTINGS: 'pinkwallet_settings_v1',
};

const EXPENSE_CATEGORIES = [
  { id: 'makan', name: 'Makanan & Minuman', icon: 'fa-utensils', color: '#f43f5e', bg: '#ffe4e6' },
  { id: 'jajan', name: 'Jajan & Camilan', icon: 'fa-cookie-bite', color: '#fb923c', bg: '#ffedd5' },
  { id: 'transport', name: 'Transportasi', icon: 'fa-bus-simple', color: '#3b82f6', bg: '#dbeafe' },
  { id: 'belanja', name: 'Belanja & Fashion', icon: 'fa-bag-shopping', color: '#ec4899', bg: '#fce7f3' },
  { id: 'kuliah', name: 'Kuliah & Edukasi', icon: 'fa-graduation-cap', color: '#8b5cf6', bg: '#ede9fe' },
  { id: 'kesehatan', name: 'Kesehatan & Skincare', icon: 'fa-heart-pulse', color: '#10b981', bg: '#d1fae5' },
  { id: 'hiburan', name: 'Hiburan & Liburan', icon: 'fa-film', color: '#a855f7', bg: '#f3e8ff' },
  { id: 'tagihan', name: 'Tagihan & Pulsa', icon: 'fa-file-invoice-dollar', color: '#eab308', bg: '#fef9c3' },
  { id: 'tabungan', name: 'Tabungan & Investasi', icon: 'fa-piggy-bank', color: '#06b6d4', bg: '#cffafe' },
  { id: 'lainnya_exp', name: 'Lain-lain', icon: 'fa-ellipsis', color: '#6b7280', bg: '#f3f4f6' },
];

const INCOME_CATEGORIES = [
  { id: 'gaji', name: 'Gaji', icon: 'fa-money-bill-wave', color: '#10b981', bg: '#d1fae5' },
  { id: 'uang_bulanan', name: 'Uang Bulanan / Saku', icon: 'fa-hand-holding-dollar', color: '#06b6d4', bg: '#cffafe' },
  { id: 'bonus', name: 'Bonus & THR', icon: 'fa-gift', color: '#f59e0b', bg: '#fef3c7' },
  { id: 'freelance', name: 'Freelance & Usaha', icon: 'fa-laptop-code', color: '#8b5cf6', bg: '#ede9fe' },
  { id: 'hadiah', name: 'Hadiah & Transfer', icon: 'fa-heart', color: '#ec4899', bg: '#fce7f3' },
  { id: 'lainnya_inc', name: 'Lain-lain', icon: 'fa-ellipsis', color: '#6b7280', bg: '#f3f4f6' },
];

const GOAL_ICONS = [
  'fa-piggy-bank', 'fa-heart', 'fa-plane', 'fa-laptop', 'fa-mobile-screen',
  'fa-car', 'fa-house', 'fa-graduation-cap', 'fa-gem', 'fa-ring', 'fa-cart-shopping'
];

// ===================================================================
// APPLICATION STATE
// ===================================================================

const state = {
  transactions: [],
  budgets: {
    overallMonthlyLimit: 0,
    categoryBudgets: {},
  },
  goals: [],
  settings: {
    hideBalance: false,
  },
  activeTab: 'dashboard',
  budgetSubTab: 'budget',
  selectedReportDate: new Date(), // Year & Month for report
  selectedTxType: 'expense',
  editingTxId: null,
  editingCatBudgetId: null,
  editingGoalId: null,
  selectedCategory: '',
  charts: {
    miniCashflow: null,
    categoryDonut: null,
    dailyTrend: null,
  },
  pendingConfirmAction: null,
};

// ===================================================================
// HELPER UTILITIES: CURRENCY, DATES, FORMATTING
// ===================================================================

/**
 * Format number to Indonesian Rupiah (e.g. 150000 -> "Rp 150.000")
 */
function formatRupiah(amount, withPrefix = true) {
  const num = Number(amount) || 0;
  const formatted = Math.abs(num).toLocaleString('id-ID');
  const sign = num < 0 ? '-' : '';
  return withPrefix ? `${sign}Rp ${formatted}` : `${sign}${formatted}`;
}

/**
 * Parse raw input string with dots/commas into pure integer
 */
function parseRupiahInput(value) {
  if (!value) return 0;
  const clean = value.toString().replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
}

/**
 * Convert number to Indonesian Words (Terbilang) for input feedback
 */
function numberToIndonesianWords(n) {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'Nol rupiah';
  if (n < 12) return bilangan[n] + ' rupiah';
  if (n < 20) return bilangan[n - 10] + ' belas rupiah';
  if (n < 100) return bilangan[Math.floor(n / 10)] + ' puluh ' + (n % 10 !== 0 ? bilangan[n % 10] : '') + ' rupiah';
  if (n < 200) return 'Seratus ' + (n % 100 !== 0 ? numberToIndonesianWords(n % 100) : 'rupiah');
  if (n < 1000) return bilangan[Math.floor(n / 100)] + ' ratus ' + (n % 100 !== 0 ? numberToIndonesianWords(n % 100) : 'rupiah');
  if (n < 2000) return 'Seribu ' + (n % 1000 !== 0 ? numberToIndonesianWords(n % 1000) : 'rupiah');
  if (n < 1000000) return numberToIndonesianWords(Math.floor(n / 1000)).replace(' rupiah', '') + ' ribu ' + (n % 1000 !== 0 ? numberToIndonesianWords(n % 1000) : 'rupiah');
  if (n < 1000000000) return numberToIndonesianWords(Math.floor(n / 1000000)).replace(' rupiah', '') + ' juta ' + (n % 1000000 !== 0 ? numberToIndonesianWords(n % 1000000) : 'rupiah');
  return formatRupiah(n);
}

/**
 * Format YYYY-MM-DD to Indonesian human readable date
 */
function formatIndonesianDate(dateString) {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

/**
 * Get Today's local date string YYYY-MM-DD
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Find Category definition by name
 */
function findCategoryDef(categoryName, type) {
  const list = type === 'income' ? INCOME_CATEGORIES : (type === 'expense' ? EXPENSE_CATEGORIES : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]);
  const found = list.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
  if (found) return found;
  return {
    id: 'unknown',
    name: categoryName || 'Lainnya',
    icon: 'fa-tags',
    color: '#ec4899',
    bg: '#fce7f3'
  };
}

/**
 * Generate unique ID
 */
function generateId() {
  return 'pw_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

// ===================================================================
// STORAGE SERVICE
// ===================================================================

function loadAllData() {
  try {
    const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    state.transactions = rawTx ? JSON.parse(rawTx) : [];

    const rawBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    state.budgets = rawBudgets ? JSON.parse(rawBudgets) : { overallMonthlyLimit: 0, categoryBudgets: {} };

    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    state.goals = rawGoals ? JSON.parse(rawGoals) : [];

    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    state.settings = rawSettings ? JSON.parse(rawSettings) : { hideBalance: false };
  } catch (err) {
    console.error('Gagal memuat data dari LocalStorage:', err);
    showToast('Terjadi kesalahan saat memuat data.', 'danger');
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
}

function saveBudgets() {
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(state.budgets));
}

function saveGoals() {
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
}

// ===================================================================
// TOAST & CONFIRMATION MODAL SYSTEM
// ===================================================================

function showToast(message, type = 'pink') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-check';
  if (type === 'danger') icon = 'fa-circle-xmark';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'pink') icon = 'fa-heart';

  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

function showConfirmModal({ title, message, onConfirm, confirmText = 'Hapus', isDanger = true }) {
  const modal = document.getElementById('modalConfirm');
  const titleEl = document.getElementById('confirmTitle');
  const msgEl = document.getElementById('confirmMessage');
  const btnProceed = document.getElementById('btnConfirmProceed');
  const btnCancel = document.getElementById('btnConfirmCancel');
  const iconEl = document.getElementById('confirmIcon');

  titleEl.textContent = title;
  msgEl.textContent = message;
  btnProceed.textContent = confirmText;

  if (isDanger) {
    btnProceed.className = 'btn-danger';
    iconEl.className = 'fa-solid fa-triangle-exclamation';
    document.getElementById('confirmIconBox').style.backgroundColor = '#fee2e2';
    document.getElementById('confirmIconBox').style.color = '#dc2626';
  } else {
    btnProceed.className = 'btn-primary';
    iconEl.className = 'fa-solid fa-circle-question';
    document.getElementById('confirmIconBox').style.backgroundColor = '#fce7f3';
    document.getElementById('confirmIconBox').style.color = '#ec4899';
  }

  state.pendingConfirmAction = onConfirm;
  openModal('modalConfirm');

  btnProceed.onclick = () => {
    closeModal('modalConfirm');
    if (typeof state.pendingConfirmAction === 'function') {
      state.pendingConfirmAction();
      state.pendingConfirmAction = null;
    }
  };

  btnCancel.onclick = () => {
    closeModal('modalConfirm');
    state.pendingConfirmAction = null;
  };
}

// ===================================================================
// MODAL CONTROLLERS
// ===================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Close modal when tapping outside modal-sheet
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
    document.body.style.overflow = '';
  }
});

// ===================================================================
// NAVIGATION & VIEW SWITCHING
// ===================================================================

function navigateToTab(tabName) {
  state.activeTab = tabName;

  // Update Bottom Nav Buttons
  document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Switch View Panels
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${tabName}`);
  if (activeView) {
    activeView.classList.add('active');
  }

  // Scroll to top of content area
  document.getElementById('mainContent').scrollTop = 0;

  // Refresh tab-specific views
  if (tabName === 'dashboard') {
    renderDashboard();
  } else if (tabName === 'transactions') {
    renderTransactionsView();
  } else if (tabName === 'budget') {
    renderBudgetView();
  } else if (tabName === 'reports') {
    renderReportsView();
  } else if (tabName === 'settings') {
    renderSettingsView();
  }
}

function switchBudgetSubTab(subTabName) {
  state.budgetSubTab = subTabName;
  const btnBudget = document.getElementById('btnSubTabBudget');
  const btnGoals = document.getElementById('btnSubTabGoals');
  const paneBudget = document.getElementById('pane-budget');
  const paneGoals = document.getElementById('pane-goals');

  if (subTabName === 'budget') {
    btnBudget.classList.add('active');
    btnGoals.classList.remove('active');
    paneBudget.classList.add('active');
    paneGoals.classList.remove('active');
  } else {
    btnGoals.classList.add('active');
    btnBudget.classList.remove('active');
    paneGoals.classList.add('active');
    paneBudget.classList.remove('active');
  }
}

// ===================================================================
// TRANSACTION FORM & MODAL HANDLERS
// ===================================================================

function openTransactionModal(type = 'expense', editTxId = null) {
  state.selectedTxType = type;
  state.editingTxId = editTxId;

  const modalTitle = document.getElementById('modalTxTitle');
  const radioExpense = document.getElementById('radioTxExpense');
  const radioIncome = document.getElementById('radioTxIncome');
  const amountInput = document.getElementById('txAmountInput');
  const dateInput = document.getElementById('txDateInput');
  const noteInput = document.getElementById('txNoteInput');
  const wordHint = document.getElementById('txAmountWordHint');

  if (editTxId) {
    const tx = state.transactions.find(t => t.id === editTxId);
    if (!tx) return;

    modalTitle.textContent = 'Edit Transaksi';
    state.selectedTxType = tx.type;
    amountInput.value = formatNumberWithDots(tx.amount);
    wordHint.textContent = numberToIndonesianWords(tx.amount);
    dateInput.value = tx.date;
    noteInput.value = tx.note || '';
    state.selectedCategory = tx.category;

    if (tx.type === 'income') {
      radioIncome.checked = true;
    } else {
      radioExpense.checked = true;
    }
  } else {
    modalTitle.textContent = type === 'income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran';
    amountInput.value = '';
    wordHint.textContent = 'Nol rupiah';
    dateInput.value = getTodayDateString();
    noteInput.value = '';

    if (type === 'income') {
      radioIncome.checked = true;
      state.selectedCategory = INCOME_CATEGORIES[0].name;
    } else {
      radioExpense.checked = true;
      state.selectedCategory = EXPENSE_CATEGORIES[0].name;
    }
  }

  renderCategoryPills(state.selectedTxType, state.selectedCategory);
  openModal('modalTransaction');
  setTimeout(() => amountInput.focus(), 200);
}

function renderCategoryPills(type, activeCategoryName) {
  const container = document.getElementById('categoryQuickPills');
  const select = document.getElementById('txCategorySelect');
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  container.innerHTML = '';
  select.innerHTML = '';

  list.forEach(cat => {
    const isSelected = (cat.name === activeCategoryName);
    
    // Quick pill
    const pill = document.createElement('div');
    pill.className = `cat-pill-item ${isSelected ? 'active' : ''}`;
    pill.innerHTML = `
      <i class="fa-solid ${cat.icon}" style="color: ${cat.color}"></i>
      <span>${cat.name}</span>
    `;
    pill.onclick = () => {
      document.querySelectorAll('#categoryQuickPills .cat-pill-item').forEach(el => el.classList.remove('active'));
      pill.classList.add('active');
      state.selectedCategory = cat.name;
      select.value = cat.name;
    };
    container.appendChild(pill);

    // Option for fallback select
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = cat.name;
    if (isSelected) opt.selected = true;
    select.appendChild(opt);
  });

  if (!state.selectedCategory && list.length > 0) {
    state.selectedCategory = list[0].name;
  }
}

function formatNumberWithDots(val) {
  const n = parseRupiahInput(val);
  return n === 0 ? '' : n.toLocaleString('id-ID');
}

// ===================================================================
// EVENT LISTENERS: TRANSACTIONS
// ===================================================================

function initTransactionEvents() {
  const form = document.getElementById('formTransaction');
  const amountInput = document.getElementById('txAmountInput');
  const wordHint = document.getElementById('txAmountWordHint');
  const radioExpense = document.getElementById('radioTxExpense');
  const radioIncome = document.getElementById('radioTxIncome');

  // Real-time Rupiah input format
  amountInput.addEventListener('input', (e) => {
    const rawVal = parseRupiahInput(e.target.value);
    e.target.value = rawVal > 0 ? rawVal.toLocaleString('id-ID') : '';
    wordHint.textContent = numberToIndonesianWords(rawVal);
  });

  // Switch type radio buttons
  radioExpense.addEventListener('change', () => {
    state.selectedTxType = 'expense';
    state.selectedCategory = EXPENSE_CATEGORIES[0].name;
    renderCategoryPills('expense', state.selectedCategory);
    document.getElementById('modalTxTitle').textContent = state.editingTxId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran';
  });

  radioIncome.addEventListener('change', () => {
    state.selectedTxType = 'income';
    state.selectedCategory = INCOME_CATEGORIES[0].name;
    renderCategoryPills('income', state.selectedCategory);
    document.getElementById('modalTxTitle').textContent = state.editingTxId ? 'Edit Pemasukan' : 'Tambah Pemasukan';
  });

  // Submit form
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseRupiahInput(amountInput.value);
    const date = document.getElementById('txDateInput').value;
    const note = document.getElementById('txNoteInput').value.trim();
    const type = radioExpense.checked ? 'expense' : 'income';
    const category = state.selectedCategory || (type === 'income' ? INCOME_CATEGORIES[0].name : EXPENSE_CATEGORIES[0].name);

    // Validation
    if (!amount || amount <= 0) {
      showToast('Nominal harus lebih dari 0!', 'danger');
      amountInput.focus();
      return;
    }
    if (!date) {
      showToast('Pilih tanggal transaksi!', 'danger');
      return;
    }

    if (state.editingTxId) {
      // Update existing
      const index = state.transactions.findIndex(t => t.id === state.editingTxId);
      if (index !== -1) {
        state.transactions[index] = {
          ...state.transactions[index],
          type,
          amount,
          category,
          date,
          note,
          updatedAt: Date.now()
        };
        saveTransactions();
        showToast('Transaksi berhasil diperbarui!', 'pink');
      }
    } else {
      // Add new
      const newTx = {
        id: generateId(),
        type,
        amount,
        category,
        date,
        note,
        createdAt: Date.now()
      };
      state.transactions.unshift(newTx);
      saveTransactions();
      showToast('Transaksi berhasil dicatat!', 'success');
    }

    closeModal('modalTransaction');
    renderCurrentTab();
  });
}

function deleteTransaction(txId) {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;

  showConfirmModal({
    title: 'Hapus Transaksi?',
    message: `Apakah Anda yakin ingin menghapus catatan ${tx.category} senilai ${formatRupiah(tx.amount)}?`,
    confirmText: 'Ya, Hapus',
    isDanger: true,
    onConfirm: () => {
      state.transactions = state.transactions.filter(t => t.id !== txId);
      saveTransactions();
      showToast('Transaksi berhasil dihapus.', 'pink');
      renderCurrentTab();
    }
  });
}

// ===================================================================
// BUDGET FEATURE CONTROLLERS
// ===================================================================

function initBudgetEvents() {
  // Overall Budget Modal Open
  document.getElementById('btnEditOverallBudget').addEventListener('click', () => {
    const input = document.getElementById('inputOverallBudget');
    input.value = state.budgets.overallMonthlyLimit > 0 ? state.budgets.overallMonthlyLimit.toLocaleString('id-ID') : '';
    document.getElementById('overallBudgetWordHint').textContent = numberToIndonesianWords(state.budgets.overallMonthlyLimit);
    openModal('modalOverallBudget');
    setTimeout(() => input.focus(), 200);
  });

  const inputOverall = document.getElementById('inputOverallBudget');
  inputOverall.addEventListener('input', (e) => {
    const rawVal = parseRupiahInput(e.target.value);
    e.target.value = rawVal > 0 ? rawVal.toLocaleString('id-ID') : '';
    document.getElementById('overallBudgetWordHint').textContent = numberToIndonesianWords(rawVal);
  });

  document.getElementById('formOverallBudget').addEventListener('submit', (e) => {
    e.preventDefault();
    const limit = parseRupiahInput(inputOverall.value);
    state.budgets.overallMonthlyLimit = limit;
    saveBudgets();
    closeModal('modalOverallBudget');
    showToast('Batas anggaran bulanan disimpan!', 'success');
    renderCurrentTab();
  });

  // Category Budget Form
  const catInputLimit = document.getElementById('inputCatBudgetLimit');
  catInputLimit.addEventListener('input', (e) => {
    const rawVal = parseRupiahInput(e.target.value);
    e.target.value = rawVal > 0 ? rawVal.toLocaleString('id-ID') : '';
  });

  document.getElementById('formCategoryBudget').addEventListener('submit', (e) => {
    e.preventDefault();
    const categoryName = document.getElementById('catBudgetCategorySelect').value;
    const limit = parseRupiahInput(catInputLimit.value);

    if (!limit || limit <= 0) {
      showToast('Nominal anggaran harus lebih dari 0!', 'danger');
      return;
    }

    if (!state.budgets.categoryBudgets) {
      state.budgets.categoryBudgets = {};
    }

    state.budgets.categoryBudgets[categoryName] = limit;
    saveBudgets();
    closeModal('modalCategoryBudget');
    showToast(`Anggaran untuk ${categoryName} berhasil disimpan!`, 'pink');
    renderBudgetView();
    renderDashboard();
  });
}

function openCategoryBudgetModal(existingCategoryName = null) {
  const select = document.getElementById('catBudgetCategorySelect');
  const inputLimit = document.getElementById('inputCatBudgetLimit');
  const modalTitle = document.getElementById('catBudgetModalTitle');

  select.innerHTML = '';
  EXPENSE_CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = cat.name;
    if (existingCategoryName === cat.name) opt.selected = true;
    select.appendChild(opt);
  });

  if (existingCategoryName) {
    modalTitle.textContent = `Ubah Anggaran ${existingCategoryName}`;
    const curVal = state.budgets.categoryBudgets[existingCategoryName] || 0;
    inputLimit.value = curVal > 0 ? curVal.toLocaleString('id-ID') : '';
  } else {
    modalTitle.textContent = 'Tambah Anggaran Kategori';
    inputLimit.value = '';
  }

  openModal('modalCategoryBudget');
  setTimeout(() => inputLimit.focus(), 200);
}

function deleteCategoryBudget(categoryName) {
  showConfirmModal({
    title: 'Hapus Anggaran Kategori?',
    message: `Apakah Anda ingin menghapus batas anggaran untuk kategori ${categoryName}?`,
    confirmText: 'Hapus',
    onConfirm: () => {
      delete state.budgets.categoryBudgets[categoryName];
      saveBudgets();
      showToast(`Anggaran ${categoryName} dihapus`, 'pink');
      renderBudgetView();
      renderDashboard();
    }
  });
}

// ===================================================================
// SAVINGS GOALS CONTROLLERS
// ===================================================================

function initGoalEvents() {
  const targetInput = document.getElementById('goalTargetInput');
  const initialInput = document.getElementById('goalInitialInput');

  targetInput.addEventListener('input', (e) => {
    const rawVal = parseRupiahInput(e.target.value);
    e.target.value = rawVal > 0 ? rawVal.toLocaleString('id-ID') : '';
  });

  initialInput.addEventListener('input', (e) => {
    const rawVal = parseRupiahInput(e.target.value);
    e.target.value = rawVal > 0 ? rawVal.toLocaleString('id-ID') : '';
  });

  // Render Goal Icons Picker
  const iconPicker = document.getElementById('goalIconPicker');
  iconPicker.innerHTML = '';
  GOAL_ICONS.forEach((ic, idx) => {
    const btn = document.createElement('div');
    btn.className = `goal-icon-choice ${idx === 0 ? 'active' : ''}`;
    btn.innerHTML = `<i class="fa-solid ${ic}"></i>`;
    btn.onclick = () => {
      document.querySelectorAll('.goal-icon-choice').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('goalSelectedIcon').value = ic;
    };
    iconPicker.appendChild(btn);
  });

  // Save Goal
  document.getElementById('formGoal').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('goalNameInput').value.trim();
    const targetAmount = parseRupiahInput(targetInput.value);
    const initialAmount = parseRupiahInput(initialInput.value);
    const deadline = document.getElementById('goalDeadlineInput').value || null;
    const icon = document.getElementById('goalSelectedIcon').value || 'fa-piggy-bank';

    if (!name) {
      showToast('Nama target tidak boleh kosong!', 'danger');
      return;
    }
    if (!targetAmount || targetAmount <= 0) {
      showToast('Target nominal harus lebih dari 0!', 'danger');
      targetInput.focus();
      return;
    }

    if (state.editingGoalId) {
      const idx = state.goals.findIndex(g => g.id === state.editingGoalId);
      if (idx !== -1) {
        state.goals[idx] = {
          ...state.goals[idx],
          name,
          targetAmount,
          deadline,
          icon,
          updatedAt: Date.now()
        };
        saveGoals();
        showToast('Target tabungan diperbarui!', 'pink');
      }
    } else {
      const newGoal = {
        id: generateId(),
        name,
        targetAmount,
        currentAmount: initialAmount,
        deadline,
        icon,
        createdAt: Date.now()
      };
      state.goals.push(newGoal);
      saveGoals();
      showToast('Target tabungan baru berhasil dibuat!', 'success');
    }

    closeModal('modalGoal');
    renderBudgetView();
    renderDashboard();
  });

  // Deposit / Withdraw Goal Form
  const depositInput = document.getElementById('inputDepositAmount');
  depositInput.addEventListener('input', (e) => {
    const rawVal = parseRupiahInput(e.target.value);
    e.target.value = rawVal > 0 ? rawVal.toLocaleString('id-ID') : '';
  });

  document.getElementById('formGoalDeposit').addEventListener('submit', (e) => {
    e.preventDefault();
    const goalId = document.getElementById('depositGoalId').value;
    const isDeposit = document.getElementById('radioDeposit').checked;
    const amount = parseRupiahInput(depositInput.value);
    const syncBalance = document.getElementById('chkSyncWithBalance').checked;

    if (!amount || amount <= 0) {
      showToast('Nominal harus lebih dari 0!', 'danger');
      return;
    }

    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    if (isDeposit) {
      goal.currentAmount = (goal.currentAmount || 0) + amount;

      // Sync with balance by recording an expense under Tabungan category
      if (syncBalance) {
        state.transactions.unshift({
          id: generateId(),
          type: 'expense',
          amount,
          category: 'Tabungan & Investasi',
          date: getTodayDateString(),
          note: `Tabungan: ${goal.name}`,
          createdAt: Date.now()
        });
        saveTransactions();
      }

      showToast(`Berhasil menambah tabungan ${formatRupiah(amount)}!`, 'success');
    } else {
      if (amount > (goal.currentAmount || 0)) {
        showToast('Nominal penarikan melebihi saldo tabungan saat ini!', 'danger');
        return;
      }
      goal.currentAmount -= amount;

      // Sync with balance by recording an income under Uang Bulanan / Tabungan
      if (syncBalance) {
        state.transactions.unshift({
          id: generateId(),
          type: 'income',
          amount,
          category: 'Uang Bulanan / Saku',
          date: getTodayDateString(),
          note: `Tarik Tabungan: ${goal.name}`,
          createdAt: Date.now()
        });
        saveTransactions();
      }

      showToast(`Berhasil menarik ${formatRupiah(amount)} dari tabungan!`, 'pink');
    }

    saveGoals();
    closeModal('modalGoalDeposit');
    renderBudgetView();
    renderDashboard();
  });
}

function openGoalModal(goalId = null) {
  state.editingGoalId = goalId;
  const modalTitle = document.getElementById('modalGoalTitle');
  const nameInput = document.getElementById('goalNameInput');
  const targetInput = document.getElementById('goalTargetInput');
  const initialInput = document.getElementById('goalInitialInput');
  const deadlineInput = document.getElementById('goalDeadlineInput');

  if (goalId) {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;
    modalTitle.textContent = 'Edit Target Tabungan';
    nameInput.value = goal.name;
    targetInput.value = goal.targetAmount.toLocaleString('id-ID');
    initialInput.value = goal.currentAmount ? goal.currentAmount.toLocaleString('id-ID') : '';
    initialInput.disabled = true; // cannot edit initial base, use deposit/withdraw
    deadlineInput.value = goal.deadline || '';
  } else {
    modalTitle.textContent = 'Target Tabungan Baru';
    nameInput.value = '';
    targetInput.value = '';
    initialInput.value = '';
    initialInput.disabled = false;
    deadlineInput.value = '';
  }

  openModal('modalGoal');
  setTimeout(() => nameInput.focus(), 200);
}

function openDepositModal(goalId) {
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return;

  document.getElementById('depositGoalId').value = goal.id;
  document.getElementById('depositModalTitle').textContent = `Alokasi: ${goal.name}`;
  document.getElementById('radioDeposit').checked = true;
  document.getElementById('inputDepositAmount').value = '';
  document.getElementById('chkSyncWithBalance').checked = true;

  openModal('modalGoalDeposit');
}

function deleteGoal(goalId) {
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return;

  showConfirmModal({
    title: 'Hapus Target Tabungan?',
    message: `Apakah Anda yakin ingin menghapus target "${goal.name}"? Catatan saldo terkumpul (${formatRupiah(goal.currentAmount || 0)}) tidak akan dihapus dari riwayat transaksi.`,
    confirmText: 'Hapus Target',
    onConfirm: () => {
      state.goals = state.goals.filter(g => g.id !== goalId);
      saveGoals();
      showToast('Target tabungan dihapus.', 'pink');
      renderBudgetView();
      renderDashboard();
    }
  });
}

// ===================================================================
// DASHBOARD RENDERING
// ===================================================================

function calculateTotals(periodFilter = 'this_month') {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const thisMonthPrefix = `${currentYear}-${currentMonth}`;

  let totalIncome = 0;
  let totalExpense = 0;
  let allTimeIncome = 0;
  let allTimeExpense = 0;

  state.transactions.forEach(tx => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      allTimeIncome += amt;
      if (tx.date && tx.date.startsWith(thisMonthPrefix)) {
        totalIncome += amt;
      }
    } else {
      allTimeExpense += amt;
      if (tx.date && tx.date.startsWith(thisMonthPrefix)) {
        totalExpense += amt;
      }
    }
  });

  const totalBalance = allTimeIncome - allTimeExpense;

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    allTimeIncome,
    allTimeExpense,
  };
}

function renderDashboard() {
  const totals = calculateTotals();

  // Balance & Stats
  const balDisplay = document.getElementById('totalBalanceDisplay');
  const incDisplay = document.getElementById('monthIncomeDisplay');
  const expDisplay = document.getElementById('monthExpenseDisplay');
  const eyeIcon = document.getElementById('eyeIcon');

  if (state.settings.hideBalance) {
    balDisplay.textContent = 'Rp ••••••••';
    eyeIcon.className = 'fa-regular fa-eye-slash';
  } else {
    balDisplay.textContent = formatRupiah(totals.totalBalance);
    eyeIcon.className = 'fa-regular fa-eye';
  }

  incDisplay.textContent = formatRupiah(totals.totalIncome);
  expDisplay.textContent = formatRupiah(totals.totalExpense);

  // Budget Progress Card on Dashboard
  const budgetLimit = state.budgets.overallMonthlyLimit || 0;
  const budgetUsed = totals.totalExpense;
  const budgetRemaining = Math.max(0, budgetLimit - budgetUsed);
  const budgetPct = budgetLimit > 0 ? Math.min(100, Math.round((budgetUsed / budgetLimit) * 100)) : 0;

  const budgetCard = document.getElementById('dashboardBudgetCard');
  const budgetLimitTitle = document.getElementById('budgetLimitTitle');
  const budgetFill = document.getElementById('budgetProgressFill');
  const budgetUsedText = document.getElementById('budgetUsedText');
  const budgetRemainingText = document.getElementById('budgetRemainingText');
  const warningBox = document.getElementById('budgetWarningBox');
  const warningText = document.getElementById('budgetWarningText');

  if (budgetLimit > 0) {
    budgetCard.style.display = 'block';
    budgetLimitTitle.textContent = `Batas: ${formatRupiah(budgetLimit)}`;
    budgetFill.style.width = `${budgetPct}%`;
    budgetUsedText.textContent = `Terpakai: ${formatRupiah(budgetUsed)} (${budgetPct}%)`;
    budgetRemainingText.textContent = `Sisa: ${formatRupiah(budgetRemaining)}`;

    budgetFill.className = 'progress-bar-fill';
    if (budgetPct >= 100) {
      budgetFill.classList.add('fill-danger');
      warningBox.classList.remove('hidden', 'alert-warning');
      warningText.textContent = 'Perhatian: Pengeluaran bulan ini telah melampaui batas anggaran!';
    } else if (budgetPct >= 75) {
      budgetFill.classList.add('fill-warning');
      warningBox.classList.remove('hidden');
      warningBox.classList.add('alert-warning');
      warningText.textContent = 'Hati-hati: Pengeluaran sudah mencapai 75% dari batas!';
    } else {
      warningBox.classList.add('hidden');
    }
  } else {
    budgetLimitTitle.textContent = 'Belum diatur';
    budgetFill.style.width = '0%';
    budgetUsedText.textContent = `Terpakai: ${formatRupiah(budgetUsed)}`;
    budgetRemainingText.textContent = 'Atur batas bulanan';
    warningBox.classList.add('hidden');
  }

  // Mini Cashflow Chart (Last 7 Days)
  renderMiniCashflowChart();

  // Savings Goals Carousel
  renderDashboardGoals();

  // Recent Transactions List (Top 5)
  renderDashboardRecentTransactions();
}

function renderDashboardGoals() {
  const container = document.getElementById('dashboardGoalsList');
  container.innerHTML = '';

  if (state.goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 16px; width: 100%;">
        <p class="empty-state-desc" style="margin-bottom: 8px;">Belum ada target tabungan impian.</p>
        <button type="button" class="btn-primary-sm" onclick="openGoalModal()">
          <i class="fa-solid fa-plus"></i> Buat Target Baru
        </button>
      </div>
    `;
    return;
  }

  state.goals.forEach(goal => {
    const current = goal.currentAmount || 0;
    const target = goal.targetAmount || 1;
    const pct = Math.min(100, Math.round((current / target) * 100));

    const card = document.createElement('div');
    card.className = 'goal-card-compact';
    card.innerHTML = `
      <div class="goal-header">
        <div class="goal-icon-badge">
          <i class="fa-solid ${goal.icon || 'fa-piggy-bank'}"></i>
        </div>
        <div class="goal-title-wrap">
          <h4 class="goal-name">${escapeHtml(goal.name)}</h4>
          <span class="goal-target-text">${formatRupiah(current)} / ${formatRupiah(target)}</span>
        </div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
        <div class="progress-label-row">
          <span>${pct}% terkumpul</span>
          <button type="button" class="link-btn" onclick="openDepositModal('${goal.id}')">Alokasi +</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderDashboardRecentTransactions() {
  const container = document.getElementById('dashboardRecentList');
  container.innerHTML = '';

  if (state.transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-receipt"></i></div>
        <h4 class="empty-state-title">Belum Ada Transaksi</h4>
        <p class="empty-state-desc">Mulai catat pemasukan dan pengeluaran harian Anda agar keuangan lebih tertata!</p>
        <button type="button" class="btn-primary-sm mt-2" onclick="openTransactionModal('expense')">
          <i class="fa-solid fa-plus"></i> Catat Transaksi Pertama
        </button>
      </div>
    `;
    return;
  }

  // Sort by date desc and take 5
  const sorted = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
  const recent = sorted.slice(0, 5);

  recent.forEach(tx => {
    container.appendChild(createTransactionElement(tx));
  });
}

function createTransactionElement(tx, showControls = false) {
  const catDef = findCategoryDef(tx.category, tx.type);
  const isIncome = tx.type === 'income';

  const el = document.createElement('div');
  el.className = 'tx-item';
  el.innerHTML = `
    <div class="tx-left">
      <div class="tx-icon-box" style="background-color: ${catDef.bg}; color: ${catDef.color}">
        <i class="fa-solid ${catDef.icon}"></i>
      </div>
      <div class="tx-details">
        <span class="tx-category">${escapeHtml(tx.category)}</span>
        ${tx.note ? `<span class="tx-note">${escapeHtml(tx.note)}</span>` : ''}
        <span class="tx-date-badge">${formatIndonesianDate(tx.date)}</span>
      </div>
    </div>
    <div class="tx-right">
      <span class="tx-amount ${isIncome ? 'amount-income' : 'amount-expense'}">
        ${isIncome ? '+' : '-'}${formatRupiah(tx.amount)}
      </span>
      <div class="tx-actions-quick">
        <button type="button" class="tx-action-btn" title="Edit" onclick="openTransactionModal('${tx.type}', '${tx.id}')">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button type="button" class="tx-action-btn" title="Hapus" onclick="deleteTransaction('${tx.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  return el;
}

// ===================================================================
// MINI CASHFLOW CHART (7 DAYS)
// ===================================================================

function renderMiniCashflowChart() {
  const canvas = document.getElementById('miniCashflowChart');
  const emptyPlaceholder = document.getElementById('emptyChartPlaceholder');
  if (!canvas) return;

  // Build last 7 days labels
  const days = [];
  const incomeData = [];
  const expenseData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
    days.push(`${dayName} (${d.getDate()})`);

    let inc = 0;
    let exp = 0;
    state.transactions.forEach(t => {
      if (t.date === dateStr) {
        if (t.type === 'income') inc += Number(t.amount) || 0;
        else exp += Number(t.amount) || 0;
      }
    });
    incomeData.push(inc);
    expenseData.push(exp);
  }

  const hasAnyTx = incomeData.some(v => v > 0) || expenseData.some(v => v > 0);
  if (!hasAnyTx) {
    emptyPlaceholder.classList.remove('hidden');
    canvas.style.display = 'none';
    if (state.charts.miniCashflow) {
      state.charts.miniCashflow.destroy();
      state.charts.miniCashflow = null;
    }
    return;
  }

  emptyPlaceholder.classList.add('hidden');
  canvas.style.display = 'block';

  if (state.charts.miniCashflow) {
    state.charts.miniCashflow.destroy();
  }

  const ctx = canvas.getContext('2d');
  state.charts.miniCashflow = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeData,
          backgroundColor: '#10b981',
          borderRadius: 6,
          barPercentage: 0.6,
        },
        {
          label: 'Pengeluaran',
          data: expenseData,
          backgroundColor: '#f43f5e',
          borderRadius: 6,
          barPercentage: 0.6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 10,
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatRupiah(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(244, 114, 182, 0.12)' },
          ticks: {
            font: { size: 9 },
            callback: (v) => (v >= 1000000 ? (v / 1000000) + 'jt' : (v >= 1000 ? (v / 1000) + 'rb' : v))
          }
        }
      }
    }
  });
}

// ===================================================================
// TRANSACTIONS VIEW (SEARCH & FILTER)
// ===================================================================

let currentTxFilter = {
  search: '',
  type: 'all',
  category: 'all',
  period: 'all',
  startDate: '',
  endDate: '',
};

function initTransactionFilterEvents() {
  const searchInput = document.getElementById('txSearchInput');
  const clearBtn = document.getElementById('txSearchClear');
  const typePills = document.getElementById('txTypePills');
  const catSelect = document.getElementById('txFilterCategory');
  const periodSelect = document.getElementById('txFilterPeriod');
  const customDateRow = document.getElementById('txCustomDateRow');
  const startDateInput = document.getElementById('txFilterStartDate');
  const endDateInput = document.getElementById('txFilterEndDate');

  // Search input
  searchInput.addEventListener('input', (e) => {
    currentTxFilter.search = e.target.value.toLowerCase().trim();
    clearBtn.classList.toggle('hidden', !e.target.value);
    renderTransactionsView();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentTxFilter.search = '';
    clearBtn.classList.add('hidden');
    renderTransactionsView();
  });

  // Type pills
  typePills.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      typePills.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTxFilter.type = e.target.dataset.type;
      populateCategoryFilterDropdown();
      renderTransactionsView();
    }
  });

  // Category select
  catSelect.addEventListener('change', (e) => {
    currentTxFilter.category = e.target.value;
    renderTransactionsView();
  });

  // Period select
  periodSelect.addEventListener('change', (e) => {
    currentTxFilter.period = e.target.value;
    if (e.target.value === 'custom') {
      customDateRow.classList.remove('hidden');
    } else {
      customDateRow.classList.add('hidden');
    }
    renderTransactionsView();
  });

  startDateInput.addEventListener('change', (e) => {
    currentTxFilter.startDate = e.target.value;
    renderTransactionsView();
  });

  endDateInput.addEventListener('change', (e) => {
    currentTxFilter.endDate = e.target.value;
    renderTransactionsView();
  });
}

function populateCategoryFilterDropdown() {
  const catSelect = document.getElementById('txFilterCategory');
  const currentVal = catSelect.value;
  catSelect.innerHTML = '<option value="all">Semua Kategori</option>';

  let cats = [];
  if (currentTxFilter.type === 'income') {
    cats = INCOME_CATEGORIES;
  } else if (currentTxFilter.type === 'expense') {
    cats = EXPENSE_CATEGORIES;
  } else {
    cats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  }

  // Deduplicate
  const seen = new Set();
  cats.forEach(c => {
    if (!seen.has(c.name)) {
      seen.add(c.name);
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    }
  });

  if (seen.has(currentVal)) {
    catSelect.value = currentVal;
  } else {
    currentTxFilter.category = 'all';
  }
}

function renderTransactionsView() {
  populateCategoryFilterDropdown();
  const container = document.getElementById('transactionsFullList');
  container.innerHTML = '';

  const todayStr = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthPrefix = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  // Filter list
  const filtered = state.transactions.filter(tx => {
    // Type filter
    if (currentTxFilter.type !== 'all' && tx.type !== currentTxFilter.type) return false;

    // Category filter
    if (currentTxFilter.category !== 'all' && tx.category !== currentTxFilter.category) return false;

    // Search query filter
    if (currentTxFilter.search) {
      const q = currentTxFilter.search;
      const matchCat = (tx.category || '').toLowerCase().includes(q);
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      if (!matchCat && !matchNote) return false;
    }

    // Period filter
    if (currentTxFilter.period === 'today' && tx.date !== todayStr) return false;
    if (currentTxFilter.period === 'yesterday' && tx.date !== yesterdayStr) return false;
    if (currentTxFilter.period === 'this_month' && !tx.date.startsWith(thisMonthPrefix)) return false;
    if (currentTxFilter.period === 'last_month' && !tx.date.startsWith(lastMonthPrefix)) return false;
    if (currentTxFilter.period === 'custom') {
      if (currentTxFilter.startDate && tx.date < currentTxFilter.startDate) return false;
      if (currentTxFilter.endDate && tx.date > currentTxFilter.endDate) return false;
    }

    return true;
  });

  // Calculate Net Total for Filtered Results
  let netTotal = 0;
  filtered.forEach(tx => {
    if (tx.type === 'income') netTotal += Number(tx.amount) || 0;
    else netTotal -= Number(tx.amount) || 0;
  });

  document.getElementById('txFilterCount').textContent = `${filtered.length} transaksi`;
  document.getElementById('txFilterTotal').textContent = `Total: ${formatRupiah(netTotal)}`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-filter-circle-xmark"></i></div>
        <h4 class="empty-state-title">Tidak Ada Transaksi</h4>
        <p class="empty-state-desc">Tidak ditemukan transaksi yang cocok dengan filter yang dipilih.</p>
      </div>
    `;
    return;
  }

  // Group by date (Sort desc)
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);

  const groups = {};
  filtered.forEach(tx => {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  });

  Object.keys(groups).forEach(dateStr => {
    let title = formatIndonesianDate(dateStr);
    if (dateStr === todayStr) title = `Hari Ini • ${title}`;
    else if (dateStr === yesterdayStr) title = `Kemarin • ${title}`;

    // Subtotal of group
    let groupNet = 0;
    groups[dateStr].forEach(t => {
      groupNet += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
    });

    const header = document.createElement('div');
    header.className = 'tx-group-header';
    header.innerHTML = `
      <span>${title}</span>
      <span class="tx-group-total">${formatRupiah(groupNet)}</span>
    `;
    container.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.className = 'transaction-list';
    groups[dateStr].forEach(tx => {
      listContainer.appendChild(createTransactionElement(tx, true));
    });
    container.appendChild(listContainer);
  });
}

// ===================================================================
// BUDGET & GOALS VIEW
// ===================================================================

function renderBudgetView() {
  // 1. Overall Monthly Budget
  const totals = calculateTotals();
  const overallLimit = state.budgets.overallMonthlyLimit || 0;
  const overallUsed = totals.totalExpense;
  const overallRem = Math.max(0, overallLimit - overallUsed);
  const overallPct = overallLimit > 0 ? Math.min(100, Math.round((overallUsed / overallLimit) * 100)) : 0;

  document.getElementById('overallBudgetAmount').textContent = formatRupiah(overallLimit);
  document.getElementById('overallBudgetUsed').textContent = `Terpakai: ${formatRupiah(overallUsed)} (${overallPct}%)`;
  document.getElementById('overallBudgetRemaining').textContent = `Sisa: ${formatRupiah(overallRem)}`;

  const fillEl = document.getElementById('overallBudgetFill');
  fillEl.style.width = `${overallPct}%`;
  fillEl.className = 'progress-bar-fill';

  const warnEl = document.getElementById('overallBudgetWarning');
  const warnText = document.getElementById('overallBudgetWarningText');

  if (overallLimit > 0) {
    if (overallPct >= 100) {
      fillEl.classList.add('fill-danger');
      warnEl.classList.remove('hidden', 'alert-warning');
      warnText.textContent = 'Peringatan: Total pengeluaran telah melampaui batas anggaran bulanan!';
    } else if (overallPct >= 75) {
      fillEl.classList.add('fill-warning');
      warnEl.classList.remove('hidden');
      warnEl.classList.add('alert-warning');
      warnText.textContent = 'Peringatan: Pengeluaran telah mencapai 75% dari batas!';
    } else {
      warnEl.classList.add('hidden');
    }
  } else {
    warnEl.classList.add('hidden');
  }

  // 2. Category Budgets
  renderCategoryBudgetsList();

  // 3. Savings Goals Full List
  renderGoalsFullList();
}

function renderCategoryBudgetsList() {
  const container = document.getElementById('categoryBudgetsList');
  container.innerHTML = '';

  const catBudgets = state.budgets.categoryBudgets || {};
  const categoriesWithBudget = Object.keys(catBudgets);

  if (categoriesWithBudget.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-chart-pie"></i></div>
        <h4 class="empty-state-title">Belum Ada Anggaran Kategori</h4>
        <p class="empty-state-desc">Atur batas pengeluaran untuk pos penting seperti Makanan, Jajan, atau Belanja.</p>
        <button type="button" class="btn-primary-sm mt-2" onclick="openCategoryBudgetModal()">
          <i class="fa-solid fa-plus"></i> Tambah Anggaran Kategori
        </button>
      </div>
    `;
    return;
  }

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  categoriesWithBudget.forEach(catName => {
    const limit = catBudgets[catName] || 0;
    const catDef = findCategoryDef(catName, 'expense');

    // Calculate current month's spent for this category
    let spent = 0;
    state.transactions.forEach(t => {
      if (t.type === 'expense' && t.category === catName && t.date && t.date.startsWith(thisMonthPrefix)) {
        spent += Number(t.amount) || 0;
      }
    });

    const rem = Math.max(0, limit - spent);
    const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

    let fillClass = '';
    let warningBadge = '';
    if (pct >= 100) {
      fillClass = 'fill-danger';
      warningBadge = '<span class="badge-soft" style="background:#fee2e2; color:#dc2626;"><i class="fa-solid fa-triangle-exclamation"></i> Lewat Batas!</span>';
    } else if (pct >= 75) {
      fillClass = 'fill-warning';
      warningBadge = '<span class="badge-soft" style="background:#fef3c7; color:#b45309;"><i class="fa-solid fa-circle-exclamation"></i> Mendekati Batas</span>';
    }

    const card = document.createElement('div');
    card.className = 'cat-budget-card';
    card.innerHTML = `
      <div class="cat-budget-top">
        <div class="cat-budget-badge">
          <i class="fa-solid ${catDef.icon}" style="color:${catDef.color}"></i>
          <span>${escapeHtml(catName)}</span>
          ${warningBadge}
        </div>
        <div class="cat-budget-actions">
          <button type="button" class="tx-action-btn" title="Edit" onclick="openCategoryBudgetModal('${escapeHtml(catName)}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="tx-action-btn" title="Hapus" onclick="deleteCategoryBudget('${escapeHtml(catName)}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-track">
          <div class="progress-bar-fill ${fillClass}" style="width: ${pct}%;"></div>
        </div>
        <div class="progress-label-row">
          <span>Terpakai: ${formatRupiah(spent)} / ${formatRupiah(limit)}</span>
          <span class="text-semibold">Sisa: ${formatRupiah(rem)} (${pct}%)</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderGoalsFullList() {
  const container = document.getElementById('goalsFullList');
  container.innerHTML = '';

  let totalAccumulated = 0;
  state.goals.forEach(g => {
    totalAccumulated += Number(g.currentAmount) || 0;
  });
  document.getElementById('totalSavingsAccumulated').textContent = formatRupiah(totalAccumulated);

  if (state.goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-bullseye"></i></div>
        <h4 class="empty-state-title">Belum Ada Target Tabungan</h4>
        <p class="empty-state-desc">Buat target impian Anda, mulai dari dana darurat, liburan, hingga gadget baru!</p>
        <button type="button" class="btn-primary-sm mt-2" onclick="openGoalModal()">
          <i class="fa-solid fa-plus"></i> Buat Target Tabungan
        </button>
      </div>
    `;
    return;
  }

  state.goals.forEach(goal => {
    const current = goal.currentAmount || 0;
    const target = goal.targetAmount || 1;
    const pct = Math.min(100, Math.round((current / target) * 100));
    const isCompleted = current >= target;

    const card = document.createElement('div');
    card.className = 'goal-item-card';
    card.innerHTML = `
      <div class="goal-item-top">
        <div class="goal-header">
          <div class="goal-icon-badge">
            <i class="fa-solid ${goal.icon || 'fa-piggy-bank'}"></i>
          </div>
          <div>
            <h4 class="goal-name" style="font-size: 1rem;">${escapeHtml(goal.name)}</h4>
            <span class="goal-target-text">
              Target: ${formatRupiah(target)} ${goal.deadline ? `• Hingga ${formatIndonesianDate(goal.deadline)}` : ''}
            </span>
          </div>
        </div>
        <div class="goal-action-btns">
          <button type="button" class="tx-action-btn" title="Edit" onclick="openGoalModal('${goal.id}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="tx-action-btn" title="Hapus" onclick="deleteGoal('${goal.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${pct}%; ${isCompleted ? 'background: #10b981;' : ''}"></div>
        </div>
        <div class="progress-label-row">
          <span class="text-semibold">${formatRupiah(current)} terkumpul</span>
          <span>${pct}% ${isCompleted ? '🎉 Tercapai!' : ''}</span>
        </div>
      </div>
      <div class="mt-2" style="display:flex; justify-content: flex-end;">
        <button type="button" class="btn-primary-sm" onclick="openDepositModal('${goal.id}')">
          <i class="fa-solid fa-coins"></i> Alokasi Saldo
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ===================================================================
// REPORTS / ANALYTICS VIEW
// ===================================================================

function initReportEvents() {
  document.getElementById('btnPrevReportMonth').addEventListener('click', () => {
    state.selectedReportDate.setMonth(state.selectedReportDate.getMonth() - 1);
    renderReportsView();
  });

  document.getElementById('btnNextReportMonth').addEventListener('click', () => {
    state.selectedReportDate.setMonth(state.selectedReportDate.getMonth() + 1);
    renderReportsView();
  });

  document.getElementById('btnExportCSVReport').addEventListener('click', () => {
    exportTransactionsToCSV(getReportMonthPrefix());
  });
}

function getReportMonthPrefix() {
  const y = state.selectedReportDate.getFullYear();
  const m = String(state.selectedReportDate.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function renderReportsView() {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthName = months[state.selectedReportDate.getMonth()];
  const yearNum = state.selectedReportDate.getFullYear();
  document.getElementById('reportPeriodTitle').textContent = `${monthName} ${yearNum}`;

  const prefix = getReportMonthPrefix();
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenses = {};
  const dailyIncome = {};
  const dailyExpense = {};

  // Days count in this month
  const daysInMonth = new Date(yearNum, state.selectedReportDate.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = String(i).padStart(2, '0');
    dailyIncome[dayStr] = 0;
    dailyExpense[dayStr] = 0;
  }

  state.transactions.forEach(tx => {
    if (tx.date && tx.date.startsWith(prefix)) {
      const amt = Number(tx.amount) || 0;
      const day = tx.date.split('-')[2];

      if (tx.type === 'income') {
        totalIncome += amt;
        if (dailyIncome[day] !== undefined) dailyIncome[day] += amt;
      } else {
        totalExpense += amt;
        if (dailyExpense[day] !== undefined) dailyExpense[day] += amt;
        categoryExpenses[tx.category] = (categoryExpenses[tx.category] || 0) + amt;
      }
    }
  });

  const netCashflow = totalIncome - totalExpense;

  document.getElementById('reportIncomeTotal').textContent = formatRupiah(totalIncome);
  document.getElementById('reportExpenseTotal').textContent = formatRupiah(totalExpense);
  document.getElementById('reportNetTotal').textContent = formatRupiah(netCashflow);

  const netHint = document.getElementById('reportNetHint');
  if (netCashflow > 0) {
    netHint.textContent = `✨ Surplus keuangan ${formatRupiah(netCashflow)}`;
    netHint.style.color = '#10b981';
  } else if (netCashflow < 0) {
    netHint.textContent = `⚠️ Defisit anggaran ${formatRupiah(Math.abs(netCashflow))}`;
    netHint.style.color = '#f43f5e';
  } else {
    netHint.textContent = 'Pemasukan dan pengeluaran seimbang';
    netHint.style.color = 'var(--text-muted)';
  }

  // Render Charts
  renderCategoryDonutChart(categoryExpenses, totalExpense);
  renderDailyTrendChart(dailyIncome, dailyExpense, daysInMonth);
}

function renderCategoryDonutChart(catExpenses, totalExpense) {
  const canvas = document.getElementById('categoryDonutChart');
  const emptyPlaceholder = document.getElementById('emptyDonutPlaceholder');
  const breakdownList = document.getElementById('categoryBreakdownList');
  breakdownList.innerHTML = '';

  const entries = Object.entries(catExpenses).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0 || totalExpense === 0) {
    emptyPlaceholder.classList.remove('hidden');
    canvas.style.display = 'none';
    if (state.charts.categoryDonut) {
      state.charts.categoryDonut.destroy();
      state.charts.categoryDonut = null;
    }
    return;
  }

  emptyPlaceholder.classList.add('hidden');
  canvas.style.display = 'block';

  const labels = [];
  const data = [];
  const colors = [];

  entries.forEach(([catName, amt]) => {
    const catDef = findCategoryDef(catName, 'expense');
    const pct = ((amt / totalExpense) * 100).toFixed(1);
    labels.push(catName);
    data.push(amt);
    colors.push(catDef.color);

    // Add to breakdown table/list
    const row = document.createElement('div');
    row.className = 'breakdown-row';
    row.innerHTML = `
      <div class="breakdown-left">
        <span class="breakdown-dot" style="background-color: ${catDef.color};"></span>
        <span class="breakdown-name">${escapeHtml(catName)}</span>
      </div>
      <div class="breakdown-right">
        <span class="breakdown-pct">${pct}%</span>
        <span class="breakdown-val">${formatRupiah(amt)}</span>
      </div>
    `;
    breakdownList.appendChild(row);
  });

  if (state.charts.categoryDonut) {
    state.charts.categoryDonut.destroy();
  }

  const ctx = canvas.getContext('2d');
  state.charts.categoryDonut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatRupiah(ctx.raw)} (${((ctx.raw / totalExpense) * 100).toFixed(1)}%)`
          }
        }
      }
    }
  });
}

function renderDailyTrendChart(dailyIncome, dailyExpense, daysInMonth) {
  const canvas = document.getElementById('dailyTrendChart');
  const emptyPlaceholder = document.getElementById('emptyDailyPlaceholder');
  if (!canvas) return;

  const labels = [];
  const incData = [];
  const expData = [];

  let hasData = false;
  for (let i = 1; i <= daysInMonth; i++) {
    const dayKey = String(i).padStart(2, '0');
    labels.push(dayKey);
    const inc = dailyIncome[dayKey] || 0;
    const exp = dailyExpense[dayKey] || 0;
    if (inc > 0 || exp > 0) hasData = true;
    incData.push(inc);
    expData.push(exp);
  }

  if (!hasData) {
    emptyPlaceholder.classList.remove('hidden');
    canvas.style.display = 'none';
    if (state.charts.dailyTrend) {
      state.charts.dailyTrend.destroy();
      state.charts.dailyTrend = null;
    }
    return;
  }

  emptyPlaceholder.classList.add('hidden');
  canvas.style.display = 'block';

  if (state.charts.dailyTrend) {
    state.charts.dailyTrend.destroy();
  }

  const ctx = canvas.getContext('2d');
  state.charts.dailyTrend = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderRadius: 4,
          barPercentage: 0.8,
        },
        {
          label: 'Pengeluaran',
          data: expData,
          backgroundColor: 'rgba(244, 63, 94, 0.8)',
          borderRadius: 4,
          barPercentage: 0.8,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 10, font: { size: 10 } }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatRupiah(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 15 }
        },
        y: {
          grid: { color: 'rgba(244, 114, 182, 0.1)' },
          ticks: {
            font: { size: 9 },
            callback: (v) => (v >= 1000000 ? (v / 1000000) + 'jt' : (v >= 1000 ? (v / 1000) + 'rb' : v))
          }
        }
      }
    }
  });
}

// ===================================================================
// SETTINGS, BACKUP, EXPORT & IMPORT
// ===================================================================

function initSettingsEvents() {
  document.getElementById('btnOpenSettings').addEventListener('click', () => {
    navigateToTab('settings');
  });

  // Export JSON Backup
  document.getElementById('btnExportJSON').addEventListener('click', exportJSONBackup);

  // Export CSV Transactions
  document.getElementById('btnExportCSVAll').addEventListener('click', () => {
    exportTransactionsToCSV();
  });

  // Import JSON File
  document.getElementById('importFileInput').addEventListener('change', handleImportJSON);

  // Reset All Data
  document.getElementById('btnResetAllData').addEventListener('click', () => {
    showConfirmModal({
      title: 'Hapus Seluruh Data?',
      message: 'PERINGATAN: Semua riwayat transaksi, batas anggaran, dan target tabungan akan dihapus permanen dari browser ini!',
      confirmText: 'Ya, Hapus Semua',
      isDanger: true,
      onConfirm: () => {
        state.transactions = [];
        state.budgets = { overallMonthlyLimit: 0, categoryBudgets: {} };
        state.goals = [];
        saveTransactions();
        saveBudgets();
        saveGoals();
        showToast('Seluruh data berhasil dihapus.', 'pink');
        renderDashboard();
        renderSettingsView();
      }
    });
  });

  // Toggle Eye Balance
  document.getElementById('toggleBalanceVisibility').addEventListener('click', () => {
    state.settings.hideBalance = !state.settings.hideBalance;
    saveSettings();
    renderDashboard();
  });
}

function renderSettingsView() {
  const summaryEl = document.getElementById('storageSummaryText');
  summaryEl.textContent = `${state.transactions.length} Transaksi • ${state.goals.length} Target Tabungan • ${Object.keys(state.budgets.categoryBudgets || {}).length} Pos Anggaran`;
}

function exportJSONBackup() {
  const backupData = {
    appName: 'PinkWallet',
    version: '1.0',
    exportDate: new Date().toISOString(),
    transactions: state.transactions,
    budgets: state.budgets,
    goals: state.goals,
    settings: state.settings,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pinkwallet-cadangan-${getTodayDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Cadangan JSON berhasil diunduh!', 'success');
}

function handleImportJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data || (!Array.isArray(data.transactions) && !data.budgets)) {
        showToast('Format file cadangan tidak valid!', 'danger');
        return;
      }

      showConfirmModal({
        title: 'Pulihkan Data Cadangan?',
        message: `Ditemukan ${data.transactions?.length || 0} transaksi dalam file cadangan. Apakah Anda ingin menimpa data saat ini dengan data cadangan ini?`,
        confirmText: 'Pulihkan Data',
        isDanger: false,
        onConfirm: () => {
          if (Array.isArray(data.transactions)) state.transactions = data.transactions;
          if (data.budgets) state.budgets = data.budgets;
          if (Array.isArray(data.goals)) state.goals = data.goals;
          if (data.settings) state.settings = data.settings;

          saveTransactions();
          saveBudgets();
          saveGoals();
          saveSettings();

          showToast('Data berhasil dipulihkan dari cadangan!', 'success');
          navigateToTab('dashboard');
        }
      });
    } catch (err) {
      console.error(err);
      showToast('Gagal membaca file JSON: format salah.', 'danger');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset input file
}

function exportTransactionsToCSV(filterMonthPrefix = null) {
  let list = state.transactions;
  if (filterMonthPrefix) {
    list = list.filter(t => t.date && t.date.startsWith(filterMonthPrefix));
  }

  if (list.length === 0) {
    showToast('Tidak ada transaksi untuk diekspor.', 'pink');
    return;
  }

  // Header CSV (with UTF-8 BOM so Excel opens Indonesian characters cleanly)
  let csvContent = '\uFEFFID,Tanggal,Tipe,Kategori,Nominal,Catatan\n';

  list.forEach(tx => {
    const safeNote = (tx.note || '').replace(/"/g, '""');
    const typeLabel = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    csvContent += `"${tx.id}","${tx.date}","${typeLabel}","${tx.category}",${tx.amount},"${safeNote}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = filterMonthPrefix ? `pinkwallet-transaksi-${filterMonthPrefix}.csv` : `pinkwallet-semua-transaksi-${getTodayDateString()}.csv`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('File CSV berhasil diunduh untuk Excel!', 'success');
}

// ===================================================================
// UTILS & INITIALIZATION
// ===================================================================

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function renderCurrentTab() {
  if (state.activeTab === 'dashboard') renderDashboard();
  else if (state.activeTab === 'transactions') renderTransactionsView();
  else if (state.activeTab === 'budget') renderBudgetView();
  else if (state.activeTab === 'reports') renderReportsView();
  else if (state.activeTab === 'settings') renderSettingsView();
}

function updateDateHeader() {
  const dateEl = document.getElementById('currentDateDisplay');
  if (dateEl) {
    const today = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    dateEl.textContent = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  updateDateHeader();
  initTransactionEvents();
  initTransactionFilterEvents();
  initBudgetEvents();
  initGoalEvents();
  initReportEvents();
  initSettingsEvents();

  // Initial tab render
  navigateToTab('dashboard');
});
