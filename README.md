# 🚀 SiteScope Development Guide  

This guide explains how we (you + ChatGPT) will build **SiteScope** step by step without losing track of code, files, or features.  

---

## 📂 Project Structure  

```
sitescope/
│
├── backend/          # Node.js/Express backend (API, ping service, alerts)
│   ├── server.js
│   └── services/
│       └── PingService.js
│
├── frontend/         # React frontend (UI dashboard, forms, results)
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   └── package.json
│
├── docs/             # Documentation, notes, drafts
│   └── README.md     # This file
│
└── .git/             # Git version control (optional but recommended)
```

---

## 🛠 Development Flow  

### 1. Start with Prototyping

---

### 2. **Isolated Steps Syntax**  

When asking ChatGPT for code, use prompts like:  

- **New file:**  
  > “Create a file `backend/server.js` with a minimal Express API server.”  

- **Update file:**  
  > “Update `frontend/src/App.jsx` so it calls `/api/ping` and shows the result.”  

- **Bug fix:**  
  > “Here’s the error log from `PingService.js`. Fix only that file.”  

This keeps backend & frontend separate, avoids confusion.  

---

### 3. **Error Handling**  

If you hit an error:  

1. Copy the **error message**.  
2. Paste the **relevant file** (not all files).  
3. Say:  
   > “Here’s my error in `backend/server.js` at line 22. Please fix.”  

⚡ We only debug the **broken part**, not the whole project.  

---

### 4. **Version Control (Git)**  

Set up Git once inside `sitescope/`:  

```bash
git init
git add .
git commit -m "Initial commit"
```

After each working feature:  

```bash
git add .
git commit -m "✅ Added frontend ping form"
```

If ChatGPT suggestion breaks things, rollback:  

```bash
git reset --hard HEAD~1
```

---

### 5. **Prompt Strategy (Different Functions = Different Prompts)**  

Keep prompts clean:  

- **Backend API requests** → in one chat thread.  
- **Frontend UI updates** → in another chat thread.  
- **Docs & strategy** → here in this main chat.  

This way, files never get mixed up.  

---

### 6. **Checklist Tracking**  

We’ll maintain a progress list:  

- [x] Backend: basic ping service  
- [x] Frontend: input form + show status  
- [ ] Email alert system  
- [ ] Database for history  
- [ ] Deployment (Heroku/Vercel)  

You update it after each working feature.  

---

## ✅ Golden Rules  

1. **Never overwrite everything at once** → only update the file in question.  
2. **Always commit working code** → use Git to save progress.  
3. **Ask for minimal changes** → backend fix, frontend update, etc.  
4. **If stuck** → share error + file only, not the whole project.  
5. **Keep docs** → use `/docs` for notes, drafts, and decisions.  

---

This way, we can scale SiteScope from a quick **prototype** → to a full **production SaaS** step by step, without chaos.  
