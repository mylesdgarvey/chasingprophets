/**
 * Multiple Linear Regression - Local Inference Script
 * Performs prediction using trained MLR model parameters.
 */

function predict(input, parameters) {
  const { coefficients, intercept, input_fields = ['close', 'volume'], output_field = 'close' } = parameters;
  
  // Validate parameters
  if (!Array.isArray(coefficients) || typeof intercept !== 'number') {
    throw new Error('Invalid parameters: coefficients must be array and intercept must be number');
  }
  
  // Extract input values
  const inputValues = input_fields.map(field => {
    const value = input[field];
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid input value for field '${field}': ${value}`);
    }
    return value;
  });
  
  // Multiple linear regression: y = b0 + b1*x1 + b2*x2 + ...
  let prediction = intercept;
  for (let i = 0; i < coefficients.length; i++) {
    prediction += coefficients[i] * inputValues[i];
  }
  
  return prediction;
}
