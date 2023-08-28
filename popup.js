// GLOBAL VARIABLES
let accountsUrl;
const windowId = chrome.windows.WINDOW_ID_CURRENT;
let continueProcessingLinks = false;
let savedAccountsList;
let allAccounts;
let accountListLoaded;
let addAcBtnClicked = false;

// CONSTANTS
const DEFAULT_MIN_DELAY = 10;
const DEFAULT_MAX_DELAY = 15;

document.addEventListener("DOMContentLoaded", async function () {
  // see if api key exists in local storage
  await chrome.storage.local.get(`${windowId}`, async (result) => {
    const apiKeyLocalStorage = await result[`${windowId}`];
    accountsUrl = apiKeyLocalStorage;
    if (apiKeyLocalStorage && apiKeyLocalStorage?.trim() !== "") {
      const accountMgtButton = document.getElementById("accountMgtButton");
      disableButton(accountMgtButton);
      displayMainPage();
      const response = await fetch(apiKeyLocalStorage);
      data = await response.json();
      const allAcc = data?.data;
      allAcc.shift();
      allAccounts = allAcc;
      document.getElementById('totalAccounts').textContent = `${allAccounts.length} accounts`;
      enableButton(accountMgtButton);
    }
  });

  // btns
  const getDataButton = document.getElementById("getDataButton");
  const accountAddTxt = document.getElementById("accountAdd");
  const accountMgtButton = document.getElementById("accountMgtButton");
  const saveAccountButton = document.getElementById("saveAccountButton");
  const backButton = document.getElementById("backButton");
  const deleteAccountButton = document.getElementById("deleteAccountButton");
  const gotoMainPageBtn = document.getElementById("backMainPageBtn");
  const connectionBtn = document.getElementById("connectionBtn");
  const connectSheetBtn = document.getElementById("connectSheetBtn");
  const accountsListNode = document.getElementById("accountsList");
  const accountsBtn = document.getElementById("accountsBtn");
  const addAccountsBtn = document.getElementById("addAccountsBtn");

  // els
  const accountForm = document.querySelector(".account-form");
  const minDelayInput = document.getElementById("minDelay");
  const maxDelayInput = document.getElementById("maxDelay");
  const minDelayInputMain = document.getElementById("minDelayMain");
  const maxDelayInputMain = document.getElementById("maxDelayMain");
  const connectionPage = document.getElementById("connectionPage");
  const mainPage = document.getElementById("mainPage");
  const linkToSheet = document.getElementById("linkToSheet");
  const accountManagementTitle = document.getElementById('accountManagementTitle');
  const totalAccounts = document.getElementById('totalAccounts');
  const totalAccCount = document.getElementById("totalAccCount");
  const addedAccCount = document.getElementById("addedAccCount");
  const processStatus = document.getElementById("processStatus");

  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  // utils fn
  const getAccounts = async (url) => {
    let data;
    let loading = true;
    let error = false;
    try {
      const response = await fetch(url);
      data = await response.json();
      loading = false;
    } catch (err) {
      error = true;
      console.log("Error:", err);
    } finally {
      return {
        data: data?.data,
        loading,
        error,
      };
    }
  };

  const compare = (a, b) => a === b;

  function updateAccountLinks (savedAccounts, updatedAccounts) {
    return savedAccounts.filter((item, index) => {
         if (updatedAccounts[index]) {
             if (item.link !== updatedAccounts[index].link) {
             item.link = updatedAccounts[index].link;
            }
          }
          return item;
      });
  }
  
  function updateSavedAccounts (savedAccounts, allAccounts) {
    const updatedAccounts = [];
    for (let i = 0; i < savedAccounts.length; i++) {
      const savedAc = savedAccounts[i];
  
      for (let j = 0; j < allAccounts.length; j++) {
        const allAc = allAccounts[j];
  
        if (savedAc['account name'].trim() === allAc['account name'].trim()) {
          if (savedAc.link !== allAc.link) {
            updatedAccounts.push(allAc);
          }
        }
      }
    }
      
    if (updatedAccounts.length > 0) {
      return updateAccountLinks(savedAccounts, updatedAccounts);
    }
    return savedAccounts;
  }
  
  function hasLinkMatched(savedAccounts, allAccounts) {
    let match = true;
    for (let i = 0; i < savedAccounts.length; i++) {
      const savedAc = savedAccounts[i];
      
      for (let j = 0; j < allAccounts.length; j++) {
        const allAc = allAccounts[j];
        if (savedAc['account name'].trim() === allAc['account name'].trim()) {
          if (savedAc.link !== allAc.link) {
            match = false;
            break;
          }
        }
      }
    }
  
    return match;
  }


  const displayAccountManagementPage = () => {
    accountForm.style.display = "block";
    accountManagementTitle.style.display = 'block';
    accountMgtButton.style.display = "none";
    totalAccounts.style.display = 'none';
    getDataButton.style.display = "none";
    connectionBtn.style.display = "none";
    processStatus.style.display = 'none';
  };

  const displayMainPage = async () => {
    await chrome.storage.local.get(`${windowId}`, async (result) => {
      const apiKeyLocalStorage = await result[`${windowId}`];
      accountsUrl = apiKeyLocalStorage;
      if (apiKeyLocalStorage && apiKeyLocalStorage?.trim() !== "") {
        accountManagementTitle.style.display = 'none';
        connectionPage.style.display = "none";
        accountForm.style.display = "none";
        mainPage.style.display = "block";
        accountMgtButton.style.display = "block";
        totalAccounts.style.display = 'block';
        getDataButton.style.display = "block";
        connectionBtn.style.display = "block";
        processStatus.style.display = 'block';
      }
    });
  };
  
  const displayConnectionPage = () => {
    connectionPage.style.display = "block";
    gotoMainPageBtn.style.display = "block";
    mainPage.style.display = "none";
    connectionBtn.style.display = 'block';
  };

  const attachClickEventListner = (element, callBack) => {
    element.addEventListener("click", () => {
      callBack();
    });
  };

  function saveDataLocalStorage(key, value, message) {
    const data = {};
    data[`${key}`] = value;

    chrome.storage.local.set(data, () => {
      if (message) {
        alert(message);
      }
    });
  }


async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function startOpenLinks() {
  const minDelay = DEFAULT_MIN_DELAY;
  const maxDelay = DEFAULT_MAX_DELAY;

  await chrome.storage.local.get(["accounts"], async function (result) {
    const savedData = result.accounts || [];
    const { id: currentTabId } = await getCurrentTab();
    
    if (savedData.length === 0) {
      alert('no saved account found');
      return;
    }

    getDataButton.textContent = 'Start Now';
    processStatus.textContent = 'Stopped';
    continueProcessingLinks = !continueProcessingLinks;
    if (continueProcessingLinks) {
      getDataButton.textContent = 'Stop Now';
       processStatus.textContent = 'Running';
    }

    chrome.runtime.sendMessage({
      action: "startOpenLinks",
      currentTabId,
      rows: savedData,
      minDelay,
      maxDelay,
      continueProcessingLinks,
    });
  
  });
  
}

  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  // Event Listeners

  connectSheetBtn.addEventListener("click", async () => {
    const link = linkToSheet.value;
    if (link.trim() === "") return;

    connectSheetBtn.innerText = "Loading...";
    const { data: accountsList, error } = await getAccounts(link);
    accountsList?.shift();
    allAccounts = accountsList;
    connectSheetBtn.innerText = "Save";
    if (error) {
      alert("Error occurred, enter a valid link");
      linkToSheet.value = "";
      return;
    }
    // params -> saveDataLocalStorage (key, value, message)
    saveDataLocalStorage(windowId, link, "Api key saved successfully");
    displayMainPage();
    linkToSheet.value = "";
  });

  attachClickEventListner(connectionBtn, displayConnectionPage);
  attachClickEventListner(gotoMainPageBtn, displayMainPage);

  attachClickEventListner(getDataButton, startOpenLinks);

  attachClickEventListner(accountMgtButton, async function () {
    if (!allAccounts || allAccounts.length<1) {
      const { data: accountsList } = await getAccounts(accountsUrl);
      accountsList?.shift();
      allAccounts = accountsList;
    }

    totalAccCount.innerText = allAccounts.length;
    displayAccountManagementPage();
    
    disableButton(saveAccountButton, 'block');
    disableButton(deleteAccountButton, 'block');
    
    chrome.storage.local.get(["accounts"], function (result) {
      savedAccountsList = result.accounts || [];
    });
  });

  attachClickEventListner(accountsBtn, async function() {
    disableButton(accountsBtn);
  
    const {
      accountList,
    } = getAccountsListNodes();

    if (accountListLoaded) {
      hideAccountsList();
      return;
    }

    if (!savedAccountsList || !allAccounts) {
      chrome.storage.local.get(["accounts"], function (result) {
          savedAccountsList = result.accounts || [];
      });
    
      const { data: accountsList } = await getAccounts(accountsUrl);
      accountsList?.shift();
      allAccounts = accountsList;
    }
    
    const {
      activeAccountsWrapper,
      activeAccountsTitle,
      activeAccountsIcon,
    } = createAccountListElements()

    const checkBoxWrapContainer = document.getElementById("checkboxWrapContainer");

    activeAccountsWrapper.setAttribute('id', `activeAccountsWrapper`);
    activeAccountsTitle.setAttribute('id', `activeAccountsTitle`);
    activeAccountsIcon.setAttribute('id', `activeAccountsIcon`);
    activeAccountsIcon.setAttribute('src', `./icons/folder2.png`);
    activeAccountsIcon.setAttribute('title', `folder icon`);
    activeAccountsIcon.setAttribute('width', `22px`);
    activeAccountsTitle.textContent = 'Active Accounts';
    
    checkBoxWrapContainer.appendChild(activeAccountsWrapper);
    activeAccountsWrapper.appendChild(activeAccountsIcon);
    activeAccountsWrapper.appendChild(activeAccountsTitle);
    accountList.prepend(checkBoxWrapContainer);

    const uniqueUnsavedAccs = getUniqueUnsavedAccounts(allAccounts, savedAccountsList);

    addedAccCount.innerText = uniqueUnsavedAccs.length;
    savedAccountsList.forEach((account, idx) => {
      const checkBoxWrapContainer = document.getElementById("checkboxWrapContainer");
      const div = document.createElement('div');
      div.className = 'checkbox-wrap';
      div.id = 'checkboxWrap';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = account['account name'];
      checkbox.value = account['account name'];
      checkbox.id = account['account name'];
      checkbox.classList.add('myinput', 'large');

      checkbox.textContent = account?.name || account["account name"];
      checkbox.dataset.maxValue = account?.maxDelay;
      checkbox.dataset.minValue = account?.minDelay;
      checkbox.dataset.link = account?.link;
      checkbox.dataset.comment = account?.comment;
      checkbox.dataset.typeof = 'activeAccounts';

      const label = document.createElement('label');
      label.textContent = `Account ${idx+1} - @${account['account name']}`;
      label.setAttribute('for', account['account name']);
      div.appendChild(checkbox);
      div.appendChild(label);
      checkBoxWrapContainer.appendChild(div);
    });

    addAccountsBtn.classList.remove('d-none');
    addAccountsBtn.style.display ='flex';
    addAccountsBtn.style.marginLeft ='-7px';
    accountListLoaded = true;
    enableButton(accountsBtn);

    updateStateOfDeleteBtn();
  });

  attachClickEventListner(addAccountsBtn, function() {
    if (addAcBtnClicked) {
      const accounts = document.querySelectorAll('#addAcCheckboxWrap');
      accounts.forEach(el => {
        el.parentNode.removeChild(el);
      });
      addAcBtnClicked = !addAcBtnClicked;
      return;
    };

    const {
      accountList,
    } = getAccountsListNodes();

    const checkBoxWrapContainer = document.getElementById("addAcCheckboxWrapContainer");
    accountList.appendChild(checkBoxWrapContainer);

    const uniqueUnsavedAccs = getUniqueUnsavedAccounts(allAccounts, savedAccountsList);

    uniqueUnsavedAccs.forEach((account, idx) => {
      const div = document.createElement('div');
      div.className = 'checkbox-wrap';
      div.id = 'addAcCheckboxWrap';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = account['account name'];
      checkbox.value = account['account name'];
      checkbox.id = account['account name'];
      checkbox.classList.add('myinput', 'large');

      checkbox.textContent = account?.name || account["account name"];
      checkbox.dataset.link = account?.link;
      checkbox.dataset.comment = account?.comment;
      checkbox.dataset.typeof = 'availableAccounts';

      const label = document.createElement('label');
      label.textContent = `Account ${idx+1} - @${account['account name']}`;
      label.setAttribute('for', account['account name']);
      div.appendChild(checkbox);
      div.appendChild(label);
      checkBoxWrapContainer.appendChild(div);
    });

    updateStateOfSaveBtn();
    addAcBtnClicked = !addAcBtnClicked;
  })

  attachClickEventListner(saveAccountButton, function () {
    
    const minDelay = parseInt(minDelayInput.value);
    const maxDelay = parseInt(maxDelayInput.value);

    if (isNaN(minDelay) || isNaN(maxDelay)) {
      alert("Please enter valid delay values.");
      return;
    }

    if (minDelay > maxDelay) {
      alert("Minimum delay cannot be greater than maximum delay.");
      return;
    }


    const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const selectedAccounts = Array.from(selectedCheckboxes).map(checkbox => {
      return {
        'account name': checkbox.value,
        comment: checkbox.dataset.comment,
        link: checkbox.dataset.link,
        maxDelay,
        minDelay,
      }
    });
    
    if (selectedAccounts.length > 1) {
      alert('please select only one account at a time');
      return;
    }

    chrome.storage.local.get(["accounts"], function (result) {
      let accounts = [...result.accounts, ...selectedAccounts] || [];

      saveDataLocalStorage(
        "accounts",
        accounts,
        "Account profile saved successfully"
      );

      minDelayInput.value = "";
      maxDelayInput.value = "";
      displayMainPage();
      hideAccountsList();
    });
  });


  attachClickEventListner(backButton, displayMainPage);

  attachClickEventListner(deleteAccountButton, function () {

    // TODO: delete account based on account id,
    const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const selectedValues = Array.from(selectedCheckboxes).map(checkbox => {
      if (checkbox.dataset.typeof === 'activeAccounts') {
        return {
          'account name': checkbox.value,
          comment: checkbox.dataset.comment,
          link: checkbox.dataset.link,
          maxDelay: +checkbox.dataset.maxValue,
          minDelay: +checkbox.dataset.minValue,
          id: +checkbox.id,
        }
      }
    }).filter(a=>a);

    if (selectedValues?.length > 1) {
      alert("Please select one account account at a time.");
      return;
    }
    const accountName = selectedValues[0]?.['account name'];

    chrome.storage.local.get(["accounts"], function (result) {
      const accounts = result.accounts || [];
      let index = accounts.findIndex(function (account) {
        return account.name || account['account name'] === accountName;
      });

      if (index !== -1) {
        accounts.splice(index, 1);
        chrome.storage.local.set({ accounts: accounts }, function () {
          alert("Account profile deleted successfully.");
          // TODO: reset input min/max value fn
          minDelayInput.value = "";
          maxDelayInput.value = "";

          displayMainPage();
          hideAccountsList();
          updateStateOfDeleteBtn();
        });
      } else {
        alert("Account profile not found.");
      }
    });
  });

  async function updateLinkFromApi(url, savedData) {
    const { data } = await getAccounts(url);
    data?.shift();

    let matchFound = hasLinkMatched(savedData, data);
    while(matchFound){
      const { data } = await getAccounts(url);
      data?.shift();
      matchFound = hasLinkMatched(savedData, data);
    }
    
    if (!matchFound) {
      const { data } = await getAccounts(url);
      data?.shift();
      const updatedAccounts = updateSavedAccounts(savedData, data);
      allAccounts = updatedAccounts;
      saveDataLocalStorage("accounts", updatedAccounts);
      return updatedAccounts;
    }
  };

  function getAccountsListNodes() {
    const accountList = document.getElementById('accountList');
    const activeAcTitle = document.getElementById('activeAccountsTitle');
    const activeAcIcon = document.getElementById("activeAccountsIcon");
    const activeAcWrapper = document.getElementById("activeAccountsWrapper");

    return {
      accountList,
      activeAcTitle,
      activeAcIcon,
      activeAcWrapper,
    }
  }

  function createAccountListElements() {
    const activeAccountsWrapper = document.createElement('div');
    const activeAccountsTitle = document.createElement('h2');
    const activeAccountsIcon = document.createElement('img');

    return {
      activeAccountsWrapper,
      activeAccountsTitle,
      activeAccountsIcon
    }
  }

  function getUniqueUnsavedAccounts(allAccounts, savedAccounts) {
    const uniqueUnsavedAccounts = Object.values(
      allAccounts?.reduce((acc, obj) => {
        const name = obj["account name"].trim();
        if (!acc[name]) {
          acc[name] = obj;
        }
        return acc;
      }, {})
    );

    return uniqueUnsavedAccounts.filter(
      (item1) =>
        !savedAccounts.some((item2) =>
          compare(item1["account name"]?.trim(), item2['account name']?.trim())
        )
    );
  }

  function enableButton(btn, className = 'loading') {
    btn.classList.remove(className);
    btn.removeAttribute('disabled');
  }

  function disableButton(btn, className='loading') {
    btn.setAttribute('disabled', 'true');
    btn.classList.add(className);
  }

  function hideAccountsList() {
      const {
        activeAcTitle,
        activeAcIcon,
        activeAcWrapper,
      } = getAccountsListNodes();

      if (addAcBtnClicked) {
        const accounts = document.querySelectorAll('#addAcCheckboxWrap');
        accounts.forEach(el => {
          el.parentNode.removeChild(el);
        });
        addAcBtnClicked = !addAcBtnClicked;
      };

      const elems = document.querySelectorAll('#checkboxWrapContainer > #checkboxWrap');
      elems.forEach(el => {
        el.parentNode.removeChild(el);
      });
      activeAcTitle.parentNode.removeChild(activeAcTitle);
      activeAcIcon.parentNode.removeChild(activeAcIcon);
      activeAcWrapper.parentNode.removeChild(activeAcWrapper)

      addAccountsBtn.style.display = 'none';

      accountListLoaded = false;
      enableButton(accountsBtn);
  }

  function updateStateOfDeleteBtn() {
    const checkboxes = document.querySelectorAll("input[type=checkbox]");
  
    checkboxes?.forEach(cb=> {
      if (cb.dataset.typeof === 'activeAccounts') {
        attachClickEventListner(cb, function(){
          const selectedCheckboxes = Array.from(document.querySelectorAll('input[data-typeof="activeAccounts"]:checked'));
          if (selectedCheckboxes.length > 0) {
            enableButton(deleteAccountButton, 'block');
            return;
          }
          disableButton(deleteAccountButton, 'block');
        })
      }
    });
  }

  function updateStateOfSaveBtn() {
    const checkboxes = document.querySelectorAll("input[type=checkbox]");
    checkboxes?.forEach(cb=> {
      if (cb.dataset.typeof === 'availableAccounts') {
        attachClickEventListner(cb, function(){
          const selectedCheckboxes = Array.from(document.querySelectorAll('input[data-typeof="availableAccounts"]:checked'));
          if (selectedCheckboxes.length > 0) {
            enableButton(saveAccountButton, 'block');
            return;
          }
          disableButton(saveAccountButton, 'block');
        })
      }
    })
  }

  // listen to messages from background script
  chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
    const { action } = message;
    
    if (action === 'tweetLoaded') {
      const {link, comment, currentTabId} = message.data;
      chrome.runtime.sendMessage({ action: 'tweetPageLoaded', data: {comment, link, currentTabId} });
    }

    if (action === 'linkMatchFound') {
      chrome.runtime.sendMessage({action: 'duplicateLinkFound'});

      const { maximumDelay, minimumDelay } = message.data;
      await chrome.storage.local.get(["accounts"], async function (result) {
        const savedData = result.accounts || [];
        const data = await updateLinkFromApi(accountsUrl, savedData);

        if (data) {
          const { id: currentTabId } = await getCurrentTab();
          
          chrome.runtime.sendMessage({
            action: "startOpenLinks",
            currentTabId,
            rows: data,
            minDelay: minimumDelay,
            maxDelay: maximumDelay,
            continueProcessingLinks,
          });
        }
      });
    }
  });

});
