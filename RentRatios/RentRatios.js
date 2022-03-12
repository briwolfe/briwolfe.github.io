var scalar = 1;
var tf = new TableFilter(document.querySelector('#homeTable'), {
    base_path: 'tablefilter/',
    rows_counter: true,
    alternate_rows: true
});
var zipCodeArray;

function processLocationResponse(data) {
    robotsResponseLeft = '<html><head><meta name=\"robots\"';
    if (data.contents.startsWith(robotsResponseLeft)) {
        alert("Zillow thinks you're a robot (they're kind of right). A new tab will open with a lot of text. Copy all of the text back into the text box that will pop up here.")
        window.open(data.status.url, '_blank');
        tabText = prompt("Please paste text from new tab", "");
        processLocation(tabText);
    } else {
        processLocation(data.contents);
    }
}

function tryMakeMap(lat, long) {
    var mapZoom = 12 + Math.log2(scalar);
    var latBase = parseFloat(document.getElementById("latitudeInput").value);
    var longBase = parseFloat(document.getElementById("longitudeInput").value);

    mapUrl = "https://tyler-demo.herokuapp.com/?greyscale=False&lat=" + latBase + "&lon=" + longBase + "&zoom=" + mapZoom + "&width=800&height=800";
    document.getElementById("mapImg").src=mapUrl;
}

function updateMarkers() {
    var dotContainer = document.getElementById("dotContainer")
    var tbodyObject = document.getElementById("homeTable").getElementsByTagName("tbody")[0]

    var latBase = parseFloat(document.getElementById("latitudeInput").value);
    var longBase = parseFloat(document.getElementById("longitudeInput").value);
    mapLatScalar = .222276/.2; //the map uses a zoom level, doesn't correspond to the zillow rectangle, so adjust - not right everywhere
    mapLongScalar = .273202/.2;
    var latSpread = .1/scalar * mapLatScalar;
    var longSpread = .1/scalar * mapLongScalar;

    mapLatMax = latBase + latSpread;
    mapLatMin = latBase - latSpread;
    mapLongMax = longBase + longSpread;
    mapLongMin = longBase - longSpread;
    dotContainerInnerHtml = ""
    Array.from(tbodyObject.children).forEach(function (eachRow) {
        if(eachRow.style.display != "none") {
            topPercent = 100 - 100*(eachRow.getAttribute("lat") - mapLatMin)/(mapLatMax - mapLatMin) + "%"
            leftPercent = 100*(eachRow.getAttribute("long") - mapLongMin)/(mapLongMax - mapLongMin) + "%"
            dotContainerInnerHtml = dotContainerInnerHtml + "<span class=\"dot\" style=\"top: " + topPercent +";left: "+leftPercent+";\"></span>";
        }
    });
    dotContainer.innerHTML = dotContainerInnerHtml;
}

function processLocation(contents) {
    theResponse = JSON.parse(contents);
    searchResults = theResponse.cat2.searchResults.mapResults.concat(theResponse.cat2.searchResults.listResults);
    totalResults = 0;
    skippedResults = 0;
    if (searchResults.length < 500) {
        tryMakeMap();
        searchResults.forEach(function (eachResult) {
            totalResults++;
            homeLink = "";
            if (eachResult.detailUrl.includes("www.zillow.com")) {
                homeLink = eachResult.detailUrl;
            } else {
                homeLink = "https://www.zillow.com" + eachResult.detailUrl;
            }
            homeAddress = homeLink.split('/')[4].split('-').join(' ');
            homeLat = eachResult.latLong.latitude;
            homeLong = eachResult.latLong.longitude;
            hdpData = eachResult.hdpData;
            if (hdpData != undefined) {
                homeData = hdpData.homeInfo;
                //homeAddress = homeData.streetAddress + " " + homeData.city;
                foreclosure = homeData.homeStatus == "PRE_FORECLOSURE";
                priceReduction = homeData.priceReduction;
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
                addHome(homeAddress, homeLat, homeLong, homeType, foreclosure, priceReduction, salePrice, zestimate, rentalZestimate, saleRatio, rentRatio, homeLink);
            } else {
                skippedResults++;
                //alert("here");
            }
        });
        tf.init();
        alert("Processed " + totalResults + " results, of which " + skippedResults + " were skipped for lack of data.");
        tf.filter();
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
    var zillowRequestString = 'https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=%7B%22pagination%22%3A%7B%7D%2C%22mapBounds%22%3A%7B%22west%22%3A' + (longBase - longSpread) + '%2C%22east%22%3A' + (longBase + longSpread) + '%2C%22south%22%3A' + (latBase - latSpread) + '%2C%22north%22%3A' +  + (latBase + latSpread) + '%7D%2C%22isMapVisible%22%3Atrue%2C%22mapZoom%22%3A13%2C%22filterState%22%3A%7B%7D%2C%22isListVisible%22%3Atrue%7D%26wants={"cat1":["mapResults"],"cat2":["listResults"]}';
    var jsonRequestString = 'https://api.allorigins.win/get?url=' + zillowRequestString;
    $.getJSON(jsonRequestString, processLocationResponse);
}

function addHome(address, homeLat, homeLong, homeType, foreclosure, priceReduction, salePrice, zestimate, rentZestimate, saleRatio, rentRatio, link) {
    var newRow = document.createElement("tr");
    newRow.setAttribute("lat",homeLat);
    newRow.setAttribute("long", homeLong);
    newRow.innerHTML = "<td>" + address + "</td><td>" + homeType + "</td><td>" + foreclosure + "</td><td>" + priceReduction + "</td><td>" + salePrice + "</td><td>" + zestimate + "</td><td>" + rentZestimate + "</td><td>" + saleRatio + "</td><td>" + rentRatio + "</td><td><a target=\"_blank\" href=\"" + link + "\"/>Link</td>";
    var theTable = document.getElementById("homeTable").getElementsByTagName("tbody")[0];
    theTable.appendChild(newRow);
}

function event_updateAll() {
    scalar = 1;
    updateResults();
}

function csvToObjects(csv){

  var lines=csv.split("\n");

  var result = [];

  // NOTE: If your columns contain commas in their values, you'll need
  // to deal with those before doing the next step 
  // (you might convert them to &&& or something, then covert them back later)
  // jsfiddle showing the issue https://jsfiddle.net/
  var headers=lines[0].split(",");

  for(var i=1;i<lines.length;i++){

      var obj = {};
      var currentline=lines[i].split(",");
      result[currentline[0]] = currentline;

      //for(var j=0;j<headers.length;j++){
      //    obj[j] = currentline[j];
      //}

      //result[currentline[0]] = obj;

  }

  return result; //JavaScript object
  //return JSON.stringify(result); //JSON
}

function setLatLongFromZip() {
    var zipVal = prompt("ZIP Code","12345");
    if (zipVal == null || zipVal == "") {
        return;
    } else {
        zipObject = zipCodeArray[zipVal];
        if (zipObject != null) {
            document.getElementById("latitudeInput").value = zipObject[3];
            document.getElementById("longitudeInput").value = zipObject[4];
            alert("Coordinates updated");
        } else {
            alert("ZIP not found");
        }
    }
}

$(document).ready(function() {
    urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("lat")) {
      document.getElementById("latitudeInput").value = urlParams.get("lat");
    }
    if (urlParams.has("long")) {
      document.getElementById("longitudeInput").value = urlParams.get("long");
    }
    if (urlParams.has("hometype")) {
      //tf.init();
      //tf.setFilterValue(1, urlParams.get("hometype"));
    }
    zipCodeArray = csvToObjects(zipCodesCsv);
});