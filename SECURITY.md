# Security Policy for Cygnis AI

## Supported Versions

This project is primarily maintained on the `main` branch. We currently do **not** publish stable versioned releases. Security updates are applied to the `main` branch.

| Branch / Tag        | Supported            |
|----------------------|---------------------|
| main                 | :white_check_mark:  |
| Tagged releases (if any) | :x:            |
| Archived versions    | :x:                 |

> If we begin to publish tagged versions (e.g. v1.0.0), this table will be updated accordingly.

---

## Reporting a Vulnerability

We take security seriously. Please report responsibly.

**Preferred methods:**

- **GitHub Security Advisory (private)** — for private reporting.  
- **Email:** `security@cygnis.ai` — use this if you cannot open a GitHub advisory.

**What to include:**

- Affected commit SHA / branch  
- Detailed steps to reproduce  
- Proof of concept or minimal exploit (if safe)  
- Impact assessment  
- Your preferred disclosure timeline (e.g. embargo period)  

**Do not publish public issues with exploit code.**

---

## Handling Reports and Fixes

1. **Acknowledgement** — within 3 business days  
2. **Initial assessment** — within 7 calendar days  
3. **Fix & Coordination** — if confirmed, we will:
   - Create a patch or mitigation
   - Coordinate disclosure timeline (default 30-day embargo)
   - Publish advisory and request CVE if applicable  

If no response occurs in these timelines, feel free to follow up.

---

## Scope

**In-scope:**

- Code and configuration files in this repository: e.g. `src/`, `next.config.js`, `firebase.json`, `.env.example`  
- API endpoints, database queries, authentication logic  
- Frontend/backend integration, if present

**Out-of-scope:**

- Third-party dependencies (report them upstream)  
- Misconfigurations external to this repo  

---

## Best Practices & Mitigations

- Maintain a `.env.example` without secrets, but with all required variable names.  
- Store real secrets in environment variables (Vercel, Firebase, etc.), not in code.  
- Rotate API keys or credentials upon any suspected leak.  
- Use signed commits and branch protection.  
- Enable dependency scanning (Dependabot) and require security updates.  

---

_Last updated: 2025-10-30_
