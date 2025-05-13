chrome.storage.local.get("tabTimes", data => {
  let tabTimes = data.tabTimes || {};
  let tabList = document.getElementById("tabList");
  tabList.innerHTML = "";

  for (let tabId in tabTimes) {
      let timeSpent = tabTimes[tabId].timeSpent;
      let secondsSpent = tabTimes[tabId].secondsSpent;
      let li = document.createElement("li");

      // Making title bold and black using <strong>
      li.innerHTML = `<strong style="color: black;">${tabTimes[tabId].title}</strong>: ${timeSpent} min ${secondsSpent} sec`;

      tabList.appendChild(li);
  }
});
