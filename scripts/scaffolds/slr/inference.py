#!/usr/bin/env python3
"""
Simple Linear Regression - Remote Inference Script
Performs prediction using trained SLR model parameters.
**CRITICAL**: Model was trained on PERCENTAGE RETURNS, not raw prices.
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
    Make predictions using the trained SLR model.
    **Model trained on % returns**: Input = prev day return, Output = current day return
    
    Args:
        prices: List of historical prices
        parameters: Trained model parameters (slope, intercept)
    
    Returns:
        List of predictions with price and predicted next price
    """
    slope = parameters['slope']
    intercept = parameters['intercept']
    
    # Convert prices to percentage returns
    prices_array = np.array(prices)
    returns = (prices_array[1:] / prices_array[:-1] - 1) * 100
    
    predictions = []
    
    # Predict next return for each point (using previous return as input)
    for i in range(len(returns)):
        current_price = prices[i + 1]
        
        # Use current return to predict next return
        if i < len(returns):
            current_return = returns[i]
            predicted_next_return = slope * current_return + intercept
            
            # Convert predicted return back to price
            predicted_next_price = current_price * (1 + predicted_next_return / 100)
            
            predictions.append({
                'close': float(current_price),
                'close_pred': float(predicted_next_price),
                'return_input': float(current_return),
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
        
        # Extract prices from data
        input_field = parameters.get('input_field', 'close')
        try:
            prices = [float(row[input_field]) for row in data]
        except (KeyError, ValueError) as e:
            raise ValueError(f"Error extracting input field '{input_field}': {e}")
        
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
