
const typeComment = (replyBox,document, comment) => {
  replyBox.textContent = comment;
  replyBox.click();
  replyBox.dispatchEvent(new Event("input", {bubbles: true}));
  setTimeout(function(){
    const tweetButton = document.querySelector('div[data-testid="tweetButtonInline"]');
    tweetButton.click();
  }, 500)
};

 
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    
  const { action } = message;
  if (action === 'tweetPageLoaded') {
  const { comment } = message.data;
  const interval = setInterval(function(){
      const replyBoxDiv = document.getElementsByClassName("public-DraftStyleDefault-block public-DraftStyleDefault-ltr")[0];
      if (replyBoxDiv) {
        typeComment(replyBoxDiv,document, comment);
        clearInterval(interval);
      }
    }, 500);
  }
});
