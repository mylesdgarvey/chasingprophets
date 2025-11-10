#!/usr/bin/env python3
"""
Multiple Linear Regression - Training Script
Trains a multiple linear regression model: y = b0 + b1*x1 + b2*x2 + ... + bn*xn
Input: Multiple numerical features, one numerical target
Output: Trained parameters (coefficients, intercept, metrics)
"""

import json
import sys
import numpy as np
from typing import Dict, Any, List


def multiple_linear_regression(X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
    """
    Calculate multiple linear regression parameters using least squares.
    y = b0 + b1*x1 + b2*x2 + ... + bn*xn
    
    Uses the normal equation: β = (X^T X)^(-1) X^T y
    
    Returns: {coefficients, intercept, r2, rmse, mape}
    """
    n_samples, n_features = X.shape
    
    if n_samples < n_features + 1:
        raise ValueError(f"Need at least {n_features + 1} samples for {n_features} features")
    
    # Add intercept column (column of ones)
    X_with_intercept = np.column_stack([np.ones(n_samples), X])
    
    # Calculate coefficients using normal equation
    try:
        # β = (X^T X)^(-1) X^T y
        XtX = X_with_intercept.T @ X_with_intercept
        Xty = X_with_intercept.T @ y
        beta = np.linalg.solve(XtX, Xty)
    except np.linalg.LinAlgError:
        raise ValueError("Cannot solve regression: matrix is singular (features may be linearly dependent)")
    
    intercept = beta[0]
    coefficients = beta[1:]
    
    # Calculate predictions
    y_pred = X_with_intercept @ beta
    
    # Calculate metrics
    y_mean = np.mean(y)
    
    # R² (coefficient of determination)
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - y_mean) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # RMSE (root mean squared error)
    rmse = np.sqrt(np.mean((y - y_pred) ** 2))
    
    # MAPE (mean absolute percentage error)
    non_zero_mask = y != 0
    if np.any(non_zero_mask):
        mape = np.mean(np.abs((y[non_zero_mask] - y_pred[non_zero_mask]) / y[non_zero_mask])) * 100
    else:
        mape = float('inf')
    
    return {
        'coefficients': coefficients.tolist(),
        'intercept': float(intercept),
        'r2': float(r2),
        'rmse': float(rmse),
        'mape': float(mape)
    }


def train(data: List[Dict[str, Any]], config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Train the MLR model on the provided data.
    
    **CRITICAL**: Training uses PERCENTAGE RETURNS, not raw prices.
    - Input (X): [previous day % return, day before that % return]
    - Output (y): current day's % return
    
    Args:
        data: List of data points with 'close' prices
        config: Training configuration (input_fields, output_field)
    
    Returns:
        Dictionary with trained parameters and metrics
    """
    # Extract price field from config
    price_field = config.get('input_fields', ['close'])[0] if isinstance(config.get('input_fields'), list) else 'close'
    
    # Extract prices
    try:
        prices = np.array([float(row[price_field]) for row in data])
    except (KeyError, ValueError) as e:
        raise ValueError(f"Error extracting prices: {e}")
    
    if len(prices) < 4:
        raise ValueError("Need at least 4 data points for MLR (2 lagged returns)")
    
    # Calculate percentage returns
    returns = (prices[1:] / prices[:-1] - 1) * 100
    
    # Create feature matrix X with 2 lagged returns
    # X[i] = [returns[i-1], returns[i-2]]
    # y[i] = returns[i]
    X = np.column_stack([
        returns[1:-1],  # returns at t-1
        returns[:-2]    # returns at t-2
    ])
    y = returns[2:]     # returns at t
    
    if len(X) < 2:
        raise ValueError("Need at least 2 samples for MLR")
    
    # Train model on % returns
    result = multiple_linear_regression(X, y)
    
    return {
        'parameters': {
            'coefficients': result['coefficients'],
            'intercept': result['intercept'],
            'input_fields': ['return_t-1', 'return_t-2'],
            'output_field': 'return_t'
        },
        'metrics': {
            'r2': result['r2'],
            'rmse': result['rmse'],
            'mape': result['mape']
        },
        'sample_size': len(X),
        'n_features': X.shape[1],
        'model_type': 'multiple_linear_regression'
    }


if __name__ == '__main__':
    """
    Command-line interface for training.
    Expected input (stdin): JSON object with 'data' and 'config' keys
    Output (stdout): JSON object with parameters and metrics
    """
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Validate input
        if 'data' not in input_data:
            raise ValueError("Input must contain 'data' key")
        if 'config' not in input_data:
            raise ValueError("Input must contain 'config' key")
        
        # Train model
        result = train(input_data['data'], input_data['config'])
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        sys.exit(0)
        
    except Exception as e:
        error_output = {
            'error': str(e),
            'type': type(e).__name__
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        sys.exit(1)
