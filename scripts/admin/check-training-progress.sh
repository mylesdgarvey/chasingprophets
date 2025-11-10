#!/bin/bash
# Check training progress without interrupting it

echo "🔍 Training Progress Monitor"
echo "================================"
echo ""

# Check if training is running
if ps aux | grep -q "[t]rain-models.ts"; then
    echo "✅ Training is RUNNING"
    echo ""
    
    # Get latest progress from log
    if [ -f /tmp/training.log ]; then
        # Extract last progress line
        LAST_PROGRESS=$(grep -oE '\[[0-9]+/[0-9]+\]' /tmp/training.log | tail -1)
        
        if [ -n "$LAST_PROGRESS" ]; then
            echo "📊 Latest: $LAST_PROGRESS"
            
            # Calculate percentage
            CURRENT=$(echo $LAST_PROGRESS | grep -oE '[0-9]+' | head -1)
            TOTAL=$(echo $LAST_PROGRESS | grep -oE '[0-9]+' | tail -1)
            PERCENT=$((CURRENT * 100 / TOTAL))
            
            echo "📈 Progress: $PERCENT% complete"
            echo "⏱️  Models trained: $CURRENT / $TOTAL"
            echo "⏳ Remaining: $((TOTAL - CURRENT))"
        else
            echo "⏳ Starting up..."
        fi
        
        # Check for errors
        ERROR_COUNT=$(grep -c "❌" /tmp/training.log 2>/dev/null || echo 0)
        echo "❌ Failures: $ERROR_COUNT"
    else
        echo "⏳ Log file not yet created..."
    fi
else
    echo "❌ Training is NOT running"
    
    if [ -f /tmp/training.log ]; then
        # Check if it completed
        if grep -q "TRAINING SUMMARY" /tmp/training.log; then
            echo ""
            echo "✅ TRAINING COMPLETED!"
            echo ""
            tail -20 /tmp/training.log | grep -E "Success:|Failures:|Total processed:"
        else
            echo "⚠️  Training stopped unexpectedly"
            echo "Last 10 lines of log:"
            tail -10 /tmp/training.log
        fi
    fi
fi

echo ""
echo "💡 To view full log: tail -f /tmp/training.log"
