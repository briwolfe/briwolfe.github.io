nhlApiUrl = "https://statsapi.web.nhl.com"


// everytime we call a function, we increment ajaxCallsOustanding
// and here, when we get them back, we decrement
// this serves to make sure we're not updating every time we get something back

var loadScoreboard = function(nhlReturnVal)
{
    ajaxCallsOutstanding--;
    parseGames(nhlReturnVal);
    if (ajaxCallsOutstanding == 0)
        printGoodGames();
}

var loadGame = function (nhlReturnVal) {
    ajaxCallsOutstanding--;
    isCloseGame(nhlReturnVal);
    if (ajaxCallsOutstanding == 0)
        printGoodGames();
}

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
    var ymd = $('#datePicker').val();
    if (ymd == "") {
        setErrorMessage("Please select a valid date.");
        return;
    }
    ajaxURL = nhlApiUrl + "/api/v1/schedule?date=" + ymd;
    doAjaxCall(ajaxURL, loadScoreboard);
    
}

var parseGames = function(nhlReturnVal)
{
    allGames = nhlReturnVal;
    if (allGames == undefined) {
        setErrorMessage("Unable to parse result.");
    }
    else if (allGames.totalGames == 0 ) {
        setErrorMessage("No games scheduled on selected date.")
    }
    else if (allGames.dates == undefined || allGames.dates[0] == undefined || allGames.dates[0].games == undefined) {
        setErrorMessage("Unable to parse result.");
    }
    else if (allGames.dates[0].games.length == 0) {
        setErrorMessage("No games scheduled on selected date.")
    }
    else {
        findGoodGames(allGames.dates[0].games);
    }
}

var findGoodGames = function(theGames)
{
    goodGames = [];
    var noneFinished = true;
    theGames.forEach(function (eachGame) {
        if (isFinal(eachGame))
        {
            noneFinished = false;
            getGameData(eachGame);
        }
    });

    if (noneFinished)
    {
        setErrorMessage("No games completed on selected date.");
    }
}

var isFinal = function(hockeyGame)
{
    if (hockeyGame.status.statusCode == 7)
        return true;
    else
        return false;

}

var getGameData = function (hockeyGame)
{
    if (!isFinal(hockeyGame))
        // only want completed games, would be enhancement for live games
        return;

    var gameURL = nhlApiUrl + hockeyGame.link;
    doAjaxCall(gameURL, loadGame)

}

// a game is defined as close (really more like good ending) if tied within the last five minutes or 1 goal lead within the last two minutes
var isCloseGame = function (gameDetails) {
    var closeGame = false;
    var scoringPlays = gameDetails.liveData.plays.scoringPlays;
    var scores = {};
    var lead = 0;
    var homeScore = 0;
    var awayScore = 0;
    scoringPlays.forEach(function (scoringPlay) {
        var specificPlay = gameDetails.liveData.plays.allPlays[scoringPlay];
        if (specificPlay == undefined) return;
        homeScore = specificPlay.about.goals.home;
        awayScore = specificPlay.about.goals.away;
        if (closeGame) return; // already close, don't care anymore
        var prevLead = lead;

        lead = Math.abs(homeScore - awayScore);

        if (specificPlay.about.period < 3) return; // only care about 3rd period specifics, otherwise the one-goal check works
            
        // only here if 3rd period
        var timeRemainingArray = specificPlay.about.periodTimeRemaining.split(":");
        var timeRemaining = 60 * parseInt(timeRemainingArray[0]) + parseInt(timeRemainingArray[1]);
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
    if (lead == 1 || lead == 0)
        closeGame = true;

    // now find it in allGames if it's close
    // would be nicer if the gameDetails had team names, but oh well
    var desiredGame;
    if (closeGame)
    {
        var simpleGameInfo = {
            home: gameDetails.gameData.teams.home.shortName,
            away: gameDetails.gameData.teams.away.shortName,
            homeScore: homeScore,
            awayScore: awayScore,
        }
        goodGames.push(simpleGameInfo);
    }

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
        var newDiv = "<div>" + goodGame.away + " @ " + goodGame.home + "<//div>";
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

var doAjaxCall = function (url, callback) {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: url,
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
    }).done(function (data) { callback(data) })
    ajaxCallsOutstanding++;
}