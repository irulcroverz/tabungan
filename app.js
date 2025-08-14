// State & Storage
const LS_KEY = 'wedding_savings_v3';
const defaultState = { target:200000000, entries:[] };
function read(){ try{return JSON.parse(localStorage.getItem(LS_KEY))||defaultState}catch(e){return defaultState} }
function write(s){ localStorage.setItem(LS_KEY,JSON.stringify(s)); }
const state=read();

// Currency formatter
function currency(n){ return 'Rp '+n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
function calcTotals(e){ const t=e.reduce((s,x)=>s+Number(x.amount),0); return {total:t, unique:[...new Set(e.map(r=>r.name))].length, avgv:e.length?Math.round(t/e.length):0}; }

// Pagination
let currentPage=1;
const itemsPerPage=4;

// Input uang format titik
document.getElementById('inputAmount').addEventListener('input',e=>{
  let value=e.target.value.replace(/\D/g,'');
  e.target.value=value.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
});

// Update UI
function updateUI(){
  const {total,unique,avgv}=calcTotals(state.entries);
  document.getElementById('totalLabel').textContent=currency(total);
  document.getElementById('remaining').textContent=currency(Math.max(0,state.target-total));
  document.getElementById('avg').textContent=currency(avgv);
  document.getElementById('payerCount').textContent=unique;
  document.getElementById('progressBar').style.width=Math.min(100,Math.round(total/state.target*100))+'%';
  renderList();
}

// Tombol tambah setoran
document.getElementById('addBtn').onclick=()=>{
  const name=document.getElementById('inputPayer').value.trim();
  let amount=document.getElementById('inputAmount').value.replace(/\./g,'').trim();
  amount=Number(amount);
  if(!name||!amount){ return alert('Isi nama penyetor dan jumlah dengan benar!'); }
  state.entries.push({name, amount, ts:Date.now()});
  write(state);
  document.getElementById('inputPayer').value='';
  document.getElementById('inputAmount').value='';
  currentPage=1; updateUI();
};

// Tombol reset
document.getElementById('resetBtn').onclick=()=>{
  if(confirm('Reset semua data?')){ state.entries=[]; write(state); currentPage=1; updateUI(); }
};

// Filter dan sorting
document.getElementById('filterName').oninput=()=>renderList();
document.getElementById('filterSort').onchange=()=>renderList();

// Render daftar setoran
function renderList(){
  let items=[...state.entries];
  const f=document.getElementById('filterName').value;
  const s=document.getElementById('filterSort').value;
  if(f) items=items.filter(i=>i.name.toLowerCase().includes(f.toLowerCase()));
  if(s==='new') items.sort((a,b)=>b.ts-a.ts);
  if(s==='old') items.sort((a,b)=>a.ts-b.ts);
  if(s==='big') items.sort((a,b)=>b.amount-a.amount);
  if(s==='small') items.sort((a,b)=>a.amount-b.amount);

  const totalPages=Math.max(1,Math.ceil(items.length/itemsPerPage));
  if(currentPage>totalPages) currentPage=totalPages;
  const start=(currentPage-1)*itemsPerPage;
  const pageItems=items.slice(start,start+itemsPerPage);

  const sheetList=document.getElementById('sheetList');
  if(!pageItems.length){ sheetList.innerHTML='<div class="empty">Belum ada setoran.</div>'; return; }

  const table=document.createElement('table');
  table.innerHTML='<thead><tr><th>Waktu</th><th>Nama</th><th>Jumlah</th><th></th></tr></thead>';
  const tbody=document.createElement('tbody');
  for(const it of pageItems){
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${new Date(it.ts).toLocaleString()}</td>
                  <td>${it.name}</td>
                  <td>${currency(it.amount)}</td>
                  <td><button data-id='${it.ts}' class='small del'>Hapus</button></td>`;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  sheetList.innerHTML=''; sheetList.appendChild(table);

  // Pagination
  const nav=document.createElement('div'); nav.className='page-nav';
  const prevBtn=document.createElement('button'); prevBtn.textContent='Sebelumnya'; prevBtn.className='page-btn';
  prevBtn.disabled=currentPage===1; prevBtn.onclick=()=>{ currentPage--; renderList(); };
  const nextBtn=document.createElement('button'); nextBtn.textContent='Berikutnya'; nextBtn.className='page-btn';
  nextBtn.disabled=currentPage===totalPages; nextBtn.onclick=()=>{ currentPage++; renderList(); };
  const info=document.createElement('span'); info.className='page-info'; info.textContent=`Halaman ${currentPage} / ${totalPages}`;
  nav.appendChild(prevBtn); nav.appendChild(info); nav.appendChild(nextBtn);
  sheetList.appendChild(nav);

  // Delete
  sheetList.querySelectorAll('.del').forEach(btn=>{
    btn.onclick=()=>{ state.entries=state.entries.filter(e=>e.ts!=btn.dataset.id); write(state); updateUI(); };
  });
}

// Init
updateUI();