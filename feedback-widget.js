(function () {
    let config = {
      fetchQuestionsEndpoint: "http://localhost:5000/get-questions", // API to fetch questions
      submitEndpoint: "http://localhost:5000/submit-feedback", // API to submit answers
      buttonColor: "#007BFF",
      textColor: "#ffffff",
      backgroundColor: "#f9f9f9"
    };
  
    if (window.FeedbackWidgetConfig) {
      config = { ...config, ...window.FeedbackWidgetConfig };
    }
  
    // Floating Button
    const button = document.createElement("button");
    button.innerText = "Feedback";
    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.background = config.buttonColor;
    button.style.color = config.textColor;
    button.style.border = "none";
    button.style.padding = "10px 15px";
    button.style.cursor = "pointer";
    button.style.borderRadius = "5px";
    document.body.appendChild(button);
  
    // Popup
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.background = config.backgroundColor;
    popup.style.padding = "20px";
    popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";
    popup.style.display = "none";
    popup.style.borderRadius = "10px";
    popup.innerHTML = `<p>Loading questions...</p>`;
    document.body.appendChild(popup);
  
    let feedbackData = []; // Stores user responses
  
    // Function to Fetch Questions
    const fetchQuestions = async () => {
      try {
        const response = await fetch(config.fetchQuestionsEndpoint);
        const questions = await response.json();
  
        if (!Array.isArray(questions)) throw new Error("Invalid data format");
  
        popup.innerHTML = ""; // Clear loading message
        feedbackData = [];
  
        questions.forEach((question, index) => {
          let questionDiv = document.createElement("div");
          questionDiv.innerHTML = `<p>${question.questionText}</p>`;
  
          if (question.type === "yesNo") {
            questionDiv.innerHTML += `
              <label><input type="radio" name="yesNo-${index}" value="true"> Yes</label>
              <label><input type="radio" name="yesNo-${index}" value="false"> No</label>
            `;
          } else if (question.type === "rating") {
            let ratingContainer = document.createElement("div");
            for (let i = 1; i <= 5; i++) {
              let star = document.createElement("span");
              star.innerText = "★";
              star.style.cursor = "pointer";
              star.style.fontSize = "20px";
              star.style.marginRight = "5px";
              star.style.color = "#ccc";
              star.onclick = () => {
                feedbackData[index].ratingAnswer = i;
                [...ratingContainer.children].forEach((s, idx) => {
                  s.style.color = idx < i ? "#FFD700" : "#ccc";
                });
              };
              ratingContainer.appendChild(star);
            }
            questionDiv.appendChild(ratingContainer);
          } else if (question.type === "description") {
            questionDiv.innerHTML += `<textarea id="description-${index}" rows="3" style="width: 100%;"></textarea>`;
          }
  
          popup.appendChild(questionDiv);
  
          // Initialize feedbackData for this question
          feedbackData.push({
            questionText: question.questionText,
            type: question.type,
            yesNoAnswer: null,
            descriptionAnswer: "",
            ratingAnswer: null
          });
        });
  
        // Submit Button
        let submitBtn = document.createElement("button");
        submitBtn.innerText = "Submit";
        submitBtn.style.marginTop = "10px";
        submitBtn.style.padding = "5px 10px";
        submitBtn.style.background = config.buttonColor;
        submitBtn.style.color = config.textColor;
        submitBtn.style.border = "none";
        submitBtn.style.cursor = "pointer";
  
        submitBtn.onclick = () => submitFeedback(questions);
  
        popup.appendChild(submitBtn);
      } catch (error) {
        popup.innerHTML = `<p>Error loading questions. Please try again.</p>`;
      }
    };
  
    // Function to Collect & Submit Feedback
    const submitFeedback = (questions) => {
      questions.forEach((question, index) => {
        if (question.type === "yesNo") {
          let selectedYesNo = document.querySelector(`input[name="yesNo-${index}"]:checked`);
          feedbackData[index].yesNoAnswer = selectedYesNo ? selectedYesNo.value === "true" : null;
        } else if (question.type === "description") {
          feedbackData[index].descriptionAnswer = document.getElementById(`description-${index}`)?.value || "";
        }
      });
  
      fetch(config.submitEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      })
        .then(() => {
          popup.innerHTML = "<p>Thank you for your feedback!</p>";
          setTimeout(() => (popup.style.display = "none"), 5000);
        })
        .catch(() => alert("Error submitting feedback!"));
    };
  
    // Show Popup & Fetch Questions on Button Click
    button.onclick = () => {
      popup.style.display = "block";
      fetchQuestions();
    };
  })();
  