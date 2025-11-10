/**
 * Multiple Linear Regression - Client-Side Inference
 * 
 * Predicts: y = b0 + b1*x1 + b2*x2 + ... + bn*xn
 * 
 * Input format: { date, open, high, low, close, volume, ... }
 * Returns: predicted close price
 */

function predict(parameters, input) {
  const { coefficients, intercept, input_fields, output_field } = parameters;
  
  // Extract input values in the order specified by input_fields
  const inputValues = input_fields.map(field => {
    const value = input[field];
    if (value === undefined || value === null || isNaN(value)) {
      console.warn(`Missing or invalid value for field '${field}':`, value);
      return 0;
    }
    return value;
  });
  
  // Calculate prediction: intercept + sum(coefficient_i * input_i)
  let prediction = intercept;
  for (let i = 0; i < coefficients.length; i++) {
    prediction += coefficients[i] * inputValues[i];
  }
  
  return prediction;
}

function batchPredict(parameters, inputs) {
  return inputs.map(input => ({
    ...input,
    prediction: predict(parameters, input)
  }));
}
