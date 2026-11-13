# Aerobic System Builder

A static, client-side two-week training planner for GitHub Pages.

## Files

- `index.html` — planner form, plan output, and page structure.
- `style.css` — responsive styling and print-to-PDF layout.
- `script.js` — plan rules, exercise selection, PDF import, and PDF export.
- `meal-planner.html`, `meal-planner.css`, and `meal-planner.js` — companion meal planner with TheMealDB recipe search, pantry-overlap planning, and editable grocery estimates.

Copy these three files into the root of a GitHub repository or its published `/docs` folder, then enable GitHub Pages for that location. The files use relative paths, so the page can be hosted under a project subpath.

For both pages, copy all six HTML/CSS/JavaScript files into the same published folder. Meal search needs internet access. It queries TheMealDB's public V1 API and links out to recipe sources. The meal budget is a transparent rough estimate (default $2.25 per person per dinner) that users can replace with their local basket total; ingredient links open Walmart search results, not live store prices. Nutrition tags are ingredient-based signals, not calculated nutrient data.

The main planner uses a deferred regular script, so plan generation also works when opening `index.html` directly. Replace `index.html` as well as `script.js`; the script tag change is what avoids module-loading restrictions during local preview.

## How the planner adapts

- **Availability:** selects a weekly template with aerobic, strength, and recovery days. Three-day plans combine short aerobic and strength blocks to retain two whole-body strength exposures. Seven available days still leaves a recovery option.
- **Time:** caps each session. Aerobic minutes are allocated across the planned sessions within the cap; the plan reports the resulting estimate rather than claiming to hit a target it cannot fit.
- **Experience:** adjusts sets, repetition ranges, effort targets, and the harder aerobic session. New or returning users get controlled intervals; the plan does not prescribe all-out sprinting.
- **Preferences:** chosen cardio modes and strength equipment are used when selecting activities and exercise variations.
- **Joint-support areas:** adds a small amount of nearby muscle, balance, or stability work. These selections are not an injury diagnosis or rehabilitation prescription.
- **Exercise details:** strength movements appear on separate lines. Hover or keyboard-focus a movement's information control for a movement-specific setup and action description, key muscle focus, and a form cue.
- **Weekend choice:** one long easy session is scheduled. The other weekend day shows an optional move-it alternative, so a user can choose Saturday or Sunday instead of adding a second long run.
- **Previous plan:** this planner's own printed PDF includes a text record that can carry over its weekly aerobic minutes and preferences. Other text PDFs are only scanned for activity terms. A PDF cannot tell whether its sessions were actually completed, so the person also selects how the prior plan felt.
- **Progression:** if a prior planner PDF is recognized, the feedback choice holds, slightly increases, or reduces its volume estimate. Without a recognized record, the planner uses the selected experience level and does not assume a previous workload.

## PDF behavior and privacy

“Save as PDF” opens the browser print dialog. Choose **Save as PDF** as the destination. The print stylesheet lays out each week as one seven-day row on landscape pages.

PDF import uses Mozilla PDF.js `6.5.438`, loaded from a version-pinned jsDelivr path only when a PDF is selected. The Content Security Policy restricts this external code to that version's build directory. The library runs in the browser and can access the page; PDF text is not intentionally sent to a server. The site has no upload endpoint, does not save the file, and does not store the extracted text. Import is limited to 10 MB, 30 pages, 200,000 extracted text characters, and a 20-second parsing window. Scanned/image-only or encrypted files may not provide readable text. PDF import needs an internet connection and an `https://` or local HTTP page; browsers may block the module library from a `file://` page. Plan generation and print export do not depend on PDF import.

Generated exercise details are escaped before being added to the page. Keep that rule if user-controlled content is added later. The policy is delivered as an HTML meta policy, so it cannot replace response-header protections such as frame-ancestor restrictions.

The aerobic planner saves the selected training level, weekly days, time cap, prior-plan feedback, activity preferences, joint-support choices, and whether a plan had been generated in this browser's local storage. On return, it restores those selections and rebuilds the plan. Uploaded PDFs and their extracted text are not saved. Browser storage may be unavailable or behave differently when the page is opened directly as a `file://` URL; the page reports when it cannot save.

## Training targets

Strength targets are shown on the plan cards: generally 2–3 sets per exercise, accessible repetition ranges, a few repetitions left in reserve, and rest between sets. Aerobic cards use conversational effort for easy work and controlled, repeatable effort for intervals. The site presents general adult activity guidance as a longer-term reference and allows lower starting workloads based on time and experience.

The planner is educational and intended for generally healthy adults. It cannot guarantee injury prevention. People with joint pain, recent surgery, or a diagnosed condition should get qualified advice before using exercise selections for that area.

## References

- [U.S. Physical Activity Guidelines: Questions and Answers](https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines/about-physical-activity-guidelines/questions-answers)
- [ACSM resistance-training guidance](https://acsm.org/resistance-training-guidelines-update-2026/)
- [Mozilla PDF.js documentation](https://mozilla.github.io/pdf.js/getting_started/)
