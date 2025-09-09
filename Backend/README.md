# Legal Lens Backend

A secure, scalable backend for legal document analysis with Firebase Authentication and Google Cloud Platform integration.

## 🚀 Features

- **Firebase Authentication**: Secure user authentication with Google Sign-In and Email/Password
- **Document Upload**: PDF upload to Google Cloud Storage with validation
- **AI Analysis**: Document text extraction using Document AI and analysis with Vertex AI (Gemini)
- **Risk Assessment**: Automated risk level classification (HIGH/MEDIUM/LOW)
- **Firestore Integration**: Secure document storage with user-based access control
- **RESTful API**: Clean, documented API endpoints
- **Error Handling**: Comprehensive error handling and logging
- **Cloud Ready**: Works both locally and on Google Cloud Run

## 📋 Prerequisites

- Node.js 18+ 
- Google Cloud Project with the following APIs enabled:
  - Document AI API
  - Vertex AI API
  - Cloud Storage API
  - Firestore API
- Firebase project with Authentication enabled
- Service account key (for local development)

## 🛠️ Setup

### 1. Environment Variables

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Required environment variables:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Google Cloud Platform
GCP_PROJECT=your-project-id
GCS_BUCKET=your-storage-bucket
DOC_AI_LOCATION=us
DOC_AI_PROCESSOR_ID=your-processor-id
VERTEX_LOCATION=us-central1

# Authentication (local development only)
GOOGLE_APPLICATION_CREDENTIALS=./key/your-service-account.json

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Create a Firebase project
2. Enable Authentication with Google and Email/Password providers
3. Get your Firebase config for the frontend

### 4. Firestore Rules

Deploy these security rules to Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{docId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### 5. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Endpoints

All endpoints require Firebase Authentication (Bearer token in Authorization header).

### Upload
- `POST /upload` - Upload and analyze PDF document

### Analysis
- `POST /analyze` - Legacy document analysis
- `POST /analyze/comprehensive` - Comprehensive analysis with risk assessment

### History
- `GET /history` - Get user's document history
- `GET /history/filtered` - Get filtered documents with pagination
- `GET /history/stats` - Get user statistics

### Documents
- `GET /document/:id` - Get document by ID
- `GET /document/:id/download` - Get document download URL
- `PUT /document/:id` - Update document
- `DELETE /document/:id` - Delete document

### Health
- `GET /health` - Health check
- `GET /` - API information

## 🔐 Authentication

The backend uses Firebase Admin SDK to verify ID tokens. Include the token in requests:

```javascript
const token = await user.getIdToken();
fetch('/api/upload', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Google Cloud  │
│   (Next.js)     │    │   (Express)     │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Firebase Auth   │◄──►│ Auth Middleware │    │ Document AI     │
│ API Client      │    │ Controllers     │    │ Vertex AI       │
│ Components      │    │ Services        │    │ Cloud Storage   │
└─────────────────┘    └─────────────────┘    │ Firestore       │
                                              └─────────────────┘
```

## 🚀 Deployment

### Google Cloud Run

1. Build and push Docker image:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/legal-lens-backend
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy legal-lens-backend \
  --image gcr.io/PROJECT_ID/legal-lens-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT=PROJECT_ID,GCS_BUCKET=BUCKET_NAME
```

3. Configure Workload Identity for automatic authentication

### Environment Variables for Production

Set these in Cloud Run:
- `GCP_PROJECT`
- `GCS_BUCKET` 
- `DOC_AI_LOCATION`
- `DOC_AI_PROCESSOR_ID`
- `VERTEX_LOCATION`
- `FRONTEND_URL`

**Note**: Don't set `GOOGLE_APPLICATION_CREDENTIALS` in production - use Workload Identity instead.

## 🧪 Testing

Test the API with curl:

```bash
# Get auth token from Firebase
TOKEN="your-firebase-id-token"

# Upload document
curl -X POST http://localhost:8080/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf"

# Get user history
curl -X GET http://localhost:8080/history \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 Document Analysis Flow

1. **Upload**: User uploads PDF via authenticated endpoint
2. **Storage**: File stored in Google Cloud Storage
3. **OCR**: Document AI extracts text from PDF
4. **Analysis**: Vertex AI (Gemini) analyzes text and generates:
   - Summary
   - Risk level (HIGH/MEDIUM/LOW)
   - Risk factors
   - Key terms
   - Obligations and rights
   - Important dates
   - Recommendations
5. **Storage**: Analysis results stored in Firestore with user ID
6. **Response**: JSON response with analysis data

## 🔒 Security

- **Authentication**: Firebase ID token verification on all endpoints
- **Authorization**: Firestore rules ensure users only access their own documents
- **Input Validation**: File type and size validation
- **Error Handling**: Secure error messages (no sensitive data leaked)
- **CORS**: Configurable CORS for frontend integration

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Firebase project configuration
   - Check service account permissions
   - Ensure ID token is valid and not expired

2. **Document AI Errors**
   - Verify processor ID and location
   - Check Document AI API is enabled
   - Ensure service account has Document AI permissions

3. **Firestore Errors**
   - Verify Firestore rules are deployed
   - Check user ID matches in document data
   - Ensure Firestore API is enabled

4. **Storage Errors**
   - Verify GCS bucket exists and is accessible
   - Check bucket permissions
   - Ensure Cloud Storage API is enabled

### Logs

Check logs for detailed error information:
```bash
# Local development
npm run dev

# Cloud Run
gcloud logs read --service=legal-lens-backend
```

## 📄 License

ISC License
