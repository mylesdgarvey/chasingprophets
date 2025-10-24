
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

print() { echo -e "[preflight] $*"; }

ensure_aws_cli() {
  if command -v aws >/dev/null 2>&1; then
    print "AWS CLI found: $(aws --version 2>&1 | head -n1)"
    return 0
  fi

  print "AWS CLI not found — installing AWS CLI v2..."
  tmpdir=$(mktemp -d)
  curl -sS "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "$tmpdir/awscliv2.zip"
  unzip -q "$tmpdir/awscliv2.zip" -d "$tmpdir"
  sudo "$tmpdir/aws/install" -i /usr/local/aws-cli -b /usr/local/bin
  rm -rf "$tmpdir"
  print "AWS CLI installed: $(aws --version 2>&1 | head -n1)"
}

ensure_node_npm() {
  if command -v npm >/dev/null 2>&1; then
    print "npm found: $(npm --version)"
    return 0
  fi

  print "npm not found — installing Node.js 18 and npm via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  print "node: $(node -v), npm: $(npm --version)"
}

load_env_file() {
  if [ -f "$ROOT_DIR/.env" ]; then
    print "Loading environment from .env"
    # Export variables for child processes
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.env"
    set +a
  else
    print ".env not found in project root ($ROOT_DIR)"
  fi
}

validate_aws_creds() {
  if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
    print "AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set after sourcing .env"
    return 1
  fi

  if ! aws sts get-caller-identity >/dev/null 2>&1; then
    print "aws sts get-caller-identity failed — supplied credentials invalid or network issue"
    return 1
  fi
  print "AWS credentials valid for account: $(aws sts get-caller-identity --query Account --output text)"
  return 0
}

run_npm_install() {
  if [ -f "$ROOT_DIR/package.json" ]; then
    print "Running npm install in project root"
    (cd "$ROOT_DIR" && npm install)
  else
    print "package.json not found — skipping npm install"
  fi
}

run_aws_setup() {
  print "Running AWS setup (this will delete and recreate Cognito pools and DynamoDB tables)"
  # Use load-env wrapper so .env is exported to the child process
  bash "$ROOT_DIR/scripts/load-env.sh" bash "$ROOT_DIR/scripts/aws-setup.sh" --reset
}

main() {
  print "Starting preflight — this will install tools and provision AWS resources (destructive)."

  ensure_aws_cli
  ensure_node_npm
  load_env_file

  if validate_aws_creds; then
    run_npm_install
    run_aws_setup
    print "Preflight completed successfully."
  else
    print "Preflight failed: AWS credentials invalid or missing. Aborting."
    exit 1
  fi
}

main "$@"
