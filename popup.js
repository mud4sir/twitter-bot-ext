// constants
const accountsUrl =
  "https://script.googleusercontent.com/macros/echo?user_content_key=fVLBqz0WBJa2fpEmRrtC3xaZQ7nBMX-yc44xvSgH_nbLhcOFmfLPUxuflpES3Prq2YT7QEpoP2PzhkgQNUF8w2bzVqvFF1k5m5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnMA0DTO7--I9cSGJU1PdSh9B8zxf6AN40Cq5tNYeal_bPk4SH7gtpGImX6-jvriUGUzMSAydGnU8CY6NRsK5hw9P1sMGBIl-ag&lib=Ms6_62q9Tg9tm3p_I1Qc-ptEeF5Y93Lss";

// utils fn
const getAccounts = async (url) => {
  try {
    let loading = true;
    const response = await fetch(url);
    const { data } = await response.json();
    loading = false;
    return {
      data,
      loading,
    };
  } catch (err) {
    console.log(err);
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // btns
  const getDataButton = document.getElementById("getDataButton");
  const accountSelect = document.getElementById("accountSelect");
  const accountAdd = document.getElementById("accountAdd");
  const accountMgtButton = document.getElementById("accountMgtButton");
  const saveAccountButton = document.getElementById("saveAccountButton");
  const backButton = document.getElementById("backButton");
  const deleteAccountButton = document.getElementById("deleteAccountButton");
  const enterDelayBtn = document.getElementById("enterDelayBtn");

  // els
  const delayBtnsDiv = document.getElementById("delayBtnMain");
  const accountForm = document.querySelector(".account-form");
  const accountNameInput = document.getElementById("accountName");
  const minDelayInput = document.getElementById("minDelay");
  const maxDelayInput = document.getElementById("maxDelay");
  const minDelayInputMain = document.getElementById("minDelayMain");
  const maxDelayInputMain = document.getElementById("maxDelayMain");

  // Event Listeners

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

      // TODO: reset input fn
      minDelayInputMain.value = "";
      maxDelayInputMain.value = "";
    }
  });

  getDataButton.addEventListener("click", async function () {
    const selectedAccount = accountSelect?.value;

    if (selectedAccount === "") {
      alert("Please select an account.");
      return;
    }

    const { minValue, maxValue } = [...accountSelect.options].map((el) => {
      return { minValue: el.dataset.minValue, maxValue: el.dataset.maxValue };
    })[1];

    var customDelay = false;
    var minDelay = null;
    var maxDelay = null;

    // TODO: take data from main page's min/max input otherwise go with stored values.

    minDelay = parseInt(minDelayInputMain.value) || parseInt(minValue);
    maxDelay = parseInt(maxDelayInputMain.value) || parseInt(maxValue);

    if (isNaN(minDelay) || isNaN(maxDelay)) {
      alert("Please enter valid delay values.");
      return;
    }

    let apiURL =
      "https://script.google.com/macros/s/AKfycbz0t2NkfYmlT_DjVisvRggrSO6OjZ04c_PDApr5AnyeSpiwGaq0vH9yKx2vfkdJlNyK/exec?accName=" +
      selectedAccount;
    if (customDelay) {
      apiURL += "&minDelay=" + minDelay + "&maxDelay=" + maxDelay;
    }

    const { data } = await getAccounts(apiURL);
    chrome.runtime.sendMessage({
      action: "startOpenLinks",
      rows: data,
      minDelay,
      maxDelay,
    });
  });

  accountMgtButton.addEventListener("click", async function () {
    // TODO: display account managemnet page fn
    accountForm.style.display = "block";
    accountSelect.style.display = "none";
    accountMgtButton.style.display = "none";
    getDataButton.style.display = "none";
    enterDelayBtn.style.display = "none";

    accountAdd.innerHTML =
      '<option disabled selected value="">Loading accounts...</option>';

    const { data: accountsList } = await getAccounts(accountsUrl);
    accountsList.shift();
    addSelectedAccount(accountsList);
  });

  saveAccountButton.addEventListener("click", function () {
    const accountName = accountAdd.value.trim();
    var minDelay = parseInt(minDelayInput.value);
    var maxDelay = parseInt(maxDelayInput.value);

    if (accountName === "") {
      alert("Please enter an account name.");
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

      // Check if the account already exists
      var existingAccount = accounts.find(function (account) {
        return account.name === accountName;
      });

      if (existingAccount) {
        alert("Account profile already exists.");
        return;
      }

      accounts.push({
        name: accountName,
        minDelay: minDelay,
        maxDelay: maxDelay,
      });

      chrome.storage.local.set({ accounts: accounts }, function () {
        alert("Account profile saved successfully.");
        minDelayInput.value = "";
        maxDelayInput.value = "";

        // TODO: display main page fn
        accountForm.style.display = "none";
        accountSelect.style.display = "block";
        accountMgtButton.style.display = "block";
        getDataButton.style.display = "block";
        enterDelayBtn.style.display = "block";

        updateAccountSelect(accounts);
      });
    });
  });

  backButton.addEventListener("click", function () {
    accountForm.style.display = "none";
    accountSelect.style.display = "block";
    accountMgtButton.style.display = "block";
    getDataButton.style.display = "block";
    enterDelayBtn.style.display = "block";
  });

  chrome.storage.local.get(["accounts"], function (result) {
    var accounts = result.accounts || [];
    updateAccountSelect(accounts);
  });

  deleteAccountButton.addEventListener("click", function () {
    const accountName = accountAdd.value.trim();

    if (accountName === "") {
      alert("Please enter an account name.");
      return;
    }

    chrome.storage.local.get(["accounts"], function (result) {
      var accounts = result.accounts || [];
      console.log("accounts", accounts);
      var index = accounts.findIndex(function (account) {
        return account.name === accountName;
      });

      if (index !== -1) {
        accounts.splice(index, 1);
        chrome.storage.local.set({ accounts: accounts }, function () {
          alert("Account profile deleted successfully.");
          minDelayInput.value = "";
          maxDelayInput.value = "";

          // TODO: display main page fn
          accountForm.style.display = "none";
          accountSelect.style.display = "block";
          accountMgtButton.style.display = "block";
          getDataButton.style.display = "block";
          enterDelayBtn.style.display = "block";

          updateAccountSelect(accounts);
        });
      } else {
        alert("Account profile not found.");
      }
    });
  });

  async function updateAccountSelect(accounts) {
    accountSelect.innerHTML =
      '<option disabled selected value="">Select an account</option>';
    accounts.forEach(function (account) {
      var option = document.createElement("option");
      option.value = account?.name || account["account name"];
      option.textContent = account?.name || account["account name"];
      option.dataset.maxValue = account?.maxDelay;
      option.dataset.minValue = account?.minDelay;
      accountSelect.appendChild(option);
    });
  }

  async function addSelectedAccount(accounts) {
    accountAdd.innerHTML =
      '<option disabled selected value="">Select an account</option>';
    accounts.forEach(function (account) {
      var option = document.createElement("option");
      option.value = account?.name || account["account name"];
      option.textContent = account?.name || account["account name"];
      option.dataset.maxValue = account?.maxDelay;
      option.dataset.minValue = account?.minDelay;
      accountAdd.appendChild(option);
    });
  }
});
