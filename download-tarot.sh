#!/bin/bash
# Rider-Waite Tarot Deck Downloader
# Public Domain / CC0 Sources

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/assets/tarot"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check dependencies
check_deps() {
    for cmd in curl unzip; do
        command -v $cmd &>/dev/null || error "$cmd is required but not installed"
    done
}

# Download from Itch.io CC0 (recommended for web/app dev)
download_itchio() {
    log "Downloading from Itch.io (CC0 License, 300x527px)..."
    local dest="$ASSETS_DIR/itchio-cc0"
    mkdir -p "$dest"

    # PNG version (higher quality, transparent)
    curl -L "https://luciellaes.itch.io/rider-waite-smith-tarot-cards-cc0" \
        -o "$dest/page.html" 2>/dev/null

    # Extract actual download URLs from the page
    local png_url=$(grep -oE 'https://[^"]+Cards-png\.zip' "$dest/page.html" 2>/dev/null | head -1)
    local jpg_url=$(grep -oE 'https://[^"]+Cards-jpg\.zip' "$dest/page.html" 2>/dev/null | head -1)

    rm -f "$dest/page.html"

    if [[ -z "$png_url" ]]; then
        warn "Itch.io requires manual download (anti-bot protection)"
        warn "Please download manually from: https://luciellaes.itch.io/rider-waite-smith-tarot-cards-cc0"
        warn "Save to: $dest/"
        return 1
    fi

    curl -L "$png_url" -o "$dest/Cards-png.zip"
    unzip -o "$dest/Cards-png.zip" -d "$dest/png"
    rm "$dest/Cards-png.zip"
    log "Itch.io CC0 download complete: $dest/png/"
}

# Download from Internet Archive (highest quality 400+ DPI)
download_archive() {
    log "Downloading from Internet Archive (400+ DPI, ~264MB)..."
    local dest="$ASSETS_DIR/archive-hires"
    mkdir -p "$dest"

    local base_url="https://archive.org/download/rider-waite-tarot"
    local metadata_url="https://archive.org/metadata/rider-waite-tarot/files"

    log "Fetching file list via metadata API..."
    curl -sL "$metadata_url" | grep -oE '"name":"[^"]+\.jpeg"' | grep -v thumb | sed 's/"name":"//;s/"//' > "$dest/filelist.txt"

    local total=$(wc -l < "$dest/filelist.txt" | tr -d ' ')
    log "Found $total PNG files to download"

    local count=0
    while read -r file; do
        count=$((count + 1))
        if [[ -f "$dest/$file" ]]; then
            echo -ne "\r[${count}/${total}] Skipping (exists): $file                    "
        else
            echo -ne "\r[${count}/${total}] Downloading: $file                    "
            curl -sL --retry 3 --retry-delay 2 -C - "$base_url/$file" -o "$dest/$file" || true
        fi
    done < "$dest/filelist.txt"

    echo ""
    rm "$dest/filelist.txt"
    log "Internet Archive download complete: $dest/"
    log "Total: $total cards (78 expected)"
}

# Download from Wikimedia Commons
download_wikimedia() {
    log "Downloading from Wikimedia Commons (Roses & Lilies 1909)..."
    local dest="$ASSETS_DIR/wikimedia-1909"
    mkdir -p "$dest"

    local api="https://commons.wikimedia.org/w/api.php"
    local category="Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)"

    # Get file list from category
    log "Fetching file list from Wikimedia..."
    curl -sL "${api}?action=query&list=categorymembers&cmtitle=${category}&cmlimit=100&cmtype=file&format=json" \
        -o "$dest/filelist.json"

    # Extract file names and download each
    local files=$(grep -oE '"title":"File:[^"]+' "$dest/filelist.json" | sed 's/"title":"File://')
    local total=$(echo "$files" | wc -l | tr -d ' ')

    log "Found $total files"

    local count=0
    echo "$files" | while read -r file; do
        count=$((count + 1))
        local encoded=$(echo "$file" | sed 's/ /_/g')
        local safe_name=$(echo "$file" | sed 's/[^a-zA-Z0-9._-]/_/g')

        # Get actual file URL
        local info=$(curl -sL "${api}?action=query&titles=File:${encoded}&prop=imageinfo&iiprop=url&format=json")
        local url=$(echo "$info" | grep -oE 'https://upload\.wikimedia\.org/[^"]+' | head -1)

        if [[ -n "$url" && ! -f "$dest/$safe_name" ]]; then
            echo -ne "\r[${count}/${total}] Downloading: $file          "
            curl -sL "$url" -o "$dest/$safe_name"
        fi
    done

    rm -f "$dest/filelist.json"
    echo ""
    log "Wikimedia download complete: $dest/"
}

# Main menu
show_menu() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║       Rider-Waite Tarot Deck Downloader                  ║"
    echo "║       Public Domain / CC0 Sources                        ║"
    echo "╠══════════════════════════════════════════════════════════╣"
    echo "║  1) Internet Archive  - 400+ DPI (~264MB) [RECOMMENDED]  ║"
    echo "║  2) Wikimedia Commons - 1909 Original Scans              ║"
    echo "║  3) Itch.io CC0       - 300x527px (Web-ready)            ║"
    echo "║  4) Download ALL sources                                 ║"
    echo "║  q) Quit                                                 ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
}

main() {
    check_deps
    mkdir -p "$ASSETS_DIR"

    if [[ $# -eq 1 ]]; then
        case "$1" in
            1|archive)  download_archive ;;
            2|wikimedia) download_wikimedia ;;
            3|itchio)   download_itchio ;;
            4|all)      download_archive; download_wikimedia; download_itchio ;;
            *)          error "Unknown option: $1" ;;
        esac
        exit 0
    fi

    while true; do
        show_menu
        read -p "Select option: " choice
        case "$choice" in
            1) download_archive ;;
            2) download_wikimedia ;;
            3) download_itchio ;;
            4) download_archive; download_wikimedia; download_itchio ;;
            q|Q) log "Bye!"; exit 0 ;;
            *) warn "Invalid option" ;;
        esac
    done
}

main "$@"
