var zwsid = "X1-ZWz17fbty5omiz_4kciw";

function processLocationResponse(data) {
    theResponse = JSON.parse(data.contents);
    searchResults = theResponse.searchResults.mapResults;
    totalResults = 0;
    skippedResults = 0;
    searchResults.forEach(function (eachResult) {
        totalResults++;
        homeLink = "https://www.zillow.com" + eachResult.detailUrl;
        hdpData = eachResult.hdpData;
        if (hdpData != undefined) {
            homeData = hdpData.homeInfo;
            homeAddress = homeData.streetAddress + " " + homeData.city;
            salePrice = homeData.priceForHDP;
            zestimate = homeData.zestimate;
            rentalZestimate = homeData.rentZestimate;
            ratio = "";
            if (rentalZestimate != "" && zestimate != "") {
                ratio = zestimate / rentalZestimate;
            }
            homeType = homeData.homeType;
            addHome(homeAddress, homeType, salePrice, zestimate, rentalZestimate, ratio, homeLink);
        } else {
            skippedResults++;
            //alert("here");
        }
    });
    alert("Processed " + totalResults + " results, of which " + skippedResults + " were skipped for lack of data.");
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
    var latSpread = .1;
    var longSpread = .1;
    var zillowRequestString = 'https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=%7B%22pagination%22%3A%7B%7D%2C%22mapBounds%22%3A%7B%22west%22%3A' + (longBase - longSpread) + '%2C%22east%22%3A' + (longBase + longSpread) + '%2C%22south%22%3A' + (latBase - latSpread) + '%2C%22north%22%3A' +  + (latBase + latSpread) + '%7D%2C%22isMapVisible%22%3Atrue%2C%22mapZoom%22%3A13%2C%22filterState%22%3A%7B%7D%2C%22isListVisible%22%3Atrue%7D';
    $.getJSON('https://api.allorigins.win/get?url=' + zillowRequestString, processLocationResponse);
    //var reqString = "https://crossorigin.me/https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=%7B%22pagination%22%3A%7B%7D%2C%22mapBounds%22%3A%7B%22west%22%3A-92.30739531103518%2C%22east%22%3A-91.90570768896487%2C%22south%22%3A37.78805572937743%2C%22north%22%3A37.86479996996949%7D%2C%22isMapVisible%22%3Atrue%2C%22mapZoom%22%3A12%2C%22filterState%22%3A%7B%22sortSelection%22%3A%7B%22value%22%3A%22globalrelevanceex%22%7D%7D%2C%22isListVisible%22%3Atrue%7D"
    //doAjaxCall(reqString, processLocationResponse);
}

function getZillowForSaleFromZip(zipCode) {

}

function processZillowHomeDetails(address, citystatezip) {
    reqUrl = "https://www.zillow.com/webservice/GetSearchResults.htm?zws-id=X1-ZWz17fbty5omiz_4kciw&address=" + address + "&citystatezip=" + citystatezip + "&rentzestimate=true"

}

function addHome(address, homeType, salePrice, zestimate, rentZestimate, ratio, link) {
    var newRow = document.createElement("tr");
    newRow.innerHTML = "<td>" + address + "</td><td>" + homeType + "</td><td>" + salePrice + "</td><td>" + zestimate + "</td><td>" + rentZestimate + "</td><td>" + ratio + "</td><td><a target=\"_blank\" href=\"" + link + "\"/>Link</td>";
    var theTable = document.getElementById("homeTable").getElementsByTagName("tbody")[0];
    theTable.appendChild(newRow);
}

function event_updateAll() {
    updateResults();
}

var doAjaxCall = function (url, callback) {
    $.ajax({
        type: "GET",
        dataType: "jsonp",
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
            //setErrorMessage(msg);
        },
    }).done(function (data) { callback(data) })
    //ajaxCallsOutstanding++;
}