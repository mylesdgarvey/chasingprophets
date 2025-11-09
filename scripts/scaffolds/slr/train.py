#!/usr/bin/env python3
"""
Simple Linear Regression - Training Script
Trains a simple linear regression model: y = mx + b
Input: x (numerical), y (numerical)
Output: Trained parameters (slope, intercept, metrics)
"""

import json
import sys
import numpy as np
from typing import Dict, Any, List


def simple_linear_regression(x: np.ndarray, y: np.ndarray) -> Dict[str, float]:
    """
    Calculate simple linear regression parameters using least squares.
    y = mx + b
    
    Returns: {slope, intercept, r2, rmse, mape}
    """
    n = len(x)
    
    # Calculate means
    x_mean = np.mean(x)
    y_mean = np.mean(y)
    
    # Calculate slope (m) and intercept (b)
    numerator = np.sum((x - x_mean) * (y - y_mean))
    denominator = np.sum((x - x_mean) ** 2)
    
    if denominator == 0:
        raise ValueError("Cannot compute regression: all x values are identical")
    
    slope = numerator / denominator
    intercept = y_mean - slope * x_mean
    
    # Calculate predictions
    y_pred = slope * x + intercept
    
    # Calculate metrics
    # R² (coefficient of determination)
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - y_mean) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # RMSE (root mean squared error)
    rmse = np.sqrt(np.mean((y - y_pred) ** 2))
    
    # MAPE (mean absolute percentage error)
    # Avoid division by zero in MAPE calculation
    non_zero_mask = y != 0
    if np.any(non_zero_mask):
        mape = np.mean(np.abs((y[non_zero_mask] - y_pred[non_zero_mask]) / y[non_zero_mask])) * 100
    else:
        mape = float('inf')
    
    return {
        'slope': float(slope),
        'intercept': float(intercept),
        'r2': float(r2),
        'rmse': float(rmse),
        'mape': float(mape)
    }


def train(data: List[Dict[str, Any]], config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Train the SLR model on the provided data.
    
    **CRITICAL**: Training uses PERCENTAGE RETURNS, not raw prices.
    - Input (x): previous day's price-to-price % return
    - Output (y): current day's price-to-price % return
    
    Args:
        data: List of data points with 'close' prices
        config: Training configuration (input_field, output_field)
    
    Returns:
        Dictionary with trained parameters and metrics
    """
    # Extract field name from config
    price_field = config.get('input_field', 'close')
    
    # Extract prices
    try:
        prices = np.array([float(row[price_field]) for row in data])
    except (KeyError, ValueError) as e:
        raise ValueError(f"Error extracting prices: {e}")
    
    if len(prices) < 3:
        raise ValueError("Need at least 3 data points to compute returns")
    
    # Calculate percentage returns: (price[t] / price[t-1] - 1) * 100
    returns = (prices[1:] / prices[:-1] - 1) * 100
    
    # Create x (previous return) and y (current return) pairs
    # x[i] = returns[i-1], y[i] = returns[i]
    x = returns[:-1]  # returns at t-1
    y = returns[1:]   # returns at t
    
    if len(x) < 2:
        raise ValueError("Need at least 2 return pairs to train")
    
    # Train model on % returns
    result = simple_linear_regression(x, y)
    
    return {
        'parameters': {
            'slope': result['slope'],
            'intercept': result['intercept'],
            'input_field': price_field,
            'output_field': price_field
        },
        'metrics': {
            'r2': result['r2'],
            'rmse': result['rmse'],
            'mape': result['mape']
        },
        'sample_size': len(x),
        'model_type': 'simple_linear_regression'
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
