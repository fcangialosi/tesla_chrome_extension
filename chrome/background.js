var japesUrl = "http://z4.invisionfree.com/japes/";
var unreadJSON = "http://sheltered-springs-7574.herokuapp.com/data/unread.json";

// Entry point when first installed
chrome.runtime.onInstalled.addListener(onInstall);
// Entry point every time after installed
chrome.runtime.onStartup.addListener(beginAcceptingRequests);

/*
 * Called only when the extension is first installed
 */
function onInstall(){
  // Initialize saved variables
  localStorage.readGeneral = 0;
  localStorage.readTeam = 0;
  localStorage.severGeneral = 0;
  localStorage.serverTeam = 0;

  // Once the user has entered their settings, begin making requests, and
  // change icon clicking action to go directly to Japes
  chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
    console.log(request.team);
    console.log(request.notifications);
    if(request.team && request.notifications){
      sendResponse({done:"done"});
      beginAcceptingRequests();
    }
  });

  // When first installed, extension click displays popup for settings,
  // this popup will never appear again once settings have been completed.
  chrome.browserAction.setPopup({popup:"settings.html"});
}

/*
 * Called each time the Chrome application is restarted
 * Sets icon action, begins repeatedly polling for new posts (alarm),
 * and begins intercepting requests to determine when posts are read
 */
function beginAcceptingRequests(){
  chrome.browserAction.setPopup({popup:""});
  chrome.browserAction.onClicked.addListener(goToForum);
  chrome.alarms.onAlarm.addListener(makeRequest);
  chrome.webRequest.onBeforeRequest.addListener(onUrlVisit,{urls:["*://z4.invisionfree.com/japes/*"]},[]);
  makeRequest();
  addAlarm();
};

/* 
 * Creates an alarm that fires the onAlarm function every periodInMinutes
 */
function addAlarm(){
  var delay = 0.5;
  console.log('Creating alarm that refreshes every: ' + delay + " minutes.");
  chrome.alarms.create('refresh', {periodInMinutes : delay});
}

/*
 * Switches to Japes tab if already open, or creates a new tab if not
 */
function goToForum(){
  console.log("Navigating to Japes page...");
  chrome.tabs.getAllInWindow(undefined, function (tabs) {
      for (var i=0, tab; tab = tabs[i]; i++) {
        if(tab.url && tab.url.indexOf(japesUrl) != -1){
          console.log('Found Japes tab.');
          chrome.tabs.update(tab.id,{selected:true});
          return;
        }
      }
      console.log("Couldn't find Japes tab, making a new one...");
    chrome.tabs.create({url : japesUrl});
  });
}

/*
 * Makes the HTTP GET request to our server to check for new messages
 * Called by alarm callback every periodInMinutes
 */
function makeRequest(){
  var req = new XMLHttpRequest();
  req.open("GET",unreadJSON,true);
  req.onload = onSuccess;
  req.onerror = function(e){console.log("Error " + e.target.status)};
  req.send(null);
}

/*
 * Callback when XHR request succeeds.
 * The main logic for determining whether or not there are new posts 
 * occurs here.
 */
function onSuccess(e){
  console.log("request success");
  var posts = JSON.parse(e.target.responseText);
  //chrome.storage.StorageArea.set({'serverGenreal':parseInt(posts.general),'serverTeam': parseInt(posts.rectenna)},function(){});
  localStorage.serverGeneral = parseInt(posts.general);
  localStorage.serverTeam = parseInt(posts.rectenna);
  var unreadGeneral = (localStorage.readGeneral - localStorage.serverGeneral) *-1;
  var unreadTeam = (localStorage.readTeam - localStorage.serverTeam)*-1;
  var flags = ""
  if(unreadGeneral > 0){
    flags += "G";
  }
  if(unreadTeam > 0){
    flags += "T";
  }
  if(flags){
    updateIcon(unreadGeneral+unreadTeam,flags);
  }
}

function updateIcon(numTotal, flags){
  console.log('updating icon');
  if(numTotal > 0){
    chrome.browserAction.setIcon({path:"honors_unread.png"});
    chrome.browserAction.setBadgeText({text:(numTotal.toString()+flags)});
  } else {
    chrome.browserAction.setIcon({path:"honors_read.png"});
    chrome.browserAction.setBadgeText({text:""});
  }
}

/*
 * Called when a request to the Japes domain is intercepted.
 *
 * If the user is requesting one of the forums with unread 
 * messages, the total count on the icon is decreased, and 
 * the necessary flags are removed.
 */
function onUrlVisit(req){
  console.log("url visited");
  var forumURL = "http://z4.invisionfree.com/japes/index.php?showforum=";
  var unreadGeneral = localStorage.serverGeneral-localStorage.readGeneral;
  var unreadTeam = localStorage.serverTeam-localStorage.readTeam;
  if ((req.url == (forumURL+"60"))&&(unreadGeneral>0)){
    localStorage.readGeneral = localStorage.serverGeneral;
    if(unreadTeam>0){
      updateIcon(unreadTeam,"T");
    } else {
      updateIcon(0,null);
    }
  } else if ((req.url == (forumURL+"65"))&&(unreadTeam>0)){
    localStorage.readTeam = localStorage.serverTeam;
    if(unreadGeneral>0){
      updateIcon(unreadGeneral,"G");
    } else {
      updateIcon(0,null);
    }
  }
}
