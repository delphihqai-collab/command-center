#!/usr/bin/env bash
# Command Center — systemd user service setup
# Run once to install and enable the service.

set -euo pipefail

SERVICE_NAME="command-center"
SERVICE_FILE="$(dirname "$0")/${SERVICE_NAME}.service"
USER_UNITS="$HOME/.config/systemd/user"

echo "→ Creating systemd user directory..."
mkdir -p "$USER_UNITS"

echo "→ Copying service file..."
cp "$SERVICE_FILE" "$USER_UNITS/${SERVICE_NAME}.service"

echo "→ Reloading systemd user daemon..."
systemctl --user daemon-reload

echo "→ Enabling service (auto-start on login)..."
systemctl --user enable "$SERVICE_NAME"

echo "→ Starting service..."
systemctl --user start "$SERVICE_NAME"

echo "→ Status:"
systemctl --user status "$SERVICE_NAME" --no-pager

echo ""
echo "Done. Access at http://localhost:9069 or via Tailscale."
echo ""
echo "Useful commands:"
echo "  systemctl --user status $SERVICE_NAME"
echo "  systemctl --user restart $SERVICE_NAME"
echo "  journalctl --user -u $SERVICE_NAME -f"
