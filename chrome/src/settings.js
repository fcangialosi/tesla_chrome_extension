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
        team = "",
        notify = false,
        grantTeam = false,
        ipTeam = false;

    // Only one of these possible
    if(rectenna)
        team = "Rectenna Team";
    else if(antenna)
   		team = "Antenna Team";
    else if(modeling)
    	team = "Modeling Team";
    else if(lossy)
    	team = "Lossy Events Team";
    
    // Any of these possible
    if(grant)
        grantTeam = true;
    if(ip)
        ipTeam = true;
    if(notifications)
    	notify = true;

    // Once we've recieved confirmation that the request succeded, 
    // display success, wait a bit, then close the window
	chrome.runtime.sendMessage({"team":team,"notifications":notify,"grantTeam":grantTeam,"ipTeam":ipTeam}, function(response){
        save.textContent = "Success! :)";
        save.setAttribute('class','btn btn-success btn-lg');
        setTimeout(function(){window.close()}, 2500);
    });
}
