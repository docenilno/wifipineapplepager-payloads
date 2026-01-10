#!/bin/bash
# Title: Specific Loot Downloader
# Author: Rektile404
# Description: Tool used to add functionality to the virtual pager to extract specific loot
# Version: 1.0

CONFIG_PATH="/tmp/specific_loot"
CONFIG_FILE="config.json"
PAYLOAD="./payload.js"

VIRTUAL_PAGER_DIR="/pineapple/ui/"
INDEX_FILE="index.html"
BACKUP_INDEX_FILE="/rom/pineapple/ui/index.html"

mkdir -p "$CONFIG_PATH"
²
check_or_create_config() {
    local full_path="$CONFIG_PATH/$CONFIG_FILE"

    # Check if path exists
    if [ ! -f "$full_path" ]; then
        echo '{"enabled":false}' > "$full_path"
    fi

    # Check if valid JSON
    if ! jq empty "$full_path" >/dev/null 2>&1; then
        echo '{"enabled":false}' > "$full_path"
    fi

    # Check if enabled is inside of the config
    if ! jq -e '.enabled' "$full_path" >/dev/null 2>&1; then
        echo '{"enabled":false}' > "$full_path"
    fi
}

inject_payload() {
    local target_index="$VIRTUAL_PAGER_DIR/$INDEX_FILE"

    if [ -f "$PAYLOAD" ] && [ -f "$target_index" ]; then
        # Create a temporary file
        local tmpfile
        tmpfile=$(mktemp)

        # Read the index.html, inject payload after <head>
        awk -v payload="$PAYLOAD" '
        /<head>/ {
            print $0
            print "<!-- Specific Loot Script -->"
            print "<script>"
            while ((getline line < payload) > 0) print line
            print "</script>"
            print "<!-- --------------------- -->"
            next
        }
        { print $0 }
        ' "$target_index" > "$tmpfile"

        # Overwrite the original index.html
        mv "$tmpfile" "$target_index"
    fi
}



remove_payload() {
    local target_index="$VIRTUAL_PAGER_DIR/$INDEX_FILE"

    if [ -f "$BACKUP_INDEX_FILE" ]; then
        cp -f "$BACKUP_INDEX_FILE" "$target_index"
    fi
}


handle_menu() {
    local full_path="$CONFIG_PATH/$CONFIG_FILE"

    # Read current enabled value
    local enabled
    enabled=$(jq -r '.enabled' "$full_path")

    # Show prompt to user
    if [ "$enabled" = "true" ]; then
        LOG "Current state: ENABLED."
        LOG "Press 'A' to DISABLE!"
    else
        LOG "Current state: DISABLED."
        LOG "Press 'A' to ENABLE!"
    fi

    LOG "Press other to STOP!"

    button_pressed=$(WAIT_FOR_INPUT)

    case "$button_pressed" in
    "A") ;;
    *) 
        LOG "Exiting..."
        exit 0
        ;;
    esac

    # Toggle value
    if [ "$enabled" = "true" ]; then
        jq '.enabled = false' "$full_path" > "$full_path.tmp" && mv "$full_path.tmp" "$full_path"
        LOG "DISABLED! Removing payload..."
        remove_payload
    else
        jq '.enabled = true' "$full_path" > "$full_path.tmp" && mv "$full_path.tmp" "$full_path"
        LOG "ENABLED! Injecting payload..."
        inject_payload
    fi

    LOG "=========================="
}


check_or_create_config

LOG "=========================="
LOG "Specific Loot Picker"
LOG "By Rektile404"
LOG "=========================="

while true; do
    handle_menu
done
