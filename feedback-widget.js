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

    let feedbackData = [];
    let submitBtn;

    const checkSubmitEnabled = () => {
        const allFilled = feedbackData.every(entry => 
            entry.type === "description" ||
            (entry.type === "yesNo" && entry.yesNoAnswer !== null) ||
            (entry.type === "rating" && entry.ratingAnswer !== null)
        );
    
        submitBtn.disabled = !allFilled;
        submitBtn.style.opacity = allFilled ? "1" : "0.5";
        submitBtn.style.cursor = allFilled ? "pointer" : "not-allowed";
    };
    

    const fetchQuestions = async () => {
        popup.innerHTML = "<p>Loading...</p>";
        try {
            const response = await fetch(config.fetchQuestionsEndpoint);
            const responseData = await response.json();

            if (!responseData.success || !Array.isArray(responseData.data)) {
                throw new Error("Invalid data format");
            }

            popup.innerHTML = "";
            feedbackData = [];

            responseData.data.forEach((question, index) => {
                let questionDiv = document.createElement("div");
                questionDiv.innerHTML = `<p>${question.questionText}</p>`;

                if (question.type === "yesNo") {
                    questionDiv.innerHTML += `
                        <label><input type="radio" name="yesNo-${index}" value="true"> Yes</label>
                        <label><input type="radio" name="yesNo-${index}" value="false"> No</label>
                    `;
                    questionDiv.querySelectorAll("input").forEach(input => {
                        input.addEventListener("change", () => {
                            feedbackData[index].yesNoAnswer = input.value === "true";
                            checkSubmitEnabled();
                        });
                    });
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
                            checkSubmitEnabled();
                        };
                        ratingContainer.appendChild(star);
                    }
                    questionDiv.appendChild(ratingContainer);
                } else if (question.type === "description") {
                    questionDiv.innerHTML += `<textarea id="description-${index}" rows="3" style="width: 100%;"></textarea>`;
                }

                popup.appendChild(questionDiv);
                feedbackData.push({
                    questionId: question._id,
                    type: question.type,
                    yesNoAnswer: null,
                    descriptionAnswer: "",
                    ratingAnswer: null
                });
            });

            submitBtn = document.createElement("button");
            submitBtn.innerText = "Submit";
            submitBtn.style.marginTop = "10px";
            submitBtn.style.padding = "5px 10px";
            submitBtn.style.background = config.buttonColor;
            submitBtn.style.color = config.textColor;
            submitBtn.style.border = "none";
            submitBtn.style.cursor = "pointer";
            submitBtn.style.opacity = 0.5;
            submitBtn.disabled = true;
            submitBtn.onclick = submitFeedback;

            popup.appendChild(submitBtn);
        } catch (error) {
            popup.innerHTML = "<p>Error loading questions. Please try again.</p>";
        }
    };

    const submitFeedback = async () => {
        const requestBody = {
            questions: feedbackData.map((q, index) => ({
                questionText: document.querySelectorAll("p")[index].innerText,  // Get question text from UI
                type: q.type,
                _id: q.questionId,
                yesNoAnswer: q.type === "yesNo" ? q.yesNoAnswer : undefined,
                ratingAnswer: q.type === "rating" ? q.ratingAnswer : undefined,
                descriptionAnswer: q.type === "description" ? document.getElementById(`description-${index}`).value : undefined
            }))            
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

    button.onclick = () => {
        popup.style.display = "block";
        fetchQuestions();
    };
})();
