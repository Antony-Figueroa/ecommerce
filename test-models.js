
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");
  try {
    // Note: The listModels method might not be directly available on the genAI instance 
    // depending on the SDK version, but we can try to find what's wrong by testing 
    // a very standard model like 'gemini-pro'.
    
    console.log("Testing 'gemini-flash-latest'...");
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent("Hola");
    console.log("Success with gemini-flash-latest:", result.response.text());
  } catch (error) {
    console.error("Error with gemini-flash-latest:", error.message);
    
    try {
      console.log("Testing 'gemini-1.5-pro'...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent("Hola");
      console.log("Success with gemini-1.5-pro:", result.response.text());
    } catch (error2) {
      console.error("Error with gemini-1.5-pro:", error2.message);
    }
  }
}

listModels();
