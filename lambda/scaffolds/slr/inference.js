/**
 * Simple Linear Regression - Client-Side Inference
 * 
 * Predicts: y = mx + b
 * 
 * Input format: { date, open, high, low, close, volume, ... }
 * Returns: predicted close price
 */

function predict(parameters, input) {
  const { slope, intercept, input_field, output_field } = parameters;
  
  // Get the input value (typically 'close' price)
  const x = input[input_field];
  
  if (x === undefined || x === null || isNaN(x)) {
    console.error(`Invalid input value for field '${input_field}':`, x, 'Full input:', input);
    return null;
  }
  
  const prediction = slope * x + intercept;
  return prediction;
}

function batchPredict(parameters, inputs) {
  return inputs.map(input => ({
    ...input,
    prediction: predict(parameters, input)
  }));
}
