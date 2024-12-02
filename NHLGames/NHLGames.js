nhlApiUrl = "https://api-web.nhle.com"

var loadScoreboard = function(nhlReturnVal)
{
    parseGames(nhlReturnVal);
}

var loadGame = function (nhlReturnVal) {
    isCloseGame(nhlReturnVal);
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
    ajaxURL = nhlApiUrl + "/v1/score/" + ymd;
    doAjaxCall(ajaxURL, loadScoreboard);
    
}

var parseGames = function(nhlReturnVal)
{
    allGames = nhlReturnVal;
    if (allGames == undefined || allGames.games == undefined) {
        setErrorMessage("Unable to parse result.");
    }
    else if (allGames.games.length == 0 ) {
        setErrorMessage("No games scheduled on selected date.")
    }
    else {
        findGoodGames(allGames.games);
    }
    printGoodGames();
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
    if (hockeyGame.gameState == "OFF")
        return true;
    else
        return false;

}

var getGameData = function (hockeyGame)
{
    if (!isFinal(hockeyGame))
        // only want completed games, would be enhancement for live games
        return;
    loadGame(hockeyGame);

}

// a game is defined as close (really more like good ending) if tied within the last five minutes or 1 goal lead within the last two minutes
var isCloseGame = function (gameDetails) {
    var closeGame = false;
    var scoringPlays = gameDetails.goals;
    var scores = {};
    var lead = 0;
    var homeScore = 0;
    var awayScore = 0;
    scoringPlays.forEach(function (scoringPlay) {
        var specificPlay = scoringPlay;
        if (specificPlay == undefined) return;
        homeScore = specificPlay.homeScore;
        awayScore = specificPlay.awayScore;
        if (closeGame) return; // already close, don't care anymore
        var prevLead = lead;

        lead = Math.abs(homeScore - awayScore);

        if (specificPlay.period < 3) return; // only care about 3rd period specifics, otherwise the one-goal check works
            
        // only here if 3rd period
        var timeInPeriodArray = specificPlay.timeInPeriod.split(":");
        var timeInPeriod = 60 * parseInt(timeInPeriodArray[0]) + parseInt(timeInPeriodArray[1]);
        if (timeInPeriod > 15 * 60) // less than 5 minutes left in 3rd
        {
            // check for tie game
            if (prevLead == 0 || lead == 0)
            {
                closeGame = true;
                return;
            }
            if (timeInPeriod > 18 * 60) // less than 2 minutes left in 3rd
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
            home: gameDetails.homeTeam.abbrev,
            away: gameDetails.awayTeam.abbrev,
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
    uiList.empty();
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
        url: useCorsProxy(url),
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
}

var useCorsProxy = function(url) {
    return "https://corsproxy.io/?"+ encodeURI(url);
}