const dialog = document.querySelector('#subscription-dialog');
document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', () => dialog.showModal()));
dialog.addEventListener('close', () => { if (dialog.returnValue === 'submit') alert('感謝您的申請！這是展示網站，資料尚未送出。'); });

const chart = document.querySelector('.chart-interactive');
if (chart) {
  const points = [{x:0,y:182,date:'06 / 03',nav:'100.00',gain:'—'},{x:162,y:163,date:'06 / 25',nav:'103.18',gain:'+3.18%'},{x:310,y:139,date:'07 / 17',nav:'107.46',gain:'+7.46%'},{x:515,y:122,date:'08 / 08',nav:'110.52',gain:'+10.52%'},{x:700,y:66,date:'08 / 31',nav:'112.47',gain:'+12.47%'}];
  const svg = chart.querySelector('svg'), tooltip = chart.querySelector('.chart-tooltip');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); marker.setAttribute('class','chart-marker'); marker.setAttribute('r','6'); svg.append(marker);
  const guide = document.createElementNS('http://www.w3.org/2000/svg', 'line'); guide.setAttribute('class','chart-guide'); guide.setAttribute('y1','0'); guide.setAttribute('y2','225'); svg.append(guide);
  chart.addEventListener('pointermove', (event) => { const rect=svg.getBoundingClientRect(), x=((event.clientX-rect.left)/rect.width)*700, actual=window.fundChartPoints||points, point=actual.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a); marker.setAttribute('cx',point.x); marker.setAttribute('cy',point.y); guide.setAttribute('x1',point.x); guide.setAttribute('x2',point.x); tooltip.innerHTML=`<span>${point.date}</span><strong>淨值 ${point.nav}</strong><b>${point.gain}</b>`; tooltip.style.left=`${Math.max(8,Math.min(82,(point.x/700)*100))}%`; chart.classList.add('is-hovered'); });
  chart.addEventListener('pointerleave', () => chart.classList.remove('is-hovered'));
}

const allocation = document.querySelector('.allocation-interactive');
if (allocation) {
  const tooltip=allocation.querySelector('.allocation-tooltip'), segments=[['全球股票型基金','52%'],['科技與創新主題','24%'],['收益與債券型基金','16%'],['現金及其他','8%']];
  allocation.addEventListener('pointermove',(event)=>{const r=allocation.getBoundingClientRect(),a=(Math.atan2(event.clientY-(r.top+r.height/2),event.clientX-(r.left+r.width/2))*180/Math.PI+450)%360,items=window.fundAllocation?.map(x=>[x.name,`${x.share.toFixed(1)}%`])||segments,total=items.reduce((sum,x)=>sum+Number(x[1].replace('%','')),0),s=items.find((x,i)=>a<items.slice(0,i+1).reduce((sum,y)=>sum+Number(y[1].replace('%','')),0)/total*360)||items[items.length-1];tooltip.innerHTML=`<span>${s[0]}</span><strong>${s[1]}</strong>`;allocation.classList.add('is-hovered');});
  allocation.addEventListener('pointerleave',()=>allocation.classList.remove('is-hovered'));
}
