// Load environment variables first
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { checkRulesWithLLM } = require("./llm");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Validate and parse PDF file
 */
async function parsePDF(buffer) {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid PDF file');
    }
    
    const data = await pdfParse(buffer);
    if (!data.text || typeof data.text !== 'string') {
      throw new Error('Failed to extract text from PDF');
    }
    
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Main API endpoint for PDF rule checking
 */
app.post("/check", upload.single("pdf"), async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "No PDF file uploaded" 
      });
    }

    // Parse rules
    let rules = [];
    try {
      rules = req.body.rules ? JSON.parse(req.body.rules) : [];
      if (!Array.isArray(rules) || rules.length === 0) {
        throw new Error('No rules provided');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: `Invalid rules format: ${error.message}`
      });
    }

    console.log(`Processing PDF with ${rules.length} rules`);
    
    // Parse PDF
    const pdfText = await parsePDF(req.file.buffer);
    
    // Process with LLM
    const results = await checkRulesWithLLM(pdfText, rules);
    
    // Return results
    res.json({
      success: true,
      results: results.map(r => ({
        rule: r.rule,
        status: r.status,
        evidence: r.evidence,
        reasoning: r.reasoning,
        confidence: r.confidence
      }))
    });

  } catch (error) {
    console.error("Error in /check endpoint:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
