var japesUrl = "http://z4.invisionfree.com/japes/";
var unreadJSON = "http://sheltered-springs-7574.herokuapp.com/data/unread.json";
var teams = {
  "General" : "60",
  "Modeling Team" : "66",
  "Lossy Events Team" : "69",
  "Antenna Team" : "68",
  "Rectenna Team" : "65",
  "IP Team" : "67",
  "Grant Team" : "70"
}

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
  localStorage.readGrant = 0;
  localStorage.serverGrant = 0;
  localStorage.readIp = 0;
  localStorage.serverIp = 0;

  // Once the user has entered their settings, begin making requests, and
  // change icon clicking action to go directly to Japes
  chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
    if(request.team && request.notifications){
      // Tell settings.html that the request was successful
      sendResponse({done:"done"});
      // Save user settings
      localStorage.teamName = request.team;
      localStorage.notifications = request.notification;
      localStorage.isOnGrantTeam = request.grantTeam;
      localStorage.isOnIpTeam = request.ipTeam;
      // Start continuous polling process
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
  var posts = JSON.parse(e.target.responseText);
  if(!(localStorage.serverGeneral == localStorage.readGeneral)||(localStorage.severTeam==localStorage.readTeam)||(localStorage.serverGrant==localStorage.readGrant)||(localStorage.serverIp==localStorage.readIp)){
    localStorage.serverGeneral = parseInt(posts["General"]);
    localStorage.serverTeam = parseInt(posts[localStorage.teamName]);
    if(localStorage.isOnGrantTeam)
      localStorage.serverGrant = parseInt(posts["Grant Team"]);
    if(localStorage.isOnIpTeam)
      localStorage.serverIp = parseInt(posts["IP Team"]);

    var unreadGeneral = parseInt(localStorage.serverGeneral) - parseInt(localStorage.readGeneral);
    var unreadTeam = (parseInt(localStorage.serverTeam)+parseInt(localStorage.serverGrant)+parseInt(localStorage.serverIp)) - (parseInt(localStorage.readTeam)+parseInt(localStorage.readGrant)+parseInt(localStorage.readIp));
    var flags = ""

    console.log(unreadGeneral);
    console.log(unreadTeam);

    if(unreadGeneral > 0)
      flags += "G";
    if(unreadTeam > 0)
      flags += "T";
    if(flags)
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
  var unreadGrant = localStorage.serverGrant-localStorage.readGrant;
  var unreadIp = localStorage.serverIp-localStorage.readIp;

  if ((req.url == (forumURL+teams["General"]))&&(unreadGeneral>0)){
    console.log("1");
    localStorage.readGeneral = localStorage.serverGeneral;
    total = unreadTeam + unreadGrant + unreadIp;
    if(total>0)
      updateIcon(total,"T");
    else
      updateIcon(0,null);
  } else if ((req.url == (forumURL+teams[localStorage.teamName]))&&(unreadTeam>0)){
    console.log("2");
    localStorage.readTeam = localStorage.serverTeam;
    total = unreadGeneral + unreadGrant + unreadIp;
    if(total>0 && total==unreadGeneral)
      updateIcon(total,"G");
    else if(total>0)
      updateIcon(total,"GT")
    else 
      updateIcon(0,null);
  } else if ((req.url == (forumURL+teams["Grant Team"]))&&(unreadGrant>0)){
    console.log("3");
    localStorage.readGrant = localStorage.serverGrant;
    total = unreadGeneral + unreadTeam + unreadIp;
    if(total>0 && total==unreadGeneral)
      updateIcon(total,"G");
    else if(total>0)
      updateIcon(total,"GT")
    else 
      updateIcon(0,null);
  } else if ((req.url == (forumURL+teams["IP Team"]))&&(unreadIp>0)){
    console.log("4");
    localStorage.readIp = localStorage.serverIp;
    total = unreadGeneral + unreadGrant + unreadTeam;
    if(total>0 && total==unreadGeneral)
      updateIcon(total,"G");
    else if(total>0)
      updateIcon(total,"GT")
    else 
      updateIcon(0,null);
  } 
}