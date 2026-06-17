# Surrey Contracting Limited — Content Management Training Manual

**System:** Sanity Studio  
**Studio URL:** https://surreycontracting.sanity.studio  
**Website:** https://surreycontracting.co.uk  

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Projects / Case Studies](#2-projects--case-studies)
3. [Publishing, Drafts & Unpublishing](#3-publishing-drafts--unpublishing)
4. [Writing Style Guide](#4-writing-style-guide)

---

## 1. Getting Started

### 1.1 Logging In

1. Open your browser and go to **https://surreycontracting.sanity.studio**
2. Click **Log in** and sign in with the email address you were invited with.
3. You will land on the **Desk** view — the main editing interface.

> **First time?** Check your email for an invitation from Sanity. Click "Accept invitation" before trying to log in.

### 1.2 The Sidebar

The left sidebar shows the content sections available to you:

| Section | What it contains |
|---|---|
| **Projects / Case studies** | All project pages shown on the website under /projects |

### 1.3 Drafts vs Published

Sanity uses a **draft/publish** workflow:

- Every document starts as a **Draft** — not visible on the live website.
- When you click **Publish**, the content goes live on the website within a few minutes.
- You can edit a published document freely — your changes stay as a Draft until you publish again.
- The live website always shows the last **published** version, never the draft.

---

## 2. Projects / Case Studies

Projects are the case study pages shown at **surreycontracting.co.uk/projects** and on individual project pages. Each project becomes its own page on the website.

### 2.1 Creating a New Project

1. In the left sidebar, click **Project / Case study**.
2. Click the **pencil/compose icon** (top right of the list) or the **"+ New"** button.
3. A blank document opens on the right. Fill in the fields — see the field reference below.
4. When ready to go live, click **Publish** (blue button, top right).

### 2.2 Field Reference

#### Title `[Required]`
The project name shown as the page heading and in cards on the projects listing.

- Example: `Tarmac Driveway, Fetcham, Surrey`
- Keep it descriptive but concise — it appears in Google search results.

#### Slug (URL) `[Required]`
The web address for this project page, e.g. `/projects/tarmac-driveway-fetcham`.

- Click **Generate** to auto-create from the Title.
- Use only lowercase letters, numbers, and hyphens. No spaces.
- **Warning:** Once a project is published and live, do not change the slug. Changing it breaks any existing links or bookmarks to that page.

#### Categories `[Required]`
One or more service categories that describe this project. Used for the filter buttons on the projects listing page.

Select all that apply from:
- Drainage
- Driveways
- Earthworks
- Groundworks
- Hard Landscaping
- Surfacing

At least one category is required.

#### Sector `[Optional]`
The market sector for this project. Shown as a small tag on the project page hero.

Options: Residential · Commercial · Education · Commercial / Public Realm · Public Sector

#### Client `[Optional]`
The client name as shown in the "Project info" sidebar on the project page.
- Example: `Private residential` or `Sutton High School`

#### Location `[Optional]`
Where the project took place.
- Example: `Fetcham, Surrey` or `Sutton, London`

#### Services (short label) `[Optional]`
A brief summary of services used, shown in the project info card.
- Use a middle dot (·) to separate multiple services.
- Example: `Tarmac · Drainage`

#### Year `[Optional]`
The year the project was completed, e.g. `2023`. Shown in the project info card.
- If Duration is set, Year is hidden in favour of Duration.

#### Duration `[Optional]`
Used instead of Year when a project ran over a notable period.
- Example: `14 weeks`

#### Status `[Optional]`
Shown as a badge in the project info card. Defaults to `Completed`.

#### Summary `[Required]`
A short 1–2 sentence description of the project. Used in:
- Project cards on the listing page
- The large text below the project title on the project page
- Google search snippet

Keep it factual and specific — mention the service type, location, and a key detail (size, client type, etc.).

#### Hero Image `[Required]`
The large banner image shown at the top of the project page, and as the card photo on the listing page.

- Click the image field, then **Upload** to add a new image, or **Browse** to reuse one already uploaded.
- Best size: landscape, at least 1600 × 900 px.
- After uploading, fill in the **Alt text** field — describe what the image shows (important for accessibility and SEO).
- You can drag the hotspot circle to set which part of the image stays centred when it's cropped for cards.

#### Body `[Optional]`
The main written content of the project page. Supports rich text.

**Formatting options:**
- **Normal** paragraph text
- **H2** headings (use for sections like "The brief", "The delivery", "The outcome")
- **Bullet lists** (select lines, then click the bullet list button)
- Bold and italic via the toolbar

**Tip:** A good structure is:
```
H2: The project
[One or two paragraphs describing what was done]

H2: The delivery  
[Bullet list of key facts/quantities]

H2: The outcome
[A closing sentence on the result]
```

#### On-site Gallery `[Optional]`
Additional photos shown in the photo grid below the main body on the project page.

- Click **Add item** to upload each photo.
- The first photo is shown larger than the rest.
- Each photo has an optional **Caption** — a short label shown on the photo, e.g. `Surfacing, base course`.
- Alt text is also available per image.

#### Featured on Homepage `[Optional]`
Tick this box to flag the project for featured placement on the homepage (if the homepage is wired to show featured projects).

#### Sort Order `[Optional]`
A number that controls the order projects appear in the listing. Lower numbers appear first.
- Example: set `1` for the project you want shown first, `2` for second, etc.
- Projects without a sort order appear after numbered ones, sorted by date added.

### 2.3 Editing an Existing Project

1. Click **Project / Case study** in the sidebar.
2. Click the project you want to edit from the list.
3. Make your changes.
4. Click **Publish** to push changes live. Until you publish, the live website shows the previous version.

### 2.4 Warnings

- **Do not change the Slug** of a project that is already live — it will break the URL.
- **Hero Image is required** — publishing will fail without one.
- **Categories must have at least one selection** — publishing will fail if all categories are deselected.
- Deleting a project removes it from the website immediately once published. There is no recycle bin — if in doubt, unpublish instead of delete (see Section 3).

---

## 3. Publishing, Drafts & Unpublishing

### 3.1 Publishing a Document

Click the **Publish** button (blue, top right of the document). The website updates within a few minutes.

### 3.2 Saving a Draft Without Publishing

Simply close the document or navigate away — Sanity saves automatically. The draft is stored in Sanity but the live website is unchanged.

You can also click the dropdown arrow next to Publish and choose **Save as draft** explicitly.

### 3.3 Editing a Published Document

Open the document and make your changes. Sanity creates a new draft automatically. The live site is unchanged until you click **Publish** again.

### 3.4 Unpublishing a Document

To remove a project from the live website without deleting it:

1. Open the document.
2. Click the **three-dot menu** (⋮) next to the Publish button.
3. Choose **Unpublish**.

The document is removed from the live site but remains in Sanity as a draft so you can re-publish it later.

### 3.5 Discarding Draft Changes

If you've made changes you don't want to keep:

1. Click the **three-dot menu** (⋮) next to the Publish button.
2. Choose **Discard changes**.

This reverts the draft to the last published version.

---

## 4. Writing Style Guide

Follow these guidelines when writing content in Sanity to keep the website consistent.

### Tone
- Professional, clear, and straightforward.
- Avoid jargon where possible, but technical terms (tarmac, macadam, SMA, etc.) are fine when relevant — the audience understands them.
- Write in third person for project descriptions: "Surrey Contracting carried out..." not "We carried out..."

### Capitalisation
- Capitalise proper nouns: client names, place names, product names.
- Service types are lowercase unless starting a sentence: `tarmac`, `drainage`, `earthworks`.
- "Surrey Contracting" always in full — not "SC" or "Surrey C".

### Numbers and Measurements
- Use numerals for quantities: `120 tonnes`, `30sqm`, `14 weeks`.
- Spell out numbers at the start of a sentence: "One hundred and twenty tonnes..."

### Summaries
- One to two sentences maximum.
- Include: service type + location + one key fact (size, client, urgency, etc.).
- Example: `Emergency tarmac footpath repairs at Sutton High School, completed over a weekend to minimise disruption.`

### Hero Images
- Always fill in Alt text. Describe the photo factually: `Completed tarmac driveway with granite sett edging, West Humble` not `photo1`.
- Landscape orientation only.
- Show the finished work where possible — "after" photos make better hero images than "during" shots.

### Categories
- Always select the most specific category — if the project is primarily a driveway, select `Driveways` even if surfacing was involved.
- Select multiple categories only if the project genuinely covered both service areas substantially.

---

*Manual version: June 2026. For support, contact your web developer.*
