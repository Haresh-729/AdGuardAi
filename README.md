# AdGuard AI
## Instant Ad Compliance Checker: An AI-Powered Multimodal Tool for Fast, Policy-Safe Ad Approvals

![AdGuard AI Overview](https://github.com/user-attachments/assets/abe02418-85fc-4c63-9612-1080aa0f17f7)

### 🚀 Overview

Digital advertising platforms face a major challenge in ensuring that ads comply with strict policy guidelines. Advertisers often submit creatives (text, images, videos, landing pages) that unintentionally violate rules, leading to delayed approvals, repeated rejections, and wasted time for both advertisers and internal review teams. Manual compliance checks are resource-intensive and slow, creating friction in the ad publishing pipeline.

Our product, the **Instant Ad Compliance Checker**, solves this problem by providing advertisers with an AI-powered tool that pre-screens ad content before submission. By detecting potential violations early, advertisers can make corrections instantly, reducing back-and-forth cycles and accelerating the approval process.

## Final Presentation: [Click to View](https://drive.google.com/file/d/11PLAIdZAwCfGe1GXKF6HxNX1TtLqxI5-/view?usp=sharing)
## Final Product Demo: https://adguardai.hareshkurade.xyz
## Greatest USP: 
Accuracy Tested and Tried on All types of Advertisements especially False Positive, False Negative our entire project performs good in all scenarios…. And by reinforcement learning it will be more strong….
## Video Demo: [Click to View](https://drive.google.com/drive/folders/1qaBm-bgqLn_litZntQw4WmqbJbk3Ttv0?usp=sharing)
## Postman Link: [Click to View APIs](https://git-win-it.postman.co/workspace/Git-win-it~fc879010-f344-4714-a946-b852dd9f177a/request/25138459-73c86719-53fc-4097-8a38-2e09416f202c?action=share&creator=25138459&ctx=documentation)
</br>
## Example False Negative.
<img width="1919" height="1079" alt="Screenshot 2025-09-29 002703" src="https://github.com/user-attachments/assets/812d5e95-794b-43c2-abda-e63f3eeb80bd" />
<img width="1682" height="838" alt="image" src="https://github.com/user-attachments/assets/296d4a2d-0ef2-4e93-a801-69c2839e5acd" />

## Example. Complianced and had few doubts with 60% confidence of valid content but After reverification with the user on call final Verict from AI was Fail.
### Reasons: 
         User fumbuled during the call.
         User took too long to reply.
         User was not confident during the call.
## Recording of the Call: [fumbulled call.mp3](https://github.com/user-attachments/files/22584828/fumbulled.call.mp3)

Some Snapshots:
<img width="1919" height="1037" alt="image" src="https://github.com/user-attachments/assets/f4a3dae7-84cf-4f7a-9dca-4c86beee7e62" />
<img width="1919" height="1030" alt="image" src="https://github.com/user-attachments/assets/6ac39ae1-9349-4922-ab29-0091cc15192d" />
<img width="1919" height="1031" alt="image" src="https://github.com/user-attachments/assets/d5474511-88f4-49ce-b7a2-69fb841433b8" />
<img width="1919" height="1025" alt="image" src="https://github.com/user-attachments/assets/bd229a59-9a3c-4a25-8f3b-3e82d84b0c78" />
<img width="1000" height="992" alt="image" src="https://github.com/user-attachments/assets/d50c073b-f6af-4411-98a7-8676b1ccf995" />
<img width="1919" height="1032" alt="image" src="https://github.com/user-attachments/assets/82a97df9-a555-4521-8124-58a83d6ab8df" />






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
