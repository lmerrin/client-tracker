const STORAGE_KEY = 'webbyWahineClientTracker.v1';

const STAGES = ['Inquiry / Discovery','Proposal / Contract','Content Collection','Design / Build','Client Review','Revisions','Deployment / Domain','Care Plan','Complete'];
const STATUSES = ['Not Started','In Progress','Waiting on Client','Ready for Review','Revisions','Ready to Launch','Complete','On Hold'];
const PAYMENTS = ['Not Started','Deposit Due','Deposit Paid','Payment Plan','Paid in Full','Trade Agreement','N/A'];
const CARE_PLANS = ['Not Offered','Offered','Accepted','Declined'];

const $ = (selector) => document.querySelector(selector);
const clientGrid = $('#clientGrid');
const dialog = $('#clientDialog');
const form = $('#clientForm');
let clients = loadClients();

function loadClients() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

function saveClients(message = 'Changes saved') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  render();
  showToast(message);
}

function fillSelect(select, options) {
  options.forEach(option => select.add(new Option(option, option)));
}

function initSelects() {
  fillSelect($('#stage'), STAGES);
  fillSelect($('#status'), STATUSES);
  fillSelect($('#payment'), PAYMENTS);
  fillSelect($('#carePlan'), CARE_PLANS);
  STATUSES.forEach(status => $('#statusFilter').add(new Option(status, status)));
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function safeUrl(value = '') {
  try {
    const url = new URL(value);
    return ['http:','https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function formatDate(date) {
  if (!date) return 'No follow-up set';
  return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`));
}

function isOverdue(date) {
  if (!date) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(`${date}T00:00:00`) < today;
}

function filteredClients() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const status = $('#statusFilter').value;
  const priority = $('#priorityFilter').value;
  const showArchived = $('#archiveToggle').checked;
  return clients.filter(client => {
    const searchable = [client.name,client.contact,client.projectType,client.nextAction,client.deliverables].join(' ').toLowerCase();
    return (showArchived || !client.archived) && (!query || searchable.includes(query)) && (!status || client.status === status) && (!priority || client.priority === priority);
  }).sort((a,b) => Number(a.archived)-Number(b.archived) || priorityRank(a.priority)-priorityRank(b.priority) || (a.name||'').localeCompare(b.name||''));
}

function priorityRank(priority) { return ({High:0,Medium:1,Low:2})[priority] ?? 3; }

function render() {
  const active = clients.filter(c => !c.archived && c.status !== 'Complete');
  $('#activeCount').textContent = active.length;
  $('#waitingCount').textContent = active.filter(c => c.waiting).length;
  $('#priorityCount').textContent = active.filter(c => c.priority === 'High').length;
  $('#followupCount').textContent = active.filter(c => isOverdue(c.nextFollowup)).length;

  const visible = filteredClients();
  $('#resultCount').textContent = `${visible.length} ${visible.length === 1 ? 'client' : 'clients'}`;
  $('#emptyState').hidden = clients.length !== 0 || visible.length !== 0;

  if (clients.length && !visible.length) {
    clientGrid.innerHTML = '<div class="empty-state"><h3>No matching projects</h3><p>Try changing your search or filters.</p></div>';
    return;
  }

  clientGrid.innerHTML = visible.map(client => {
    const statusClass = client.status === 'Complete' ? 'complete' : client.waiting ? 'waiting' : '';
    const due = client.status === 'Complete' ? 'Project complete' : formatDate(client.nextFollowup);
    const overdue = client.status !== 'Complete' && isOverdue(client.nextFollowup);
    const website = safeUrl(client.url);
    return `<article class="client-card ${client.archived ? 'archived-card' : ''}">
      <div class="card-top">
        <div><h3 class="card-title">${escapeHtml(client.name)}</h3><p class="card-meta">${escapeHtml(client.stage || 'No stage')}<span class="priority ${escapeHtml((client.priority||'').toLowerCase())}">${escapeHtml(client.priority || '')}</span></p></div>
        <span class="status-pill ${statusClass}">${escapeHtml(client.archived ? 'Archived' : client.status || 'No status')}</span>
      </div>
      <div class="card-progress"><div class="progress-label"><span>Progress</span><strong>${Number(client.progress)||0}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,Math.max(0,Number(client.progress)||0))}%"></div></div></div>
      <div class="card-next"><span>Your next action</span><p>${escapeHtml(client.nextAction || 'Add the next action for this project.')}</p></div>
      <div class="card-footer"><span class="due ${overdue ? 'overdue' : ''}">${overdue ? 'Follow-up overdue · ' : 'Follow-up · '}${escapeHtml(due)}</span><div class="card-actions">${website ? `<a class="mini-button" href="${escapeHtml(website)}" target="_blank" rel="noopener">Open site</a>` : ''}<button class="mini-button edit-button" data-id="${escapeHtml(client.id)}" type="button">Edit</button></div></div>
    </article>`;
  }).join('');
}

function openDialog(client = null) {
  form.reset();
  $('#dialogTitle').textContent = client ? 'Edit client' : 'Add client';
  $('#archiveBtn').hidden = !client;
  $('#clientId').value = client?.id || '';
  const values = client || {stage:STAGES[0],status:STATUSES[0],priority:'Medium',waiting:false,progress:0,payment:PAYMENTS[0],carePlan:CARE_PLANS[0]};
  ['name','contact','projectType','stage','status','priority','deliverables','nextAction','url','hosting','payment','carePlan','lastContact','nextFollowup','targetLaunch','notes','progress'].forEach(key => {
    const input = $(`#${key}`); if (input) input.value = values[key] ?? '';
  });
  $('#waiting').value = String(Boolean(values.waiting));
  $('#progressOutput').textContent = `${values.progress || 0}%`;
  $('#archiveBtn').textContent = client?.archived ? 'Restore client' : 'Archive client';
  dialog.showModal();
  requestAnimationFrame(() => $('#name').focus());
}

function formData() {
  const existing = clients.find(client => client.id === $('#clientId').value);
  return {
    id: existing?.id || crypto.randomUUID(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: existing?.archived || false,
    name: $('#name').value.trim(), contact: $('#contact').value.trim(), projectType: $('#projectType').value.trim(),
    stage: $('#stage').value, status: $('#status').value, priority: $('#priority').value, waiting: $('#waiting').value === 'true', progress: Number($('#progress').value),
    deliverables: $('#deliverables').value.trim(), nextAction: $('#nextAction').value.trim(), url: $('#url').value.trim(), hosting: $('#hosting').value.trim(),
    payment: $('#payment').value, carePlan: $('#carePlan').value, lastContact: $('#lastContact').value, nextFollowup: $('#nextFollowup').value, targetLaunch: $('#targetLaunch').value, notes: $('#notes').value.trim()
  };
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({app:'Webby Wahine Client Tracker',version:1,exportedAt:new Date().toISOString(),clients},null,2)],{type:'application/json'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `webby-wahine-client-backup-${new Date().toISOString().slice(0,10)}.json`;
  link.click(); URL.revokeObjectURL(link.href); showToast('Backup exported');
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.clients)) throw new Error();
    if (clients.length && !confirm('Importing will replace the client records currently saved on this device. Continue?')) return;
    clients = data.clients; saveClients('Backup imported');
  } catch { alert('That file is not a valid Webby Wahine client backup.'); }
}

let toastTimer;
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'),2200);
}

initSelects(); render();
$('#addClientBtn').addEventListener('click',() => openDialog());
$('#emptyAddBtn').addEventListener('click',() => openDialog());
$('#closeDialogBtn').addEventListener('click',() => dialog.close());
$('#cancelBtn').addEventListener('click',() => dialog.close());
$('#progress').addEventListener('input',event => $('#progressOutput').textContent = `${event.target.value}%`);
form.addEventListener('submit',event => {
  event.preventDefault(); if (!form.reportValidity()) return;
  const record = formData(); const index = clients.findIndex(client => client.id === record.id);
  if (index >= 0) clients[index] = record; else clients.push(record);
  dialog.close(); saveClients(index >= 0 ? 'Client updated' : 'Client added');
});
$('#archiveBtn').addEventListener('click',() => {
  const client = clients.find(item => item.id === $('#clientId').value); if (!client) return;
  client.archived = !client.archived; client.updatedAt = new Date().toISOString(); dialog.close(); saveClients(client.archived ? 'Client archived' : 'Client restored');
});
clientGrid.addEventListener('click',event => { const button = event.target.closest('.edit-button'); if (button) openDialog(clients.find(client => client.id === button.dataset.id)); });
['searchInput','statusFilter','priorityFilter','archiveToggle'].forEach(id => $(`#${id}`).addEventListener(id === 'searchInput' ? 'input' : 'change',render));
$('#exportBtn').addEventListener('click',exportBackup);
$('#importInput').addEventListener('change',event => { if (event.target.files[0]) importBackup(event.target.files[0]); event.target.value=''; });
dialog.addEventListener('click',event => { if (event.target === dialog) dialog.close(); });
