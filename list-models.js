
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listAllModels() {
  const apiKey = process.env.GOOGLE_AI_KEY || "";
  console.log("Using API Key (first 5 chars):", apiKey.substring(0, 5));
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      console.error("API Error:", data.error);
      return;
    }
    
    console.log("Available models:");
    data.models.forEach(m => console.log("- " + m.name));
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

listAllModels();
