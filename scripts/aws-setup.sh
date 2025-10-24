#!/usr/bin/env bash

# Function to print in color
print_status() {
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    NC='\033[0m' # No Color
    
    if [ "$2" = "error" ]; then
        echo -e "${RED}$1${NC}"
    else
        echo -e "${GREEN}$1${NC}"
    fi
}

# Function to validate AWS credentials
validate_aws_creds() {
    if [[ -z "${AWS_ACCESS_KEY_ID}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY}" ]]; then
        print_status "AWS credentials not found in environment" "error"
        return 1
    fi
    return 0
}

# Main setup function
main() {
    local RESET=false
    
    # Parse command line arguments
    while [[ "$#" -gt 0 ]]; do
        case $1 in
            --reset) RESET=true ;;
            *) print_status "Unknown parameter: $1" "error"; exit 1 ;;
        esac
        shift
    done

    print_status "Setting up ChasingProphets on AWS..."
    print_status "Reset resources: $RESET"
    
    # Validate AWS credentials
    if ! validate_aws_creds; then
        print_status "Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables" "error"
        exit 1
    fi

    # Check AWS connection
    print_status "Verifying AWS credentials..."
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_status "Failed to validate AWS credentials. Please check your credentials and try again." "error"
        exit 1
    fi
    print_status "AWS credentials verified!"

    # Create DynamoDB tables and load sample data
    print_status "Setting up DynamoDB tables..."
    if [ "$RESET" = true ]; then
        npm run setup-db -- --reset
    else
        npm run setup-db
    fi

    # Set up Cognito
    print_status "Setting up Cognito..."
    ./scripts/setup-cognito.sh

    print_status "Setup complete! 🚀"
    print_status "Run 'npm run dev' to start the application"
}

# Run main function with all arguments
main "$@"