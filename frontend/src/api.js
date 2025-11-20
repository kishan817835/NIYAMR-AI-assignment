import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

export async function checkDocument(pdfFile, rules) {
  if (!pdfFile) {
    throw new Error("No PDF file provided");
  }

  if (!Array.isArray(rules) || rules.length === 0) {
    throw new Error("No rules provided");
  }

  const form = new FormData();
  form.append("pdf", pdfFile);
  form.append("rules", JSON.stringify(rules));

  try {
    const response = await axios.post(`${API_BASE_URL}/check`, form, {
      headers: { 
        "Content-Type": "multipart/form-data" 
      },
      timeout: 60000 // 1 minute timeout
    });

    if (!response.data || !Array.isArray(response.data.results)) {
      throw new Error("Invalid response format from server");
    }

    return response.data.results;
  } catch (error) {
    let errorMessage = "An error occurred while processing your request";
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 413) {
        errorMessage = "File is too large. Please upload a smaller file.";
      } else if (error.response.status === 400) {
        errorMessage = "Invalid request. Please check your input and try again.";
      } else if (error.response.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
    } else if (error.request) {
      
      errorMessage = "No response from server. Please check your connection.";
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "Request timed out. Please try again.";
    } else if (error.message) {
    
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}
