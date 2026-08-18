const state = {
  allData: [],
  currentFilter: 'all',
  query: ''
};

const elements = {
  summary: document.getElementById('summary'),
  tableBody: document.getElementById('table-body'),
  recordCount: document.getElementById('record-count'),
  searchInput: document.getElementById('searchInput')
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

const formatMoney = (value) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);

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

const renderTable = (records) => {
  if (!records.length) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">لا توجد نتائج تطابق البحث الحالي.</td>
      </tr>
    `;
    return;
  }

  elements.tableBody.innerHTML = records
    .map((record) => {
      const statusText = record.needs_review ? 'تحتاج مراجعة' : 'مقبولة';
      const statusClass = record.needs_review ? 'review' : 'good';

      return `
        <tr>
          <td>${record.id}</td>
          <td>${record.cost_center}</td>
          <td>${record.booking_number}</td>
          <td>${record.contract_details}</td>
          <td>${record.notes}</td>
          <td>${formatMoney(record.amount_lyd)}</td>
          <td><span class="badge ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    })
    .join('');
};

const render = () => {
  const records = filteredRecords();
  renderSummary(records);
  renderTable(records);
  elements.recordCount.textContent = String(records.length);
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
};

const init = async () => {
  try {
    const response = await fetch('./data/cost_centers_initial_data.json');
    const payload = await response.json();
    state.allData = payload.records || [];
    bindEvents();
    render();
  } catch (error) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">تعذر تحميل البيانات. تأكد من تشغيل الخادم المحلي.</td>
      </tr>
    `;
    console.error(error);
  }
};

init();
