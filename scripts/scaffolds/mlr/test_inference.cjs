const { predict, calculateFeatureImportance } = require('./inference.js');

const params = {
  coefficients: [0.21171560161714023, 0.3118883131877517, 0.4221358664262816, 1.079447323013809e-06],
  intercept: 6.393782383423148,
  input_fields: ['open', 'high', 'low', 'volume'],
  output_field: 'close'
};

const data = [
  {open: 119, high: 123, low: 117, volume: 1380000},
  {open: 121, high: 125, low: 119, volume: 1420000}
];

console.log('MLR JavaScript Inference Test');
console.log('=============================');
const predictions = predict(data, params);
console.log(JSON.stringify(predictions, null, 2));
console.log('\nTest passed! ✓');
