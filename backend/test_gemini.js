const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./src/config');
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const functionDeclarations = [
  {
    name: "getPendingGoals",
    description: "Fetch the user's current pending goals/quests.",
    parameters: { type: "OBJECT", properties: {} }
  }
];

async function test() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    tools: [{ functionDeclarations }],
  });

  const chat = model.startChat();
  let result = await chat.sendMessage("What are my pending goals?");
  let response = result.response;
  
  if (response.functionCalls && response.functionCalls().length > 0) {
    const call = response.functionCalls()[0];
    console.log("Got function call:", call.name);
    
    // Try sending response as functionResponse part
    try {
      let nextResult = await chat.sendMessage([{
        functionResponse: {
          name: call.name,
          response: { goals: [] }
        }
      }]);
      console.log("Success with functionResponse part:", nextResult.response.text());
    } catch (e) {
      console.error("Error with functionResponse part:", e.message);
      
      // Fallback: send as text
      try {
        let fallbackResult = await chat.sendMessage(`Function call result for ${call.name}: ${JSON.stringify({ goals: [] })}`);
        console.log("Success with text fallback:", fallbackResult.response.text());
      } catch (e2) {
        console.error("Error with text fallback:", e2.message);
      }
    }
  } else {
    console.log("No function call returned.", response.text());
  }
}

test();
