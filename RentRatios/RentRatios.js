var scalar = 1;
function processLocationResponse(data) {
    theResponse = JSON.parse(data.contents);
    searchResults = theResponse.searchResults.mapResults;
    totalResults = 0;
    skippedResults = 0;
    if (searchResults.length < 500) {
    searchResults.forEach(function (eachResult) {
        totalResults++;
        homeLink = "https://www.zillow.com" + eachResult.detailUrl;
        hdpData = eachResult.hdpData;
        if (hdpData != undefined) {
            homeData = hdpData.homeInfo;
            homeAddress = homeData.streetAddress + " " + homeData.city;
            foreclosure = homeData.isPreforeclosureAuction;
            salePrice = homeData.priceForHDP;
            zestimate = homeData.zestimate;
            rentalZestimate = homeData.rentZestimate;
            saleRatio = "";
            if (zestimate != "" && salePrice != "") {
                saleRatio = Math.round(salePrice / zestimate * 100) / 100;
            }
            rentRatio = "";
            if (rentalZestimate != "" && salePrice != "") {
                rentRatio = Math.round(salePrice / rentalZestimate);
            }
            homeType = homeData.homeType;
            addHome(homeAddress, homeType, foreclosure, salePrice, zestimate, rentalZestimate, saleRatio, rentRatio, homeLink);
        } else {
            skippedResults++;
            //alert("here");
        }
    });
    alert("Processed " + totalResults + " results, of which " + skippedResults + " were skipped for lack of data.");
    }else{
        scalar *= 2;
        updateResults();
    }
}

function updateResults() {
    $('#homeTable tbody > tr').remove();
    var latBase = parseFloat(document.getElementById("latitudeInput").value);
    var longBase = parseFloat(document.getElementById("longitudeInput").value);
    if (latBase == "NaN" || longBase == "NaN") {
        alert("Please check lat and long values");
        return;
    }
    //var latBase = 37.843075;
    //var longBase = -92.15365;
    var latSpread = .1/scalar;
    var longSpread = .1/scalar;
    var zillowRequestString = 'https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=%7B%22pagination%22%3A%7B%7D%2C%22mapBounds%22%3A%7B%22west%22%3A' + (longBase - longSpread) + '%2C%22east%22%3A' + (longBase + longSpread) + '%2C%22south%22%3A' + (latBase - latSpread) + '%2C%22north%22%3A' +  + (latBase + latSpread) + '%7D%2C%22isMapVisible%22%3Atrue%2C%22mapZoom%22%3A13%2C%22filterState%22%3A%7B%7D%2C%22isListVisible%22%3Atrue%7D';
    $.getJSON('https://api.allorigins.win/get?url=' + zillowRequestString, processLocationResponse);
}

function addHome(address, homeType, foreclosure, salePrice, zestimate, rentZestimate, saleRatio, rentRatio, link) {
    var newRow = document.createElement("tr");
    newRow.innerHTML = "<td>" + address + "</td><td>" + homeType + "</td><td>" + foreclosure + "</td><td>" + salePrice + "</td><td>" + zestimate + "</td><td>" + rentZestimate + "</td><td>" + saleRatio + "</td><td>" + rentRatio + "</td><td><a target=\"_blank\" href=\"" + link + "\"/>Link</td>";
    var theTable = document.getElementById("homeTable").getElementsByTagName("tbody")[0];
    theTable.appendChild(newRow);
}

function event_updateAll() {
    scalar = 1;
    updateResults();
}