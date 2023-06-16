function openLinksSequentially(rows, minDelay, maxDelay) {
  var index = 0;
  var currentTabId;
  var tabUpdated = false;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs?.length > 0) {
      currentTabId = tabs[0]?.id;
      navigateToNextLink();
    }
  });

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (
      tabId === currentTabId &&
      changeInfo.status === "complete" &&
      tabUpdated
    ) {
      tabUpdated = false;
      const delay = getRandomDelay(minDelay, maxDelay);
      setTimeout(function () {
        index++;
        navigateToNextLink();
      }, delay * 1000);
    }
  });

  function navigateToNextLink() {
    if (index >= rows?.length) {
      return;
    }

    var link = rows[index]?.link;

    chrome.tabs.update(currentTabId, { url: link }, function () {
      tabUpdated = true;
    });
  }

  function getRandomDelay(min, max) {
    if (min && max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (min) {
      return min;
    } else {
      return 0;
    }
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "startOpenLinks") {
    const { rows, minDelay, maxDelay } = message;
    openLinksSequentially(rows, minDelay, maxDelay);
  }
});
