/* Click listener for the Save Button
 *
 * Sends message to extension about settings, then closes the popup
 */
var save = document.getElementById('saveButton');
save.onclick = function(){
	var rectenna = document.getElementById('rectenna').checked,
        antenna = document.getElementById('antenna').checked,
        modeling = document.getElementById('modeling').checked,
        lossy = document.getElementById('lossy').checked,
        grant = document.getElementById('grant').checked,
        ip = document.getElementById('ip').checked,
        notifications = document.getElementById('notifications').checked,
        playSounds = document.getElementById('sound').checked,
        teams = [],
        notify = false,
        sound = false;

    // Only one of these possible
    if(rectenna)
        teams.push("rectenna");
    else if(antenna)
   		teams.push("antenna");
    else if(modeling)
    	teams.push("modeling");
    else if(lossy)
    	teams.push("lossy");
 
    // Any of these possible
    if(grant)
        teams.push("grant");
    if(ip)
        teams.push("ip");
    if(notifications)
    	notify = true;
    if(playSounds)
        sound = true;

    // Once we've recieved confirmation that the request succeded, 
    // display success, wait a bit, then close the window
	chrome.runtime.sendMessage({"teams" : teams, "notifications" : notify, "sound" : sound}, function(response){
        save.textContent = "Success! :)";
        save.setAttribute('class','btn btn-success btn-lg');
        setTimeout(function(){window.close()}, 2500);
    });
}
