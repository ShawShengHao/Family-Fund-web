(() => {
  const codePattern = /^[A-Za-z0-9.-]{1,15}$/;
  const resultFor = row => {
    let result = row.querySelector('.stock-lookup-result');
    if (!result) {
      result = document.createElement('small');
      result.className = 'stock-lookup-result';
      row.append(result);
    }
    return result;
  };
  const lookup = async input => {
    const code = input.value.trim();
    const row = input.closest('.holding');
    const result = resultFor(row);
    if (!codePattern.test(code)) { result.textContent = ''; return; }
    const requestedCode = code.toUpperCase();
    input.dataset.lookupCode = requestedCode;
    result.classList.remove('is-error');
    result.textContent = '正在查詢股票名稱…';
    try {
      const response = await fetch(`/api/stock-lookup?symbol=${encodeURIComponent(requestedCode)}`);
      const data = await response.json();
      if (input.dataset.lookupCode !== requestedCode) return;
      if (!response.ok || !data.ok) throw new Error('not found');
      row.dataset.symbol = data.symbol;
      input.value = data.name;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      result.textContent = `代號：${data.symbol}`;
    } catch {
      if (input.dataset.lookupCode === requestedCode) {
        result.textContent = '找不到股票名稱，請確認代號。';
        result.classList.add('is-error');
      }
    }
  };
  document.querySelector('#holdings').addEventListener('blur', event => {
    if (event.target.matches('[name=holdingName]')) lookup(event.target);
  }, true);

  document.querySelector('#refresh-holdings').addEventListener('click', async () => {
    const button = document.querySelector('#refresh-holdings');
    const rows = [...document.querySelectorAll('#holdings .holding')].filter(row => row.dataset.symbol && Number(row.querySelector('[name=holdingQuantity]').value) > 0);
    if (!rows.length) { button.textContent = '沒有可更新的持股'; setTimeout(() => { button.textContent = '刷新持股價值 ↻'; }, 1400); return; }
    button.disabled = true;
    button.textContent = `刷新中 0 / ${rows.length}`;
    let updated = 0;
    for (const row of rows) {
      try {
        const response = await fetch(`/api/stock-price?symbol=${encodeURIComponent(row.dataset.symbol)}`);
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error('price unavailable');
        const quantity = Number(row.querySelector('[name=holdingQuantity]').value);
        row.querySelector('[name=holdingValue]').value = (data.price * quantity).toLocaleString('en-US', { maximumFractionDigits: 2 });
        const result = resultFor(row);
        result.classList.remove('is-error');
        result.textContent = `${data.symbol}｜收盤價 ${data.price} ${data.currency}（${data.closedAt}）`;
        updated++;
      } catch {
        const result = resultFor(row);
        result.textContent = '無法取得收盤價，保留原本目前價值。';
        result.classList.add('is-error');
      }
      button.textContent = `刷新中 ${updated} / ${rows.length}`;
    }
    document.querySelector('[name=holdingValue]')?.dispatchEvent(new Event('input', { bubbles: true }));
    button.disabled = false;
    button.textContent = `已更新 ${updated} 筆`;
    setTimeout(() => { button.textContent = '刷新持股價值 ↻'; }, 1800);
  });
})();
