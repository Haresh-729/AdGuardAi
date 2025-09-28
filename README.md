# 🛡️ AdGuard AI – Instant Ad Compliance Checker

**Author:** Haresh Kurade  
**Team:** reaturn0  
**Email:** kuradeharesh4002@gmail.com  
**Live Demo:** [AdGuard AI](https://adguardai.hareshkurade.xyz)

---

## 📌 Overview

AdGuard AI is a **full-stack AI-powered compliance checker** that analyzes advertisements (text, images, videos, audio, and links) against global advertising policies. It ensures businesses can launch campaigns with confidence, free from violations, misleading claims, or targeting of vulnerable groups.  

The system combines **multimodal AI/ML models** with real-time compliance reasoning powered by **Gemini** and **OpenAI GPT**, delivering a reliable verdict: ✅ Pass, ❌ Fail, ⚠️ Manual Review, or 📞 Clarification Needed.  

---

## ✨ Features

- 🔍 **Multimodal Analysis** – Text, Image, Video, and Audio compliance detection  
- ⚖️ **AI-Powered Decisions** – Gemini + OpenAI GPT-4 reasoning  
- 🗂️ **Detailed Reports** – Raw AI outputs + normalized compliance verdicts  
- 📞 **Call Integrations** – Automated clarification calls via Twilio, Vonage, Amazon Connect  
- ☁️ **Cloud-Native** – Deployed with scalable architecture (Node.js + FastAPI + PostgreSQL + AWS S3)  
- 🔐 **Secure** – JWT authentication, password hashing, HTTPS  
- ⚡ **Modern UI** – Built with React.js + TailwindCSS + Redux Toolkit  

---

## 🏗️ Tech Stack

### **Backend**
- Node.js, Express.js  
- PostgreSQL, AWS S3  
- JWT, bcrypt, CORS  
- Multer (file uploads)  
- Nodemailer (SMTP emails)  
- Twilio, Vonage, Amazon Connect, WebRTC (voice)  

### **Frontend**
- React.js (ES6+)
- Redux Toolkit  
- Tailwind CSS  

### **AI/ML Pipeline (FastAPI Server)**
- YOLO (banned content detection)  
- LLaVA-1.5-7B (vision-language model)  
- LLaVA-Video-7B (video analysis)  
- PaddleOCR (text extraction)  
- Whisper-tiny (speech-to-text)  
- Llama-3-8B, Phi-3-mini (text LLMs)  
- RAG-enabled compliance reasoning  

### **Cloud & Deployment**
- AWS S3 (media storage)  
- PostgreSQL (database)  
- REST APIs + Microservices  
- HTTPS security  

---

## 📂 Project Architecture

- **Backend (Node.js + Express)** – Handles user management, uploads, compliance requests  
- **Frontend (React.js)** – Interactive dashboard, report visualization  
- **AI/ML Microservices (FastAPI + Python)** – Specialized multimodal compliance checks  
- **LLM Integration** – Gemini & OpenAI GPT for compliance reasoning  
- **Storage** – AWS S3 for media, PostgreSQL for structured data  

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/adguard-ai.git
cd adguard-ai
```

### 2️⃣ Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3️⃣ Environment Setup

Create a `.env` file in backend:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/adguard
JWT_SECRET=your-secret
AWS_ACCESS_KEY=xxx
AWS_SECRET_KEY=xxx
S3_BUCKET=adguard-uploads
SMTP_HOST=smtp.example.com
SMTP_USER=your@email.com
SMTP_PASS=yourpassword
```

### 4️⃣ Run Services

```bash
# Backend
npm run dev

# Frontend
npm start

# FastAPI (AI microservice)
uvicorn main:app --reload --port 8000
```

---

## 📊 Example Compliance Output

```json
{
  "raw_output": { ... }, 
  "compliance_results": {
    "verdict": "fail",
    "reason": "Promotion of controlled substances and misleading medical claims",
    "overall_risk_score": 0.95,
    "modalities_summary": {
      "text": "Non-compliant due to drug promotion",
      "image": "No violations detected",
      "audio": "Contains misleading medical claim",
      "video": "No violations detected",
      "link": "No violations detected"
    }
  }
}
```

---

## 📧 Contact

👨‍💻 **Haresh Kurade**  
📩 [kuradeharesh4002@gmail.com](mailto:kuradeharesh4002@gmail.com)  
🌐 [AdGuard AI](https://adguardai.hareshkurade.xyz)

---

## 📝 License

This project is licensed under the **MIT License**.

---

> 💡 AdGuard AI – Keeping ads **ethical, compliant, and trusted**.