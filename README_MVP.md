# 🚀 SiteScope MVP Development Guide

This is the **lightweight version** of SiteScope.  
Goal: Get a **working prototype in under 1 hour** → Add a website, check if it's up, display status, and send basic email alerts.

---

## 📂 Project Structure (MVP)

```
sitescope/
│
├── backend/                # FastAPI or Express backend (choose one)
│   ├── server.py           # FastAPI entry point (or server.js for Node/Express)
│   ├── monitor.py          # Core ping/HTTP check logic
│   ├── alerts.py           # Email alerts (Nodemailer or SMTP in Python)
│   ├── requirements.txt    # If Python
│   └── package.json        # If Node.js
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main app: form + site list + status
│   │   ├── components/
│   │   │   ├── MonitorForm.jsx
│   │   │   └── MonitorList.jsx
│   │   └── services/api.js # Fetch wrapper to call backend
│   ├── package.json
│   └── index.html
│
├── docs/
│   └── README.md           # This file
│
└── .gitignore
```

---

## 🛠 Development Flow

### 1. Start Small
- Backend: implement a `/ping` endpoint that accepts a URL and returns UP/DOWN.  
- Frontend: input form to call `/ping` and show result.  

### 2. Add Auto Monitoring
- Backend: store sites in memory (list/dict).  
- Use `setInterval` (Node) or `asyncio loop` (Python) to recheck every 60s.  
- Return latest status via `/status`.  

### 3. Add Email Alerts
- Trigger only when status changes (UP → DOWN or DOWN → UP).  
- Use Gmail SMTP (Python: `smtplib`, Node: `nodemailer`).  

### 4. Keep Code Organized
- Only 2–3 backend files, 2–3 frontend files at first.  
- Add new features gradually.  

---

## ✅ Checklist (MVP)

- [ ] Backend: `/ping` endpoint  
- [ ] Frontend: input form + show status  
- [ ] Auto-check loop every 60s  
- [ ] Email alerts on status change  
- [ ] Basic UI polish (Tailwind optional)  

---

## ⚡ Golden Rules

1. Focus only on **ping + alert** for MVP.  
2. Keep backend & frontend separate → one file per feature.  
3. Use **Git** to commit after each working feature.  
4. If error → paste only error + file here for fix.  
5. Once MVP works → evolve towards full structure (DB, Celery, Stripe, etc.).  
