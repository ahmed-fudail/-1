const state = {
  allData: [],
  currentFilter: 'all',
  query: '',
  selectedId: null
};

const elements = {
  summary: document.getElementById('summary'),
  tableBody: document.getElementById('table-body'),
  recordCount: document.getElementById('record-count'),
  searchInput: document.getElementById('searchInput'),
  detailPanel: document.getElementById('detailPanel'),
  detailTitle: document.getElementById('detailTitle'),
  detailCostCenter: document.getElementById('detailCostCenter'),
  detailBooking: document.getElementById('detailBooking'),
  detailContract: document.getElementById('detailContract'),
  detailNotes: document.getElementById('detailNotes'),
  detailAmount: document.getElementById('detailAmount'),
  detailStatus: document.getElementById('detailStatus'),
  shareBtn: document.getElementById('shareBtn')
};

const normalize = (value = '') => {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const safeText = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  return text === 'null' ? '' : text;
};

const formatMoney = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value || 0));

const wordsFrom = (record) => {
  const text = [
    record.id,
    record.cost_center,
    record.booking_number,
    record.contract_details,
    record.notes,
    record.amount_lyd,
    record.needs_review ? 'needs review review' : 'no review'
  ].join(' ');

  return normalize(text);
};

const matchesSmartSearch = (record, query) => {
  if (!query) return true;

  const q = normalize(query).trim();
  const searchText = wordsFrom(record);

  if (!q) return true;
  if (searchText.includes(q)) return true;

  const tokens = q.split(' ').filter((token) => token.length > 1);
  if (tokens.length === 0) return true;

  return tokens.every((token) => searchText.includes(token));
};

const filteredRecords = () => {
  return state.allData.filter((record) => {
    const matchesQuery = matchesSmartSearch(record, state.query);
    const matchesFilter =
      state.currentFilter === 'all'
        ? true
        : state.currentFilter === 'review'
          ? record.needs_review
          : !record.needs_review;

    return matchesQuery && matchesFilter;
  });
};

const renderSummary = (records) => {
  const totalAmount = records.reduce((sum, item) => sum + Number(item.amount_lyd || 0), 0);
  const reviewCount = records.filter((item) => item.needs_review).length;

  elements.summary.innerHTML = `
    <div class="card">
      <span class="label">إجمالي السجلات</span>
      <span class="value">${records.length}</span>
    </div>
    <div class="card">
      <span class="label">إجمالي المبلغ</span>
      <span class="value">${formatMoney(totalAmount)} LYD</span>
    </div>
    <div class="card">
      <span class="label">تحتاج مراجعة</span>
      <span class="value">${reviewCount}</span>
    </div>
  `;
};

const getDisplayNotes = (record) => safeText(record.notes || '');

const renderDetailCard = (record) => {
  if (!record) {
    elements.detailPanel.classList.add('hidden');
    return;
  }

  const notes = getDisplayNotes(record);
  const statusText = record.needs_review ? 'تحتاج مراجعة' : 'غير مطلوبة';

  elements.detailTitle.textContent = record.cost_center || 'مركز التكلفة';
  elements.detailCostCenter.textContent = safeText(record.cost_center) || '–';
  elements.detailBooking.textContent = safeText(record.booking_number) || '–';
  elements.detailContract.textContent = safeText(record.contract_details) || '–';
  elements.detailNotes.textContent = notes || ' ';
  elements.detailAmount.textContent = `${formatMoney(record.amount_lyd)} LYD`;
  elements.detailStatus.textContent = statusText;
  elements.detailPanel.classList.remove('hidden');
};

const renderTable = (records) => {
  if (!records.length) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty">لا توجد نتائج تطابق البحث الحالي.</td>
      </tr>
    `;
    return;
  }

  elements.tableBody.innerHTML = records
    .map((record) => {
      const notes = getDisplayNotes(record);
      const selectedClass = record.id === state.selectedId ? 'selected' : '';

      return `
        <tr data-id="${record.id}" class="${selectedClass}">
          <td>${safeText(record.cost_center) || '–'}</td>
          <td>${safeText(record.booking_number) || '–'}</td>
          <td>${safeText(record.contract_details) || '–'}</td>
          <td>${notes || ''}</td>
          <td>${formatMoney(record.amount_lyd)} LYD</td>
        </tr>
      `;
    })
    .join('');
};

const syncSelectionFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id && state.allData.some((record) => record.id === id)) {
    state.selectedId = id;
  }
};

const syncUrlWithSelection = () => {
  const url = new URL(window.location.href);
  if (state.selectedId) {
    url.searchParams.set('id', state.selectedId);
  } else {
    url.searchParams.delete('id');
  }
  window.history.replaceState({}, '', url.toString());
};

const shareSelectedRecord = async () => {
  const record = state.allData.find((item) => item.id === state.selectedId);
  if (!record) return;

  const shareUrl = new URL(window.location.href);
  shareUrl.searchParams.set('id', record.id);

  const shareText = [
    `مركز التكلفة: ${safeText(record.cost_center) || '—'}`,
    `رقم الحجز: ${safeText(record.booking_number) || '—'}`,
    `تفاصيل العقد: ${safeText(record.contract_details) || '—'}`,
    `الملاحظات: ${getDisplayNotes(record) || 'لا يوجد'}`,
    `المبلغ: ${formatMoney(record.amount_lyd)} LYD`
  ].join('\n');

  try {
    if (navigator.share) {
      await navigator.share({
        title: 'دليل مراكز التكلفة',
        text: shareText,
        url: shareUrl.toString()
      });
      return;
    }

    await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl.toString()}`);
    alert('تم نسخ تفاصيل المركز إلى الحافظة');
  } catch (error) {
    console.error('Share failed', error);
  }
};

const render = () => {
  const records = filteredRecords();

  if (!records.length) {
    state.selectedId = null;
    renderSummary([]);
    renderTable([]);
    elements.recordCount.textContent = '0';
    elements.detailPanel.classList.add('hidden');
    return;
  }

  if (!records.some((record) => record.id === state.selectedId)) {
    state.selectedId = records[0].id;
  }

  const selectedRecord = records.find((record) => record.id === state.selectedId) || records[0];
  renderSummary(records);
  renderTable(records);
  renderDetailCard(selectedRecord);
  elements.recordCount.textContent = String(records.length);
  syncUrlWithSelection();
};

const bindEvents = () => {
  elements.searchInput.addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    render();
  });

  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      state.currentFilter = button.dataset.filter;
      render();
    });
  });

  elements.tableBody.addEventListener('click', (event) => {
    const row = event.target.closest('tr[data-id]');
    if (!row) return;

    state.selectedId = row.dataset.id;
    render();
  });

  elements.shareBtn.addEventListener('click', shareSelectedRecord);
};

const init = async () => {
  try {
    const response = await fetch('./data/cost_centers_initial_data.json');
    const payload = await response.json();
    state.allData = payload.records || [];
    syncSelectionFromUrl();
    bindEvents();
    render();
  } catch (error) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty">تعذر تحميل البيانات. تأكد من تشغيل الخادم المحلي.</td>
      </tr>
    `;
    console.error(error);
  }
};

init();
