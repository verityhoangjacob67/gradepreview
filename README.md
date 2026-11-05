# GradePreview for StudentVUE

## Install in Chrome

1. Download this repository using **Code → Download ZIP**, then extract it to a permanent folder.
2. Open `chrome://extensions`.
3. Enable **Developer mode**, click **Load unpacked**, and select the folder containing `manifest.json`.
4. Refresh StudentVUE. Open **Grade Book** and choose a class. Click **What if** beside an assignment's points to reveal its small score editor. A separate **What-if grade** appears directly below the actual grade.

## Use

The calculator appears within the class page and automatically reads loaded assignments. Open **Grid** beside the category chart to load the Grade Calculation Summary; weights update automatically while your scenario is unchanged. Clear assignment filters and load all assignment rows/pages. Use **Refresh from gradebook** when you want to replace your scenario with the latest loaded grades. The extension matches cells to their header IDs across Synergy's separate header and body tables, including categories hidden by the narrow layout. Verify the imported row count and values. Ungraded rows retain their possible points, with blank earned scores. Work labeled Not For Grading, Excused, or Excluded is unchecked.

Category weights are imported from the Grade Calculation Summary and weighted mode is selected automatically when weights are available. Imported assignment totals are compared with each summary category; mismatches produce a warning. If weights are unavailable, the calculator warns you: select Grid and import again, or enter weights manually. Use Total points only for classes graded by total points. Categories with no graded points are omitted and remaining weights are normalized.

Assignment editors start collapsed. Click **What if** to open one, then edit earned or possible points in its small box. The opener hides while editing. Click × or press Escape to close it; your edits remain applied and appear in the button label. The large panel stays closed. Changed boxes are highlighted and have a per-assignment **Reset**. Include or exclude assignments using the Count column in More options. Blank earned scores are ignored; zero counts. The preview below your actual grade shows the estimated percentage, plus a warning when inputs or loaded data need checking. Your official grade and assignment scores remain untouched.

The Category column uses a dropdown of the imported class categories.

**More options**, inside the what-if grade box, opens the optional advanced calculator for adding hypothetical assignments, setting weights, or refreshing data. **Reset changes** beneath the preview restores imported scores, weights, and grading mode. Switching classes keeps a separate draft for each class during the current page session. Changed scenarios are preserved when the portal updates, with a prompt to refresh. These drafts disappear on a full page reload. There are no scenario saving controls or persistent storage permissions.

Estimates do not implement dropped scores, standards grading, teacher-specific rules, or official rounding. Verify the baseline against StudentVUE before using a prediction. The live markup and summaries were inspected in two classes. Automated tests use synthetic fixtures matching the split-table markup and exercise import and calculator interactions, including class switching. This package has not been installed and tested inside Chrome yet. The Codex sidebar was used for inspection; install this extension in Chrome to run it.

## Privacy

Only this district's HTTPS portal is matched. There are no network requests, analytics, remote dependencies, or credential access. The extension requests no extension API permissions. Entered/imported grades are kept only in memory during the page session. No actual student data is bundled.

## Files

Manifest V3, plain JavaScript; no build step. `core.js` contains calculation and point parsing; `importer.js` reads gradebook DOM; `content.js` adds an isolated interface on the portal. `popup.html` provides a portal shortcut. This is an independent extension, unaffiliated with the district or Edupoint.

## Updating an earlier version

Replace the old extension folder's files with this version. At `chrome://extensions`, click the extension's Reload button, then refresh StudentVUE. Older saved scenarios are no longer read by this version.

## Development checks

Run `npm install`, then `npm test`. Test fixtures use synthetic grades and include no student identifiers. The extension itself has no runtime dependencies or build step.
