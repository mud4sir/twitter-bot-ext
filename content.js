chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getA2Value') {
    var a2Value = '';
    var cell = document.querySelector('[aria-label="A2"]');
    if (cell) {
      a2Value = cell.textContent.trim();
    }
    sendResponse({ value: a2Value });
  }
});
