const API_URL = 'https://your-backend-url.com';
const POLL_MESSAGES = 3000;
const POLL_ONLINE = 3000;
const BUCKETS = 24;

/* ---------- State ---------- */
let lastMessageIds = new Set();
let recent = [];
let onlineDevices = new Map();
let activity = new Array(BUCKETS).fill(0);
let labels = [];
(function(){
  const now = new Date();
  for(let i=BUCKETS-1;i>=0;i--){
    const d = new Date(now.getTime()-i*60*60*1000);
    labels.push(d.getHours().toString().padStart(2,'0')+':00');
  }
})();

/* ---------- Charts ---------- */
const ctx = document.getElementById('activityChart').getContext('2d');
const chart = new Chart(ctx, {
  type:'line',
  data:{ labels:labels.slice(), datasets:[{ label:'Active users', data:activity.slice(), borderColor:'#00ff99', backgroundColor:'rgba(0,255,153,0.06)', tension:0.25, fill:true, pointRadius:3 }] },
  options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{color:'#999'}}, y:{beginAtZero:true,ticks:{color:'#999'}} } }
});
const analyticsChart = new Chart(document.getElementById('analytics-chart').getContext('2d'),{
  type:'line',
  data:{ labels:labels.slice(), datasets:[{ label:'Active users', data:activity.slice(), borderColor:'#00ff99', backgroundColor:'rgba(0,255,153,0.06)', tension:0.25, fill:true, pointRadius:3 }] },
  options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{color:'#999'}}, y:{beginAtZero:true,ticks:{color:'#999'}} } }
});

/* ---------- UI ---------- */
const onlineNumberEl = document.getElementById('online-number');
const statOnlineEl = document.getElementById('stat-online');
const statBroadcastsEl = document.getElementById('stat-broadcasts');
const statPingEl = document.getElementById('stat-ping');
const previewMessageEl = document.getElementById('preview-message');
const recentListEl = document.getElementById('recent-list');
const deviceListEl = document.getElementById('device-list');
const messagesAll = document.getElementById('messages-all');
const devicesTabList = document.getElementById('devices-tab-list');

/* ---------- Helpers ---------- */
function safe(s){ return String(s||''); }
function timeAgo(ms){ const s=Math.floor((Date.now()-ms)/1000); if(s<10)return'now'; if(s<60)return s+'s'; if(s<3600)return Math.floor(s/60)+'m'; return Math.floor(s/3600)+'h'; }
function showPreview(name,text,duration=7){ previewMessageEl.innerHTML=`<span class="name">${safe(name)}:</span> ${safe(text)}`; previewMessageEl.style.animation='none'; void previewMessageEl.offsetWidth; previewMessageEl.style.animation=`fadeSlide ${duration}s forwards`; }

/* ---------- Recent Messages ---------- */
function addRecent(obj){ recent.unshift(obj); if(recent.length>200) recent.pop(); renderRecent(); renderMessagesAll(); statBroadcastsEl.innerText=recent.length; const rlist=document.getElementById('recent-list'); if(rlist){ const entry=document.createElement('div'); entry.style.padding='6px'; entry.style.borderBottom='1px solid rgba(255,255,255,0.03)'; entry.innerHTML=`<strong>${safe(obj.name)}</strong> <span style="color:#999;font-size:12px">[${new Date(obj.timestamp).toLocaleTimeString()}]</span>: ${safe(obj.message)}`; rlist.prepend(entry); while(rlist.children.length>30) rlist.removeChild(rlist.lastChild); } }
function renderRecent(){ recentListEl.innerHTML=''; for(const r of recent.slice(0,12)){ const div=document.createElement('div'); div.style.padding='8px'; div.style.borderRadius='8px'; div.style.background='rgba(255,255,255,0.01)'; div.innerHTML=`<div style="font-weight:700">${safe(r.name)}</div><div style="font-size:12px;color:#999">${timeAgo(r.timestamp)}</div><div style="margin-top:6px">${safe(r.message)}</div>`; div.addEventListener('click',()=>showPreview(r.name,r.message,7)); recentListEl.appendChild(div); } }
function renderMessagesAll(){ messagesAll.innerHTML=''; if(recent.length===0){ messagesAll.innerHTML='<div style="color:#999;padding:8px;">No messages yet.</div>'; return; } for(const r of recent){ const div=document.createElement('div'); div.style.padding='6px'; div.style.borderBottom='1px solid rgba(255,255,255,0.03)'; div.innerHTML=`<strong>${safe(r.name)}</strong> <span style="color:#999;font-size:12px">[${new Date(r.timestamp).toLocaleTimeString()}]</span>: ${safe(r.message)}`; messagesAll.appendChild(div); } }

/* ---------- Devices ---------- */
function renderDevices(){ deviceListEl.innerHTML=''; devicesTabList.innerHTML=''; const items=Array.from(onlineDevices.entries()).sort((a,b)=> b[1]-a[1]); for(const [id,ts] of items){ const el=document.createElement('div'); el.className='device-item'; el.innerHTML=`<div><strong>${safe(id)}</strong><div style="font-size:12px;color:#999">${timeAgo(ts)}</div></div><div style="color:${Date.now()-ts<20000?'#00ff99':'#999'}">•</div>`; deviceListEl.appendChild(el); devicesTabList.appendChild(el.cloneNode(true)); } }

/* ---------- Polling Messages ---------- */
async function pollMessages(){
  try{
    const t0 = performance.now();
    const res = await fetch(`${API_URL}/messages`);
    const ping = Math.round(performance.now()-t0);
    statPingEl.innerText=ping;
    if(!res.ok) return;
    const data = await res.json();
    for(const m of data){
      const id=m.timestamp+'|'+m.name+'|'+m.message;
      if(!lastMessageIds.has(id)){
        lastMessageIds.add(id);
        addRecent({ name:m.name,message:m.message,color:m.color,timestamp:m.timestamp });
        onlineDevices.set(m.name,Date.now());
      }
    }
    renderDevices();
  } catch(e){ console.error(e); }
}

/* ---------- Polling Online ---------- */
async function pollOnline(){
  try{
    const res = await fetch(`${API_URL}/online-count`);
    if(res.ok){
      const data = await res.json();
      const count = data.count || 0;
      onlineNumberEl.innerText = count;
      statOnlineEl.innerText = count;
      if(data.devices) data.devices.forEach(d=>onlineDevices.set(d.id,d.lastPing));
      pushActivity(count);
      renderDevices();
    }
  } catch(e){ console.error(e); }
}

/* ---------- Activity Graph ---------- */
function pushActivity(count){
  const now=new Date();
  const currentHourLabel=now.getHours().toString().padStart(2,'0')+':00';
  const lastLabel=chart.data.labels[chart.data.labels.length-1];
  const lastHour=parseInt(lastLabel.split(':')[0],10);
  const hourIndex=now.getHours();
  if(lastHour!==hourIndex){
    const diff=(hourIndex-lastHour+24)%24;
    for(let i=0;i<diff;i++){
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
      chart.data.labels.push(currentHourLabel);
      chart.data.datasets[0].data.push(0);
    }
  }
  chart.data.datasets[0].data[chart.data.datasets[0].data.length-1]=Math.max(chart.data.datasets[0].data[chart.data.datasets[0].data.length-1]||0,count);
  chart.update();
  analyticsChart.data.labels = chart.data.labels.slice();
  analyticsChart.data.datasets[0].data = chart.data.datasets[0].data.slice();
  analyticsChart.update();
}

/* ---------- Start Polling ---------- */
pollMessages();
pollOnline();
setInterval(pollMessages,POLL_MESSAGES);
setInterval(pollOnline,POLL_ONLINE);
