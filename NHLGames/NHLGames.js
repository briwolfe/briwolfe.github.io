// NHL REQUIRED FUNCTIONS
// NHL returns these as functions, so we have to use them, as far as I can tell
// everytime we call an nhl function, we increment ajaxCallsOustanding
// and here, when we get them back, we decrement
// this serves to make sure we're not updating every time we get something back

var loadScoreboard = function(nhlReturnVal)
{
    ajaxCallsOutstanding--;
    parseGames(nhlReturnVal);
    if (ajaxCallsOutstanding == 0)
        printGoodGames();
}
var GCBX = [];
GCBX.load = function (nhlReturnVal) {
    ajaxCallsOutstanding--;
    isCloseGame(nhlReturnVal);
    if (ajaxCallsOutstanding == 0)
        printGoodGames();
}

// END NHL REQUIRED FUNCTIONS


Date.prototype.toDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
});

$(document).ready(function () {
    $('#datePicker').val(new Date().toDateInputValue())
});

var allGames;
var goodGames;
var ajaxCallsOutstanding = 0;

var getGames = function ()
{
    setErrorMessage("");
    $("#goodGamesList").empty();
    ajaxCallsOutstanding = 0;
    goodGames = [];
    //var requestedDay = new Date();
    //var year = requestedDay.getFullYear();
    //var month = requestedDay.getMonth();
    //if (month < 10) month = "0" + (month + 1)
    //else month = month + 1;
    //var date = requestedDay.getDate();
    //var ymd = year + "-" + month + "-" + date;
    var ymd = $('#datePicker').val();
    if (ymd == "")
        setErrorMessage("Please select a valid date.");
    $.ajax({
        type: "POST",
        dataType: "jsonp",
        url: "http:////live.nhle.com//GameData//GCScoreboard//" + ymd + ".jsonp",
        error: function (jqXHR, exception) {
            var msg = '';
            if (jqXHR.status === 200) {
                return;
            } else if (jqXHR.status === 0) {
                msg = 'Not connect.\n Verify Network.';
            } else if (jqXHR.status == 404) {
                msg = 'Unable to complete request. Please check date.';
            } else if (jqXHR.status == 500) {
                msg = 'Internal Server Error [500].';
            }
            setErrorMessage(msg);
        },
    })
    ajaxCallsOutstanding++;
    
}

// REQUIRED!!! nhl returns this as function, so we use it
var parseGames = function(nhlReturnVal)
{
    allGames = nhlReturnVal;
    if (allGames == undefined || allGames.games == undefined)
    {
        setErrorMessage("Unable to parse result.");
    }
    else if (allGames.games.length == 0)
    {
        setErrorMessage("No games scheduled on selected date.")
    }
    else
    {
        findGoodGames(allGames.games);
    }
}

var findGoodGames = function(theGames)
{
    goodGames = [];
    var noneFinished = true;
    theGames.forEach(function (eachGame) {
        if (isAGoodGame(eachGame))
            goodGames.push(eachGame);
        if (eachGame.bs.substr(0,5) == "FINAL")
            noneFinished = false;
    });

    if (noneFinished)
    {
        setErrorMessage("No games completed on selected date.");
    }
}

var isAGoodGame = function(hockeyGame)
{
    if (isOvertimeGame(hockeyGame))
        return true;
    else 
        getGameData(hockeyGame);
    return false;
}

var isOvertimeGame = function(hockeyGame)
{
    if (hockeyGame.bs == "FINAL OT" || hockeyGame.bs == "FINAL SO")
        return true;
    else
        return false;

}

var getGameData = function (hockeyGame)
{
    if (hockeyGame.bs.substr(0, 5) != "FINAL")
        // only want completed games, would be enhancement for live games
        return;

    var gameID = hockeyGame.id;
    var seasonStart = hockeyGame.id.toString().substr(0,4);
    var seasonEnd = parseInt(seasonStart, 10) + 1;
    var season = seasonStart + "" + seasonEnd;
    var gameURL = "http:////live.nhle.com//GameData//" + season + "//" + gameID + "//gc//gcbx.jsonp";

    $.ajax({
        type: "POST",
        dataType: "jsonp",
        url: gameURL,
        error: function (jqXHR, exception) {
            var msg = '';
            if (jqXHR.status === 200) {
                return;
            } else if (jqXHR.status === 0) {
                msg = 'Not connect.\n Verify Network.';
            } else if (jqXHR.status == 404) {
                msg = 'Unable to complete request. Please check date.';
            } else if (jqXHR.status == 500) {
                msg = 'Internal Server Error [500].';
            }
            setErrorMessage(msg);
        },
    })
    ajaxCallsOutstanding++;

}

// a game is defined as close (really more like good ending) if tied within the last five minutes or 1 goal lead within the last two minutes
var isCloseGame = function (gameDetails) {
    var closeGame = false;
    var goalSum = gameDetails.goalSummary;
    var scores = {};
    var lead = 0;
    goalSum.forEach(function (period) {
        var periodGoals = period.goals;
        if (periodGoals == undefined) return;
        periodGoals.forEach(function (goal) {
            if (closeGame) return; // already close, don't care anymore

            var prevLead = lead;
            if ((scores[goal.t1]) == undefined)
                scores[goal.t1] = 0;
            if ((scores[goal.t2]) == undefined)
                scores[goal.t2] = 0;
            scores[goal.t1]++;
            lead = Math.abs(scores[goal.t1] - scores[goal.t2]);
            if (goal.p != 3) return;

            
            // only here if 3rd period
            var timeIntoPeriod = goal.sip;
            var totalTimeInPeriod = 20 * 60;
            var timeRemaining = totalTimeInPeriod - timeIntoPeriod;
            if (timeRemaining < 5 * 60) // less than 5 minutes left in 3rd
            {
                // check for tie game
                if (prevLead == 0 || lead == 0)
                {
                    closeGame = true;
                    return;
                }
                if (timeRemaining < 2 * 60) // less than 2 minutes left in 3rd
                {
                    // check for 1 goal lead
                    if (prevLead == 1 || lead == 1)
                    {
                        closeGame = true;
                        return;
                    }
                }
            }

        });
    });
    if (lead == 1) // don't worry about lead == 0, that's taken care of in the OT/SO check
        closeGame = true;

    // now find it in allGames if it's close
    // would be nicer if the gameDetails had team names, but oh well
    var desiredGame;
    if (closeGame)
    {
        allGames.games.forEach(function (eachGame) {
            if (eachGame.id == gameDetails.gid)
                desiredGame = eachGame;
        });
    }
    if (desiredGame != undefined)
        goodGames.push(desiredGame);

}

var printGoodGames = function()
{
    
    if (goodGames.length == 0 && $("#errorMessage").text() == "")
    {
        setErrorMessage("No good games on selected date.");
    }

    // shuffle it, because I don't want to know that the first ones are overtime and the last ones are close but no OT
    shuffle(goodGames);

    var uiList = $("#goodGamesList");
    goodGames.forEach(function (goodGame) {
        var newDiv = "<div>" + goodGame.atcommon + " @ " + goodGame.htcommon + "<//div>";
        uiList.append(newDiv);
    })
}

var setErrorMessage = function(errMessage)
{
    $("#errorMessage").text(errMessage);
}

var shuffle = function (array)
{
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


/*
KNOWN ISSUES:

Submitted 2016-02-13
Games in 2011-2012 season returns two jsonp values, one of which is good (the first one), the second of which is empty. 
This means we set the goodGames correctly and also set an error message.

Submitted 2016-02-13
Dates during lockout (approx. summer 2012 - january 2013) return 404


*/