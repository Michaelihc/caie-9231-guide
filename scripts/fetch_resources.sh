#!/usr/bin/env bash
# Re-download 9231 past papers (2002-2025) and syllabi/formula lists into resources/.
set -euo pipefail
cd "$(dirname "$0")/.."
B=https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload
while read -r f; do
  y=20$(echo "$f" | sed -E 's/9231_[a-z]([0-9]{2})_.*/\1/')
  mkdir -p "resources/papers/$y"
  [ -s "resources/papers/$y/$f" ] || echo "$B/$f resources/papers/$y/$f"
done < scripts/paper_list.txt | xargs -P 12 -n 2 sh -c 'curl -sS --retry 4 --max-time 120 -o "$1" "$0"'

S=resources/syllabus; mkdir -p $S
get() { [ -s "$S/$1" ] || curl -sSL --http1.1 --retry 3 --max-time 120 -o "$S/$1" "$2"; }
get 9231_y23-25_sy.pdf https://www.cambridgeinternational.org/Images/597381-2023-2025-syllabus.pdf
get 9709_y20-22_sy.pdf https://www.cambridgeinternational.org/Images/415060-2020-2022-syllabus.pdf
get 9709_y23-25_sy.pdf https://www.cambridgeinternational.org/Images/597421-2023-2025-syllabus.pdf
get 9231_y20-22_sy.pdf https://www.cambridgeinternational.org/Images/414957-2020-2022-syllabus.pdf
get 9231_2020_syllabus_change_outline.pdf https://www.cambridgeinternational.org/images/syllabus-outline-further-mathematics-9231-final.pdf
get MF19_list_of_formulae.pdf https://www.cambridgeinternational.org/Images/417318-list-of-formulae-and-statistical-tables.pdf
get MF10_list_of_formulae.pdf https://www.cambridgeinternational.org/images/344616-list-of-formulae-and-statistical-tables.pdf
get 9231_y16_sy.pdf https://cienotes.com/wp-content/uploads/2018/06/9231_y16_sy.pdf
get 9231_y17-18_sy.pdf https://cienotes.com/wp-content/uploads/2018/06/9231_y17-18_sy.pdf
get 9231_y19_sy.pdf "https://pastpapers.co/cie/A-Level/Mathematics-9280/Syllabus%20%26%20Specimen/9231_y19_sy.pdf"
get 9231_y20-22_su.pdf "https://pastpapers.co/cie/A-Level/Mathematics-Further-9231/Syllabus%20%26%20Specimen/9231_y20-22_su.pdf"
echo "papers: $(find resources/papers -name '*.pdf' | wc -l)  syllabus files: $(ls $S | wc -l)"
