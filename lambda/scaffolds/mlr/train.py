import json
import sys
import numpy as np
from sklearn.linear_model import LinearRegression

# Multiple Linear Regression Training
# Reads data and config from stdin
input_data = json.loads(sys.stdin.read())
data_rows = input_data['data']
config = input_data['config']

# Extract features and target
input_fields = config.get('input_fields', ['open', 'high', 'low', 'volume'])
output_field = config.get('output_field', 'close')

# Build X (features) and y (target) arrays
X = np.array([[float(row[field]) for field in input_fields] for row in data_rows])
y = np.array([float(row[output_field]) for row in data_rows])

# Train model
model = LinearRegression()
model.fit(X, y)

# Extract parameters
coefficients = model.coef_.tolist()
intercept = float(model.intercept_)

print(json.dumps({
  'coefficients': coefficients,
  'intercept': intercept,
  'input_fields': input_fields,
  'output_field': output_field
}))
