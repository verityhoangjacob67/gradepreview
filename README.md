# GradePreview for StudentVUE

Use the same calculator as a Chrome extension, a Firefox extension (Firefox 140+), or a self-contained userscript. Choose one installation method per browser profile.

## Install in Chrome

1. Download this repository using **Code → Download ZIP**, then extract it to a permanent folder.
2. Open `chrome://extensions`.
3. Enable **Developer mode**, click **Load unpacked**, and select the folder containing `manifest.json`.
4. Refresh StudentVUE. Open **Grade Book** and choose a class. Click **What if** beside an assignment's points to reveal its small score editor. A separate **What-if grade** appears directly below the actual grade.

## Install in Firefox

For temporary development installation:

1. Download and extract this repository.
2. Open `about:debugging#/runtime/this-firefox` in Firefox 140 or newer.
3. Click **Load Temporary Add-on**, then select the root `manifest.json`.
4. Open or refresh StudentVUE and choose a class in Grade Book.

Temporary add-ons are removed when Firefox restarts. Permanent installation in standard Firefox requires a Mozilla-signed add-on; this repository is not yet signed or published on Firefox Add-ons. See [Mozilla's signing documentation](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/). The manifest includes a stable Firefox add-on ID and declares no data collection, following [Mozilla's manifest reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings).

## Install as a userscript

1. Install a userscript manager such as Tampermonkey or Violentmonkey for your browser.
2. Download this repository and open `userscript/gradepreview.user.js` in a text editor.
3. Create a new script in the manager, replace its template with the **entire file**, and save.
4. Refresh StudentVUE. The same row editors and grade preview appear without the standalone extension.

Because this repository is private, a raw GitHub URL may not be accessible to a script manager. Copying the downloaded file avoids that issue. There is no remote `@require`, automatic update URL, or dependency download. Install updated versions by replacing the script contents. The script uses `@grant none`, runs at `document-idle`, and is limited to the district portal and the top-level page; see [Tampermonkey metadata documentation](https://www.tampermonkey.net/documentation.php). Turn off the standalone extension if you choose the userscript. Duplicate UI is guarded against, but running a single version avoids an older copy taking precedence.

## Use

The calculator appears within the class page and automatically reads loaded assignments. Open **Grid** beside the category chart to load the Grade Calculation Summary; weights update automatically while your scenario is unchanged. Clear assignment filters and load all assignment rows/pages. Use **Refresh from gradebook** when you want to replace your scenario with the latest loaded grades. The extension matches cells to their header IDs across Synergy's separate header and body tables, including categories hidden by the narrow layout. Verify the imported row count and values. Ungraded rows retain their possible points, with blank earned scores. Work labeled Not For Grading, Excused, or Excluded is unchecked.

Category weights are imported from the Grade Calculation Summary and weighted mode is selected automatically when weights are available. Imported assignment totals are compared with each summary category; mismatches produce a warning. If weights are unavailable, the calculator warns you: select Grid and import again, or enter weights manually. Use Total points only for classes graded by total points. Categories with no graded points are omitted and remaining weights are normalized.

Assignment editors start collapsed. Click **What if** to open one, then edit earned or possible points in its small box. The opener hides while editing. Click × or press Escape to close it; your edits remain applied and appear in the button label. The large panel stays closed. Changed boxes are highlighted and have a per-assignment **Reset**. Include or exclude assignments using the Count column in More options. Blank earned scores are ignored; zero counts. The preview below your actual grade shows the estimated percentage, plus a warning when inputs or loaded data need checking. Your official grade and assignment scores remain untouched.

The Category column uses a dropdown of the imported class categories.

**More options**, inside the what-if grade box, opens the optional advanced calculator for adding hypothetical assignments, setting weights, or refreshing data. **Reset changes** beneath the preview restores imported scores, weights, and grading mode. Switching classes keeps a separate draft for each class during the current page session. Changed scenarios are preserved when the portal updates, with a prompt to refresh. These drafts disappear on a full page reload. There are no scenario saving controls or persistent storage permissions.

Estimates do not implement dropped scores, standards grading, teacher-specific rules, or official rounding. Verify the baseline against StudentVUE before using a prediction. The live markup and summaries were inspected in two classes. Automated tests run both the extension scripts and the userscript against synthetic fixtures, including inline editing, reset, category selection, and class switching. Tests also check userscript isolation, duplicate injection, and site restriction. Live installation in Firefox and userscript managers has not yet been verified.

## Privacy

Only this district's HTTPS portal is matched. There are no network requests, analytics, remote dependencies, or credential access. The extension requests no extension API permissions. Entered/imported grades are kept only in memory during the page session. No actual student data is bundled.

## Files

Manifest V3, plain JavaScript. The root extension files work directly in Chrome and Firefox without a build step. `core.js` contains calculation and point parsing; `importer.js` reads gradebook DOM; `content.js` adds an isolated interface on the portal. `popup.html` provides an extension toolbar shortcut. `scripts/build.cjs` combines these same source files into `userscript/gradepreview.user.js`, keeping helper objects private to the userscript. This is an independent project, unaffiliated with the district or Edupoint.

## Updating an earlier version

Replace the old extension folder's files with this version. At `chrome://extensions`, click the extension's Reload button, then refresh StudentVUE. Older saved scenarios are no longer read by this version.

## Development checks

Run `npm install`, `npm run build`, then `npm test`. After changing source files, regenerate and commit the userscript using `npm run build`. The tests verify that the checked-in userscript matches its sources. Test fixtures use synthetic grades and include no student identifiers. The extension and generated userscript have no runtime dependencies.
