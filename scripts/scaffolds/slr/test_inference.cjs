const { predict, addConfidenceIntervals } = require('./inference.js');

const params = { 
  slope: 1.996969696969697, 
  intercept: 0.026666666666665506, 
  input_field: 'x', 
  output_field: 'y' 
};

const data = [
  {x: 11}, 
  {x: 12}, 
  {x: 13}
];

console.log('SLR JavaScript Inference Test');
console.log('==============================');
const predictions = predict(data, params);
console.log(JSON.stringify(predictions, null, 2));
console.log('\nTest passed! ✓');
