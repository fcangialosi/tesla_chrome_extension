
var japesUrl = "http://z4.invisionfree.com/japes/";
var unreadJSON = "http://sheltered-springs-7574.herokuapp.com/posts";

var teams = {
  "general" : "60",
  "modeling" : "66",
  "lossy" : "69",
  "antenna" : "68",
  "rectenna" : "65",
  "ip" : "67",
  "grant" : "70"
}

// Entry point when first installed
chrome.runtime.onInstalled.addListener(onInstall);
// Entry point every time after installed
chrome.runtime.onStartup.addListener(beginAcceptingRequests);

function initializeLocalStorage(){
  localStorage.clear();
  localStorage.readAntennaCount = [];
  localStorage.readGeneralCount = [];
  localStorage.readGrantCount = [];
  localStorage.readIpCount = [];
  localStorage.readLossyCount = [];
  localStorage.readRectennaCount = [];
  localStorage.readModelingCount = [];
  localStorage.diffAntennaCount = [];
  localStorage.antennaTopic = [];
  localStorage.diffGeneralCount = [];
  localStorage.generalTopic = [  ];
  localStorage.diffGrantCount = [];
  localStorage.grantTopic = [];
  localStorage.diffIpCount = [];
  localStorage.ipTopic = [];
  localStorage.diffLossyCount = [];
  localStorage.lossyTopic = [];
  localStorage.diffRectennaCount = [ ];
  localStorage.rectennaTopic = [ ];
  localStorage.diffModelingCount = [];
  localStorage.modelingTopic = [];
}
/*
 * Called only when the extension is first installed
 */
function onInstall(){
  initializeLocalStorage();

  // Once the user has entered their settings, begin making requests, and
  // change icon clicking action to go directly to Japes
  chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
    if(request.teams){
      // Tell settings.html that the request was successful
      sendResponse({done:"done"});

      // Save user settings
      localStorage.teams = request.teams;
      localStorage.notifications = request.notifications;
      localStorage.sound = request.sound;

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
  chrome.alarms.onAlarm.addListener(getPosts);
  chrome.webRequest.onBeforeRequest.addListener(onUrlVisit,{urls:["*://z4.invisionfree.com/japes/*"]},["requestBody"]);
  getPosts();
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
  chrome.tabs.getAllInWindow(undefined, function (tabs) {
      for (var i=0, tab; tab = tabs[i]; i++) {
        if(tab.url && tab.url.indexOf(japesUrl) != -1){
          chrome.tabs.update(tab.id,{selected:true});
          return;
        }
      }
    chrome.tabs.create({url : japesUrl});
  });
}

/*
 * Makes the HTTP GET request to our server to check for new messages
 * Called by alarm callback every periodInMinutes
 */
function getPosts(){
  var req = new XMLHttpRequest();
  req.open("GET",unreadJSON,true);
  req.onload = onSuccess;
  req.onerror = function(e){console.log("Error " + e.target.status)};
  req.send(null);
}

function newPost(interception){
  var req = new XMLHttpRequest();
  var postUrl = "http://sheltered-springs-7574.herokuapp.com/newpost?secret=42xigUBluzIGgGl8zOSA&forum_num="+interception['forum_num']+"&topic_num="+interception['topic_num'];
  req.open("POST",(postUrl),true);
  req.onload = function(e){readMyOwnPost(interception['topic_num'])};
  req.onerror = function(e){};
  req.send(null);
}

/*
 * Callback when XHR request succeeds.
 * The main logic for determining whether or not there are new posts 
 * occurs here.
 */
function onSuccess(e){
  var posts = JSON.parse(e.target.responseText);
  var new_posts = calculateDiffs(posts);
  updateIcon(new_posts);
}

function fillArray(n, fill) {
  var arr = Array.apply(null, Array(n));
  return arr.map(function (x, i) { return fill });
}

function isOnTeam(team){
  return (localStorage.teams.indexOf(team) != -1);
}

function subtractArrays(read_str, server){
  read = JSON.parse("[" + read_str + "]");
  var diff = new Array(read.length);
  for(var i=0; i<read.length; i++){
    diff[i] = server[i] - read[i];
  }
  return diff;
}

function pushN(arr_str, n){
  arr = JSON.parse("[" + arr_str + "]");
  for(var i=0; i<n; i++){
    arr.push(0);
  }
  return arr;
}

function arraysDiff(a_str,b_str){
  a = JSON.parse("[" + a_str + "]");
  b = JSON.parse("[" + b_str + "]");
  for(var i=0; i<a.length; i++){
    if(a[i] != b[i]){
      return true;
    }
  }
  return false;
}

function addArray(arr_str){
  arr = JSON.parse("[" + arr_str + "]");
  total = 0;
  for(var i=0; i<arr.length; i++){
    total+=arr[i];
  }
  return total;
}

function calculateDiffs(posts){
  var total = 0;
  if(isOnTeam("antenna") && posts['antennaTopic']) {
    if(localStorage.antennaTopic.length == 0){
      localStorage.antennaTopic = posts['antennaTopic'].slice(0);
      localStorage.readAntennaCount = fillArray(posts['antennaCount'].length, 0);
      localStorage.diffAntennaCount = posts['antennaCount'].slice(0);
    } else {
      num_new = (posts['antennaCount'].length - ((localStorage.readAntennaCount.length+1)/2));
      if(num_new > 0){
        localStorage.antennaTopic = posts['antennaTopic'].slice(0);
        localStorage.readAntennaCount = pushN(localStorage.readAntennaCount, num_new);
      } else {
        localStorage.diffAntennaCount = subtractArrays(localStorage.readAntennaCount, posts['antennaCount']);
      }
    }
    total += addArray(localStorage.diffAntennaCount);
  }
  if(posts['generalTopic']) {
    if(localStorage.generalTopic.length == 0){
        localStorage.generalTopic = posts['generalTopic'].slice(0);
        localStorage.readGeneralCount = fillArray(posts['generalCount'].length, 0);
        localStorage.diffGeneralCount = posts['generalCount'].slice(0);
    } else {
      num_new = (posts['generalCount'].length - ((localStorage.readGeneralCount.length+1)/2));
      if(num_new > 0){
        localStorage.generalTopic = posts['generalTopic'].slice(0);
        localStorage.readGeneralCount = pushN(localStorage.readGeneralCount, num_new);
      } 
      localStorage.diffGeneralCount = subtractArrays(localStorage.readGeneralCount, posts['generalCount']);
    }
    total += addArray(localStorage.diffGeneralCount);
  }
  if(isOnTeam("grant") && posts['grantTopic']) {
    if(localStorage.grantTopic.length == 0){
        localStorage.grantTopic = posts['grantTopic'].slice(0);
        localStorage.readGrantCount = fillArray(posts['grantCount'].length, 0);
        localStorage.diffGrantCount = posts['grantCount'].slice(0);
    } else {
      num_new = (posts['grantCount'].length - ((localStorage.readGrantCount.length+1)/2));
      if(num_new > 0){
        localStorage.grantTopic = posts['grantTopic'].slice(0);
        localStorage.readGrantCount = pushN(localStorage.readGrantCount, num_new);
      } else {
        localStorage.diffGrantCount = subtractArrays(localStorage.readGrantCount, posts['grantCount']);
      }
    }
    total += addArray(localStorage.diffGrantCount);
  }
  if(isOnTeam("ip") && posts['ipTopic']) {
    if(localStorage.ipTopic.length == 0){
        localStorage.ipTopic = posts['ipTopic'].slice(0);
        localStorage.readIpCount = fillArray(posts['ipCount'].length, 0);
        localStorage.diffIpCount = posts['ipCount'].slice(0);
    } else {
      num_new = (posts['ipCount'].length - ((localStorage.readIpCount.length+1)/2));
      if(num_new > 0){
        localStorage.ipTopic = posts['ipTopic'].slice(0);
        localStorage.readIpCount = pushN(localStorage.readIpCount, num_new);
      }
      localStorage.diffIpCount = subtractArrays(localStorage.readIpCount, posts['ipCount']);
    }
    total += addArray(localStorage.diffIpCount);
  }
  if(isOnTeam("lossy") && posts['lossyTopic']) {
    if(localStorage.lossyTopic.length == 0){
        localStorage.lossyTopic = posts['lossyTopic'].slice(0);
        localStorage.readLossyCount = fillArray(posts['lossyCount'].length, 0);
        localStorage.diffLossyCount = posts['lossyCount'].slice(0);
    } else {
      num_new = (posts['lossyCount'].length - ((localStorage.readLossyCount.length+1)/2));
      if(num_new > 0){
        localStorage.lossyTopic = posts['lossyTopic'].slice(0);
        localStorage.readLossyCount = pushN(localStorage.readLossyCount, num_new);
      }
      localStorage.diffLossyCount = subtractArrays(localStorage.readLossyCount, posts['lossyCount']);
    }
    total += addArray(localStorage.diffLossyCount);
  }

  if(isOnTeam("rectenna") && posts['rectennaTopic']) {
    if(localStorage.rectennaTopic.length == 0){
        localStorage.rectennaTopic = posts['rectennaTopic'].slice(0);
        localStorage.readRectennaCount = fillArray(posts['rectennaCount'].length, 0);
        localStorage.diffRectennaCount = posts['rectennaCount'].slice(0);
    } else {
      num_new = (posts['rectennaCount'].length - ((localStorage.readRectennaCount.length+1)/2));
      if(num_new > 0){
        localStorage.rectennaTopic = posts['rectennaTopic'].slice(0);
        localStorage.readRectennaCount = pushN(localStorage.readRectennaCount, num_new);
      }
      localStorage.diffRectennaCount = subtractArrays(localStorage.readRectennaCount, posts['rectennaCount']);
    }
    total += addArray(localStorage.diffRectennaCount);
  }
  if(isOnTeam("modeling") && posts['modelingTopic']) {
    if(localStorage.modelingTopic.length == 0){
        localStorage.modelingTopic = posts['modelingTopic'].slice(0);
        localStorage.readModelingCount = fillArray(posts['modelingCount'].length, 0);
        localStorage.diffModelingCount = posts['modelingCount'].slice(0);
    } else {
      num_new = (posts['modelingCount'].length - ((localStorage.readModelingCount.length+1)/2));
      if(num_new > 0){
        localStorage.modelingTopic = posts['modelingTopic'].slice(0);
        localStorage.readModelingCount = pushN(localStorage.readModelingCount, num_new);
      } 
      localStorage.diffModelingCount = subtractArrays(localStorage.readModelingCount, posts['modelingCount']); 
    }
    total += addArray(localStorage.diffModelingCount);
  }
  return total;
}

function updateIcon(numTotal){
  localStorage.currentTotal = numTotal;
  if(numTotal > 0){
    chrome.browserAction.setIcon({path:"honors_unread.png"});
    chrome.browserAction.setBadgeText({text:(numTotal.toString())});
  } else {
    chrome.browserAction.setIcon({path:"honors_read.png"});
    chrome.browserAction.setBadgeText({text:""});
  }
}

function parseMultipart(buf) {
  var body = String.fromCharCode.apply(null, new Uint8Array(buf));
  var msg = body.match(/(?:name=\"Post\"\s*)([^\-]*)/)[1];
  var forum = body.match(/(?:name=\"f\"\s*)([^\-]*)/)[1];
  var topic = body.match(/(?:name=\"t\"\s*)([^\-]*)/)[1];
  return {
    'forum_num' : forum.substring(0,forum.length-1),
    'topic_num' : topic.substring(0,topic.length-1),
    'message' : msg.substring(0,msg.length-1)
  };
}

function parseFormData(form){
  return {
    'forum_num' : form.f[0],
    'topic_num' : form.t[0],
    'message' : form.Post[0]
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
  var forumURL = "http://z4.invisionfree.com/japes/index.php?showforum=";
  if(req.requestBody && req.requestBody.raw){
    interception = parseMultipart(req.requestBody.raw[0].bytes);
    newPost(interception);
    //makeNotification(interception);
  }
  if(req.requestBody && req.requestBody.formData){
    interception = parseFormData(req.requestBody.formData);
    newPost(interception);
    //makeNotification(interception);
  } 
  var post_viewed = req.url.match(/(?:showtopic=)(\d+)/);
  if(post_viewed){
    topic_num = post_viewed[1];
    just_read = findAndUpdateReadCount(topic_num);
    updateIcon((parseInt(localStorage.currentTotal) - just_read));
  }
}

function strToArr(str){
  return JSON.parse("[" + str + "]");
}

function readMyOwnPost(topic_num){
  var x, y;
  x = strToArr(localStorage.antennaTopic);  
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readAntennaCount); 
    new_arr[y] += 1
    localStorage.readAntennaCount = new_arr;
  }
  x = strToArr(localStorage.generalTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readGeneralCount); 
    new_arr[y] += 1
    localStorage.readGeneralCount = new_arr;
  }
  x = strToArr(localStorage.grantTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readGrantCount); 
    new_arr[y] += 1
    localStorage.readGrantCount = new_arr;
  }
  x = strToArr(localStorage.ipTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readIpCount); 
    new_arr[y] += 1
    localStorage.readIpCount = new_arr;
  }
  x = strToArr(localStorage.lossyTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readLossyCount); 
    new_arr[y] += 1
    localStorage.readLossyCount = new_arr;
  }
  x = strToArr(localStorage.rectennaTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readRectennaCount); 
    new_arr[y] += 1
    localStorage.readRectennaCount = new_arr;
  }
  x = strToArr(localStorage.modelingTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readModelingCount); 
    new_arr[y] += 1
    localStorage.readModelingCount = new_arr;
  }
}
function findAndUpdateReadCount(topic_num){
  var x, y;
  x = strToArr(localStorage.antennaTopic);  
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readAntennaCount); 
    just_read = strToArr(localStorage.diffAntennaCount)[y];
    if(just_read > new_arr[y]){
      new_arr[y] = just_read
      localStorage.readAntennaCount = new_arr;
      return new_arr[y];
    }
  }
  x = strToArr(localStorage.generalTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readGeneralCount); 
    just_read = strToArr(localStorage.diffGeneralCount)[y];
    if(just_read > new_arr[y]){
      new_arr[y] = just_read
      localStorage.readGeneralCount = new_arr;
      return new_arr[y];
    }
  }
  x = strToArr(localStorage.grantTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readGrantCount); 
    just_read = strToArr(localStorage.diffGrantCount)[y];
    if(just_read > new_arr[y]){
      new_arr[y] = just_read
      localStorage.readGrantCount = new_arr;
      return new_arr[y];
    }
  }
  x = strToArr(localStorage.ipTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readIpCount); 
    just_read = strToArr(localStorage.diffIpCount)[y];
    if(just_read > new_arr[y]){
      new_arr[y] = just_read
      localStorage.readIpCount = new_arr;
      return new_arr[y];
    }
  }
  x = strToArr(localStorage.lossyTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readLossyCount); 
    just_read = strToArr(localStorage.diffLossyCount)[y];
    if(just_read > new_arr[y]){
      new_arr[y] = just_read
      localStorage.readLossyCount = new_arr;
      return new_arr[y];
    }
  }
  x = strToArr(localStorage.rectennaTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readRectennaCount); 
    just_read = strToArr(localStorage.diffRectennaCount)[y];
    if(just_read > new_arr[y]){
      new_arr[y] = just_read
      localStorage.readRectennaCount = new_arr;
      return new_arr[y];
    }
  }
  x = strToArr(localStorage.modelingTopic);
  y = x.indexOf(parseInt(topic_num));
  if(y != -1){
    new_arr = strToArr(localStorage.readModelingCount); 
    just_read = strToArr(localStorage.diffModelingCount)[y];
    if(just_read > new_arr[y]){
      new_arr[y] = just_read
      localStorage.readModelingCount = new_arr;
      return new_arr[y];
    }
  }
  return 0;
}

// function makeNotification(interception){
//   if(localStorage.notifications === "true"){
//     if(localStorage.sound === "true"){
//       var notification = webkitNotifications.createHTMLNotification('notification_sound.html');
//       notification.show();
//     }
//     var notification = webkitNotifications.createHTMLNotification('notification_nosound.html');
//     notification.show();
//   }
// }