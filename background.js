
// CONSTANTS
let START_PROCESSING_LINK_TIME_DELAY = 20000; // 5 mins
const DEFAULT_MIN_DELAY = 5;
const DEFAULT_MAX_DELAY = 10;

let prevProcessedLinks = [];
let minimumDelay;
let maximumDelay;
let openLinksTimer;
let globalTimer;
// utils

const checkLinkMatch = (link, arr) => {
	return arr.some(a => a === link);
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

function openLinksSequentially(rows,tabID, minDelay, maxDelay) {
  minimumDelay = minDelay;
  maximumDelay = maxDelay;
  var index = 0;
  var currentTabId = tabID;
  var tabUpdated = false;

  const delay = getRandomDelay(minDelay, maxDelay);
  const initialProcessingTimer = setTimeout(()=>{
    navigateToNextLink();
  }, delay * 1000);

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (
      tabId === currentTabId &&
      changeInfo.status === "complete" &&
      tabUpdated
    ) {
      clearTimeout(initialProcessingTimer);
      tabUpdated = false;
      const delay = getRandomDelay(minimumDelay || DEFAULT_MIN_DELAY, maximumDelay || DEFAULT_MAX_DELAY);
      globalTimer = setTimeout(function () {
        index++;
        navigateToNextLink();
      }, delay * 1000);
    }
  });

  function navigateToNextLink() {
    const link = rows[index]?.link;
    const comment = rows[index]?.comment;
    
    const linkMatchFound = checkLinkMatch(link, prevProcessedLinks);
    if (linkMatchFound) {
      clearTimeout(globalTimer);
      const processedLinks = [...prevProcessedLinks];
      chrome.runtime.sendMessage({
        action: 'linkMatchFound',
        data: { minimumDelay, maximumDelay, processedLinks }
      });
      return;
    }

    chrome.runtime.sendMessage({ action: 'tweetLoaded', data: {comment, link, currentTabId} });

    chrome.tabs.update(currentTabId, { url: link }, function () {
      tabUpdated = true;
    });

    // TODO: store each processed link in an array.
    prevProcessedLinks.push(link);
  }
}

function startProcessingLinksContinously (rows,currentTabId, minDelay, maxDelay, condition) {
  if (!openLinksTimer) {
    openLinksSequentially(rows, currentTabId, minDelay, maxDelay);
  }
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    if (message.action === 'duplicateLinkFound') {
      clearTimeout(openLinksTimer);
      clearTimeout(globalTimer);
      prevProcessedLinks = [];
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
    clearTimeout(openLinksTimer);
    clearTimeout(globalTimer);
    const { rows,currentTabId, minDelay, maxDelay, continueProcessingLinks } = message;
    const delay = getRandomDelay(minDelay, maxDelay);
    START_PROCESSING_LINK_TIME_DELAY = (((delay * rows.length) + 20) * 1000) + (delay * 1000) ;
    startProcessingLinksContinously(rows,currentTabId, minDelay, maxDelay, continueProcessingLinks);
  }
});
