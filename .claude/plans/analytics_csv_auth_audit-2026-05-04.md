# Analytics CSV endpoints — missing auth gates

Surfaced 2026-05-04 while auditing instructor `real_name` privacy. Tackle
separately from the real_name fix.

## The gap

`AnalyticsController` (`app/controllers/analytics_controller.rb`) only
requires sign-in on `:ungreeted` (line 13). Every other action — including
two CSV downloads — is reachable anonymously.

```ruby
class AnalyticsController < ApplicationController
  layout 'admin'                                # cosmetic, not auth
  before_action :require_signed_in, only: :ungreeted
  ...
end
```

Routes (`config/routes.rb:273–281`):

| Route | Action | Auth | Notes |
|---|---|---|---|
| `GET /analytics(/*any)` | `index` | none | admin form UI |
| `POST /analytics(/*any)` | `results` | none | runs `monthly_report` / `campaign_intersection` |
| `GET /usage` | `usage` | none | aggregate stats only — low risk |
| `GET /ungreeted` | `ungreeted` | signed-in | CSV — fine |
| `GET /tagged_courses_csv/:tag` | `tagged_courses_csv` | **none** | **leaks instructor real_name + course list under a private tag** |
| `GET /all_courses_csv` | `all_courses_csv` | **none** | leaks existence of every course (including private), with their tag |
| `GET /all_courses` | `all_courses` | inline filter | non-admins get only `Course.nonprivate` (line 63) — OK by design |
| `GET /all_campaigns` | `all_campaigns` | none | all campaigns — probably fine, campaigns are public |

## What the CSVs contain

### `tagged_courses_csv` (`lib/analytics/tagged_courses_csv_builder.rb`)

Columns: `Courses, Institution/Term, Wiki_Expert, Instructor, Recent_Edits,
Words_Added, Refrences_Added, Views, Editors, Start_Date`.

- `Instructor` column is `course.courses_users.where(role: 1).first&.real_name`
  (line 29) — **instructor real_name leak**.
- The endpoint also takes `:tag` and lists every course tagged with it.
  Per Sage 2026-05-04: tags are private data, so the *whole CSV* — not
  just the real_name column — is admin-only material.

### `all_courses_csv` (`lib/analytics/course_csv_builder.rb` via `CampaignCsvBuilder.new(nil)`)

Columns are course metadata only (`course_slug, title, institution, term,
home_wiki, created_at, start_date, end_date, new_or_returning, editors,
…training_completion_rate`). No real_name, no email. **But** `nil`
campaign resolves to `AllCourses`, so this dumps every row from the
`courses` table — including `private: true` courses. The companion
`all_courses` JSON action explicitly filters private courses for
non-admins; the CSV does not.

## Fix sketch

Two-part:

1. **Lock down the controller.** Either add
   `before_action :require_admin_permissions` for the whole controller (and
   carve out the WMF-facing JSON actions `:all_courses` and `:all_campaigns`,
   which are documented as community-data endpoints), or whitelist only
   those two as `skip_before_action`. Match whatever pattern the rest of
   the admin-only controllers use (e.g. `tagged_courses_controller.rb`
   uses `before_action :require_admin_permissions`).

2. **Decide the policy on `all_courses_csv`.** Either gate it admin-only,
   or — to mirror `all_courses` JSON — make the underlying scope respect
   `private` for non-admins. Admin-only is simpler given that this is
   already an "admin tools" controller in spirit.

## Tests to add

- Spec hitting `/tagged_courses_csv/foo` and `/all_courses_csv`
  unauthenticated → expects redirect / 401, not a 200 CSV body.
- Spec confirming admin can still pull both.

## Out of scope here

- Already fixed in the same branch: instructor `real_name` leaks in
  `active_courses/index.json.jbuilder`, `courses_by_wiki/show.json.jbuilder`,
  `unsubmitted_courses/_row.html.haml`, `courses/search.json.jbuilder`,
  `campaigns/active_courses.jbuilder`, `campaigns/_course_row.html.haml`.
- The `tagged_courses_csv_builder.rb:29` real_name column is left in
  place; once the controller is admin-gated, that column is fine to keep
  (admins can see real_names by policy).
