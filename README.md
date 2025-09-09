# 🚀 Legal Assistant MVP

An AI-powered legal document analysis platform built with Next.js, Node.js, and Google Cloud services.

## ✨ Features

- **📁 Document Upload**: Support for PDF, DOCX, and DOC files
- **🔍 AI-Powered OCR**: Google Document AI for text extraction
- **🤖 Legal Analysis**: Google Vertex AI (Gemini) for document insights
- **💬 Interactive Chat**: Ask questions about your legal documents
- **📊 Document Summary**: AI-generated summaries with key insights
- **🔐 User Authentication**: Firebase Auth with secure user management
- **📚 History Tracking**: Complete analysis history in Firestore
- **☁️ Cloud Storage**: Google Cloud Storage for secure file management

## 🏗️ Architecture

```
Frontend (Next.js) ←→ Backend (Node.js/Express) ←→ Google Cloud Services
     ↓                           ↓                           ↓
- React Components         - REST API              - Document AI (OCR)
- Tailwind CSS            - File Upload           - Vertex AI (Gemini)
- Firebase Auth           - Document Analysis     - Cloud Storage
- TypeScript              - History Management    - Firestore
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with billing enabled
- Firebase Project

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd legal-assistant-mvp

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### 2. Google Cloud Setup

1. **Enable APIs**:
   - Cloud Run API
   - Cloud Build API
   - Document AI API
   - Vertex AI API
   - Cloud Storage API
   - Firestore API

2. **Create Resources**:
   ```bash
   # Create Firestore database (Native mode)
   gcloud firestore databases create --region=us-central1
   
   # Create Storage bucket
   gcloud storage buckets create gs://YOUR_BUCKET_NAME --location=us-central1
   
   # Create Document AI processor
   gcloud documentai processors create \
     --processor-type=DOCUMENT_OCR_PROCESSOR \
     --location=us \
     --display-name="Legal Document OCR"
   ```

3. **Service Account Setup**:
   ```bash
   # Create service account
   gcloud iam service-accounts create legal-assistant-sa \
     --display-name="Legal Assistant Service Account"
   
   # Grant necessary roles
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:legal-assistant-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:legal-assistant-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/datastore.user"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:legal-assistant-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:legal-assistant-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/documentai.apiUser"
   
   # Download key
   gcloud iam service-accounts keys create key.json \
     --iam-account=legal-assistant-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

### 3. Environment Variables

#### Backend (.env)
```bash
PORT=8080
GCP_PROJECT=YOUR_PROJECT_ID
GCS_BUCKET=YOUR_BUCKET_NAME
DOC_AI_LOCATION=us
DOC_AI_PROCESSOR_ID=YOUR_PROCESSOR_ID
VERTEX_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./key.json
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Run Locally

```bash
# Terminal 1 - Backend
cd Backend
npm start

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🚀 Deployment

### Deploy Backend to Cloud Run

```bash
cd Backend

# Build and deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/legal-backend
gcloud run deploy legal-backend \
  --image gcr.io/YOUR_PROJECT_ID/legal-backend \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars GCP_PROJECT=YOUR_PROJECT_ID,GCS_BUCKET=YOUR_BUCKET_NAME,DOC_AI_LOCATION=us,DOC_AI_PROCESSOR_ID=YOUR_PROCESSOR_ID,VERTEX_LOCATION=us-central1

# If Cloud Build bucket access is restricted, grant roles or use a custom staging bucket:
# gcloud builds submit --gcs-source-staging-dir=gs://YOUR_BUCKET/tmp --tag gcr.io/YOUR_PROJECT_ID/legal-backend
```

### Deploy Frontend to Firebase

```bash
cd Frontend

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

## 📁 Project Structure

```
legal-assistant-mvp/
├── Backend/                    # Node.js + Express backend
│   ├── index.js               # Main server file
│   ├── package.json           # Backend dependencies
│   └── Dockerfile             # Cloud Run deployment
├── Frontend/                   # Next.js frontend
│   ├── app/                   # App Router pages
│   │   ├── login/page.tsx     # Authentication
│   │   ├── signup/page.tsx    # User registration
│   │   ├── dashboard/page.tsx # User dashboard
│   │   ├── upload/page.tsx    # Document upload
│   │   ├── summary/page.tsx   # Document summary
│   │   └── chat/page.tsx      # AI chat interface
│   ├── lib/firebase.ts        # Firebase configuration
│   ├── styles/globals.css     # Global styles
│   └── package.json           # Frontend dependencies
├── firestore.rules            # Security rules
└── README.md                  # This file
```

## 🔧 API Endpoints

### Backend API

- `GET /` - Health check
- `POST /upload` - Upload document to GCS
- `POST /analyze` - Analyze document with OCR + AI
- `GET /history/:userId` - Get user's analysis history
- `GET /document?gcsUri=ENCODED_GS_URI` - Get document information

### Request/Response Examples

#### Upload Document
```json
POST /upload
{
  "fileName": "contract.pdf",
  "fileContent": "base64_encoded_content"
}

Response:
{
  "success": true,
  "gcsUri": "gs://bucket/contract.pdf",
  "message": "File uploaded successfully"
}
```

#### Analyze Document
```json
POST /analyze
{
  "gcsUri": "gs://bucket/contract.pdf",
  "question": "What are the key terms?",
  "userId": "user123"
}

Response:
{
  "success": true,
  "answer": "AI-generated analysis...",
  "documentText": "Extracted text preview...",
  "message": "Document analyzed successfully"
}
```

#### Get Document Info
```http
GET /document?gcsUri=gs%3A%2F%2Fbucket%2Fcontract.pdf

Response:
{
  "success": true,
  "document": {
    "gcsUri": "gs://bucket/contract.pdf",
    "fileName": "contract.pdf",
    "lastAnalyzed": "2024-01-01T12:00:00.000Z",
    "questionCount": 3
  }
}
```

## 🎨 UI Components

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Interface**: Clean, professional legal application design
- **Interactive Elements**: Smooth animations and transitions
- **Accessibility**: ARIA labels and keyboard navigation support

## 🔐 Security Features

- **Authentication**: Firebase Auth with email/password
- **Authorization**: User-specific data access
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for production deployment
- **Secure Storage**: Google Cloud Storage with proper IAM

## 🧪 Testing

```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd Frontend
npm test

# Type checking
npm run type-check
```

## 📊 Performance

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Next.js built-in image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Efficient caching strategies for API responses

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is properly configured
2. **Authentication Failures**: Check Firebase configuration
3. **Upload Failures**: Verify Google Cloud Storage permissions
4. **OCR Errors**: Ensure Document AI processor is active

### Debug Mode

```bash
# Backend debug
DEBUG=* npm start

# Frontend debug
NODE_ENV=development npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Advanced document comparison
- [ ] Legal precedent integration
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with legal databases

---

**Built with ❤️ using Next.js, Node.js, and Google Cloud**
#   l e g a l - l e n s  
 #   l e g a l - l e n s  
 #   l e g a l - l e n s  
 #   l e g a l - l e n s  
 