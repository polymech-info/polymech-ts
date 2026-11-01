#!/bin/bash
# convert-videos.sh - Convert videos using HandBrakeCLI
# Usage: ./convert-videos.sh "input_pattern" [--preset "preset_name"]

# Exit on error, undefined variable, or pipe failure
set -euo pipefail

# Default values
PRESET="Fast 1080p30"
INPUT_PATTERN=""
TOTAL_FILES=0
CURRENT_FILE=0

# Print usage information
usage() {
    echo "Usage: $(basename "$0") INPUT_PATTERN [--preset PRESET]"
    echo
    echo "Arguments:"
    echo "  INPUT_PATTERN             Glob pattern for input files (e.g., '*.mp4' or 'videos/*.mkv')"
    echo "  --preset PRESET           HandBrake preset to use (default: 'Fast 1080p30')"
    echo
    echo "Example:"
    echo "  $(basename "$0") '*.mp4'"
    echo "  $(basename "$0") 'videos/*.mkv' --preset 'Very Fast 720p30'"
    exit 1
}

# Parse command line arguments
if [[ $# -lt 1 ]]; then
    usage
fi

INPUT_PATTERN="$1"
shift

while [[ $# -gt 0 ]]; do
    case "$1" in
        --preset)
            if [[ $# -gt 1 ]]; then
                PRESET="$2"
                shift 2
            else
                echo "Error: --preset requires a value" >&2
                usage
            fi
            ;;
        *)
            echo "Error: Unknown argument: $1" >&2
            usage
            ;;
    esac
done

# Check if HandBrakeCLI is installed
if ! command -v HandBrakeCLI &> /dev/null; then
    echo "Error: HandBrakeCLI is not installed or not in your PATH" >&2
    echo "Please install HandBrake CLI from https://handbrake.fr/downloads.php" >&2
    exit 1
fi

# Expand the input pattern and count files
mapfile -t FILES < <(find . -path "$INPUT_PATTERN" -type f 2>/dev/null || find "$INPUT_PATTERN" -type f 2>/dev/null || echo "$INPUT_PATTERN")
TOTAL_FILES=${#FILES[@]}

if [[ $TOTAL_FILES -eq 0 ]]; then
    echo "Error: No files match the pattern '$INPUT_PATTERN'" >&2
    exit 1
fi

echo "Found $TOTAL_FILES file(s) to convert using preset '$PRESET'"
echo

# Process each file
for input_file in "${FILES[@]}"; do
    ((CURRENT_FILE++))
    
    # Check if file exists and is readable
    if [[ ! -f "$input_file" || ! -r "$input_file" ]]; then
        echo "Warning: Cannot access file: $input_file - skipping"
        continue
    fi
    
    # Generate output filename with "-converted" suffix
    filename=$(basename -- "$input_file")
    extension="${filename##*.}"
    filename="${filename%.*}"
    dirname=$(dirname -- "$input_file")
    output_file="$dirname/$filename-converted.$extension"
    
    # Display progress
    echo -e "[$CURRENT_FILE/$TOTAL_FILES] Converting: $input_file"
    echo -e "                Output to: $output_file"
    
    # Run HandBrakeCLI
    HandBrakeCLI --preset="$PRESET" --input="$input_file" --output="$output_file" || {
        echo "Error: Failed to convert $input_file" >&2
        continue
    }
    
    echo -e "Completed: $output_file\n"
done

echo "Conversion complete! Processed $CURRENT_FILE of $TOTAL_FILES files."

