var team;

var clickPirates = function() {
team = "Pirates";
clickButton();
};
var clickPenguins = function() {
team = "Penguins";
clickButton();
};
var clickSteelers = function() {
team = "Steelers";
clickButton();
};

var clickButton = function () {
if (team != undefined) {
var query;
if (team == "Steelers") {
    query = "select href from html where url=\"http://reddit.com/r/nflstreams\" and xpath='//*[@id=\"siteTable\"]/div/div/p/a' and content LIKE '%" + team + "%'";
} else if (team == "Pirates") {
query = "select href from html where url=\"http://reddit.com/r/mlbstreams\" and xpath='//*[@id=\"siteTable\"]/div/div/p/a' and content LIKE '%" + team + "%'";
} else if (team == "Penguins") {
query = "select href from html where url=\"http://reddit.com/r/nhlstreams\" and xpath='//*[@id=\"siteTable\"]/div/div/p/a' and content LIKE '%" + team + "%'";
}
if (query != "") {
useYahoo(query, onGetRedditPage);
}
}
};

var onGetRedditPage = function (returnObj) {
    var linkToPage;
    try {
        var results = returnObj["query"]["results"];
        if (results == undefined) {
            alert(team + " not playing");
            return;
        } else {
            linkToPage = "http://reddit.com" + results["a"]["href"]
            //alert(linkToPage);
        }
    }
    catch (e) {
        alert("error in onGetRedditPage");
        return;
    }
    var query = "select * from html where url=\"" + linkToPage + "\" and xpath='//*[@class=\"entry unvoted\"]'";
    useYahoo(query, onGetStreamSite);
    //alert("got it");
};

var onGetStreamSite = function (returnObj) {
    if (!returnObj || !returnObj["query"] || !returnObj["query"]["results"]) alert("unexpected returnObj");
    var results = returnObj["query"]["results"];
    var highScore = -1;
    var bestResult;
    //danger will robinson: yuck below
    $(results["div"]).each(function (i, e) {
        if (e["form"] == undefined) return;
        if (!e["p"] || !e["p"]["span"]) return;
        $(e["p"]["span"]).each(function (ii, ee) {
            if (ee["class"] == "score unvoted") {
                var numPoints = ee["content"];
                var intVal = parseInt(numPoints, 10);
                if (intVal > highScore) {
                    try {
                        bestResult = e["form"]["div"]["div"]["p"]["a"]["href"];
                        highScore = intVal;

                    }
                    catch (e) {
                        //alert("error in onGetStreamSite"); //or non-simple link
                    }
                }
                return;
            }
        });

    });
    //window.open(bestResult);
    if(bestResult == undefined) {
        alert("can't find link");
        return;
    }
    window.location.replace(bestResult);
}

var useYahoo = function (query, callback) {
    var yahoo = "https://query.yahooapis.com/v1/public/yql?q=";
    var postQuery = "format=json&diagnostics=true&callback=";
    var changedQuery = encodeURIComponent(query);
    $.getJSON(yahoo + changedQuery, postQuery, callback);
}