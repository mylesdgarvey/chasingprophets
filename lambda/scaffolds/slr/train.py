import json
import sys
import numpy as np

# Simple Linear Regression Training
# Reads data and config from stdin
input_data = json.loads(sys.stdin.read())
data_rows = input_data['data']
config = input_data['config']

# Extract x and y from the data rows using config
input_field = config.get('input_field', 'close')
output_field = config.get('output_field', 'close')

# Build x and y arrays from data
x = np.array([float(row[input_field]) for row in data_rows])
y = np.array([float(row[output_field]) for row in data_rows])

# Calculate slope and intercept
x_mean = np.mean(x)
y_mean = np.mean(y)
numerator = np.sum((x - x_mean) * (y - y_mean))
denominator = np.sum((x - x_mean) ** 2)
slope = numerator / denominator
intercept = y_mean - slope * x_mean

print(json.dumps({
  'slope': float(slope),
  'intercept': float(intercept),
  'input_field': input_field,
  'output_field': output_field
}))
