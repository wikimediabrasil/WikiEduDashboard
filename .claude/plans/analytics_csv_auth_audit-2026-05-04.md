# Analytics CSV endpoints — missing auth gates

Surfaced 2026-05-04 while auditing instructor `real_name` privacy. Tackle
separately from the real_name fix.

**Update 2026-05-04:** `tagged_courses_csv` is now admin-gated.
`all_courses_csv` now filters out private courses for non-admins,
mirroring `all_courses` JSON. The `monthly_report` branch of `results`
is now admin-only via an inline `require_admin_permissions` guard
inside the action (the conditional-`before_action` approach collided
with the existing `tagged_courses_csv` callback — Rails dedupes
`before_action` registrations by callback name). `index`, `usage`,
and the other branches of `results` (`campaign_intersection`,
`ores_changes`) remain anonymous-reachable.

## The gap

`AnalyticsController` (`app/controllers/analytics_controller.rb`) only
requires sign-in on `:ungreeted` and admin on `:tagged_courses_csv`
(after the recent fix). Every other action — including the
all-courses CSV download — is still reachable anonymously.

```ruby
class AnalyticsController < ApplicationController
  layout 'admin'                                # cosmetic, not auth
  before_action :require_signed_in, only: :ungreeted
  before_action :require_admin_permissions, only: :tagged_courses_csv
  ...
end
```

Routes (`config/routes.rb:273–281`):

| Route | Action | Auth | Notes |
|---|---|---|---|
| `GET /analytics(/*any)` | `index` | none | admin form UI |
| `POST /analytics(/*any)` | `results` | inline guard | `monthly_report` branch admin-only (fixed 2026-05-04); other branches anonymous |
| `GET /usage` | `usage` | none | aggregate stats only — low risk |
| `GET /ungreeted` | `ungreeted` | signed-in | CSV — fine |
| `GET /tagged_courses_csv/:tag` | `tagged_courses_csv` | **admin** | fixed 2026-05-04 |
| `GET /all_courses_csv` | `all_courses_csv` | inline filter | non-admins get only `Course.nonprivate` — fixed 2026-05-04, mirrors `all_courses` JSON |
| `GET /all_courses` | `all_courses` | inline filter | non-admins get only `Course.nonprivate` (line 63) — OK by design |
| `GET /all_campaigns` | `all_campaigns` | none | all campaigns — probably fine, campaigns are public |

## What the CSVs contain

### `tagged_courses_csv` (`lib/analytics/tagged_courses_csv_builder.rb`) — fixed

Columns: `Courses, Institution/Term, Wiki_Expert, Instructor, Recent_Edits,
Words_Added, Refrences_Added, Views, Editors, Start_Date`. The `Instructor`
column is the instructor's real_name. Endpoint is now admin-only, so this
is fine to keep — admins can see real_names by policy. Originally a
leak both because of the real_name column and because tags are private
data (so the whole CSV — course list under a tag — was admin-only material).

### `all_courses_csv` (`lib/analytics/course_csv_builder.rb` via `CampaignCsvBuilder`) — fixed

Columns are course metadata only (`course_slug, title, institution, term,
home_wiki, created_at, start_date, end_date, new_or_returning, editors,
…training_completion_rate`). No real_name, no email. Originally `nil`
campaign resolved to `AllCourses` and dumped every row from the `courses`
table including `private: true`. Fix 2026-05-04: controller now passes
`CampaignCsvBuilder::AllNonprivateCourses` (new sibling of `AllCourses`)
for non-admins. Mirrors the `all_courses` JSON endpoint's filter.

## Fix sketch (remaining work)

The form-UI actions (`index`, `results`, `usage`) remain anonymous-reachable.
The form UI at `/analytics` and the `monthly_report` /
`campaign_intersection` results page are useful only with admin tooling;
`/usage` is bare aggregate counts (low risk). `campaign_intersection`
in particular could surface private courses that appear in two campaigns.

If gating, the per-action whitelist pattern matches what's already in
place; alternately a controller-level `require_admin_permissions` with
`skip_before_action` carve-outs for the WMF-facing `:all_courses` and
`:all_campaigns` JSON endpoints would cover everything in one move. The
existing `analytics_controller_spec.rb` would need updating — it
currently asserts these endpoints return 200 anonymously, baking in
the leak as a tested invariant.

## Out of scope here

- Already fixed in the same branch: instructor `real_name` leaks in
  `active_courses/index.json.jbuilder`, `courses_by_wiki/show.json.jbuilder`,
  `unsubmitted_courses/_row.html.haml`, `courses/search.json.jbuilder`,
  `campaigns/active_courses.jbuilder`, `campaigns/_course_row.html.haml`.
- The `tagged_courses_csv_builder.rb:29` real_name column is left in
  place; now that the controller is admin-gated, that column is fine
  to keep (admins can see real_names by policy).
