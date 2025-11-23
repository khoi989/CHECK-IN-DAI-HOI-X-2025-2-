const CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwuLvHw-Ju0V8DsA1uV-Vn3YxUDFavxvVAGsFZ0Pu2K49kV2Lc-wgqn-w94wI9Bw5o/exec'
};

const $ = (id) => document.getElementById(id);

function htmlEscape(s) {
  const str = s == null ? '' : String(s);
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function showMessage(kind, seat = '') {
  const el = $('result');
  let html = "";

  if (kind === 'ok') {
    html = `<div class="ok">
      <div><strong>Check-In thành công!</strong></div>
      <div><strong>Số ghế của bạn: ${htmlEscape(seat)}</strong></div>
      <div class="muted"><em>Cảm ơn bạn đã tham dự chương trình ĐẠI HỘI X 2025. 
      Xin vui lòng di chuyển lên hội trường và ngồi đúng số ghế đã chỉ định.</em></div>
    </div>`;
  } else if (kind === 'err') {
    html = `<div class="err">
      <div><strong>Check-In không thành công!</strong></div>
      <div class="muted"><em>Xin vui lòng kiểm tra lại các thông tin hoặc di chuyển tới khu vực lễ tân để được hỗ trợ.</em></div>
    </div>`;
  } else {
    html = `<div class="warn">
      <div><strong>Vui lòng điền đầy đủ thông tin</strong></div>
    </div>`;
  }

  el.innerHTML = html;
}

function jsonp(url, params = {}, timeoutMs = 15000) {
  const qs = new URLSearchParams({ ...params }).toString();
  const fullUrl = `${url}?${qs}`;

  return fetch(fullUrl)
    .then(response => response.text())  // Use `.text()` because the response is wrapped in a function
    .then(data => {
      // Parse the response after it's been wrapped in the callback function
      const jsonpData = data.replace(/^[^(]*\((.*)\)[^)]*$/, '$1');  // Remove the callback wrapper
      return JSON.parse(jsonpData);  // Parse it as JSON
    })
    .catch(error => {
      console.error('Fetch error:', error);
      throw new Error('JSONP network error');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = $('seat-form');
  const submitBtn = $('submitBtn');
  const resultEl = $('result');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = $('name').value.trim();
    const studentID = $('studentID').value.trim();
    const lop = $('lop').value.trim();

    if (!name || !studentID || !lop) {
      showMessage('warn');
      return;
    }

    const cleanName = name.replace(/\s+/g, ' ');
    const cleanLop  = lop.replace(/\s+/g, ' ');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang kiểm tra…';

    try {
      const res = await jsonp(CONFIG.WEB_APP_URL, {
        name: cleanName,
        studentID,
        lop: cleanLop
      });

      // If the guest already exists and has a seat assigned, show success message
      if (res && res.ok && res.seat) {
        showMessage('ok', res.seat);  // Show success with seat number
      } else {
        showMessage('err');  // Show error if no seat is assigned
      }
    } catch (err) {
      showMessage('err');
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Check in';
    }
  });
});
