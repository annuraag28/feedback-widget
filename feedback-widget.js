(function () {
    let config = {
        fetchQuestionsEndpoint: "http://localhost:9000/api/v1/questions/published",
        submitEndpoint: "http://localhost:9000/api/v1/feedbacks/",
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
    document.body.appendChild(popup);

    let feedbackData = []; // Stores user responses

    // Function to Show Loader
    const showLoader = () => {
        popup.innerHTML = `
            <div style="text-align:center;">
                <p>Loading...</p>
                <div class="loader" style="border: 4px solid #f3f3f3; border-top: 4px solid ${config.buttonColor}; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    };

    // Function to Fetch Questions
    const fetchQuestions = async () => {
        showLoader();
        try {
            const response = await fetch(config.fetchQuestionsEndpoint);
            const responseData = await response.json();

            if (!responseData.success || !Array.isArray(responseData.data)) {
                throw new Error("Invalid data format");
            }

            popup.innerHTML = ""; // Clear loader
            feedbackData = [];

            responseData.data.forEach((question, index) => {
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
                    questionId: question._id,
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

            submitBtn.onclick = () => submitFeedback();

            popup.appendChild(submitBtn);
        } catch (error) {
            popup.innerHTML = `<p>Error loading questions. Please try again.</p>`;
        }
    };

    // Function to Collect & Submit Feedback
    const submitFeedback = async () => {
        feedbackData.forEach((entry, index) => {
            if (entry.type === "yesNo") {
                let selectedYesNo = document.querySelector(`input[name="yesNo-${index}"]:checked`);
                entry.yesNoAnswer = selectedYesNo ? selectedYesNo.value === "true" : null;
                delete entry.descriptionAnswer;
                delete entry.ratingAnswer;
            } else if (entry.type === "rating") {
                delete entry.yesNoAnswer;
                delete entry.descriptionAnswer;
            } else if (entry.type === "description") {
                entry.descriptionAnswer = document.getElementById(`description-${index}`)?.value || "";
                delete entry.yesNoAnswer;
                delete entry.ratingAnswer;
            }
        });
    
        const requestBody = {
            questions: feedbackData.map(q => {
                let questionEntry = {
                    questionText: q.questionText,
                    type: q.type,
                    published: true,
                    _id: q.questionId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                if (q.type === "yesNo") {
                    questionEntry.yesNoAnswer = q.yesNoAnswer;
                } else if (q.type === "rating") {
                    questionEntry.ratingAnswer = q.ratingAnswer;
                } else if (q.type === "description") {
                    questionEntry.descriptionAnswer = q.descriptionAnswer;
                }
    
                return questionEntry;
            })
        };
    
        try {
            const response = await fetch(config.submitEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
    
            const responseData = await response.json();
            
            if (responseData.success) {
                let countdown = 5;
                popup.innerHTML = `<p>Thank you for your feedback! Closing in <span id="countdown">${countdown}</span> seconds...</p>`;
    
                const interval = setInterval(() => {
                    countdown--;
                    document.getElementById("countdown").innerText = countdown;
                    if (countdown === 0) {
                        clearInterval(interval);
                        popup.style.display = "none";
                    }
                }, 1000);
            } else {
                alert("Error submitting feedback. Please try again.");
            }
        } catch (error) {
            alert("Network error. Please try again later.");
        }
    };
    

    // Show Popup & Fetch Questions on Button Click
    button.onclick = () => {
        popup.style.display = "block";
        fetchQuestions();
    };
})();
