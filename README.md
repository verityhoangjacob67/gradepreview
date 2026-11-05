# GradePreview for StudentVUE

Preview how a different assignment or test score would affect your grade, right inside StudentVUE.

Works with the [Anoka-Hennepin StudentVUE portal](https://synergyportal.anoka.k12.mn.us/) as a **Chrome extension**, **Firefox extension**, or **userscript**.

## What it does

- Adds a **What-if grade** below your actual grade.
- Lets you try scores in a small editor beside each assignment.
- Uses your class's grading categories and weights.
- Supports hypothetical assignments and one-click resets.

## Install

Choose one installation method per browser.

### Userscript

1. Install Tampermonkey or Violentmonkey in your browser.
2. [Open the userscript](https://raw.githubusercontent.com/verityhoangjacob67/gradepreview/main/userscript/gradepreview.user.js) and confirm installation in your script manager.
3. Refresh StudentVUE.

If the link opens as plain text, create a new script in your manager, paste the entire file, and save.

### Chrome

1. [Download the repository](https://github.com/verityhoangjacob67/gradepreview/archive/refs/heads/main.zip) and extract it to a permanent folder.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Refresh StudentVUE.

### Firefox

Requires Firefox 140 or newer. This is a temporary installation.

1. Download and extract the repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `manifest.json`.
4. Refresh StudentVUE.

Firefox removes temporary add-ons when it restarts. The userscript is another option for Firefox.

## Try a score

1. Open **Grade Book** and choose a class.
2. Click **What if** beside an assignment's points.
3. Change the earned or possible points. The preview updates immediately.
4. Click **×** or press **Escape** to close the editor. Your changes stay applied.

Use **Reset** inside an editor to restore that assignment, or **Reset changes** below the grade preview to start over.

**More options** lets you add hypothetical assignments, choose categories, adjust weights, and refresh grades from the page.

## If the preview looks wrong

- Clear assignment filters and load all rows or pages.
- Open **Grid** beside the category chart to load the grading summary.
- Choose **More options → Refresh from gradebook** to start from the latest loaded scores.
- Check that the grading method and weights match your class.

The preview is an estimate. Dropped scores, standards-based grading, teacher-specific rules, and official rounding can produce different results. Blank scores are excluded; zero counts as a score.

## Privacy

Your official grades are never changed. Scores stay in memory during the page session; reloading the page clears your what-if changes. There are no accounts, analytics, or uploads of your grades.

This project is independent of Anoka-Hennepin and Edupoint.

<details>
<summary><strong>Development and updates</strong></summary>

The extension uses plain JavaScript and needs no build step. To regenerate the userscript and run the tests:

```sh
npm install
npm run build
npm test
```

The tests use synthetic grades and cover the extension and userscript. Live Firefox and userscript-manager installation has not yet been verified.

After editing source files, regenerate and commit `userscript/gradepreview.user.js`. The tests check that it matches the source.

To update an installed extension, replace its files, reload it in the browser's extension manager, and refresh StudentVUE. To update the userscript, install the latest file again.

</details>
