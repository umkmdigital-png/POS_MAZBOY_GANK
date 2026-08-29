// ============ DATA STORE ============
let db = {
  settings:{nama:'Mazboy Group',alamat:'Jl. Kalibaru Timur III',telp:'085117010280',footer:'Terima kasih telah berkunjung! 🙏'},
  users:[
    {id:1,nama:'Walanduta',role:'owner',pin:'1234',color:'accent',initials:'BS'},
    {id:2,nama:'Iqbal',role:'staff',pin:'5678',color:'green',initials:'SD'},
    {id:3,nama:'Tegar',role:'staff',pin:'9012',color:'blue',initials:'AP'},
  ],
  menus:[
    {id:1,emoji:'🍜',nama:'Mie Ayam',kategori:'Makanan',harga:15000,stok:50,avail:true},
    {id:2,emoji:'🍚',nama:'Nasi Goreng',kategori:'Makanan',harga:18000,stok:45,avail:true},
    {id:3,emoji:'🍗',nama:'Ayam Goreng',kategori:'Makanan',harga:20000,stok:30,avail:true},
    {id:4,emoji:'🥗',nama:'Gado-gado',kategori:'Makanan',harga:16000,stok:25,avail:true},
    {id:5,emoji:'🍱',nama:'Paket Hemat',kategori:'Paket',harga:25000,stok:20,avail:true},
    {id:6,emoji:'☕',nama:'Es Teh Manis',kategori:'Minuman',harga:5000,stok:100,avail:true},
    {id:7,emoji:'🥤',nama:'Es Jeruk',kategori:'Minuman',harga:8000,stok:80,avail:true},
    {id:8,emoji:'🧋',nama:'Es Kopi Susu',kategori:'Minuman',harga:15000,stok:60,avail:true},
    {id:9,emoji:'🥛',nama:'Susu Segar',kategori:'Minuman',harga:10000,stok:40,avail:true},
    {id:10,emoji:'🍟',nama:'Kentang Goreng',kategori:'Camilan',harga:12000,stok:35,avail:true},
    {id:11,emoji:'🌮',nama:'Risoles',kategori:'Camilan',harga:8000,stok:28,avail:true},
    {id:12,emoji:'🧇',nama:'Pisang Goreng',kategori:'Camilan',harga:6000,stok:40,avail:true},
  ],
  toppings:[
    {id:1,nama:'Extra Bakso',harga:5000,avail:true},
    {id:2,nama:'Extra Cabe',harga:0,avail:true},
    {id:3,nama:'Extra Saos',harga:0,avail:true},
    {id:4,nama:'Keju',harga:5000,avail:true},
    {id:5,nama:'Extra Nasi',harga:3000,avail:true},
    {id:6,nama:'Telur Ceplok',harga:4000,avail:true},
  ],
  transactions:[],
  absensi:[],
  nextTxId:1
};

// Load from localStorage
try{const s=localStorage.getItem('kasirpro_db');if(s){const p=JSON.parse(s);Object.assign(db,p)}}catch(e){}

function saveDB(){try{localStorage.setItem('kasirpro_db',JSON.stringify(db))}catch(e){}}

// ============ AUTH ============
let currentUser=null;
let selectedUserId=null;

function renderUserList(){
  const ul=document.getElementById('user-list');
  ul.innerHTML=db.users.map(u=>`
    <div class="user-item ${selectedUserId===u.id?'selected':''}" onclick="selectUser(${u.id})">
      <div class="user-avatar" style="background:var(--${u.color}-bg||var(--accent-bg));color:var(--${u.color}||var(--accent))">${u.initials||u.nama.charAt(0)}</div>
      <div>
        <div style="font-weight:600;font-size:.9rem">${u.nama}</div>
        <div style="font-size:.75rem;color:var(--text2)">${u.role}</div>
      </div>
      <span class="role-badge ${u.role==='owner'?'badge-owner':'badge-staff'}">${u.role}</span>
    </div>
  `).join('');
}

function selectUser(id){
  selectedUserId=id;
  renderUserList();
  document.getElementById('pin-input').focus();
}

function doLogin(){
  if(!selectedUserId){toast('Pilih akun terlebih dahulu','error');return}
  const user=db.users.find(u=>u.id===selectedUserId);
  const pin=document.getElementById('pin-input').value;
  if(pin!==user.pin){toast('PIN salah!','error');return}
  currentUser=user;
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='block';
  initApp();
}

function logout(){
  currentUser=null;selectedUserId=null;
  document.getElementById('pin-input').value='';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('app').style.display='none';
  renderUserList();
}

// ============ APP INIT ============
function initApp(){
  document.getElementById('sidebar-name').textContent=currentUser.nama;
  document.getElementById('sidebar-role').textContent=currentUser.role;
  const av=document.getElementById('sidebar-avatar');
  av.textContent=currentUser.initials||currentUser.nama.charAt(0);
  av.style.background=`var(--${currentUser.color}-bg,var(--accent-bg))`;
  av.style.color=`var(--${currentUser.color},var(--accent))`;
  
  // Show owner-only items
  const ownerItems=document.querySelectorAll('.owner-only');
  ownerItems.forEach(el=>{el.style.display=currentUser.role==='owner'?'flex':'none'});
  document.getElementById('nav-owner-section').style.display=currentUser.role==='owner'?'block':'none';
  
  document.getElementById('floating-chart').style.display='block';
  
  renderCategoryTabs();
  renderMenuGrid();
  renderMenuMgmt();
  renderToppingTable();
  renderAkunTable();
  renderStokTable();
  renderAbsensi();
  renderLaporan();
  loadSettings();
  initCalc();
  updateClock();
  updateFloatingChart();
  setInterval(updateClock,1000);
  setInterval(updateFloatingChart,30000);

  // Set today dates
  const today=new Date().toISOString().split('T')[0];
  document.getElementById('from-date').value=today;
  document.getElementById('to-date').value=today;
  document.getElementById('absensi-date').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

function updateClock(){
  const now=new Date();
  document.getElementById('topbar-clock').textContent=now.toLocaleTimeString('id-ID');
}

// ============ NAVIGATION ============
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  const titles={kasir:'🛒 Kasir',laporan:'📊 Laporan',stok:'📦 Stok Opname',absensi:'🕐 Absensi',kalkulator:'🧮 Kalkulator',menu:'🍽️ Kelola Menu',topping:'🫙 Kelola Topping',akun:'👥 Kelola Akun',pengaturan:'⚙️ Pengaturan'};
  document.getElementById('page-title').textContent=titles[name]||name;
  if(name==='laporan')renderLaporan();
  if(name==='stok')renderStokTable();
  closeSidebar();
}

function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

// ============ KASIR - MENU ============
let activeCategory='Semua';
let cart=[];
let selectedMenuForCart=null;
let selectedToppings=[];
let paymentMethod='tunai';

function renderCategoryTabs(){
  const cats=['Semua',...new Set(db.menus.map(m=>m.kategori))];
  document.getElementById('category-tabs').innerHTML=cats.map(c=>`<div class="cat-tab ${c===activeCategory?'active':''}" onclick="setCategory('${c}')">${c}</div>`).join('');
}

function setCategory(cat){activeCategory=cat;renderCategoryTabs();renderMenuGrid()}

function filterMenu(){renderMenuGrid()}

function renderMenuGrid(){
  const q=document.getElementById('menu-search').value.toLowerCase();
  let menus=db.menus.filter(m=>{
    const catOk=activeCategory==='Semua'||m.kategori===activeCategory;
    const searchOk=m.nama.toLowerCase().includes(q);
    return catOk&&searchOk;
  });
  document.getElementById('menu-grid').innerHTML=menus.map(m=>`
    <div class="menu-card ${!m.avail||m.stok<=0?'out-stock':''}" onclick="addToCartModal(${m.id})">
      ${m.stok<=10&&m.avail?`<span class="stock-badge">Stok ${m.stok}</span>`:''}
      <span class="menu-emoji">${m.emoji}</span>
      <div class="menu-name">${m.nama}</div>
      <div class="menu-cat">${m.kategori}</div>
      <div class="menu-price">${fmtRp(m.harga)}</div>
      ${!m.avail?'<div style="font-size:.72rem;color:var(--red);margin-top:.25rem">Habis</div>':''}
    </div>
  `).join('');
}

function addToCartModal(id){
  const menu=db.menus.find(m=>m.id===id);
  selectedMenuForCart=menu;
  selectedToppings=[];
  document.getElementById('modal-note').value='';
  document.getElementById('modal-item-preview').innerHTML=`
    <div class="emoji">${menu.emoji}</div>
    <div class="info">
      <h4>${menu.nama}</h4>
      <p>${fmtRp(menu.harga)} · ${menu.kategori}</p>
    </div>`;
  const availTop=db.toppings.filter(t=>t.avail);
  document.getElementById('modal-topping-list').innerHTML=availTop.length?availTop.map(t=>`
    <div class="topping-item" id="tip-${t.id}" onclick="toggleTopping(${t.id})">
      <label>${t.nama}</label>
      <span class="topping-price">${t.harga>0?'+'+fmtRp(t.harga):'Gratis'}</span>
    </div>`).join(''):'<div style="color:var(--text2);font-size:.85rem">Tidak ada topping tersedia</div>';
  document.getElementById('topping-modal').style.display='flex';
}

function toggleTopping(id){
  const idx=selectedToppings.indexOf(id);
  if(idx>=0)selectedToppings.splice(idx,1);else selectedToppings.push(id);
  document.querySelectorAll('[id^=tip-]').forEach(el=>{
    const tid=parseInt(el.id.split('-')[1]);
    el.classList.toggle('selected',selectedToppings.includes(tid));
  });
}

function confirmAddToCart(){
  const menu=selectedMenuForCart;
  const toppings=selectedToppings.map(id=>db.toppings.find(t=>t.id===id));
  const note=document.getElementById('modal-note').value;
  const toppingPrice=toppings.reduce((s,t)=>s+t.harga,0);
  const existing=cart.find(c=>c.id===menu.id&&JSON.stringify(c.toppingIds)===JSON.stringify(selectedToppings)&&c.note===note);
  if(existing){existing.qty++}else{
    cart.push({id:menu.id,emoji:menu.emoji,nama:menu.nama,harga:menu.harga,toppings,toppingIds:[...selectedToppings],toppingPrice,note,qty:1});
  }
  closeToppingModal();
  updateCart();
  toast(`${menu.emoji} ${menu.nama} ditambahkan`,'success');
}

function closeToppingModal(){document.getElementById('topping-modal').style.display='none'}

function updateCart(){
  const cartEl=document.getElementById('cart-items');
  if(cart.length===0){
    cartEl.innerHTML='<div style="text-align:center;padding:2rem;color:var(--text2);font-size:.9rem">Belum ada pesanan</div>';
  }else{
    cartEl.innerHTML=cart.map((item,i)=>`
      <div class="cart-item">
        <span style="font-size:1.2rem">${item.emoji}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.nama}</div>
          ${item.toppings.length?`<div class="cart-item-note">+${item.toppings.map(t=>t.nama).join(', ')}</div>`:''}
          ${item.note?`<div class="cart-item-note">📝 ${item.note}</div>`:''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.2rem">
          <div class="cart-item-price">${fmtRp((item.harga+item.toppingPrice)*item.qty)}</div>
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
          </div>
        </div>
      </div>`).join('');
  }
  const subtotal=cart.reduce((s,c)=>s+(c.harga+c.toppingPrice)*c.qty,0);
  const discVal=parseFloat(document.getElementById('discount-val').value)||0;
  const discType=document.getElementById('discount-type').value;
  let discAmt=0;
  if(discType==='persen')discAmt=Math.round(subtotal*discVal/100);
  else discAmt=Math.min(discVal,subtotal);
  const total=subtotal-discAmt;
  document.getElementById('subtotal').textContent=fmtRp(subtotal);
  document.getElementById('discount-display').textContent='-'+fmtRp(discAmt);
  document.getElementById('total-display').textContent=fmtRp(total);
  calcKembalian();
}

function changeQty(i,d){
  cart[i].qty+=d;
  if(cart[i].qty<=0)cart.splice(i,1);
  updateCart();
}

function clearCart(){cart=[];document.getElementById('customer-name').value='';document.getElementById('discount-val').value='';updateCart()}

function setPayment(m){
  paymentMethod=m;
  ['tunai','qris','transfer'].forEach(p=>{document.getElementById('pay-'+p).classList.toggle('active',p===m)});
  document.getElementById('cash-section').classList.toggle('show',m==='tunai');
  if(m!=='tunai'){document.getElementById('kembalian-display').style.display='none'}
}

function calcKembalian(){
  if(paymentMethod!=='tunai'){document.getElementById('kembalian-display').style.display='none';return}
  const total=getTotal();
  const cash=parseFloat(document.getElementById('cash-input').value)||0;
  const kemb=cash-total;
  const el=document.getElementById('kembalian-display');
  if(cash>0){
    el.style.display='block';
    if(kemb>=0)el.textContent=`Kembalian: ${fmtRp(kemb)}`;
    else el.textContent=`Kurang: ${fmtRp(-kemb)}`;
    el.style.color=kemb>=0?'var(--green)':'var(--red)';
  }else{el.style.display='none'}
}

function getTotal(){
  const subtotal=cart.reduce((s,c)=>s+(c.harga+c.toppingPrice)*c.qty,0);
  const discVal=parseFloat(document.getElementById('discount-val').value)||0;
  const discType=document.getElementById('discount-type').value;
  let discAmt=0;
  if(discType==='persen')discAmt=Math.round(subtotal*discVal/100);
  else discAmt=Math.min(discVal,subtotal);
  return subtotal-discAmt;
}

function checkout(){
  if(cart.length===0){toast('Keranjang masih kosong!','error');return}
  if(paymentMethod==='tunai'){
    const cash=parseFloat(document.getElementById('cash-input').value)||0;
    if(cash<getTotal()){toast('Uang kurang!','error');return}
  }
  const subtotal=cart.reduce((s,c)=>s+(c.harga+c.toppingPrice)*c.qty,0);
  const discVal=parseFloat(document.getElementById('discount-val').value)||0;
  const discType=document.getElementById('discount-type').value;
  let discAmt=0;
  if(discType==='persen')discAmt=Math.round(subtotal*discVal/100);
  else discAmt=Math.min(discVal,subtotal);
  const total=subtotal-discAmt;
  const cash=parseFloat(document.getElementById('cash-input').value)||0;
  const tx={
    id:db.nextTxId++,
    no:`TX-${String(db.nextTxId-1).padStart(4,'0')}`,
    waktu:new Date().toISOString(),
    customer:document.getElementById('customer-name').value||'Umum',
    items:[...cart.map(c=>({...c}))],
    subtotal,discAmt,discType,discVal,total,
    metode:paymentMethod,
    cash,kembalian:cash-total,
    kasir:currentUser.nama
  };
  // Update stok
  cart.forEach(item=>{
    const menu=db.menus.find(m=>m.id===item.id);
    if(menu)menu.stok=Math.max(0,menu.stok-item.qty);
  });
  db.transactions.push(tx);
  saveDB();
  showStruk(tx);
  clearCart();
  document.getElementById('cash-input').value='';
  updateFloatingChart();
  toast('✅ Transaksi berhasil!','success');
}

// ============ STRUK ============
function showStruk(tx){
  const items=tx.items.map(i=>{
    const price=(i.harga+i.toppingPrice)*i.qty;
    const tLine=i.toppings.length?`\n  +${i.toppings.map(t=>t.nama).join(',')}`:''
    const nLine=i.note?`\n  Catatan:${i.note}`:''
    return `${i.emoji}${i.nama} x${i.qty}${tLine}${nLine}\n  ${fmtRp(i.harga+i.toppingPrice)} x${i.qty} = ${fmtRp(price)}`;
  }).join('\n\n');
  const now=new Date(tx.waktu);
  document.getElementById('struk-content').innerHTML=`
    <div class="struk-header">
      <strong style="font-size:1rem">${db.settings.nama}</strong><br>
      ${db.settings.alamat}<br>
      Telp: ${db.settings.telp}
    </div>
    <hr class="struk-divider">
    <div class="struk-row"><span>No. Transaksi</span><span>${tx.no}</span></div>
    <div class="struk-row"><span>Tanggal</span><span>${now.toLocaleDateString('id-ID')}</span></div>
    <div class="struk-row"><span>Waktu</span><span>${now.toLocaleTimeString('id-ID')}</span></div>
    <div class="struk-row"><span>Pelanggan</span><span>${tx.customer}</span></div>
    <div class="struk-row"><span>Kasir</span><span>${tx.kasir}</span></div>
    <hr class="struk-divider">
    <pre style="font-size:.78rem;white-space:pre-wrap">${items}</pre>
    <hr class="struk-divider">
    <div class="struk-row"><span>Subtotal</span><span>${fmtRp(tx.subtotal)}</span></div>
    ${tx.discAmt>0?`<div class="struk-row"><span>Diskon${tx.discType==='persen'?' ('+tx.discVal+'%)':''}</span><span>-${fmtRp(tx.discAmt)}</span></div>`:''}
    <div class="struk-row struk-total"><span>TOTAL</span><span>${fmtRp(tx.total)}</span></div>
    ${tx.metode==='tunai'?`<div class="struk-row"><span>Tunai</span><span>${fmtRp(tx.cash)}</span></div><div class="struk-row"><span>Kembalian</span><span>${fmtRp(tx.kembalian)}</span></div>`:''}
    <div class="struk-row"><span>Metode</span><span style="text-transform:capitalize">${tx.metode}</span></div>
    <hr class="struk-divider">
    <div class="struk-footer">${db.settings.footer}</div>
  `;
  document.getElementById('struk-modal').style.display='flex';
}

function closeStruk(){document.getElementById('struk-modal').style.display='none'}

let bluetoothDevice=null;
let btCharacteristic=null;

async function connectBluetooth(){
  try{
    if(!navigator.bluetooth){toast('Browser tidak mendukung Bluetooth','error');return}
    bluetoothDevice=await navigator.bluetooth.requestDevice({
      filters:[{services:['000018f0-0000-1000-8000-00805f9b34fb']}],
      optionalServices:['000018f0-0000-1000-8000-00805f9b34fb']
    });
    const server=await bluetoothDevice.gatt.connect();
    const service=await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    btCharacteristic=await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
    document.getElementById('printer-status').textContent='● Terhubung: '+bluetoothDevice.name;
    document.getElementById('printer-status').style.color='var(--green)';
    toast('✅ Printer terhubung!','success');
  }catch(e){toast('Gagal terhubung: '+e.message,'error')}
}

async function printBluetooth(){
  if(!btCharacteristic){toast('Printer belum terhubung. Hubungkan di Pengaturan.','error');return}
  const text=document.getElementById('struk-content').innerText+'\n\n\n';
  const enc=new TextEncoder();
  const data=enc.encode(text);
  try{
    for(let i=0;i<data.length;i+=20){
      await btCharacteristic.writeValue(data.slice(i,i+20));
    }
    toast('🖨️ Struk dicetak!','success');
  }catch(e){toast('Gagal cetak: '+e.message,'error')}
}

function printWeb(){window.print()}

// ============ LAPORAN ============
function renderLaporan(){
  const from=document.getElementById('from-date')?.value;
  const to=document.getElementById('to-date')?.value;
  let txs=db.transactions;
  if(from){const fd=new Date(from);txs=txs.filter(t=>new Date(t.waktu)>=fd)}
  if(to){const td=new Date(to);td.setHours(23,59,59);txs=txs.filter(t=>new Date(t.waktu)<=td)}
  const totalPenjualan=txs.reduce((s,t)=>s+t.total,0);
  const jumlahTx=txs.length;
  const avgTx=jumlahTx?Math.round(totalPenjualan/jumlahTx):0;
  const totalDiskon=txs.reduce((s,t)=>s+t.discAmt,0);
  document.getElementById('laporan-stats').innerHTML=`
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Total Penjualan</div><div class="stat-value" style="color:var(--green)">${fmtRp(totalPenjualan)}</div></div>
    <div class="stat-card"><div class="stat-icon">🧾</div><div class="stat-label">Jumlah Transaksi</div><div class="stat-value">${jumlahTx}</div></div>
    <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-label">Rata-rata/Transaksi</div><div class="stat-value">${fmtRp(avgTx)}</div></div>
    <div class="stat-card"><div class="stat-icon">🎫</div><div class="stat-label">Total Diskon</div><div class="stat-value" style="color:var(--red)">${fmtRp(totalDiskon)}</div></div>
  `;
  const tbody=document.getElementById('laporan-tbody');
  tbody.innerHTML=[...txs].reverse().map(t=>{
    const d=new Date(t.waktu);
    return `<tr>
      <td>${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</td>
      <td><span class="badge badge-purple">${t.no}</span></td>
      <td>${t.customer}</td>
      <td style="font-size:.8rem">${t.items.map(i=>`${i.emoji}${i.nama}(${i.qty})`).join(', ')}</td>
      <td>${fmtRp(t.subtotal)}</td>
      <td>${t.discAmt>0?'<span class="badge badge-warning">-'+fmtRp(t.discAmt)+'</span>':'—'}</td>
      <td style="font-weight:700;color:var(--green)">${fmtRp(t.total)}</td>
      <td><span class="badge ${t.metode==='tunai'?'badge-success':t.metode==='qris'?'badge-info':'badge-warning'}">${t.metode}</span></td>
    </tr>`;
  }).join('');
}

function filterLaporan(){renderLaporan()}

function sendWA(){
  const num=document.getElementById('wa-number').value;
  if(!num){toast('Masukkan nomor WhatsApp','error');return}
  const today=new Date().toLocaleDateString('id-ID');
  const todayTxs=db.transactions.filter(t=>{const d=new Date(t.waktu);return d.toLocaleDateString('id-ID')===today});
  const total=todayTxs.reduce((s,t)=>s+t.total,0);
  const msg=encodeURIComponent(`*Laporan Penjualan ${db.settings.nama}*\n📅 ${today}\n\n💰 Total: ${fmtRp(total)}\n🧾 Transaksi: ${todayTxs.length}\n\n${todayTxs.map(t=>`• ${t.no} - ${t.customer} - ${fmtRp(t.total)}`).join('\n')}\n\nDikirim otomatis dari Kasir Pro 🧾`);
  window.open(`https://wa.me/${num}?text=${msg}`,'_blank');
}

async function sendSheet(){
  const url=document.getElementById('sheet-url').value;
  if(!url){toast('Masukkan Google Sheet webhook URL','error');return}
  const today=new Date().toLocaleDateString('id-ID');
  const data={
    toko:db.settings.nama,tanggal:today,
    transaksi:db.transactions.filter(t=>new Date(t.waktu).toLocaleDateString('id-ID')===today).map(t=>({no:t.no,waktu:t.waktu,customer:t.customer,total:t.total,metode:t.metode}))
  };
  try{
    await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),mode:'no-cors'});
    toast('✅ Data terkirim ke Google Sheet!','success');
  }catch(e){toast('Gagal kirim: cek URL','error')}
}

function exportCSV(){
  const rows=[['No','Waktu','Pelanggan','Items','Subtotal','Diskon','Total','Metode','Kasir']];
  db.transactions.forEach(t=>{
    rows.push([t.no,t.waktu,t.customer,t.items.map(i=>`${i.nama}x${i.qty}`).join(';'),t.subtotal,t.discAmt,t.total,t.metode,t.kasir]);
  });
  const csv=rows.map(r=>r.join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='laporan-kasir.csv';a.click();
}

// ============ STOK OPNAME ============
function renderStokTable(){
  document.getElementById('stok-tbody').innerHTML=db.menus.map(m=>`
    <tr>
      <td>${m.emoji} ${m.nama}</td>
      <td>${m.kategori}</td>
      <td>${m.stok}</td>
      <td><input type="number" value="${m.stok}" min="0" id="stok-${m.id}" style="width:70px;background:var(--bg3);border:1px solid var(--border2);color:var(--text);padding:.35rem .5rem;border-radius:6px;font-size:.82rem;text-align:center" oninput="calcDiff(${m.id},${m.stok})"></td>
      <td><span id="diff-${m.id}" class="stok-diff zero">0</span></td>
      <td><input type="text" placeholder="Catatan..." style="width:120px;background:var(--bg3);border:1px solid var(--border2);color:var(--text);padding:.35rem .5rem;border-radius:6px;font-size:.78rem" id="note-stok-${m.id}"></td>
    </tr>`).join('');
}

function calcDiff(id,sistem){
  const fisik=parseInt(document.getElementById('stok-'+id).value)||0;
  const diff=fisik-sistem;
  const el=document.getElementById('diff-'+id);
  el.textContent=(diff>=0?'+':'')+diff;
  el.className='stok-diff '+(diff>0?'plus':diff<0?'minus':'zero');
}

function saveStok(){
  db.menus.forEach(m=>{
    const el=document.getElementById('stok-'+m.id);
    if(el)m.stok=parseInt(el.value)||0;
  });
  saveDB();renderMenuGrid();renderStokTable();toast('✅ Stok berhasil disimpan!','success');
}

// ============ ABSENSI ============
function renderAbsensi(){
  const cards=db.users.filter(u=>u.role==='staff'||u.role==='owner');
  document.getElementById('absensi-cards').innerHTML=cards.map(u=>{
    const today=new Date().toISOString().split('T')[0];
    const rec=db.absensi.find(a=>a.userId===u.id&&a.tanggal===today);
    return `
    <div class="staff-absen-card">
      <div class="staff-avatar-big" style="background:var(--${u.color}-bg,var(--accent-bg));color:var(--${u.color},var(--accent))">${u.initials||u.nama.charAt(0)}</div>
      <div style="font-weight:700;font-size:.95rem">${u.nama}</div>
      <div style="font-size:.78rem;color:var(--text2);margin-bottom:.5rem">${u.role}</div>
      <div class="clock-display" id="clock-${u.id}">--:--:--</div>
      ${rec?.masuk?`<div class="check-time">✅ Masuk: ${rec.masuk}</div>`:''}
      ${rec?.keluar?`<div class="check-time">🔴 Keluar: ${rec.keluar}</div>`:''}
      ${!rec?.masuk?`<button class="btn btn-success btn-sm" style="margin-top:.5rem;width:100%" onclick="checkIn(${u.id})">✅ Check In</button>`:''}
      ${rec?.masuk&&!rec?.keluar?`<button class="btn btn-danger btn-sm" style="margin-top:.5rem;width:100%" onclick="checkOut(${u.id})">🔴 Check Out</button>`:''}
      ${rec?.keluar?`<span class="badge badge-success" style="margin-top:.5rem">Selesai</span>`:''}
    </div>`;
  }).join('');
  
  setInterval(()=>{
    const now=new Date().toLocaleTimeString('id-ID');
    cards.forEach(u=>{const el=document.getElementById('clock-'+u.id);if(el)el.textContent=now});
  },1000);
  
  renderAbsensiTable();
}

function checkIn(userId){
  const today=new Date().toISOString().split('T')[0];
  const time=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  const user=db.users.find(u=>u.id===userId);
  db.absensi.push({id:Date.now(),userId,nama:user.nama,tanggal:today,masuk:time,keluar:null});
  saveDB();renderAbsensi();toast(`✅ ${user.nama} check in ${time}`,'success');
}

function checkOut(userId){
  const today=new Date().toISOString().split('T')[0];
  const time=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  const rec=db.absensi.find(a=>a.userId===userId&&a.tanggal===today&&!a.keluar);
  if(rec){
    rec.keluar=time;
    const [im,ii]=rec.masuk.split(':').map(Number);
    const [om,oi]=time.split(':').map(Number);
    const dur=(om*60+oi)-(im*60+ii);
    rec.durasi=Math.floor(dur/60)+'j '+( dur%60)+'m';
    saveDB();renderAbsensi();const user=db.users.find(u=>u.id===userId);toast(`🔴 ${user.nama} check out ${time}`,'info');
  }
}

function renderAbsensiTable(){
  document.getElementById('absensi-tbody').innerHTML=[...db.absensi].reverse().map(a=>`
    <tr>
      <td>${a.tanggal}</td>
      <td>${a.nama}</td>
      <td>${a.masuk||'—'}</td>
      <td>${a.keluar||'—'}</td>
      <td>${a.durasi||'—'}</td>
      <td><span class="badge ${a.keluar?'badge-success':'badge-warning'}">${a.keluar?'Selesai':'Aktif'}</span></td>
    </tr>`).join('');
}

// ============ KALKULATOR ============
let calcExpr='';let calcHistory='';
function initCalc(){
  const btns=[
    ['C','←','%','÷'],
    ['7','8','9','×'],
    ['4','5','6','−'],
    ['1','2','3','+'],
    ['±','0','.','='],
  ];
  const classes={'C':'cb-clear','÷':'cb-op','×':'cb-op','−':'cb-op','+':'cb-op','=':'cb-accent','←':'cb-op','%':'cb-op','±':'cb-op','.':'cb-num'};
  document.getElementById('calc-buttons').innerHTML=btns.flat().map(b=>`
    <button class="calc-btn ${classes[b]||'cb-num'}" onclick="calcPress('${b}')">${b}</button>
  `).join('');
}
function calcPress(k){
  if(k==='C'){calcExpr='';calcHistory='';updateCalcDisplay()}
  else if(k==='←'){calcExpr=calcExpr.slice(0,-1);updateCalcDisplay()}
  else if(k==='='){
    try{
      let expr=calcExpr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
      calcHistory=calcExpr+'=';
      calcExpr=String(eval(expr));
    }catch{calcExpr='Error'}
    updateCalcDisplay();
  }
  else if(k==='%'){
    try{calcExpr=String(eval(calcExpr)/100)}catch{}
    updateCalcDisplay();
  }
  else if(k==='±'){
    if(calcExpr.startsWith('-'))calcExpr=calcExpr.slice(1);else calcExpr='-'+calcExpr;
    updateCalcDisplay();
  }
  else{calcExpr+=k;updateCalcDisplay()}
}
function updateCalcDisplay(){
  document.getElementById('calc-expr').textContent=calcHistory;
  document.getElementById('calc-result').textContent=calcExpr||'0';
}

// ============ MENU MANAGEMENT ============
let editMenuId=null;
function renderMenuMgmt(){
  document.getElementById('menu-mgmt-grid').innerHTML=db.menus.map(m=>`
    <div class="menu-mgmt-card">
      <div class="emoji">${m.emoji}</div>
      <div class="info">
        <h4>${m.nama}</h4>
        <p>${m.kategori} · ${fmtRp(m.harga)}</p>
        <div class="stock-indicator">
          <span style="width:8px;height:8px;border-radius:50%;background:${m.stok>10?'var(--green)':m.stok>0?'var(--amber)':'var(--red)'};display:inline-block"></span>
          Stok: ${m.stok}
        </div>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" onclick="openEditMenu(${m.id})">✏️ Edit</button>
          <button class="btn btn-sm" style="background:${m.avail?'var(--green-bg)':'var(--red-bg)'};color:${m.avail?'var(--green)':'var(--red)'};border:none" onclick="toggleMenuAvail(${m.id})">${m.avail?'✅ Aktif':'❌ Nonaktif'}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMenu(${m.id})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

function openAddMenu(){
  editMenuId=null;
  document.getElementById('menu-modal-title').textContent='Tambah Menu';
  ['emoji','nama-input','harga-input'].forEach(f=>document.getElementById('menu-'+f).value='');
  document.getElementById('menu-stok-input').value=100;
  document.getElementById('menu-modal').style.display='flex';
}

function openEditMenu(id){
  const m=db.menus.find(x=>x.id===id);
  editMenuId=id;
  document.getElementById('menu-modal-title').textContent='Edit Menu';
  document.getElementById('menu-emoji').value=m.emoji;
  document.getElementById('menu-nama-input').value=m.nama;
  document.getElementById('menu-kategori-input').value=m.kategori;
  document.getElementById('menu-harga-input').value=m.harga;
  document.getElementById('menu-stok-input').value=m.stok;
  document.getElementById('menu-avail-input').value=m.avail?'1':'0';
  document.getElementById('menu-modal').style.display='flex';
}

function saveMenu(){
  const data={
    emoji:document.getElementById('menu-emoji').value||'🍽️',
    nama:document.getElementById('menu-nama-input').value,
    kategori:document.getElementById('menu-kategori-input').value,
    harga:parseInt(document.getElementById('menu-harga-input').value)||0,
    stok:parseInt(document.getElementById('menu-stok-input').value)||0,
    avail:document.getElementById('menu-avail-input').value==='1',
  };
  if(!data.nama){toast('Nama menu wajib diisi','error');return}
  if(editMenuId){Object.assign(db.menus.find(m=>m.id===editMenuId),data)}
  else{db.menus.push({id:Date.now(),...data})}
  saveDB();renderMenuMgmt();renderMenuGrid();renderCategoryTabs();
  document.getElementById('menu-modal').style.display='none';
  toast('✅ Menu disimpan!','success');
}

function toggleMenuAvail(id){
  const m=db.menus.find(x=>x.id===id);m.avail=!m.avail;
  saveDB();renderMenuMgmt();renderMenuGrid();
}

function deleteMenu(id){
  if(!confirm('Hapus menu ini?'))return;
  db.menus=db.menus.filter(m=>m.id!==id);
  saveDB();renderMenuMgmt();renderMenuGrid();renderCategoryTabs();
  toast('Menu dihapus','info');
}

// ============ TOPPING MANAGEMENT ============
let editToppingId=null;
function renderToppingTable(){
  document.getElementById('topping-tbody').innerHTML=db.toppings.map(t=>`
    <tr>
      <td>${t.nama}</td>
      <td>${t.harga>0?fmtRp(t.harga):'Gratis'}</td>
      <td><span class="badge ${t.avail?'badge-success':'badge-danger'}">${t.avail?'Tersedia':'Habis'}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openEditTopping(${t.id})">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="toggleToppingAvail(${t.id})">${t.avail?'Nonaktifkan':'Aktifkan'}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTopping(${t.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

function openAddTopping(){
  editToppingId=null;
  document.getElementById('topping-modal-title').textContent='Tambah Topping';
  document.getElementById('topping-nama-input').value='';
  document.getElementById('topping-harga-input').value='';
  document.getElementById('topping-form-modal').style.display='flex';
}

function openEditTopping(id){
  const t=db.toppings.find(x=>x.id===id);editToppingId=id;
  document.getElementById('topping-modal-title').textContent='Edit Topping';
  document.getElementById('topping-nama-input').value=t.nama;
  document.getElementById('topping-harga-input').value=t.harga;
  document.getElementById('topping-avail-input').value=t.avail?'1':'0';
  document.getElementById('topping-form-modal').style.display='flex';
}

function saveTopping(){
  const data={nama:document.getElementById('topping-nama-input').value,harga:parseInt(document.getElementById('topping-harga-input').value)||0,avail:document.getElementById('topping-avail-input').value==='1'};
  if(!data.nama){toast('Nama topping wajib diisi','error');return}
  if(editToppingId){Object.assign(db.toppings.find(t=>t.id===editToppingId),data)}
  else{db.toppings.push({id:Date.now(),...data})}
  saveDB();renderToppingTable();
  document.getElementById('topping-form-modal').style.display='none';
  toast('✅ Topping disimpan!','success');
}

function toggleToppingAvail(id){
  const t=db.toppings.find(x=>x.id===id);t.avail=!t.avail;saveDB();renderToppingTable();
}

function deleteTopping(id){
  if(!confirm('Hapus topping ini?'))return;
  db.toppings=db.toppings.filter(t=>t.id!==id);saveDB();renderToppingTable();
}

// ============ AKUN MANAGEMENT ============
let editUserId=null;
function renderAkunTable(){
  document.getElementById('akun-tbody').innerHTML=db.users.map(u=>`
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:.5rem">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--${u.color}-bg,var(--accent-bg));color:var(--${u.color},var(--accent));display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700">${u.initials||u.nama.charAt(0)}</div>
          ${u.nama}
        </div>
      </td>
      <td><span class="badge ${u.role==='owner'?'badge-warning':'badge-info'}">${u.role}</span></td>
      <td style="font-family:monospace">****</td>
      <td><span class="badge badge-success">Aktif</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openEditUser(${u.id})">✏️ Edit</button>
        ${u.id!==currentUser.id?`<button class="btn btn-danger btn-sm" onclick="deleteUser(${u.id})">🗑️</button>`:''}
      </td>
    </tr>`).join('');
}

function openAddUser(){
  editUserId=null;
  document.getElementById('user-modal-title').textContent='Tambah Akun';
  ['user-nama-input','user-pin-input'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('user-modal').style.display='flex';
}

function openEditUser(id){
  const u=db.users.find(x=>x.id===id);editUserId=id;
  document.getElementById('user-modal-title').textContent='Edit Akun';
  document.getElementById('user-nama-input').value=u.nama;
  document.getElementById('user-role-input').value=u.role;
  document.getElementById('user-pin-input').value=u.pin;
  document.getElementById('user-color-input').value=u.color;
  document.getElementById('user-modal').style.display='flex';
}

function saveUser(){
  const nama=document.getElementById('user-nama-input').value;
  const role=document.getElementById('user-role-input').value;
  const pin=document.getElementById('user-pin-input').value;
  const color=document.getElementById('user-color-input').value;
  if(!nama||!pin){toast('Nama dan PIN wajib diisi','error');return}
  const initials=nama.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  if(editUserId){Object.assign(db.users.find(u=>u.id===editUserId),{nama,role,pin,color,initials})}
  else{db.users.push({id:Date.now(),nama,role,pin,color,initials})}
  saveDB();renderAkunTable();renderUserList();
  document.getElementById('user-modal').style.display='none';
  toast('✅ Akun disimpan!','success');
}

function deleteUser(id){
  if(!confirm('Hapus akun ini?'))return;
  db.users=db.users.filter(u=>u.id!==id);saveDB();renderAkunTable();renderUserList();
}

// ============ SETTINGS ============
function loadSettings(){
  document.getElementById('toko-nama').value=db.settings.nama||'';
  document.getElementById('toko-alamat').value=db.settings.alamat||'';
  document.getElementById('toko-telp').value=db.settings.telp||'';
  document.getElementById('toko-footer').value=db.settings.footer||'';
}

function saveTokoSettings(){
  db.settings.nama=document.getElementById('toko-nama').value;
  db.settings.alamat=document.getElementById('toko-alamat').value;
  db.settings.telp=document.getElementById('toko-telp').value;
  db.settings.footer=document.getElementById('toko-footer').value;
  saveDB();toast('✅ Pengaturan disimpan!','success');
}

// ============ FLOATING CHART ============
function updateFloatingChart(){
  const today=new Date().toLocaleDateString('id-ID');
  const todayTxs=db.transactions.filter(t=>new Date(t.waktu).toLocaleDateString('id-ID')===today);
  const totalToday=todayTxs.reduce((s,t)=>s+t.total,0);
  document.getElementById('chart-total-today').textContent=fmtRp(totalToday);
  
  const hours={};
  for(let h=8;h<=20;h++)hours[h]=0;
  todayTxs.forEach(t=>{const h=new Date(t.waktu).getHours();if(hours[h]!==undefined)hours[h]+=t.total});
  const vals=Object.values(hours);
  const maxVal=Math.max(...vals,1);
  document.getElementById('mini-chart').innerHTML=Object.entries(hours).map(([h,v])=>`
    <div class="bar" style="height:${Math.max(4,(v/maxVal)*100)}%">
      <span class="bar-label">${h}</span>
      <span class="bar-val">${fmtRp(v)}</span>
    </div>`).join('')+'<div class="chart-axis"></div>';
}

let chartVisible=false;
function toggleChart(){
  chartVisible=!chartVisible;
  document.getElementById('chart-popup').classList.toggle('show',chartVisible);
  if(chartVisible)updateFloatingChart();
}

// ============ TOAST ============
function toast(msg,type='info'){
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  const icons={success:'✅',error:'❌',info:'ℹ️'};
  el.innerHTML=`<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>{el.style.animation='fadeOut .3s forwards';setTimeout(()=>el.remove(),300)},3000);
}

// ============ UTILS ============
function fmtRp(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(n)}

// ============ INIT ============
renderUserList();
document.getElementById('pin-input').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
