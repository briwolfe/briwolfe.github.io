var maxDieValue = 6;
var rolls = [];
var gamestates = [];

setUpRolls = function () {
                var rolls = [];
                for (var i = 1; i <= maxDieValue; i++) {
                    for (var j = i; j <= maxDieValue; j++) {
                        var newRoll = {}
                        newRoll.dieLow = i;
                        newRoll.dieHigh = j;
                        if (j === i) {
                            newRoll.probability = 1.0 / (maxDieValue * maxDieValue);
                        } else {
                            newRoll.probability = 2.0 / (maxDieValue * maxDieValue);
                        }

                        rolls.push(newRoll);
                    }
                }
                return rolls;

            }
setUpGamestates = function () {
                var gamestates = [];
                var maxPowerOfTwo = 1;
                for (var i = 0; i < (2 * maxDieValue); i++) {
                    maxPowerOfTwo = maxPowerOfTwo << 1;
                }
                for (var i = 0; i < maxPowerOfTwo; i++) {
                    var gs = {};
                    gs.flipped = makeGamestateBoolsFromIndex(i);
                    gs.optimalRollToGamestate = [];
                    gs.processed = false;
                    gamestates.push(gs);
                }
                return gamestates;
            }

getGamestateIndex = function (flipped) {
                var curPowerOfTwo = 1;
                var runningSum = 0;
                for (var i = 0; i < flipped.length; i++) {
                    if (flipped[i]) {
                        runningSum = (runningSum + curPowerOfTwo);
                    }
                    curPowerOfTwo = curPowerOfTwo << 1;
                }
                return runningSum;

            }

makeGamestateBoolsFromIndex = function (index) {
                var curPowerOfTwo = 1;
                var runningSum = index;
                var flipped = [];
                var maxBool = 0;
                for (var i = 0; i < 2 * maxDieValue; i++) {

                    flipped.push(false);

                }

                while (curPowerOfTwo <= index) {
                    curPowerOfTwo = curPowerOfTwo << 1;
                    maxBool++;
                }
                curPowerOfTwo = curPowerOfTwo >> 1;
                maxBool--;
                for (var i = maxBool; i >= 0; i--) {

                    if (runningSum >= curPowerOfTwo) {
                        runningSum -= curPowerOfTwo;
                        flipped[i] = true;
                    }
                    curPowerOfTwo = curPowerOfTwo >> 1;

                }
                return flipped;

            }

getGamestateScore = function (flipped) {
                var runningSum = 0;
                for (var i = 0; i < flipped.length; i++) {
                    if (flipped[i]) {
                        runningSum += i + 1;
                    }
                }
                return runningSum;
            }

getOptimalGamestates = function (g) {
                if (g.processed) {
                    return g;
                }
                var averageOptimalPlayScore = 0;
                var origIndex = getGamestateIndex(g.flipped);
                for (var i = 0; i < rolls.length; i++) {
                    var thisRoll = rolls[i];
                    var dieOne = thisRoll.dieHigh;
                    var dieTwo = thisRoll.dieLow;
                    var gamestateFlippedCopy = g.flipped.slice();
                    if (g.flipped[dieOne - 1] || g.flipped[dieTwo - 1] || dieOne === dieTwo) {
                        if (g.flipped[dieOne + dieTwo - 1]) {
                            g.optimalRollToGamestate[i] = g;
                            averageOptimalPlayScore += thisRoll.probability * getGamestateScore(g.flipped);
                        } else {
                            gamestateFlippedCopy[dieOne + dieTwo - 1] = true;
                            g.optimalRollToGamestate[i] = getOptimalGamestates(gamestates[getGamestateIndex(gamestateFlippedCopy)]);
                            averageOptimalPlayScore += thisRoll.probability * g.optimalRollToGamestate[i].averageOptimalPlayOutcome;
                        }
                    } else {
                        if (g.flipped[dieOne + dieTwo - 1]) {
                            gamestateFlippedCopy[dieOne - 1] = true;
                            gamestateFlippedCopy[dieTwo - 1] = true;
                            g.optimalRollToGamestate[i] = getOptimalGamestates(gamestates[getGamestateIndex(gamestateFlippedCopy)]);
                            averageOptimalPlayScore += thisRoll.probability * g.optimalRollToGamestate[i].averageOptimalPlayOutcome;
                        } else {
                            // choices choices
//if (origIndex == 50) {
//dieOne = dieOne;
//}
                            gamestateFlippedCopy[dieOne - 1] = true;
                            gamestateFlippedCopy[dieTwo - 1] = true;
                            var scoreIndividual = getOptimalGamestates(gamestates[getGamestateIndex(gamestateFlippedCopy)]).averageOptimalPlayOutcome;
                            gamestateFlippedCopy[dieOne - 1] = false;
                            gamestateFlippedCopy[dieTwo - 1] = false;
                            gamestateFlippedCopy[dieOne + dieTwo - 1] = true;
                            var scoreSummed = getOptimalGamestates(gamestates[getGamestateIndex(gamestateFlippedCopy)]).averageOptimalPlayOutcome;

                            if (scoreSummed < scoreIndividual) {
                                //flip it back
                                gamestateFlippedCopy[dieOne - 1] = true;
                                gamestateFlippedCopy[dieTwo - 1] = true;
                                gamestateFlippedCopy[dieOne + dieTwo - 1] = false;
                            }
                            g.optimalRollToGamestate[i] = getOptimalGamestates(gamestates[getGamestateIndex(gamestateFlippedCopy)]);
                            averageOptimalPlayScore += thisRoll.probability * g.optimalRollToGamestate[i].averageOptimalPlayOutcome;
                        }
                    }
                }
                g.processed = true;
                g.averageOptimalPlayOutcome = averageOptimalPlayScore;

                return g;
            }

var main = function() {
rolls = setUpRolls();

            gamestates = setUpGamestates();
            getOptimalGamestates(gamestates[0]);

var flippablesDiv = $("#flippables");
flippablesDiv.empty();
for (var i = 0; i < 2 * maxDieValue; i++) {
var newDiv = "<button" + " class=\"flippable\" " + " onClick=\"flipButtonColor(this)\" " + ">" + (i + 1).toString() + "<//button>";
flippablesDiv.append(newDiv)
}
}


var flipButtonColor = function(inObj) {
if ($(inObj).hasClass('flipped')) {
$(inObj).removeClass('flipped');
} else {
$(inObj).addClass('flipped');
}
}

var rollDice = function()
{
var randRollOne = Math.floor(1 + Math.random() * maxDieValue);
var randRollTwo = Math.floor(1 + Math.random() * maxDieValue);
var diceHigh = (randRollOne > randRollTwo ? randRollOne : randRollTwo);
var diceLow = (randRollOne > randRollTwo ? randRollTwo : randRollOne);
var diceDiv = $("#dice");
diceDiv.empty();
var diceHighDiv = "<div" + " class=\"diceVal\" " + ">" + diceHigh + "<//div>";
var diceLowDiv = "<div" + " class=\"diceVal\" " + ">" + diceLow + "<//div>";
diceDiv.append(diceHighDiv);
diceDiv.append(diceLowDiv);

var nthRoll = -1;
for (var i = 0; i < rolls.length; i++) {
if (rolls[i].dieHigh == diceHigh && rolls[i].dieLow == diceLow) {
nthRoll = i;
break;
}
}
if (nthRoll < 0) alert('something went wrong');

var gamestateIndex = parseGuiGamestate();

var thisGamestate = gamestates[gamestateIndex];

var message = "";

var thisGamestateOptimalPlay = thisGamestate.optimalRollToGamestate[nthRoll];
if (thisGamestateOptimalPlay == undefined) {
message = 'not a reachable gamestate';
} else 
{
if (getGamestateIndex(thisGamestateOptimalPlay.flipped) == gamestateIndex) {
message = 'no moves possible with roll';
} else if (thisGamestate.flipped[diceLow - 1] == false && thisGamestateOptimalPlay.flipped[diceLow - 1] == true) {
message = 'do both dice values individually'
} else message = 'do both dice values summed'
}
var suggestionDiv = $("#suggestion");
suggestionDiv.empty();
suggestionDiv.append(message);
}


var parseGuiGamestate = function() {
var flippables = $("#flippables > button");
var flippedBools = [];
for (var i = 0; i < 2 * maxDieValue; i++) {
if ($("#flippables :nth-child(" + (i + 1).toString() + ")").hasClass("flipped")) {
flippedBools.push(true)
}
else flippedBools.push(false);
}
var gsIndex = getGamestateIndex(flippedBools);
return gsIndex;
}
