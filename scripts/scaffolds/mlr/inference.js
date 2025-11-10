/**
 * Multiple Linear Regression - Local Inference Script
 * Performs prediction using trained MLR model parameters.
 * Used for client-side visualization in the browser.
 * Input: parameters object, input data array
 * Output: Predictions array
 */

/**
 * Make predictions using the trained MLR model.
 * @param {Array<Object>} data - Array of data points with input features
 * @param {Object} parameters - Trained model parameters
 * @param {Array<number>} parameters.coefficients - Regression coefficients
 * @param {number} parameters.intercept - Regression intercept
 * @param {Array<string>} parameters.input_fields - Names of input fields
 * @param {string} parameters.output_field - Name of output field (default: 'y')
 * @returns {Array<Object>} Array of predictions with original data and predicted values
 */
function predict(data, parameters) {
  const { coefficients, intercept, input_fields, output_field = 'y' } = parameters;
  
  // Validate inputs
  if (!Array.isArray(coefficients) || typeof intercept !== 'number') {
    throw new Error('Invalid parameters: coefficients must be an array and intercept a number');
  }
  
  if (!Array.isArray(input_fields) || input_fields.length === 0) {
    throw new Error('Invalid parameters: input_fields must be a non-empty array');
  }
  
  if (coefficients.length !== input_fields.length) {
    throw new Error(`Coefficient count (${coefficients.length}) must match input field count (${input_fields.length})`);
  }
  
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  // Make predictions
  const predictions = data.map(row => {
    // Extract feature values
    const features = input_fields.map(field => {
      const value = parseFloat(row[field]);
      if (isNaN(value)) {
        throw new Error(`Invalid value for field '${field}': ${row[field]}`);
      }
      return value;
    });
    
    // Calculate prediction: y = b0 + b1*x1 + b2*x2 + ... + bn*xn
    let y_pred = intercept;
    for (let i = 0; i < features.length; i++) {
      y_pred += coefficients[i] * features[i];
    }
    
    return {
      ...row,
      [`${output_field}_pred`]: y_pred
    };
  });
  
  return predictions;
}

/**
 * Calculate feature importance (contribution to predictions)
 * @param {Object} parameters - Model parameters
 * @param {Array<Object>} data - Sample data for analysis
 * @returns {Array<Object>} Feature importance rankings
 */
function calculateFeatureImportance(parameters, data) {
  const { coefficients, input_fields } = parameters;
  
  // Calculate mean absolute values for each feature
  const featureMeans = input_fields.map((field, i) => {
    const values = data.map(row => Math.abs(parseFloat(row[field]) || 0));
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return mean;
  });
  
  // Calculate importance as |coefficient| * mean(|feature_values|)
  const importance = input_fields.map((field, i) => ({
    feature: field,
    coefficient: coefficients[i],
    importance: Math.abs(coefficients[i]) * featureMeans[i],
    percentage: 0  // Will be calculated after sorting
  }));
  
  // Sort by importance
  importance.sort((a, b) => b.importance - a.importance);
  
  // Calculate percentage of total importance
  const totalImportance = importance.reduce((sum, item) => sum + item.importance, 0);
  importance.forEach(item => {
    item.percentage = totalImportance > 0 ? (item.importance / totalImportance) * 100 : 0;
  });
  
  return importance;
}

/**
 * Generate prediction summary statistics
 * @param {Array<Object>} predictions - Predictions with actual and predicted values
 * @param {string} outputField - Name of the output field
 * @returns {Object} Summary statistics
 */
function getPredictionSummary(predictions, outputField = 'y') {
  const predField = `${outputField}_pred`;
  
  const values = predictions.map(p => p[predField]);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    count: predictions.length,
    mean,
    min,
    max,
    stdDev,
    range: max - min
  };
}

// Export for use in browser (ES modules) or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    predict, 
    calculateFeatureImportance,
    getPredictionSummary 
  };
}

// Also support direct browser usage
if (typeof window !== 'undefined') {
  window.MLR_Inference = { 
    predict, 
    calculateFeatureImportance,
    getPredictionSummary 
  };
}
