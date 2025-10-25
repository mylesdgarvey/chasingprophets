#!/usr/bin/env bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    if [ "$2" = "error" ]; then
        echo -e "${RED}$1${NC}"
    elif [ "$2" = "info" ]; then
        echo -e "${BLUE}$1${NC}"
    else
        echo -e "${GREEN}$1${NC}"
    fi
}

cleanup_cognito() {
    print_status "Cleaning up existing Cognito resources..." "info"
    
    # List and delete existing user pools
    USER_POOLS=$(aws cognito-idp list-user-pools --max-results 60 --query 'UserPools[?starts_with(Name, `ChasingProphets`)].Id' --output text)
    
    if [ ! -z "$USER_POOLS" ]; then
        print_status "Found existing ChasingProphets user pools. Deleting..." "info"
        for pool_id in $USER_POOLS; do
            print_status "Deleting user pool: $pool_id" "info"
            aws cognito-idp delete-user-pool --user-pool-id $pool_id
            # Wait for deletion to complete
            sleep 10
        done
    else
        print_status "No existing ChasingProphets user pools found" "info"
    fi

    # Verify all pools are deleted
    USER_POOLS=$(aws cognito-idp list-user-pools --max-results 60 --query 'UserPools[?starts_with(Name, `ChasingProphets`)].Id' --output text)
    if [ ! -z "$USER_POOLS" ]; then
        print_status "Warning: Some user pools still exist. Waiting..." "error"
        sleep 20
    fi
}

setup_cognito() {
    print_status "Setting up Amazon Cognito..." "info"
    
    # Clean up existing resources first
    cleanup_cognito
    
    # Create User Pool with retries
    local max_attempts=3
    local attempt=1
    local success=false

    while [ $attempt -le $max_attempts ] && [ "$success" = false ]; do
        print_status "Creating Cognito User Pool (attempt $attempt)..." "info"
        USER_POOL_ID=$(aws cognito-idp create-user-pool \
            --pool-name "ChasingProphetsUsers" \
            --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false}}' \
            --schema '[{"Name":"email","Required":true,"Mutable":true,"AttributeDataType":"String"}]' \
            --auto-verified-attributes email \
            --query 'UserPool.Id' \
            --output text)

        if [ -n "$USER_POOL_ID" ]; then
            success=true
            print_status "User Pool created successfully with ID: $USER_POOL_ID" "info"
            # Wait for pool to be fully created
            sleep 5
        else
            print_status "Failed to create User Pool (attempt $attempt)" "error"
            if [ $attempt -lt $max_attempts ]; then
                print_status "Retrying in 10 seconds..." "info"
                sleep 10
            fi
            ((attempt++))
        fi
    done

    if [ "$success" = false ]; then
        print_status "Failed to create User Pool after $max_attempts attempts" "error"
        exit 1
    fi

    if [ $? -ne 0 ]; then
        print_status "Failed to create User Pool" "error"
        exit 1
    fi
    
    print_status "User Pool created with ID: $USER_POOL_ID"

    # Create App Client
    print_status "Creating Cognito App Client..." "info"
    CLIENT_ID=$(aws cognito-idp create-user-pool-client \
        --user-pool-id $USER_POOL_ID \
        --client-name "ChasingProphetsWeb" \
        --no-generate-secret \
        --auth-session-validity 15 \
        --explicit-auth-flows "ALLOW_USER_SRP_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" "ALLOW_USER_PASSWORD_AUTH" \
        --prevent-user-existence-errors "ENABLED" \
        --query 'UserPoolClient.ClientId' \
        --output text)

    if [ $? -ne 0 ]; then
        print_status "Failed to create App Client" "error"
        exit 1
    fi
    
    print_status "App Client created with ID: $CLIENT_ID"

    # Create admin user
    print_status "Creating admin user..." "info"
    aws cognito-idp admin-create-user \
        --user-pool-id $USER_POOL_ID \
        --username admin@chasingprophets.local \
        --temporary-password "Admin123!" \
        --user-attributes Name=email,Value=admin@chasingprophets.local \
        --message-action SUPPRESS

    if [ $? -ne 0 ]; then
        print_status "Failed to create admin user" "error"
        exit 1
    fi

    # Set permanent password for admin user
    aws cognito-idp admin-set-user-password \
        --user-pool-id $USER_POOL_ID \
        --username admin@chasingprophets.local \
        --password "Admin123!" \
        --permanent

    # Create regular user account (username 'user' with email)
    print_status "Creating regular user account..." "info"
    aws cognito-idp admin-create-user \
        --user-pool-id $USER_POOL_ID \
        --username user \
        --temporary-password "User123!" \
        --user-attributes Name=email,Value=user@chasingprophets.local \
        --message-action SUPPRESS

    if [ $? -ne 0 ]; then
        print_status "Failed to create regular user" "error"
        exit 1
    fi

    # Set permanent password for regular user
    aws cognito-idp admin-set-user-password \
        --user-pool-id $USER_POOL_ID \
        --username user \
        --password "User123!" \
        --permanent

    if [ $? -ne 0 ]; then
        print_status "Failed to set permanent password for regular user" "error"
        exit 1
    fi

    if [ $? -ne 0 ]; then
        print_status "Failed to set permanent password for admin user" "error"
        exit 1
    fi

    # Update .env file
    print_status "Updating .env file with Cognito configuration..." "info"
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
    fi

    # Update Cognito settings in .env
    sed -i "s/VITE_COGNITO_USER_POOL_ID=.*/VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID/" .env
    sed -i "s/VITE_COGNITO_CLIENT_ID=.*/VITE_COGNITO_CLIENT_ID=$CLIENT_ID/" .env

    print_status "Cognito setup complete! ✨" "success"
    print_status "\nDefault admin credentials:" "info"
    print_status "Email: admin@chasingprophets.local" "info"
    print_status "Temporary password: Admin123!" "info"
    print_status "\nIMPORTANT: You will be prompted to change this password on first login" "info"
}

# Main setup
setup_cognito