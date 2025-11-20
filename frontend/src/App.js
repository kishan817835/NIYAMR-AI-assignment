import React, { useState, useRef } from "react";
import { checkDocument } from "./api";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [rules, setRules] = useState(["", "", ""]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setFileName(file.name);
      setError("");
    } else if (file) {
      setError("Please upload a valid PDF file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRuleChange = (index, value) => {
    const updated = [...rules];
    updated[index] = value;
    setRules(updated);
    if (error) setError("");
  };

  const addRuleField = () => {
    setRules([...rules, ""]);
  };

  const removeRule = (index) => {
    if (rules.length > 1) {
      const updated = rules.filter((_, i) => i !== index);
      setRules(updated);
    }
  };

  const handleCheck = async () => {
    if (!pdfFile) {
      setError("Please upload a PDF file.");
      return;
    }

    const validRules = rules.filter(rule => rule.trim() !== "");
    if (validRules.length === 0) {
      setError("Please enter at least one rule.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    
    try {
      const output = await checkDocument(pdfFile, validRules);
      setResults(output);
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || "Failed to process the document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📄 PDF Rule Checker</h2>

      {/* PDF Upload */}
      <div style={styles.section}>
        <label style={styles.label}>
          Upload PDF File
          <span style={{ color: 'red' }}>*</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="file"
            id="pdf-upload"
            accept="application/pdf"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <label 
            htmlFor="pdf-upload" 
            style={styles.uploadButton}
          >
            {fileName || 'Choose PDF File'}
          </label>
          {fileName && (
            <span style={{ fontSize: '0.9em', color: '#666' }}>
              {fileName}
            </span>
          )}
        </div>
      </div>

      {/* Rules */}
      <div style={styles.section}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ ...styles.label, marginBottom: 0 }}>Rules</label>
          <span style={{ color: 'red' }}>*</span>
          <button 
            onClick={addRuleField} 
            type="button" 
            style={styles.addRuleButton}
            disabled={loading}
          >
            + Add Rule
          </button>
        </div>
        
        {rules.map((rule, index) => (
          <div key={index} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={`Rule ${index + 1}`}
              value={rule}
              onChange={(e) => handleRuleChange(index, e.target.value)}
              style={{ ...styles.input, flex: 1, marginBottom: 0 }}
              disabled={loading}
            />
            {rules.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeRule(index)}
                style={styles.removeButton}
                disabled={loading}
                aria-label="Remove rule"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button 
        onClick={handleCheck} 
        style={styles.button} 
        disabled={loading || !pdfFile || !rules.some(r => r.trim() !== '')}
      >
        {loading ? (
          <span>Checking... <span style={styles.loadingDots}>...</span></span>
        ) : (
          'Check Document'
        )}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div style={styles.resultsContainer}>
          <h3 style={styles.resultsHeader}>Results</h3>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Rule</th>
                  <th style={styles.tableHeader}>Status</th>
                  <th style={styles.tableHeader}>Evidence</th>
                  <th style={styles.tableHeader}>Reasoning</th>
                  <th style={styles.tableHeader}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                    <td style={styles.tableCell}>{r.rule}</td>
                    <td style={{
                      ...styles.tableCell,
                      color: r.status === "pass" ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      {r.status.toUpperCase()}
                    </td>
                    <td style={styles.tableCell}>{r.evidence || 'N/A'}</td>
                    <td style={styles.tableCell}>{r.reasoning || 'N/A'}</td>
                    <td style={styles.tableCell}>
                      <div style={styles.confidenceContainer}>
                        <div 
                          style={{
                            ...styles.confidenceBar,
                            width: `${r.confidence}%`,
                            backgroundColor: r.confidence > 70 ? '#28a745' : r.confidence > 30 ? '#ffc107' : '#dc3545'
                          }}
                        />
                        <span style={styles.confidenceText}>{r.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* Inline styles */
const styles = {
  container: {
    padding: '2rem',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    lineHeight: '1.6',
    color: '#333',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#2c3e50',
    fontSize: '2rem',
    fontWeight: '600',
  },
  section: {
    marginBottom: '1.5rem',
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#2c3e50',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    transition: 'border-color 0.3s',
  },
  inputFocus: {
    outline: 'none',
    borderColor: '#3498db',
    boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    marginTop: '1rem',
    width: '100%',
    maxWidth: '300px',
  },
  buttonHover: {
    backgroundColor: '#2980b9',
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  uploadButton: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textAlign: 'center',
    minWidth: '150px',
  },
  uploadButtonHover: {
    backgroundColor: '#e9ecef',
  },
  addRuleButton: {
    backgroundColor: 'transparent',
    color: '#3498db',
    border: '1px dashed #3498db',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    marginLeft: '1rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
  },
  removeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#e74c3c',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: '#fde8e8',
    color: '#c0392b',
    padding: '1rem',
    borderRadius: '4px',
    margin: '1rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  errorIcon: {
    fontSize: '1.25rem',
  },
  loadingDots: {
    display: 'inline-block',
    width: '1em',
    textAlign: 'left',
    overflow: 'hidden',
    verticalAlign: 'bottom',
    animation: 'dots 1.5s steps(4, end) infinite',
  },
  resultsContainer: {
    marginTop: '2rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  resultsHeader: {
    backgroundColor: '#f8f9fa',
    margin: 0,
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #eee',
    color: '#2c3e50',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '1px solid #eee',
  },
  tableRowEven: {
    backgroundColor: '#fff',
  },
  tableRowOdd: {
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    padding: '1rem',
    borderBottom: '1px solid #eee',
    verticalAlign: 'top',
  },
  confidenceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  confidenceBar: {
    height: '8px',
    borderRadius: '4px',
    minWidth: '40px',
    transition: 'width 0.3s, background-color 0.3s',
  },
  confidenceText: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
    minWidth: '40px',
    textAlign: 'right',
  },
  // Keyframes should be defined in a separate style tag or CSS file
  // as they are not directly supported in inline styles
};

export default App;
