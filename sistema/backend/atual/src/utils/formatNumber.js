function formatNumber(num) {
  if (!num) throw new Error('Número inválido');
  let n = num.replace(/\D/g, '');
  if (n.length === 10 || n.length === 11) n = '55' + n;
  if (!n.startsWith('55')) n = '55' + n;
  return n + '@c.us';
}

module.exports = formatNumber;
