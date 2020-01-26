function updateResults() {
    var curZipCode = document.getElementById("zipCodeInput").value;

}

function getZillowForSaleFromZip(zipCode) {

}

function addHome(address, zestimate, rentZestimate, ratio, link) {
    var newRow = document.createElement("tr");
    newRow.innerHTML = "<td>" + address + "</td><td>" + zestimate + "</td><td>" + rentZestimate + "</td><td>" + ratio + "</td><td><a target=\"_blank\" href=\"" + link + "\"/>Link</td>";
    var theTable = document.getElementById("homeTable").getElementsByTagName("tbody")[0];
    theTable.appendChild(newRow);
}

function event_updateAll() {
    updateResults();
}