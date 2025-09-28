<<<<<<< HEAD
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
=======
# AdGuard AI
## Instant Ad Compliance Checker: An AI-Powered Multimodal Tool for Fast, Policy-Safe Ad Approvals

![AdGuard AI Overview](https://github.com/user-attachments/assets/abe02418-85fc-4c63-9612-1080aa0f17f7)

### 🚀 Overview

Digital advertising platforms face a major challenge in ensuring that ads comply with strict policy guidelines. Advertisers often submit creatives (text, images, videos, landing pages) that unintentionally violate rules, leading to delayed approvals, repeated rejections, and wasted time for both advertisers and internal review teams. Manual compliance checks are resource-intensive and slow, creating friction in the ad publishing pipeline.

Our product, the **Instant Ad Compliance Checker**, solves this problem by providing advertisers with an AI-powered tool that pre-screens ad content before submission. By detecting potential violations early, advertisers can make corrections instantly, reducing back-and-forth cycles and accelerating the approval process.

## ✨ Key Features

The tool's value lies in its **multimodal AI approach**:

- **📝 Text/Ad Copy Analysis**: Fine-tuned LLMs flag prohibited language, exaggerated claims, and formatting violations using RAG-based policy compliance
- **🖼️ Image Analysis**: Qwen2.5 7B parameter model detects adult/violent imagery, trademark misuse, or misleading visual cues
- **🎥 Video Analysis**: Adaptive frame sampling with frames passed to image model for inappropriate visuals detection
- **🌐 Landing Page Checks**: Browser Use Agent crawls and validates that page content aligns with ad promises
- **🎙️ Voice Analysis**: Whisper integration for audio transcription and policy violation detection
- **🤖 Interactive Clarification**: AI-assisted calls with transcript analysis and compliance score updates

## 🎯 Unique Selling Point (USP)

What makes this product stand out is its **explainable AI-driven reporting**. Instead of just rejecting ads, it provides clear, actionable feedback with compliance scores, severity levels, and improvement suggestions. This transforms compliance from a bottleneck into a collaborative, AI-assisted process empowering advertisers and streamlining review operations.

## 🧠 AI/LLM Architecture

![AI Use Case Architecture](https://github.com/user-attachments/assets/17223e23-ad47-4b20-8aee-8bddd0abcb2f)

### Central Role of AI/LLMs:
- AI and LLMs are the core engines driving compliance checks across all ad modalities (text, image, video, landing page)
- They perform contextual reasoning, identify prohibited content, detect misleading claims, and generate explainable compliance reports

### Models & Techniques Leveraged:

1. **Text Analysis**: 
   - **Qwen2.5 7B parameter model** for detecting prohibited or misleading ad copy and claims
   - RAG-based policy text model for contextual compliance checking

2. **Image Analysis**: 
   - **Qwen2.5 7B parameter model** for scene understanding and policy violation detection
   - YOLO for banned object detection
   - PaddleOCR for text overlay extraction

3. **Video Analysis**:
   - **Adaptive frame sampling** technique for efficient processing
   - Frames passed to **Qwen2.5 7B parameter model** for scene understanding
   - YOLO for object detection in frames
   - **Whisper** for audio transcription
   - PaddleOCR for text overlays
   - Multi-modal fusion with Policy LLM for holistic compliance reasoning

4. **Landing Page Analysis**: 
   - **Browser Use Agent** for automated page visiting and content extraction
   - RAG system + LLM to match ad claims with page content

5. **Voice Processing**:
   - **Whisper** integration for accurate speech-to-text conversion
   - Policy compliance checking on transcribed audio content

6. **Policy RAG System**: 
   - Retrieves relevant policy documents for LLM-guided reasoning
   - Context-aware policy violation detection

## 💻 User Interface

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/7b47cc4c-27be-4f03-846a-e91453fa3375)

The main dashboard provides an overview of recent compliance checks, success rates, and quick access to all features.

### Upload Page
![Upload Page](https://github.com/user-attachments/assets/329e1bcf-9b90-4800-98ff-6520b2abcdfc)

Intuitive upload interface supporting multiple content types:
- Text/Ad copy input
- Image file upload
- Video file upload  
- Landing page URL input
- Batch processing capabilities

### Compliance Report
![Report Page](https://github.com/user-attachments/assets/1d2de845-12e7-488b-abab-5aef2a7f2ed3)

Detailed compliance analysis with:
- Overall compliance score
- Violation breakdown by category
- Risk assessment levels
- Actionable recommendations

### Compliance Analysis
![Compliance Page](https://github.com/user-attachments/assets/caf03790-e9aa-4221-9f18-77422fcee62b)

In-depth analysis view showing:
- Policy section violations
- Evidence highlighting
- Confidence scores
- Suggested fixes

### Policy Management
![Policy Page](https://github.com/user-attachments/assets/15cbd188-f067-4b38-bb38-b5630de488c8)

Centralized policy document management with:
- Policy document viewer
- Version control
- Custom policy uploads
- RAG system configuration

### User Profile
![User Profile](https://github.com/user-attachments/assets/6a445cc8-e9fd-4c03-b591-200e0c8cbed5)

User management interface featuring:
- Account settings
- Usage statistics
- API key management
- Notification preferences

### Detailed Overview
![Detailed Overview](https://github.com/user-attachments/assets/2bad6e4c-ff6c-4618-87fc-988af39edfaa)

Comprehensive project overview with metrics and analytics.

### Key Technical Features:

- **Adaptive Frame Sampling**: Intelligent video frame extraction for optimal processing
- **RAG-based Policy Matching**: Semantic search through policy documents
- **Multi-language Support**: Automatic language detection and culturally-aware analysis
- **Browser Automation**: Automated landing page content extraction
- **Real-time Processing**: Fast compliance checking for immediate feedback

## 🎯 Minimum Viable Product (MVP)

![MVP Features](https://github.com/user-attachments/assets/5643f94b-8cf7-419d-8ab1-d394ed6ed129)

### Core Functionalities:
- ✅ Web App Interface for multi-modal content upload
- ✅ Text Compliance Checks using Qwen2.5 7B + RAG system
- ✅ Image Compliance Checks with Qwen2.5 7B model
- ✅ Video Compliance Checks with adaptive frame sampling
- ✅ Landing Page Analysis using Browser Use Agent
- ✅ Voice Analysis with Whisper integration
- ✅ Compliance Scoring Engine with explainable results
- ✅ AI-Assisted Clarification system

### Extended Features:
- 🔄 Multilingual Compliance Checks
- 📊 Risk-Level Prediction (low/medium/high severity)
- 🔧 Generative Ad Fix Suggestions
- 💬 Conversational AI Reviewer

## 🚀 Installation & Setup

### Prerequisites
```bash
pip install -r requirements.txt
```

### Required Dependencies
- `transformers` - For Qwen2.5 7B model
- `whisper` - For voice transcription
- `llama-index` - For RAG implementation
- `groq` - For LLM API access
- `google-generativeai` - For Gemini integration
- `selenium` - For Browser Use Agent
- `opencv-python` - For video frame processing

### Environment Variables
```bash
export GROQ_API_KEY="your_groq_api_key"
export GEMINI_API_KEY="your_gemini_api_key"
```

### Quick Start
```python
# Initialize the compliance checker
checker = PolicyComplianceChecker()
checker.initialize()

# Analyze ad content
result = checker.check_compliance("Your ad text here")
print(result)
```

## 🔄 Workflow

1. **Content Upload**: Users upload text, images, videos, or landing page URLs
2. **Multi-modal Analysis**: 
   - Text processed by Qwen2.5 7B + RAG
   - Images analyzed by Qwen2.5 7B vision model
   - Videos processed with adaptive frame sampling
   - Landing pages crawled by Browser Use Agent
   - Audio transcribed by Whisper
3. **Policy Matching**: RAG system retrieves relevant policy sections
4. **Compliance Scoring**: AI generates detailed compliance reports
5. **Interactive Feedback**: Users receive actionable recommendations

## 🎯 Why AI is Essential

- **Nuanced Violation Detection**: Goes beyond simple keyword matching
- **Multimodal Analysis**: Combines visual, audio, and text inputs intelligently
- **Scalable Decision Making**: Handles large volumes with consistent quality
- **Explainable Results**: Provides clear reasoning for compliance decisions
- **Cultural Awareness**: Adapts analysis based on language and cultural context

## 📈 Benefits

- **Faster Ad Approvals**: Pre-screening reduces review cycles
- **Cost Reduction**: Automated compliance checking saves manual review time
- **Better Advertiser Experience**: Clear, actionable feedback improves satisfaction
- **Scalability**: Handles increasing ad volumes without proportional staff increases
- **Consistency**: Standardized policy application across all content types

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

---

**AdGuard AI** - Transforming ad compliance from a bottleneck into a collaborative, AI-assisted process that empowers advertisers and streamlines operations.
>>>>>>> 5a305726b1e9e007526c77ec2308e4b93e29a883
