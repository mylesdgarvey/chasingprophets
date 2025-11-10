/**
 * Simple Linear Regression - Local Inference Script
 * Performs prediction using trained SLR model parameters.
 * Used for client-side visualization in the browser.
 */

function predict(input, parameters) {
  const { slope, intercept, input_field = 'close', output_field = 'close' } = parameters;
  
  // Validate parameters
  if (typeof slope !== 'number' || typeof intercept !== 'number') {
    throw new Error('Invalid parameters: slope and intercept must be numbers');
  }
  
  // Get input value
  const x = input[input_field];
  if (typeof x !== 'number' || isNaN(x)) {
    throw new Error(`Invalid input value for field '${input_field}': ${x}`);
  }
  
  // Simple linear regression: y = mx + b
  return slope * x + intercept;
}
