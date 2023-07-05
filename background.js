
// CONSTANTS
const START_PROCESSING_LINK_TIME_DELAY = 5000; // 5 mins
const DEFAULT_MIN_DELAY = 5;
const DEFAULT_MAX_DELAY = 10;

let prevProcessedLink;
let minimumDelay;
let maximumDelay;
let openLinksTimer;

function openLinksSequentially(rows,tabID, minDelay, maxDelay) {
  minimumDelay = minDelay;
  maximumDelay = maxDelay;
  var index = 0;
  var currentTabId = tabID;
  var tabUpdated = false;

  const delay = getRandomDelay(minDelay, maxDelay);
  setTimeout(()=>{
    navigateToNextLink(rows, currentTabId, index);
  }, delay * 1000);

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (
      tabId === currentTabId &&
      changeInfo.status === "complete" &&
      tabUpdated
    ) {
      tabUpdated = false;
      const delay = getRandomDelay(minimumDelay || DEFAULT_MIN_DELAY, maximumDelay || DEFAULT_MAX_DELAY);
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

    const accountName = rows[index]?.['account name'] || rows[index]?.accountName;
    const link = rows[index]?.link;
    const comment = rows[index]?.comment;
    
    if (link === prevProcessedLink) {
      chrome.runtime.sendMessage({
        action: 'linkMatchFound',
        data: { minimumDelay, maximumDelay, accountName, prevProcessedLink }
      });
      return;
    }

    chrome.runtime.sendMessage({ action: 'tweetLoaded', data: {comment, link, currentTabId} });

    chrome.tabs.update(currentTabId, { url: link }, function () {
      tabUpdated = true;
    });

    prevProcessedLink = link;
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

function startProcessingLinksContinously (rows,currentTabId, minDelay, maxDelay, condition) {

  if (!openLinksTimer) {
    openLinksSequentially(rows, currentTabId, minDelay, maxDelay);
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    if (message.action === 'duplicateLinkFound') {
      clearTimeout(openLinksTimer);
      return;
    }
  });
  
  let bool = condition;
  if (bool) {
    openLinksTimer = setTimeout(()=>{
      openLinksSequentially(rows,currentTabId, minDelay, maxDelay);
      startProcessingLinksContinously(rows,currentTabId, minDelay, maxDelay, bool);
    }, START_PROCESSING_LINK_TIME_DELAY);
  } else {
    clearTimeout(openLinksTimer);
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const { action } = message;
  if (action === 'tweetPageLoaded') {
    const { currentTabId } = message.data;
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(currentTabId, message);
      }
    });
  }

  if (action === "startOpenLinks") {
    const { rows,currentTabId, minDelay, maxDelay, continueProcessingLinks } = message;
    startProcessingLinksContinously(rows,currentTabId, minDelay, maxDelay, continueProcessingLinks);
  }
});
