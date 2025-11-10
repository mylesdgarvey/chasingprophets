/**
 * Simple Linear Regression - Local Inference Script
 * Performs prediction using trained SLR model parameters.
 * Used for client-side visualization in the browser.
 * Input: parameters object, input data array
 * Output: Predictions array
 */

/**
 * Make predictions using the trained SLR model.
 * @param {Array<Object>} data - Array of data points with input field
 * @param {Object} parameters - Trained model parameters
 * @param {number} parameters.slope - Regression slope
 * @param {number} parameters.intercept - Regression intercept
 * @param {string} parameters.input_field - Name of input field (default: 'x')
 * @param {string} parameters.output_field - Name of output field (default: 'y')
 * @returns {Array<Object>} Array of predictions with original data and predicted values
 */
function predict(data, parameters) {
  const { slope, intercept, input_field = 'x', output_field = 'y' } = parameters;
  
  // Validate inputs
  if (typeof slope !== 'number' || typeof intercept !== 'number') {
    throw new Error('Invalid parameters: slope and intercept must be numbers');
  }
  
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  // Make predictions
  const predictions = data.map(row => {
    const x = parseFloat(row[input_field]);
    
    if (isNaN(x)) {
      throw new Error(`Invalid input value for field '${input_field}': ${row[input_field]}`);
    }
    
    const y_pred = slope * x + intercept;
    
    return {
      ...row,
      [`${output_field}_pred`]: y_pred
    };
  });
  
  return predictions;
}

/**
 * Calculate prediction confidence intervals (optional enhancement)
 * @param {Array<Object>} data - Original training data
 * @param {Array<Object>} predictions - Predictions to add intervals to
 * @param {Object} parameters - Model parameters
 * @returns {Array<Object>} Predictions with confidence intervals
 */
function addConfidenceIntervals(data, predictions, parameters) {
  // Simplified confidence interval calculation
  // In production, this would use proper statistical methods
  const errors = data.map((row, i) => {
    const actual = parseFloat(row[parameters.output_field]);
    const predicted = predictions[i][`${parameters.output_field}_pred`];
    return Math.abs(actual - predicted);
  });
  
  const meanError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
  const stdError = Math.sqrt(
    errors.reduce((sum, e) => sum + Math.pow(e - meanError, 2), 0) / errors.length
  );
  
  // Add 95% confidence interval (approximately ±2 standard errors)
  return predictions.map(pred => ({
    ...pred,
    confidence_lower: pred[`${parameters.output_field}_pred`] - 2 * stdError,
    confidence_upper: pred[`${parameters.output_field}_pred`] + 2 * stdError
  }));
}

// Export for use in browser (ES modules) or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { predict, addConfidenceIntervals };
}

// Also support direct browser usage
if (typeof window !== 'undefined') {
  window.SLR_Inference = { predict, addConfidenceIntervals };
}
