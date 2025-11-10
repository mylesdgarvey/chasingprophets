#!/usr/bin/env python3
"""
Multiple Linear Regression - Remote Inference Script
Performs prediction using trained MLR model parameters.
**CRITICAL**: Model was trained on PERCENTAGE RETURNS with 2 lags.
Used for server-side scheduled predictions (Lambda).
Input: parameters.json, price data
Output: Price predictions
"""

import json
import sys
import numpy as np
from typing import Dict, Any, List


def predict(prices: List[float], parameters: Dict[str, Any]) -> List[Dict[str, float]]:
    """
    Make predictions using the trained MLR model.
    **Model trained on % returns**: Input = [return[t-1], return[t-2]], Output = return[t]
    
    Args:
        prices: List of historical prices
        parameters: Trained model parameters (coefficients, intercept)
    
    Returns:
        List of predictions with price and predicted next price
    """
    coefficients = np.array(parameters['coefficients'])
    intercept = parameters['intercept']
    
    # Convert prices to percentage returns
    prices_array = np.array(prices)
    returns = (prices_array[1:] / prices_array[:-1] - 1) * 100
    
    predictions = []
    
    # Predict next return using 2 lagged returns
    # Need at least 3 prices (2 returns) to make first prediction
    for i in range(2, len(returns)):
        current_price = prices[i + 1]
        
        # Features: [return[t-1], return[t-2]]
        X = np.array([returns[i - 1], returns[i - 2]])
        
        # Predict next return
        predicted_next_return = intercept + X @ coefficients
        
        # Convert predicted return back to price
        predicted_next_price = current_price * (1 + predicted_next_return / 100)
        
        predictions.append({
            'close': float(current_price),
            'close_pred': float(predicted_next_price),
            'return_t-1': float(returns[i - 1]),
            'return_t-2': float(returns[i - 2]),
            'return_pred': float(predicted_next_return)
        })
    
    return predictions


if __name__ == '__main__':
    """
    Command-line interface for inference.
    Expected input (stdin): JSON object with 'parameters' and 'data' keys
    Output (stdout): JSON array of predictions
    """
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Validate input
        if 'parameters' not in input_data:
            raise ValueError("Input must contain 'parameters' key")
        if 'data' not in input_data:
            raise ValueError("Input must contain 'data' key")
        
        parameters = input_data['parameters']
        data = input_data['data']
        
        # Extract prices from data (use 'close' field, not the synthetic return fields from training)
        try:
            prices = [float(row['close']) for row in data]
        except (KeyError, ValueError) as e:
            raise ValueError(f"Error extracting prices from 'close' field: {e}")
        
        # Make predictions
        predictions = predict(prices, parameters)
        
        # Output predictions as JSON
        print(json.dumps(predictions, indent=2))
        sys.exit(0)
        
    except Exception as e:
        error_output = {
            'error': str(e),
            'type': type(e).__name__
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        sys.exit(1)
