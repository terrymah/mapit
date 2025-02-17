// Global variables for quiz mode.
var quizQuestions = [];
var currentQuestionIndex = 0;
var quizScore = 0;
var currentQuizKey = null;
var quizActive = true;
var quizConfig = window.quizConfig; // Will be set in app.js
var layerMap = {}; // Mapping from feature key to its layer

// quizOnEachFeature: attach quiz-specific event handlers.
function quizOnEachFeature(feature, layer) {
  var key = feature.properties[quizConfig.key];
  layer.quizKey = key;
  layer.quizAnswered = false; // Initially not answered.
  layerMap[key] = layer;
  
  // Attach click handler.
  layer.on('click', handleQuizClick);
  
  // Attach hover handlers.
  layer.on({
    mouseover: function(e) {
      if (!layer.quizAnswered) {
        // For unanswered features, on mouseover set full opacity.
        e.target.setStyle({ fillOpacity: 1, weight: 3 });
      } else {
        // Answered features remain fully opaque.
        e.target.setStyle({ fillOpacity: 1, weight: 3 });
      }
      e.target.bringToFront();
    },
    mouseout: function(e) {
      if (!layer.quizAnswered) {
        // For unanswered features, revert to lower opacity.
        e.target.setStyle({ fillOpacity: 0.5, weight: 2 });
      }
    }
  });
}

// initQuiz: initialize quiz variables and display the first question.
function initQuiz(geoLayer, config) {
  quizConfig = config; // Ensure quizConfig is set.
  // Gather all features from geoLayer.
  quizQuestions = [];
  for (var id in geoLayer._layers) {
    var lyr = geoLayer._layers[id];
    if (lyr.feature && lyr.feature.properties) {
      quizQuestions.push(lyr.feature);
    }
  }
  // Shuffle the questions.
  quizQuestions.sort(() => Math.random() - 0.5);
  currentQuestionIndex = 0;
  quizScore = 0;
  quizActive = true;
  displayCurrentQuestion();
}

// displayCurrentQuestion: show the current prompt in #quizPrompt.
function displayCurrentQuestion() {
  var quizPromptDiv = document.getElementById('quizPrompt');
  if (currentQuestionIndex < quizQuestions.length) {
    currentQuizKey = quizQuestions[currentQuestionIndex].properties[quizConfig.key];
    quizPromptDiv.textContent = "Find: " + currentQuizKey;
  } else {
    quizPromptDiv.textContent = "";
    showFinalScore();
  }
}

// flashHint: briefly display the name of the incorrect feature clicked.
function flashHint(hintText) {
  var hintDiv = document.createElement('div');
  hintDiv.style.position = 'fixed';
  hintDiv.style.top = '20%';
  hintDiv.style.left = '50%';
  hintDiv.style.transform = 'translateX(-50%)';
  hintDiv.style.fontSize = '36px';
  hintDiv.style.background = 'rgba(255,255,255,0.8)';
  hintDiv.style.padding = '10px';
  hintDiv.style.border = '1px solid #000';
  hintDiv.style.zIndex = '1100';
  hintDiv.textContent = "You clicked: " + hintText;
  document.body.appendChild(hintDiv);
  setTimeout(function() {
    hintDiv.parentNode.removeChild(hintDiv);
  }, 1000);
}

// handleQuizClick: process clicks during quiz mode.
function handleQuizClick(e) {
  if (!quizActive) return;
  var clickedKey = e.target.feature.properties[quizConfig.key];
  quizActive = false; // Disable further clicks until next question.
  if (clickedKey === currentQuizKey) {
    // Correct answer.
    e.target.setStyle({ fillColor: 'green', color: 'green', fillOpacity: 1, weight: 3 });
    layerMap[currentQuizKey].quizAnswered = true;
    quizScore++;
  } else {
    // Incorrect: immediately reveal the correct feature in red.
    if (layerMap[currentQuizKey]) {
      layerMap[currentQuizKey].setStyle({ fillColor: 'red', color: 'red', fillOpacity: 1, weight: 3 });
      layerMap[currentQuizKey].quizAnswered = true;
    }
    // Flash the name of the incorrectly clicked feature.
    flashHint(clickedKey);
  }
  // Advance to the next question after a short delay.
  setTimeout(function() {
    currentQuestionIndex++;
    quizActive = true;
    displayCurrentQuestion();
  }, 1000);
}

// showFinalScore: display the final score as a large floating message over a dimmed background.
function showFinalScore() {
  var scorePercent = Math.round((quizScore / quizQuestions.length) * 100);

  // Create an overlay to dim the map.
  var overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '1000';

  // Create the final score div.
  var finalScoreDiv = document.createElement('div');
  finalScoreDiv.style.position = 'absolute';
  finalScoreDiv.style.top = '50%';
  finalScoreDiv.style.left = '50%';
  finalScoreDiv.style.transform = 'translate(-50%, -50%)';
  finalScoreDiv.style.fontSize = '48px';
  finalScoreDiv.style.background = 'rgba(255,255,255,0.9)';
  finalScoreDiv.style.padding = '20px';
  finalScoreDiv.style.border = '2px solid #000';
  finalScoreDiv.style.zIndex = '1100';
  finalScoreDiv.textContent = "You scored " + scorePercent + "%! Congratulations!";

  // Append the score div to the overlay and the overlay to the body.
  overlay.appendChild(finalScoreDiv);
  document.body.appendChild(overlay);
}
