// constants
let accountsUrl;
const windowId = chrome.windows.WINDOW_ID_CURRENT;
let continueProcessingLinks = false;

document.addEventListener("DOMContentLoaded", async function () {
  // see if api key exists in local storage
  await chrome.storage.local.get(`${windowId}`, async (result) => {
    const apiKeyLocalStorage = await result[`${windowId}`];
    accountsUrl = apiKeyLocalStorage;
    if (apiKeyLocalStorage && apiKeyLocalStorage?.trim() !== "") {
      displayMainPage();
    }
  });

  // btns
  const getDataButton = document.getElementById("getDataButton");
  const accountSelect = document.getElementById("accountSelect");
  const accountAdd = document.getElementById("accountAdd");
  const accountMgtButton = document.getElementById("accountMgtButton");
  const saveAccountButton = document.getElementById("saveAccountButton");
  const backButton = document.getElementById("backButton");
  const deleteAccountButton = document.getElementById("deleteAccountButton");
  const enterDelayBtn = document.getElementById("enterDelayBtn");
  const gotoMainPageBtn = document.getElementById("backMainPageBtn");
  const connectionBtn = document.getElementById("connectionBtn");
  const connectSheetBtn = document.getElementById("connectSheetBtn");

  // els
  const delayBtnsDiv = document.getElementById("delayBtnMain");
  const accountForm = document.querySelector(".account-form");
  const minDelayInput = document.getElementById("minDelay");
  const maxDelayInput = document.getElementById("maxDelay");
  const minDelayInputMain = document.getElementById("minDelayMain");
  const maxDelayInputMain = document.getElementById("maxDelayMain");
  const connectionPage = document.getElementById("connectionPage");
  const mainPage = document.getElementById("mainPage");
  const linkToSheet = document.getElementById("linkToSheet");

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
    accountSelect.style.display = "none";
    accountMgtButton.style.display = "none";
    getDataButton.style.display = "none";
    enterDelayBtn.style.display = "none";
    connectionBtn.style.display = "none";
  };

  const displayMainPage = async () => {
    await chrome.storage.local.get(`${windowId}`, async (result) => {
      const apiKeyLocalStorage = await result[`${windowId}`];
      accountsUrl = apiKeyLocalStorage;
      if (apiKeyLocalStorage && apiKeyLocalStorage?.trim() !== "") {
        connectionPage.style.display = "none";
        accountForm.style.display = "none";
        mainPage.style.display = "block";
        accountSelect.style.display = "block";
        accountMgtButton.style.display = "block";
        getDataButton.style.display = "block";
        enterDelayBtn.style.display = "block";
        connectionBtn.style.display = "block";
      }
    });
  };
  
  const displayConnectionPage = () => {
    connectionPage.style.display = "block";
    gotoMainPageBtn.style.display = "block";
    mainPage.style.display = "none";
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
  const minDelay = parseInt(minDelayInputMain.value);
  const maxDelay = parseInt(maxDelayInputMain.value);

  await chrome.storage.local.get(["accounts"], async function (result) {
    const savedData = result.accounts || [];
    const { id: currentTabId } = await getCurrentTab();
    
    if (savedData.length === 0) {
      alert('no saved account found');
      return;
    }

    getDataButton.textContent = 'Start';
    continueProcessingLinks = !continueProcessingLinks;
    if (continueProcessingLinks) {
      getDataButton.textContent = 'Stop';
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

  enterDelayBtn.addEventListener("click", () => {
    if (
      enterDelayBtn.innerText === "Enter Delay" &&
      delayBtnsDiv.style.display === "none"
    ) {
      enterDelayBtn.innerText = "Cancel";
      delayBtnsDiv.style.display = "block";
    } else {
      enterDelayBtn.innerText = "Enter Delay";
      delayBtnsDiv.style.display = "none";

      // TODO: reset input min/max fn
      minDelayInputMain.value = "";
      maxDelayInputMain.value = "";
    }
  });

  attachClickEventListner(getDataButton, startOpenLinks);

  attachClickEventListner(accountMgtButton, async function () {
    displayAccountManagementPage();

    let savedAccountsList;
    chrome.storage.local.get(["accounts"], function (result) {
      savedAccountsList = result.accounts || [];
    });

    accountAdd.innerHTML =
      '<option disabled selected value="">Loading accounts...</option>';

    const { data: accountsList } = await getAccounts(accountsUrl);
    accountsList?.shift();
    addSelectedAccount(accountsList || [], savedAccountsList);
  });

  attachClickEventListner(saveAccountButton, function () {
    const accountName = accountAdd.value.trim();
    
    const selectElement = document.getElementById('accountAdd');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const link = selectedOption.getAttribute('data-link') || '';
    const comment = selectedOption.getAttribute('data-comment') || '';
    var minDelay = parseInt(minDelayInput.value);
    var maxDelay = parseInt(maxDelayInput.value);

    if (accountName === "") {
      alert("Please select an account.");
      return;
    }

    if (isNaN(minDelay) || isNaN(maxDelay)) {
      alert("Please enter valid delay values.");
      return;
    }

    if (minDelay > maxDelay) {
      alert("Minimum delay cannot be greater than maximum delay.");
      return;
    }

    chrome.storage.local.get(["accounts"], function (result) {
      var accounts = result.accounts || [];

      var existingAccount = accounts.find(function (account) {
        return account.name || account['account name'] === accountName;
      });

      if (existingAccount) {
        alert("Account profile already exists.");
        return;
      }

      accounts.push({
        'account name': accountName,
        minDelay: minDelay,
        maxDelay: maxDelay,
        link,
        comment,
      });

      saveDataLocalStorage(
        "accounts",
        accounts,
        "Account profile saved successfully"
      );

      minDelayInput.value = "";
      maxDelayInput.value = "";
      displayMainPage();
      updateAccountSelect(accounts);
    });
  });

  attachClickEventListner(backButton, displayMainPage);

  chrome.storage.local.get(["accounts"], function (result) {
    var accounts = result.accounts || [];
    updateAccountSelect(accounts);
  });

  attachClickEventListner(deleteAccountButton, function () {
    const accountName = accountAdd.value.trim();

    if (accountName === "") {
      alert("Please enter an account name.");
      return;
    }

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

          updateAccountSelect(accounts);
        });
      } else {
        alert("Account profile not found.");
      }
    });
  });

  async function updateAccountSelect(accounts) {
    accountSelect.innerHTML =
      '<option disabled selected value="">Added Accounts</option>';
    accounts.forEach(function (account) {
      // TODO: this functionality can be exported to a function
      // it's repeatitive
      const option = document.createElement("option");
      option.value = account?.name || account["account name"];
      option.textContent = account?.name || account["account name"];
      option.dataset.maxValue = account?.maxDelay;
      option.dataset.minValue = account?.minDelay;
      option.dataset.link = account?.link;
      option.dataset.comment = account?.comment;
      accountSelect.appendChild(option);
    });
  }

  async function addSelectedAccount(accounts, saveAccounts) {
    // TODO: refactoring needs to be here

    const uniqueUnsavedAccounts = Object.values(
      accounts?.reduce((acc, obj) => {
        const name = obj["account name"].trim();
        if (!acc[name]) {
          acc[name] = obj;
        }
        return acc;
      }, {})
    );

    const unsavedAccounts = uniqueUnsavedAccounts.filter(
      (item1) =>
        !saveAccounts.some((item2) =>
          compare(item1["account name"]?.trim(), item2['account name']?.trim())
        )
    );

    accountAdd.innerHTML = `<option disabled selected value="">Select an account</option>`;
    const optgroup = document.createElement("optgroup");
    optgroup.label = "----- Available Accounts ------";
    accountAdd.appendChild(optgroup);
    if (unsavedAccounts.length <= 0) {
      const option = document.createElement("option");
      option.textContent = "no accounts available";
      option.disabled = true;
      optgroup.appendChild(option);
    }
    if (unsavedAccounts.length > 0) {
      unsavedAccounts.forEach(function (account) {
        const option = document.createElement("option");
        option.value = account?.name || account["account name"];
        option.textContent = account?.name || account["account name"];
        option.dataset.maxValue = account?.maxDelay;
        option.dataset.minValue = account?.minDelay;
        option.dataset.link = account?.link;
        option.dataset.comment = account?.comment;
        optgroup.appendChild(option);
      });
    }

    if (saveAccounts.length <= 0) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = "----- Added Accounts ------";
      accountAdd.appendChild(optgroup);

      const option = document.createElement("option");
      option.textContent = "no accounts available";
      option.disabled = true;
      optgroup.appendChild(option);
    }

    if (saveAccounts.length > 0) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = "----- Added Accounts ------";
      accountAdd.appendChild(optgroup);

      saveAccounts.forEach(function (account) {
        const option = document.createElement("option");
        option.value = account?.name || account["account name"];
        option.textContent = account?.name || account["account name"];
        option.dataset.maxValue = account?.maxDelay;
        option.dataset.minValue = account?.minDelay;
        option.dataset.link = account?.link;
        option.dataset.comment = account?.comment;
        optgroup.appendChild(option);
      });
    }
  }
  
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
      saveDataLocalStorage("accounts", updatedAccounts);
      return updatedAccounts;
    }
  };

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
