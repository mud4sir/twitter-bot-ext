
const START_PROCESSING_LINK_TIME = 20000;// 20 seconds // 300000 --> 5 minutes for each iteration
const DEFAULT_MIN_DELAY = 5;
const DEFAULT_MAX_DELAY = 10;

let minimumDelay;
let maximumDelay;

function openLinksSequentially(rows, currentTabId, minDelay, maxDelay) {
  var index = 0;
  var tabUpdated = false;
  minimumDelay = minDelay;
  maximumDelay = maxDelay;
  const delay = getRandomDelay(minDelay, maxDelay);
  setTimeout(() => {
    navigateToNextLink();
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
    const link = rows[index]?.link;
    const comment = rows[index]?.comment;
    chrome.runtime.sendMessage({ action: 'tweetLoaded', data: { comment, link, tabId } });
  });

  function navigateToNextLink() {
    if (index >= rows.length) {
      return;
    }

    var link = rows[index].link;
    console.log('link', link);
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
  if (message.action === 'tweetPageLoaded') {
    const { tabId } = message.data;
    chrome.tabs.sendMessage(tabId, message);
  }

  if (message.action === "startOpenLinks") {
    // let firstIterationTime = 0;
    // let isFirstIteration = true;
    const { rows, currentTabId, minDelay, maxDelay } = message;

    // current behavior.
    openLinksSequentially(rows, currentTabId, minDelay, maxDelay);

    // console.log('continueProcessingLinks', continueProcessingLinks);
    // console.log('firstIterationTime', firstIterationTime);
    // console.log(firstIterationTime ?? START_PROCESSING_LINK_TIME);

    // if (continueProcessingLinks) {
    //   setInterval(() => {
    //     console.log('rows', rows);
    //     console.log('currentTabId', currentTabId);
    //     console.log('minDelay', minDelay);
    //     console.log('maxDelay', maxDelay);
    //     openLinksSequentially(rows, currentTabId, minDelay, maxDelay);
    //   }, START_PROCESSING_LINK_TIME)
    // }

    // if (continueProcessingLinks) {
    //   let isFirstIteration = true;

    //   const interval = setInterval(() => {
    //   console.log('rows', rows);
    //     if (isFirstIteration) {
    //       isFirstIteration = false;
    //       openLinksSequentially(rows, currentTabId, minDelay, maxDelay);
    //     } else {
    //       openLinksSequentially(rows, currentTabId, minDelay, maxDelay);
    //     }
    //   }, isFirstIteration ? firstIterationTime : START_PROCESSING_LINK_TIME);

    //   // Clear the interval after the first iteration
    //   setTimeout(() => {
    //     clearInterval(interval);
    //   }, firstIterationTime);
    // }

    // const startProcessingLinks = () => {
    //   console.log('rows', rows);
    //   openLinksSequentially(rows, currentTabId, minDelay, maxDelay);
    //   setInterval(() => {
    //     openLinksSequentially(rows, currentTabId, minDelay, maxDelay);
    //   }, START_PROCESSING_LINK_TIME);
    // };

    // if (continueProcessingLinks) {
    //   startProcessingLinks();
    //   isFirstIteration = false;
    // }
    // setInterval(() => {
    //   if (!isFirstIteration) {
    //     startProcessingLinks();
    //   }
    // }, START_PROCESSING_LINK_TIME);
  }
});
