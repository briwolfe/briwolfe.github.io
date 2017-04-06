var places = [
    [7, 5, "placeA"],
    [0, 9, "placeB"],
    [3, 7, "placeC"],
    [4, 6, "placeD"],
    [1, 2, "placeE"],
    [1, 1, "placeF"]];
var teamNameArray = ["placeA", "placeB", "placeC", "placeD", "placeE", "placeF"];
var teamDistanceMatrix = [[]];
var numberOfDivisions = 2;
var teamsPerDivision = Math.ceil(places.length / numberOfDivisions);
var divisions;
var optimalDistance = 1000;
var optimalDivisions;

function makeDivisions(previousDivisions, remainingTeams) {
    if (remainingTeams.length === 0) {
        return getTotalDistance(previousDivisions);
    }
    var divisions = previousDivisions;
    if (divisions === undefined) divisions = [];
    for (var i = 0; i < numberOfDivisions; i++) {
        if (divisions.length <= i) divisions[i] = [];
        if (divisions[i].length >= teamsPerDivision) continue;
        var removedTeam = remainingTeams.splice(0, 1)[0];
        divisions[i][divisions[i].length] = removedTeam;
        var distance = makeDivisions(divisions.slice(0), remainingTeams);
        if (distance < optimalDistance) {
            optimalDistance = distance;
            optimalDivisions = JSON.parse(JSON.stringify(divisions));
        }
        divisions[i].splice(divisions[i].length - 1, 1);
        remainingTeams.splice(0, 0, removedTeam);
        if (divisions[i].length == 0) break;
    }

    return optimalDistance;
}

//#region distance calcs
function getTotalDistance(allDivisions) {
    if (allDivisions === undefined) return NaN;
    if (allDivisions.length === 0) return NaN;
    var totalDistance = 0;
    for (var i = 0; i < allDivisions.length; i++) {
        var thisDivision = allDivisions[i];
        var thisDivisionDistance = 0;
        if (thisDivision === undefined) continue;
        for (var j = 0; j < thisDivision.length; j++) {
            for (var k = j + 1; k < thisDivision.length; k++) {
                //thisDivisionDistance += getDistance(thisDivision[j], thisDivision[k]);
                thisDivisionDistance += teamDistanceMatrix[thisDivision[j][2]][thisDivision[k][2]];
            }
        }
        totalDistance += thisDivisionDistance / thisDivision.length; // produce an "average" of sorts
    }
    return totalDistance;
}

function getDistance(firstPlace, secondPlace) {
    return Math.sqrt(Math.pow((secondPlace[1] - firstPlace[1]), 2) + Math.pow((secondPlace[0] - firstPlace[0]), 2));
}
//#endregion

//#region calculate using inputs
function updateResults() {
    getNumOfDivisions();
    getTeamsFromTable();
    getOptimalDivisions();
}

function getNumOfDivisions() {
    var divisionsInput = document.getElementById("divisionInput");
    numberOfDivisions = divisionsInput.value;
}

function getTeamsFromTable() {
    places = [];
    teamNameArray = [];
    teamDistanceMatrix = [[]];

    var tableElement = document.getElementById("teamTable");
    var tbodyElement = tableElement.children[0];
    var tableRows = tbodyElement.children;
    var skips = 0;
    for (var i = 0; i < tableRows.length; i++) {
        var thisRow = tableRows[i];
        if (thisRow.children[0].tagName == "TH") {
            skips++;
            continue;
        }
        var placeName = thisRow.children[0].children[0].value;
        var xCoord = thisRow.children[1].children[0].value;
        var yCoord = thisRow.children[2].children[0].value;
        var teamToMake = [xCoord, yCoord, i - skips];
        places.push(teamToMake);
        teamNameArray.push(placeName);
    }
    var placesLength = places.length;
    teamDistanceMatrix = new Array(placesLength);
    for (var i = 0; i < placesLength; i++) {
        teamDistanceMatrix[i] = new Array(placesLength);
        teamDistanceMatrix[i][i] = 0;
        for (var j = 0; j < i; j++) {
            teamDistanceMatrix[i][j] = getDistance(places[i], places[j]);
            teamDistanceMatrix[j][i] = teamDistanceMatrix[i][j];
        }
    }
}

function getOptimalDivisions() {
    teamsPerDivision = Math.ceil(places.length / numberOfDivisions);
    optimalDivisions = [];
    optimalDistance = 1000;
    optimalDistance = makeDivisions(optimalDivisions, places);
}
//#endregion

//#region update ui
function updateGUI() {
    updateTable();
    updateDistance();
    updateMap();
}

function updateTable() {
    var divisionSet = optimalDivisions;
    var theTable = document.getElementById("divisionTable");
    var s = "";
    for (var i = 0; i < divisionSet.length; i++) {
        s += "<tr>"
        for (var j = 0; j < divisionSet[i].length; j++) {
            s += "<td>" + teamNameArray[divisionSet[i][j][2]] + "</td>";
        }
        s += "</tr>";
    }
    theTable.innerHTML = s;

}

function updateDistance() {
    var theDistanceResult = document.getElementById("distanceResult");
    theDistanceResult.innerHTML = optimalDistance;
}

function updateMap() {
    var minX = 1000000;
    var maxX = -1000000;
    var minY = 1000000;
    var maxY = -1000000;

    var divisionSet = optimalDivisions;
    var theTable = document.getElementById("divisionTable");
    var colors = ["F00", "0F0", "00F", "FF0", "F0F", "0FF"];
    for (var i = 0; i < divisionSet.length; i++) {
        var thisColor = colors[i % colors.length];
        for (var j = 0; j < divisionSet[i].length; j++) {
            if (parseInt(minX) > parseInt(divisionSet[i][j][0])) minX = divisionSet[i][j][0];
            if (parseInt(maxX) < parseInt(divisionSet[i][j][0])) maxX = divisionSet[i][j][0];
            if (parseInt(minY) > parseInt(divisionSet[i][j][1])) minY = divisionSet[i][j][1];
            if (parseInt(maxY) < parseInt(divisionSet[i][j][1])) maxY = divisionSet[i][j][1];
        }
    }
    var svgHeight = 100;
    var svgScale = svgHeight / (parseInt(maxY) - parseInt(minY));
    var svgWidth = svgScale * (parseInt(maxX) - parseInt(minX));
    var radius = 1.5;
    var s = "<svg " + "width=\"" + (svgWidth + 2 * radius) + "\" height=\"" + (svgHeight + 2 * radius) + "\" ><g>";

    for (var i = 0; i < divisionSet.length; i++) {
        var thisColor = colors[i % colors.length];
        for (var j = 0; j < divisionSet[i].length; j++) {
            s += "<circle fill=\"#" + thisColor + "\" r=\"" + radius + "\" cx=\"" + (svgWidth - svgScale * (divisionSet[i][j][0] - minX) + radius) + "\" cy=\"" + (svgHeight - svgScale * (divisionSet[i][j][1] - minY) + radius) + "\"/>";
        }
    }
    var teamMap = document.getElementById("teamMap");
    teamMap.innerHTML = s;
}
//#endregion

function importTeams(textToImport) {
    var placeArray = textToImport.split('\n');
    if (placeArray.length < 0) return;
    for (var i = 0; i < placeArray.length; i++) {
        var thisPlace = placeArray[i];
        var thisPlaceSplit = thisPlace.split(',');
        if (thisPlaceSplit.length == 3) {
            var thisLocation = thisPlaceSplit[0];
            var thisXCoord = thisPlaceSplit[1];
            var thisYCoord = thisPlaceSplit[2];
            addTeam(thisLocation, thisXCoord, thisYCoord);
        }
    }

}

function addTeam(place, xCoord, yCoord) {
    var newRow = document.createElement("tr");
    newRow.innerHTML = "<td><input value=\"" + place + "\"></td><td><input value=\"" + xCoord + "\" /></td><td><input value=\"" + yCoord + "\" /></td><td><button onclick=\"event_removeTeam(this)\">Remove!</button></td>";
    var theTable = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
    theTable.appendChild(newRow);
}

//#region events
function event_addTeam() {
    addTeam("NewPlace", 5, 7);
}

function event_removeTeam(theButton) {
    theButton.parentElement.parentElement.remove();

}

function event_updateAll() {
    updateResults();
    updateGUI();
}

function event_importTeams(theButton) {
    var input = document.getElementById("importTeamsInput");
    var textualInput = input.value;
    importTeams(textualInput);
}
//#endregion