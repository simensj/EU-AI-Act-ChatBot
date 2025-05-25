window.onload = function() {
    // Create the initial information message.
    const messageElement = create_message("", "bot");
    messageElement.innerHTML = "Før du bruker denne chatboten, må du lese og godta vår <a href='#' onclick='showConsentBanner(); return false;'>personvernerklæring</a>. Klikk på lenken for å lese erklæringen. ";
};

let consentGiven = false; // Tracks if the user has agreed to privacy policy.
let lastFetchedInput = ""; // Tracks the last input used for fetching suggestions.
let debounceTimeout; // Variable for debouncing input event (for fething suggestions).
let suggestionsActive = true; // Tracks if autocomplete questions are active or not

const user_input_field = document.getElementById("chatbot_input_field");
user_input_field.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); 
        send_user_input();
        toggle_input(false) // Disable input while waiting for response, to mitigate spam.
    }
    /* This code adds a keydown event listener to the input field.
    It enables the user to send a message by pressing the enter key,
    while also allowing for linebreaks with shift+enter. */
});

function toggle_input(isActive){
    // Function to enable or disable the input field and send button.
    send_message_button = document.getElementById("chatbutton");
    if (isActive == true){
        send_message_button.removeAttribute("disabled")
        user_input_field.removeAttribute("disabled")
    } 
    else {
        send_message_button.setAttribute("disabled", "")
        user_input_field.setAttribute("disabled", "")
    }
}

const fallbackmessage = 
"En feil har oppstått ved henting av svar. Vennligst prøv igjen senere eller still et spørsmål fra forslagslisten.";

function send_user_input() {
    // Function to send user input to the backend API endpoint, and display the response.

    clearTimeout(debounceTimeout); // Clear the timeout for fetching suggestions.
    suggestionsListElement.style.display = "none"; // Hide the suggestions box when sending input

    // Jump out of the function if the user has not accepted the privacy policy.
    if (!consentGiven) {
        create_message("Vennligst godta personvernerklæringen før du sender inn spørsmål.", "bot");
        user_input_field.value = "";
        return;
    }

    let user_input = user_input_field.value.trim(); // store the user input in a variable and remove whitespace characters.
    
    if (user_input === "" || user_input.length > 150) 
        return; // Prevent empty messages and additional safeguard towards long inputs.
    
    //const chatDialog = get_chat_dialog();
    
    // Create the user message bubble.
    create_message(user_input, "user");
    const botMessageElement = create_message("Tenker...", "bot");
    user_input_field.value = ""; // Clear the input field after the user has sent a message.
    
    // Send a request to the backend API "ask" endpoint with the user-input and fetch the response.
    (async () => {
        try {
            const response = await fetch("/ask", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({question: user_input})
            });

            const data = await response.json();
            //console.log(data); // Debugging line.

            // Display the answer
            botMessageElement.textContent = data.answer || "Ingen respons mottatt.";
            
            /* This is for debugging, but also part of an unimplemented feature to display the retrieved chunks' corresponding page.
            // Display the context with page numbers
            if (data.context && data.context.length > 0) {
                data.context.forEach(doc => {
                    create_message(`ID: ${doc.id}`, "bot");
                });
            }
            */

        } catch (error) {
            console.error(error); // Log the error to the console for debugging.
            botMessageElement.textContent = fallbackmessage; // Display a fallback message.
        }
        toggle_input(true);
        chatDialog.scrollTop = chatDialog.scrollHeight; // Auto-scroll to the latest message
    })();
}

const chatDialog = document.getElementById("chat_dialog_field");
function create_message(text, sender) {
    // Function to create a message bubble in the chat dialog.

    // create a container and a bubble for the message, and add the appropriate classes.
    // if the sender is the user, add the class "user_message", otherwise add "bot_message".
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("chat_message_container", sender === "user" ? "user_message" : "bot_message");

    const messageBubble = document.createElement("div");
    messageBubble.classList.add("chat_message", sender === "user" ? "user_bubble" : "bot_bubble");
    messageBubble.textContent = text;
    
    // Add the message bubble to the container and the container to the chat dialog.
    messageContainer.appendChild(messageBubble);
    chatDialog.appendChild(messageContainer);

    return messageBubble; // Return the message bubble element.
}


const suggestionsListElement = document.getElementById("autocomplete-list");
async function showSuggestions(input) {
    // Function to fetch and display similar questions based on the user input.
    
    if (!suggestionsActive || !input.trim()) {
        suggestionsListElement.style.display = "none"; // Hide the suggestion box if input is empty or disabled by the user.
        return;
    }
    if (!consentGiven) { // Dont show suggestions if the user has not agreed to the privacy policy.
        return;
    }
    suggestionsListElement.innerHTML = ""; // Clear previous suggestions.

    try {
        // Fetch suggestions from the backend API "suggestions" endpoint.
        const response = await fetch("/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: input })
        });
        const data = await response.json();

        if (!data.suggestions || data.suggestions.length === 0) {
            suggestionsListElement.style.display = "none"; // FAISS always returns suggestions, so this should not happen, but a server error could cause this. 
            return;
        }

        // Limit to a maximum of 3 suggestions. The backend should return 3 suggestions, but this is an additional safeguard.
        const suggestionsList = data.suggestions.slice(0, 3);

        // Loop through the suggestions and create a div for each suggestion.
        suggestionsList.forEach(item => {
        if (!checkifinputisEmpty()) {
            const div = document.createElement("div");
            div.classList.add("autocomplete-item");
            div.textContent = item;
            div.onclick = function () {
                user_input_field.value = item; // Set input field value
                suggestionsListElement.style.display = "none"; // Hide the suggestios if the user clicks on one.
            };
            suggestionsListElement.appendChild(div);
            suggestionsListElement.style.display = "block"; // Show the suggestion box when there are suggestions.
        } 
    });

        lastFetchedInput = input; // Update the tracker with the current input.
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        suggestionsListElement.style.display = "none"; // Hide the suggestion box on error
    }
}

// Debounced input event listener
user_input_field.addEventListener("input", function () {
    // This function is called when the user types in the input field.
    clearTimeout(debounceTimeout); // Clear the previous timeout
    const input = this.value;

    debounceTimeout = setTimeout(() => {
        showSuggestions(input); // Fetch the suggestions when the user stops typing for 555ms.
    }, 555); // Set a 555ms delay
});

function checkifinputisEmpty() {
    // Function to check if the input field is empty.
    //console.log(user_input_field.value.trim() === "")
    return user_input_field.value.trim() === ""; // Check if the input field is empty.
}

function toggleSuggestionBox() {
    // function to toggle fetching suggestions.
    const wandIcon = document.getElementById("toggle-icon");
    const currentInput = user_input_field.value.trim();

    // Hiding the suggestion box
    if (suggestionsActive === true) {
        suggestionsActive = false; // Disable suggestions
        suggestionsListElement.style.display = "none"; // Hide the suggestion box
        wandIcon.setAttribute("src", "/static/magic-wand-off.svg"); // Set wand to greyed out
    } 
    // Showing the suggestion box
    else {
        clearTimeout(debounceTimeout);
        suggestionsActive = true; // Enable suggestions
        wandIcon.setAttribute("src", "/static/magic-wand-on.svg"); // Change icon to on

        // Check if the current input differs from the last fetched input. Mitigates spam by rapidly clicking the wand icon.
        if (currentInput !== lastFetchedInput && currentInput !== "") {
            lastFetchedInput = currentInput; // Update the last fetched input.
            showSuggestions(currentInput); // Fetch new suggestions.
        } else if (checkifinputisEmpty()) {
            suggestionsListElement.style.display = "none"; // Hide the suggestion box if input is empty.
        } else {
            suggestionsListElement.style.display = "block"; // Show the existing suggestions.
        }
    }
    // console.log("Suggestions active:", suggestionsActive); // Debugging line.
}



function showConsentBanner() {
    // Function to show the privacy policy banner.
    // This banner text is partly generated by ChatGPT model GPT 4-o (https://chatgpt.com/share/681107ec-9c88-8004-be5f-66d97001725d) and expanded upon by the developers.
  
    if (consentGiven || document.getElementById("consent-banner-overlay")) return; // Dont show if user has already agreed or banner is already present.

  // Create the overlay and banner element.
  const privacyOverlay = document.createElement("div");
  privacyOverlay.id = "consent-banner-overlay";

  const privacyBanner = document.createElement("div");
  privacyBanner.className = "consent-banner";
  privacyBanner.innerHTML = `
    <p style="margin-bottom: 20px; font-size: 16px;">
      <b>Viktig informasjon om personvern og databehandling</b><br><br>

  <p>
    Spørsmål du sender inn via denne tjenesten kan deles med tredjepartsleverandører, inkludert
    <a href="https://www.langchain.com/langsmith" target="_blank">LangSmith</a> og
    <a href="https://openai.com/" target="_blank">OpenAI</a>.
  </p>

  <ul>
    <li>Data som deles med LangSmith brukes til å forbedre tjenestens kvalitet og ytelse, samt for å overvåke og forhindre misbruk eller spam.</li>
    <li>Data som sendes til OpenAI er nødvendige for at tjenesten skal fungere som forventet.</li>
  </ul>

  <p>
  <b>Ikke del personlig informasjon</b> (som navn, e-post, telefonnummer, fødselsnummer eller annen sensitiv informasjon).
  </p>
  
  <p>
    <b>LangSmith-trace-data blir automatisk slettet etter 14 dager.</b><br>
    Dersom du har delt personlig eller sensitiv informasjonønsker å få slettet en spesifikk samtale (trace) tidligere, eller har andre spørsmål, kan du kontakte oss på <a href="mailto:221004@himolde.no">mail</a>.
  </p>
  <p>
    For å bruke tjenesten må du bekrefte at du har lest og godtar vilkårene for databehandling.
 <br>
 <br>
    <button id="agree-button">Godta</button>
    <button id="disagree-button">Avvis</button>
  `;



  privacyOverlay.appendChild(privacyBanner);
  document.body.appendChild(privacyOverlay);

  document.getElementById("agree-button").onclick = () => {
    consentGiven = true;
    privacyOverlay.remove();

    create_message("Jeg har lest og godtatt vilkårene i personvernerklæringen.", "user");
    const BotInfomessageElement = create_message("", "bot");
    BotInfomessageElement.innerHTML = `
  <p>
    Du kommuniserer nå med en <strong>AI-basert chatbot</strong> utviklet for å gi generell informasjon om <strong>EUs KI-forordning fra 2024</strong>.
  </p>
  <p>
    Dette er et <em>automatisert system</em>, ikke en menneskelig representant. Chatboten kan gi <strong>feilaktig eller ufullstendig informasjon</strong>, og må ikke brukes som kilde til <strong>juridisk rådgivning</strong>.
  </p>
  <p>
    Samtalehistorikken lagres ikke i minnet, og chatboten <strong>husker ikke tidligere meldinger</strong>. Det betyr at du ikke kan stille oppfølgingsspørsmål basert på tidligere svar.
  </p>
  <p>
    Du kan stille et ofte stilt spørsmål ved å bruke <strong>forslagene som vises når du begynner å skrive</strong>, eller slå dem av og på ved å bruke <strong>tryllestav-knappen</strong>.
  </p>
  <p>
    Dette prosjektet er utviklet som del av en <strong>bacheloroppgave ved Høyskolen i Molde av Simen Johannessen og Henrik Hoset</strong>. Kildekoden er åpen og kan finnes her:  
    <a href="https://github.com/simensj/EU-AI-Act-ChatBot" target="_blank">https://github.com/simensj/EU-AI-Act-ChatBot</a>
  </p>
`;
  };
  document.getElementById("disagree-button").onclick = () => {
    // If the user disagrees to the privacy policy, set consentGiven to false and remove the overlay.
    consentGiven = false;
    privacyOverlay.remove();
  };
}
