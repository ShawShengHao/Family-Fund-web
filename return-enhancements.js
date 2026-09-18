(async () => {
  const data = await fetch('/api/latest').then(response => response.json()).catch(() => null);
  if (!data) return;

  const number = value => Number(String(value ?? 0).replaceAll(',', ''));
  const setReturnClass = (element, value) => {
    if (!element) return;
    element.classList.remove('positive', 'negative');
    element.classList.add('return-value', value < 0 ? 'negative' : 'positive');
  };
  const applyReturnClasses = () => {
    const nav = number(data.nav);
    const rate = base => number(base) ? (nav - number(base)) / number(base) * 100 : 0;
    setReturnClass(document.querySelector('.metrics article:nth-child(2) strong'), rate(data.initialNav));
    setReturnClass(document.querySelector('.metrics article:nth-child(3) strong'), rate(data.yearStartNav));
    setReturnClass(document.querySelector('.chart-top .tag'), rate(data.nav90));
    document.querySelectorAll('.return-card dd').forEach(element => {
      const value = Number.parseFloat(element.textContent);
      if (Number.isFinite(value)) setReturnClass(element, value);
    });
    document.querySelectorAll('.table-wrap tbody tr').forEach((row, index) => {
      const holding = data.holdings?.[index];
      if (!holding) return;
      const cost = number(holding.cost);
      setReturnClass(row.lastElementChild, cost ? (number(holding.value) - cost) / cost * 100 : 0);
    });
  };
  const renderAllocation = () => {
    const holdings = data.holdings || [];
    const holdingCost = holdings.reduce((sum, holding) => sum + number(holding.cost), 0);
    const cash = Math.max(0, number(data.principal) - holdingCost);
    const total = holdingCost + cash;
    const colors = ['#197a6c', '#79ad9b', '#b7d6a9', '#d8d7c9', '#e3ad72'];
    const allocation = holdings.map((holding, index) => ({ name: holding.name, amount: number(holding.cost), color: colors[index % colors.length] }));
    if (cash > 0) allocation.push({ name: '現金', amount: cash, color: colors[4] });
    const list = document.querySelector('.allocation-list');
    const donut = document.querySelector('.donut');
    if (!list || !donut || !allocation.length || !total) return;
    list.innerHTML = allocation.map(item => `<div><span class="dot" style="background:${item.color}"></span><p>${item.name}</p><strong>${(item.amount / total * 100).toFixed(1)}%</strong></div>`).join('');
    let start = 0;
    donut.style.background = `conic-gradient(${allocation.map(item => { const end = start + item.amount / total * 100; const segment = `${item.color} ${start}% ${end}%`; start = end; return segment; }).join(',')})`;
    window.fundAllocation = allocation.map(item => ({ ...item, share: item.amount / total * 100 }));
  };

  // public-sync.js populates its data asynchronously; retry briefly after it has rendered.
  [0, 100, 300].forEach(delay => setTimeout(() => {
    applyReturnClasses();
    renderAllocation();
  }, delay));
})();
