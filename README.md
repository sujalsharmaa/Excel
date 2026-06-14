https://youtu.be/22nAo-FSDSQ


# SheetWise: Collaborative Spreadsheet Application

![SheetWise](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/License-ISC-green.svg)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen.svg)

A **production-grade, cloud-native collaborative spreadsheet application** inspired by Google Sheets and Microsoft Excel. Built with modern technologies, SheetWise enables real-time multi-user editing, AI-powered data analysis, and seamless file management with enterprise-level security and scalability.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup & Installation](#local-setup--installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [WebSocket Events](#websocket-events)
- [Deployment Guide](#deployment-guide)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support & Contact](#support--contact)

---

## 🎯 Overview

**SheetWise** is a cloud-native spreadsheet application that combines the power of traditional spreadsheets with modern collaborative features. It provides:

- **Real-time Collaboration**: Multiple users editing simultaneously with WebSocket-based synchronization
- **AI Integration**: Gemini 2.5 Flash for intelligent data analysis and cell operations
- **File Management**: Secure S3 storage with multi-user permissions and sharing
- **Performance Optimization**: Redis caching, vector embeddings with Chroma DB
- **Scalability**: Kubernetes-ready with auto-scaling, load balancing, and monitoring
- **Security**: JWT authentication, role-based access control, data encryption

Perfect for teams, businesses, and enterprises needing collaborative data management with advanced features.

---

## ✨ Features

### Core Functionality
- ✅ Create, edit, and delete spreadsheets
- ✅ Cell-level editing with real-time synchronization
- ✅ Add/remove rows and columns dynamically
- ✅ Data export/import (CSV, XLSX formats)
- ✅ Drawing/whiteboarding canvas (Excalidraw integration)
- ✅ Chat collaboration within spreadsheets

### Advanced Features
- 🤖 **AI Assistant**: Ask questions about your data, perform automated operations
- 🔐 **Permission Management**: Granular control (read/write permissions)
- 🔗 **File Sharing**: Generate time-limited access tokens for sharing
- 📊 **Data Visualization**: Charts and advanced formatting
- 🎨 **Multiple Themes**: Light/dark mode support
- 📧 **Email Integration**: Share files via email with download links
- 💾 **Auto-save**: Continuous background synchronization

### Enterprise Features
- 🏢 **Multi-user Support**: Concurrent editing with conflict resolution
- 📈 **Scalability**: Horizontal scaling with Kubernetes
- 🔍 **Monitoring**: Prometheus metrics, Grafana dashboards
- 🗂️ **Storage Management**: Track usage, upgrade storage plans
- 💳 **Payment Integration**: Razorpay for storage upgrades
- 🔎 **Vector Search**: Chroma DB for semantic search over spreadsheet data
- 🎯 **Logging**: Winston + Elasticsearch for comprehensive logging

---

## 🛠 Technology Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI framework | 18.3.1 |
| **Vite** | Build tool | 6.0.1 |
| **Tailwind CSS** | Styling | 3.4.16 |
| **Handsontable** | Spreadsheet grid | 15.0.0 |
| **Excalidraw** | Drawing/whiteboarding | 0.17.6 |
| **Zustand** | State management | 5.0.3 |
| **Axios** | HTTP client | 1.7.9 |
| **React Router** | Routing | 7.1.3 |

### Backend (REST API)
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Node.js** | Runtime | 20-alpine |
| **Express.js** | Web framework | 4.21.2 |
| **PostgreSQL** | Database | 15-alpine |
| **Redis** | Caching & JSON store | redis-stack |
| **AWS S3** | File storage | - |
| **Google Gemini** | AI/LLM | 2.5-flash |
| **LangChain** | LLM framework | 1.4.0 |
| **Chroma DB** | Vector database | 3.4.3 |

### Backend (WebSocket)
| Technology | Purpose | Version |
|-----------|---------|---------|
| **WebSocket** | Real-time communication | - |
| **Redis Pub/Sub** | Message broadcasting | - |
| **Bull Queue** | Job queue for S3 uploads | 4.16.5 |

### Infrastructure & DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Kubernetes** | Orchestration |
| **AWS EC2/ECS** | Compute |
| **AWS S3** | Object storage |
| **AWS RDS** | Database service |
| **AWS API Gateway** | API management |
| **CloudFront** | CDN |
| **Terraform** | IaC |
| **Jenkins** | CI/CD |
| **Prometheus** | Metrics |
| **Grafana** | Visualization |
| **Elasticsearch** | Log aggregation |
| **Winston** | Logging |

---

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React/Vite)                   │
│              (Handsontable + Excalidraw + Chat)             │
└──────────────────┬──────────────────┬──────────────────────┘
                   │                  │
        ┌──────────▼────────┐  ┌──────▼──────────┐
        │   REST API (3000) │  │  WebSocket (8080)
        │   Node.js/Express │  │  Node.js/WS     │
        └──────────────┬────┘  └────────┬────────┘
                       │                 │
        ┌──────────────▼─────────────────▼────────────┐
        │        Redis (Caching & JSON Store)         │
        │  - File data caching                        │
        │  - Session management                       │
        │  - Chat history                             │
        │  - Token management                         │
        └──────────────┬────────────────────────────┬─┘
                       │                            │
        ┌──────────────▼────────────┐  ┌──────────▼──────┐
        │   PostgreSQL Database     │  │   AWS S3 Storage │
        │  - User data              │  │  - File storage  │
        │  - Permissions            │  │  - Backups       │
        │  - File metadata          │  │                  │
        └───────────────────────────┘  └──────────────────┘
                                              │
                        ┌─────────────────────┼──────────────┐
                        │                     │              │
            ┌───────────▼──────┐  ┌──────────▼──────┐   ┌───▼──────┐
            │   Chroma DB      │  │ Google Gemini   │   │ Mailtrap │
            │  (Vector Search) │  │  (AI Assistant) │   │ (Email)  │
            └──────────────────┘  └─────────────────┘   └──────────┘
```

### Data Flow Diagram

```
User Action (Edit Cell)
    │
    ├─► REST API: Store in Redis + Send update to WebSocket
    │
    ├─► WebSocket: Broadcast to connected clients (Pub/Sub)
    │
    ├─► Each Client: Update local state + Re-render
    │
    └─► Background Job: Upload to S3 when user disconnects
```

### Real-time Sync Architecture

```
Client A               Client B               Server
   │                     │                      │
   │  Send Update ───────────────────────────►  │
   │                     │                      │
   │                     │  Broadcast Update    │
   │  ◄─────────────────────────────────────────┤
   │                     │                      │
   │                     │  ◄─ Broadcast Update─┤
   │               Update UI                    │
```

---

## 📁 Project Structure

```
Excel/
├── Excel_Backend/                    # REST API (Port 3000)
│   ├── Controllers/
│   │   └── Controllers.js            # Auth & file operations
│   ├── Routes/
│   │   └── Route.js                  # API routes
│   ├── Model/
│   │   ├── Db_config.js             # PostgreSQL connection
│   │   ├── CreateTable.js           # Schema initialization
│   │   └── DropTable.js             # Table cleanup
│   ├── Middleware/
│   │   └── authMiddleware.js        # JWT verification
│   ├── Cache/
│   │   └── RedisConfig.js           # Redis client config
│   ├── Mailtrap/
│   │   ├── EmailControllers.js      # Email sending logic
│   │   ├── mailtrap.config.js       # Email service config
│   │   └── emailTemplates.js        # HTML email templates
│   ├── utils/
│   │   ├── s3Utils.js               # AWS S3 operations
│   │   ├── dbUtils.js               # Database utilities
│   │   ├── JWTservice.js            # Token generation/verification
│   │   └── temp.js
│   ├── Server.js                    # Main server file
│   ├── dockerfile                   # Docker configuration
│   ├── package.json                 # Dependencies
│   └── .env                         # Environment variables
│
├── Excel_Backend_Nodejs_WS/         # WebSocket Server (Port 8080)
│   ├── Server.js                    # WebSocket server
│   ├── queue.js                     # Bull job queue for S3 uploads
│   ├── s3Utils.js                   # S3 utilities
│   ├── Dockerfile                   # Docker configuration
│   ├── package.json                 # Dependencies
│   └── .env                         # Environment variables
│
├── Frontend/                        # React Application (Port 5173)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sheetwise.jsx       # Main spreadsheet component
│   │   │   ├── AdminDashboard/     # Admin panel
│   │   │   ├── FileViewerByToken.jsx
│   │   │   ├── ExcalidrawWrapper.jsx
│   │   │   ├── StorageUpgrade.jsx
│   │   │   └── ... (other components)
│   │   ├── Store/
│   │   │   └── useStore.js         # Zustand state management
│   │   ├── hooks/
│   │   │   └── use-toast.js        # Toast notifications
│   │   ├── lib/
│   │   │   └── utils.js            # Utility functions
│   │   ├── App.jsx                 # Main App component
│   │   ├── main.jsx                # Entry point
│   │   ├── index.css               # Global styles
│   │   └── App.css
│   ├── public/                      # Static assets
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind configuration
│   ├── package.json                # Dependencies
│   ├── vercel.json                 # Vercel deployment config
│   └── .env.local                  # Frontend env variables
│
├── kubernetes-manifests/            # K8s deployment files
│   ├── backend-nodejs-deployment.yaml
│   ├── backend-ws-deployment.yaml
│   ├── redis-manifests/
│   ├── postgres/
│   ├── Istio/
│   ├── ingress.yaml
│   └── servicemonitor.yaml
│
├── terraform-configuration/         # Infrastructure as Code
│   ├── main.tf                      # AWS resources
│   ├── local.tf                     # Local variables
│   ├── provider.tf                  # Terraform provider
│   ├── config.py                    # Configuration script
│   ├── sheetwise-auth-backend.sh   # Backend setup script
│   ├── sheetwise-ws-backend.sh     # WS server setup script
│   └── userdata-tools.sh           # Infrastructure setup
│
├── jenkinsfiles/
│   └── jenkinsfile-backend-nodejs.groovy  # CI/CD pipeline
│
└── README.md                        # This file
```

---

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ (for development) or any Linux distribution
- **CPU**: 4 cores minimum
- **RAM**: 8 GB minimum (16 GB recommended)
- **Storage**: 50 GB SSD minimum

### Software Requirements
- **Node.js**: v20.x LTS
- **npm**: v10.x
- **Docker**: v24.x
- **Docker Compose**: v2.x
- **Git**: Latest version
- **PostgreSQL**: v15+ (or use Docker)
- **Redis**: Latest (or use Docker)

### Accounts & API Keys
1. **Google Cloud**
   - Google OAuth 2.0 credentials
   - Gemini API key

2. **AWS**
   - AWS Access Key ID
   - AWS Secret Access Key
   - S3 bucket created

3. **Mailtrap/Gmail**
   - Email service credentials

4. **Razorpay** (optional, for payment)
   - Razorpay Key ID & Secret

---

## 🚀 Local Setup & Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/sujalsharmaa/Excel.git
cd Excel
```

### Step 2: Backend Setup (REST API)

```bash
cd Excel_Backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials (see Configuration section below)
nano .env

# Start the server (development mode)
npm start
# or
node Server.js

# For production with PM2
npm install -g pm2
pm2 start Server.js --name "sheetwise-api" --max-memory-restart 250M
pm2 save
```

**Backend runs on**: `http://localhost:3000`

### Step 3: WebSocket Server Setup

```bash
cd Excel_Backend_Nodejs_WS

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with credentials
nano .env

# Start the WebSocket server
npm start
# or
node Server.js

# With PM2
pm2 start Server.js --name "sheetwise-ws" --max-memory-restart 250M
```

**WebSocket runs on**: `http://localhost:8080`

### Step 4: Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local
nano .env.local

# Start development server
npm run dev

# Production build
npm run build
npm run preview
```

**Frontend runs on**: `http://localhost:5173`

### Step 5: Infrastructure Setup (Docker)

```bash
# Start all services with Docker Compose
docker-compose up -d

# Services started:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Chroma DB: localhost:8000
```

### Step 6: Initialize Database

```bash
# The database tables are automatically created on first run
# If needed, manually trigger table creation:

cd Excel_Backend
node -e "import('./Model/CreateTable.js').then(m => m.createTable())"
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=postgres

# Redis
redis_host=localhost
redis_port=6379

# AWS S3
S3_BUCKET_NAME=your-s3-bucket-name
accesskeyid=YOUR_AWS_ACCESS_KEY
secretaccesskey=YOUR_AWS_SECRET_KEY

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google Gemini AI
GEMINI_KEYS_2=your-gemini-api-key
model=gemini-2.5-flash
embedding=gemini-embedding-001

# Vector Database (Chroma)
CHROMA_URL=http://localhost:8000

# Email Service (Mailtrap/Gmail)
MY_EMAIL=your-email@gmail.com
MY_PASSWORD=your-app-password

# Razorpay (Payment)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Elasticsearch (Logging)
ELASTICSEARCH_URL=localhost:9200

# Session Secret
SESSION_SECRET=your-session-secret-key
```

#### WebSocket Server (.env)

```env
# Server
PORT=8080
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=postgres

# Redis
redis_host=localhost
redis_port=6379

# AWS
accesskeyid=YOUR_AWS_ACCESS_KEY
secretaccesskey=YOUR_AWS_SECRET_KEY
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Elasticsearch
ELASTICSEARCH_URL=localhost:9200
```

#### Frontend (.env.local)

```env
# API Configuration
VITE_PUBLIC_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:8080
VITE_FRONTEND_URL=http://localhost:5173

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## ▶️ Running the Application

### Development Mode (All Services)

```bash
# Terminal 1: Backend API
cd Excel_Backend
npm start

# Terminal 2: WebSocket Server
cd Excel_Backend_Nodejs_WS
npm start

# Terminal 3: Frontend
cd Frontend
npm run dev

# Terminal 4: Infrastructure (Optional, if using Docker)
docker-compose up -d
```

### Production Mode with PM2

```bash
# Backend
cd Excel_Backend
pm2 start Server.js --name "api" -i max

# WebSocket
cd Excel_Backend_Nodejs_WS
pm2 start Server.js --name "ws" -i max

# Frontend (Build & Serve)
cd Frontend
npm run build
pm2 serve dist 3000 --name "frontend"

# Monitor
pm2 monit
```

### Docker Containerization

```bash
# Build backend image
cd Excel_Backend
docker build -t sheetwise-api:latest .

# Build WebSocket image
cd Excel_Backend_Nodejs_WS
docker build -t sheetwise-ws:latest .

# Run containers
docker run -d --name api -p 3000:3000 --env-file .env sheetwise-api:latest
docker run -d --name ws -p 8080:8080 --env-file .env sheetwise-ws:latest
```

---

## 📚 API Documentation

### Authentication Endpoints

#### Google OAuth Verification
```http
POST /api/auth/google/verify
Content-Type: application/json

{
  "token": "google-id-token"
}

Response:
{
  "success": true,
  "user": { ... },
  "token": "jwt-token"
}
```

#### Check Authentication Status
```http
GET /api/auth/status
```

#### Logout
```http
GET /logout
```

### File Operations

#### Get Admin Files
```http
GET /api/admin
Authorization: Bearer {jwt-token}

Response:
{
  "success": true,
  "data": [
    {
      "fileId": "file_123_abc.csv",
      "file_name_user": "Sales Report",
      "modified_at": "2024-01-15T10:30:00Z",
      "permissions": [...]
    }
  ]
}
```

#### Create New File
```http
POST /api/newfile
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "fileNamebyUser": "My Spreadsheet",
  "UserPermissions": [
    {
      "email": "user@example.com",
      "permission": "view"
    }
  ]
}

Response:
{
  "success": true,
  "fileId": "file_timestamp_googleid.csv"
}
```

#### Get File Content
```http
GET /api/file/{fileId}
Authorization: Bearer {jwt-token}

Response:
{
  "fileNameForUser": "My Spreadsheet",
  "fileContent": [
    ["Header1", "Header2"],
    ["Data1", "Data2"]
  ]
}
```

#### Rename File
```http
POST /api/file/rename
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "file_Old_name": "Old Name",
  "fileNewName": "New Name"
}
```

#### Delete File
```http
DELETE /api/admin/files/{fileName}
Authorization: Bearer {jwt-token}

Response:
{
  "success": true,
  "version": "version-id"
}
```

### Permission Management

#### Add User Permission
```http
POST /api/admin/files/{fileName}/users
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "email": "user@example.com",
  "read_permission": true,
  "write_permission": false
}
```

#### Update User Permission
```http
PUT /api/admin/files/{fileName}/users/{email}
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "read_permission": true,
  "write_permission": true
}
```

#### Remove User Permission
```http
DELETE /api/admin/files/{fileName}/users/{email}
Authorization: Bearer {jwt-token}
```

### Sharing & Tokens

#### Generate Share Token
```http
POST /api/admin/generateToken
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "time": "24h",
  "fileName": "My Spreadsheet"
}

Response:
{
  "token": "random-base64-token",
  "url": "http://localhost:5173/token/file/file_id/token",
  "expiresAt": 1672531200000
}
```

#### Access File with Token (No Auth Required)
```http
GET /api/token/file/{fileId}/{token}

Response:
{
  "fileContent": "csv-data",
  "ttl": 86400,
  "fileNameFromUser": "My Spreadsheet"
}
```

#### Send File via Email
```http
POST /api/email
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "email": "recipient@example.com",
  "file_id": "file_123_abc.csv",
  "fileName": "Sales Report"
}
```

### AI Features

#### Chat with AI Assistant
```http
POST /api/chat
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "fileUrl": "file_123_abc.csv",
  "fileNameFromUser": "Sales Data",
  "messages": [
    {
      "role": "user",
      "content": "Calculate sum of column A"
    }
  ]
}

Response:
{
  "response": {
    "response": "I've calculated the sum...",
    "actions": [
      {
        "type": "SET_CELL_VALUE",
        "row": 10,
        "col": 0,
        "value": "1250"
      }
    ]
  }
}
```

#### Embed Data with Vector Search
```http
POST /api/embed
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "fileUrl": "file_123_abc.csv",
  "fileNameFromUser": "Data"
}

Response:
{
  "success": true,
  "message": "Embedding complete"
}
```

### Storage Management

#### Get Storage Usage
```http
GET /api/storageSize
Authorization: Bearer {jwt-token}

Response:
{
  "bytes": 1048576,
  "megabytes": 1.0,
  "gigabytes": 0.001
}
```

### Payment Integration

#### Create Storage Upgrade Order
```http
POST /api/create-storage-order
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "amount": 29900,
  "currency": "INR"
}
```

#### Verify Payment
```http
POST /api/verify-payment
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "razorpay_payment_id": "pay_123",
  "razorpay_order_id": "order_123",
  "razorpay_signature": "signature_123"
}
```

---

## 🔌 WebSocket Events

### Connection Events

#### Initialize Connection
```javascript
// Client sends
{
  "type": "INIT",
  "userID": "google_id",
  "fileName": "file_id.csv"
}
```

### Data Update Events

#### Cell Update
```javascript
// Client sends
[{
  "type": "UPDATE",
  "row": 0,
  "col": 1,
  "value": "New Value",
  "fileNameFromUser": "file_id.csv",
  "isWritePermitted": true,
  "id": "user_google_id"
}]

// Server broadcasts to other clients
[{
  "type": "UPDATE",
  "row": 0,
  "col": 1,
  "value": "New Value",
  "fileNameFromUser": "file_id.csv",
  "senderId": "user_google_id"
}]
```

#### Add Row
```javascript
{
  "type": "ROW_ADD",
  "fileNameFromUser": "file_id.csv",
  "amount": 5,
  "id": "user_google_id",
  "isWritePermitted": true
}
```

#### Add Column
```javascript
{
  "type": "COL_ADD",
  "fileNameFromUser": "file_id.csv",
  "amount": 3,
  "id": "user_google_id",
  "isWritePermitted": true
}
```

### Chat Events

#### Chat Message
```javascript
{
  "type": "CHAT_MESSAGE",
  "fileNameFromUser": "file_id.csv",
  "sender": {
    "id": "user_google_id",
    "name": "John Doe"
  },
  "message": "Hello team!",
  "timestamp": 1672531200000
}
```

#### Load Chat History
```javascript
{
  "type": "CHAT_HISTORY",
  "fileNameFromUser": "file_id.csv"
}

// Server responds
{
  "type": "CHAT_HISTORY",
  "messages": [...]
}
```

### Drawing Events

#### Get Drawing History
```javascript
{
  "type": "GET_DRAWING_HISTORY",
  "fileNameFromUser": "file_id.csv",
  "id": "user_google_id"
}

// Server responds
{
  "type": "DRAWING_HISTORY",
  "history": {...}
}
```

#### Drawing Update
```javascript
{
  "type": "DRAWING_UPDATE",
  "fileNameFromUser": "file_id.csv",
  "id": "user_google_id",
  "scene": {
    "elements": [...]
  }
}
```

#### Save Drawing
```javascript
{
  "type": "SAVE_DRAWING",
  "fileNameFromUser": "file_id.csv",
  "id": "user_google_id"
}
```

### Video Chat Events

#### Video Offer
```javascript
{
  "type": "VIDEO_OFFER",
  "fileNameFromUser": "file_id.csv",
  "id": "user_google_id",
  "offer": {...}
}
```

#### Video Answer
```javascript
{
  "type": "VIDEO_ANSWER",
  "fileNameFromUser": "file_id.csv",
  "id": "user_google_id",
  "answer": {...}
}
```

#### ICE Candidate
```javascript
{
  "type": "ICE_CANDIDATE",
  "fileNameFromUser": "file_id.csv",
  "id": "user_google_id",
  "candidate": {...}
}
```

---

## 🚢 Deployment Guide

### Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster (1.25+)
- kubectl configured
- Docker images pushed to registry

#### Deployment Steps

```bash
# 1. Create namespaces
kubectl create namespace sheetwise

# 2. Create secrets
kubectl create secret generic sheetwise-secrets \
  -n sheetwise \
  --from-literal=DB_PASS=postgres \
  --from-literal=GEMINI_KEYS_2=your-key \
  # ... other secrets

# 3. Apply ConfigMaps
kubectl apply -f kubernetes-manifests/configmap-backend.yaml
kubectl apply -f kubernetes-manifests/configmap-ws.yaml

# 4. Apply storage resources
kubectl apply -f kubernetes-manifests/postgres/persistent-volume.yaml
kubectl apply -f kubernetes-manifests/postgres/persistent-volume-claim.yaml

# 5. Deploy PostgreSQL
kubectl apply -f kubernetes-manifests/postgres/postgres-secret.yaml
kubectl apply -f kubernetes-manifests/postgres/postgres-statefulsets.yaml
kubectl apply -f kubernetes-manifests/postgres/postgres-service.yaml

# 6. Deploy Redis
kubectl apply -f kubernetes-manifests/Redis-manifests/redis-configmap.yaml
kubectl apply -f kubernetes-manifests/Redis-manifests/redis-statefulsets.yaml
kubectl apply -f kubernetes-manifests/Redis-manifests/redis-service.yaml

# 7. Deploy Chroma DB
kubectl apply -f kubernetes-manifests/postgres/chromaDB-sts.yaml

# 8. Deploy backend services
kubectl apply -f kubernetes-manifests/backend-nodejs-deployment.yaml
kubectl apply -f kubernetes-manifests/backend-nodejs-service.yaml
kubectl apply -f kubernetes-manifests/backend-ws-deployment.yaml
kubectl apply -f kubernetes-manifests/backend-ws-service.yaml

# 9. Setup Ingress
kubectl apply -f kubernetes-manifests/issuer.yaml
kubectl apply -f kubernetes-manifests/ingress.yaml

# 10. Verify deployment
kubectl get pods -n sheetwise
kubectl get svc -n sheetwise
kubectl get ingress -n sheetwise
```

### AWS Deployment with Terraform

```bash
# 1. Navigate to terraform directory
cd terraform-configuration

# 2. Initialize Terraform
terraform init

# 3. Review infrastructure plan
terraform plan

# 4. Apply infrastructure
terraform apply

# 5. Get outputs
terraform output

# 6. Monitor deployment
# Check AWS EC2 Dashboard and CloudWatch
```

### CI/CD Pipeline (Jenkins)

```groovy
// Jenkins will automatically:
// 1. Build Docker images
// 2. Push to Docker registry
// 3. Run Trivy security scan
// 4. Deploy to Kubernetes
// 5. Monitor with Prometheus/Grafana
```

### SSL/TLS Setup with Let's Encrypt

```bash
# Certificates are automatically managed via cert-manager
# Ingress configuration includes:
# - Certificate issuer (Let's Encrypt)
# - Automatic renewal
# - HTTPS termination at CloudFront/ALB
```

---

## 🗄️ Database Schema

### PostgreSQL Tables

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  imageURL VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_premium_user BOOLEAN DEFAULT false,
  storage INT DEFAULT 1
);
```

#### project_files
```sql
CREATE TABLE project_files (
  file_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255),
  google_id VARCHAR(255) NOT NULL,
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  file_name_user VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  drawing_data JSONB,
  FOREIGN KEY (google_id) REFERENCES users (google_id) ON DELETE CASCADE,
  FOREIGN KEY (email) REFERENCES users (email) ON DELETE CASCADE
);
```

#### file_permissions
```sql
CREATE TABLE file_permissions (
  id SERIAL PRIMARY KEY,
  file_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  read_permission BOOLEAN DEFAULT false,
  write_permission BOOLEAN DEFAULT false,
  email VARCHAR(255) NOT NULL,
  is_admin BOOLEAN NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES project_files(file_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(google_id) ON DELETE CASCADE,
  UNIQUE (file_id, user_id)
);
```

### Redis Data Structure

```
Keys:
- {file_id}: JSON compressed spreadsheet data
- chat:{file_id}: List of chat messages
- {file_id}token: Share access token
- {file_id}name: File name
```

---

## 🔒 Security Considerations

### Authentication & Authorization
- JWT tokens with 24-hour expiration
- Google OAuth 2.0 for secure login
- Role-based access control (read/write)
- Admin permissions for file operations

### Data Protection
- AWS S3 with encryption at rest
- HTTPS/TLS for all communications
- Redis JSON store encrypted
- PostgreSQL password authentication

### API Security
- CORS configuration for whitelisted domains
- Rate limiting on API endpoints
- Input validation on all endpoints
- SQL injection prevention with parameterized queries

### Infrastructure Security
- VPC isolation for database and services
- Security groups for traffic control
- IAM roles for AWS service access
- Regular security scanning with Trivy

---

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Refused
```bash
# Check if WebSocket server is running
lsof -i :8080

# Check WebSocket server logs
pm2 logs ws

# Solution: Restart WebSocket server
pm2 restart ws
```

#### Redis Connection Error
```bash
# Check Redis status
redis-cli ping
# Should respond: PONG

# Start Redis
redis-server
# or
docker run -d -p 6379:6379 redis/redis-stack
```

#### PostgreSQL Connection Failed
```bash
# Check PostgreSQL status
psql -U postgres -h localhost

# Check logs
docker logs postgres

# Reset database
psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS postgres;"
psql -U postgres -d postgres -c "CREATE DATABASE postgres;"
```

#### File Not Found in Redis
```bash
# Check Redis keys
redis-cli KEYS "*"

# Check specific file
redis-cli JSON.GET file_123_abc.csv

# Solution: Re-upload file
# The file will be cached on next access
```

#### AI Assistant Not Working
```bash
# Check Gemini API key
echo $GEMINI_KEYS_2

# Check Chroma DB connection
curl http://localhost:8000/api/v1/heartbeat

# Check LangChain imports
npm list @langchain/google-genai
```

#### Email Not Sending
```bash
# Check email configuration
echo $MY_EMAIL
echo $MY_PASSWORD

# Check Mailtrap/Gmail app password
# Gmail: Use 16-character app password, not account password

# Test email service
node -e "const ec = require('./Mailtrap/EmailControllers'); ec.sendWelcomeEmail('test@test.com', 'Test')"
```

#### Performance Issues
```bash
# Check process memory
pm2 monit

# Check database queries
# Enable slow query log in PostgreSQL

# Optimize Redis
redis-cli INFO stats

# Check S3 upload speed
# Monitor CloudWatch metrics
```

---

## 🤝 Contributing

### Code Style
- Follow ESLint configuration
- Use consistent formatting with Prettier
- Write meaningful commit messages
- Add comments for complex logic

### Pull Request Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Testing
```bash
# Run tests
npm test

# Coverage report
npm run test:coverage

# Lint code
npm run lint
```

### Reporting Issues
- Use GitHub Issues
- Include error messages and logs
- Provide reproduction steps
- Specify environment details

---

## 📄 License

This project is licensed under the ISC License - see LICENSE file for details.

---

## 📞 Support & Contact

### Documentation
- **API Docs**: See API Documentation section above
- **Architecture**: See Architecture section above
- **Deployment**: See Deployment Guide section above

### Support Channels
- **Email**: sujalsharma151@gmail.com
- **GitHub Issues**: [Create an issue](https://github.com/sujalsharmaa/Excel/issues)
- **Documentation**: Check [markdown.md](./Excel_Backend/markdown.md)

### Useful Links
- **Live Demo**: https://sujalsharma.in
- **GitHub Repository**: https://github.com/sujalsharmaa/Excel
- **Tech Stack Docs**:
  - [React Documentation](https://react.dev)
  - [Express.js Guide](https://expressjs.com)
  - [Kubernetes Docs](https://kubernetes.io/docs)
  - [Terraform Docs](https://www.terraform.io/docs)
  - [Google Gemini API](https://ai.google.dev)

---

## 🎉 Acknowledgments

### Technologies & Services
- Google Cloud for Gemini AI
- AWS for cloud infrastructure
- Handsontable for spreadsheet component
- Excalidraw for drawing canvas
- LangChain for LLM framework
- All open-source contributors

### Inspiration
- Google Sheets
- Microsoft Excel
- Figma (collaboration model)

---

## 📊 Project Statistics

- **Frontend**: ~5,000+ lines of React/JavaScript
- **Backend API**: ~3,500+ lines of Node.js
- **WebSocket**: ~2,000+ lines of Node.js
- **Database**: 3 tables with relationships
- **API Endpoints**: 30+
- **WebSocket Events**: 15+
- **Kubernetes Manifests**: 15+ YAML files
- **Terraform Code**: 500+ lines of IaC

---

## 🗓️ Roadmap

### Completed ✅
- Real-time collaboration
- AI-powered data analysis
- File sharing with tokens
- Email integration
- Payment integration
- Kubernetes deployment
- Vector search with Chroma

### In Progress 🔄
- Advanced charting
- Data export to multiple formats
- API documentation portal
- Mobile app version

### Future 🚀
- Offline mode with sync
- Advanced data analysis (ML)
- Custom formula editor
- Plugin marketplace
- Multi-language support
- Mobile native apps

---

**Happy spreadsheet collaboration! 🎉**

For detailed information on specific components, check the relevant files in the repository.

Last Updated: January 2025 | Version: 1.0.0
