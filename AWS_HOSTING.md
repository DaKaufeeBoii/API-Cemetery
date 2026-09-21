# AWS Hosting & Deployment Guide — API Cemetery

API Cemetery is architected for full-stack cloud hosting on AWS using serverless, highly-available, and cost-effective services.

---

## 🏗️ Architecture Overview

```
[Users / Internet]
       │
       ▼ (HTTPS / Global CDN)
[Amazon CloudFront Distribution]
       │
       ├──► [Amazon S3 (Hosting Bucket)]
       │      • Next.js Static Export (HTML / JS / CSS)
       │      • Origin Access Control (OAC) enabled
       │      • Custom Error Responses (403/404 -> /index.html) for client-side routing
       │
       └──► [Amazon API Gateway (ProjectsApi)]
              • REST API routes (/projects, /endpoints, /ingest, /analyze)
              │
              ▼
       [AWS Lambda Functions (Node.js 20)]
              │
              ├──► [Amazon DynamoDB Tables]
              │      • api-cemetery-projects
              │      • api-cemetery-endpoints (ProjectIndex GSI)
              │      • api-cemetery-consumers
              │      • api-cemetery-dependencies
              │      • api-cemetery-analysis
              │
              └──► [Amazon S3 (Data Bucket)]
                     • Raw OpenAPI and log ingestion archives
```

---

## 🚀 Option 1: One-Click Automated Deployment (Recommended)

Everything can be deployed with a single command using the included deployment script:

```powershell
npm run deploy:aws
```

or directly via PowerShell:

```powershell
.\deploy-aws.ps1
```

### What this script does:
1. Validates your active AWS CLI credentials and region.
2. Builds the SAM backend (`sam build`).
3. Deploys/updates the AWS CloudFormation stack (`api-cemetery-prod`) with DynamoDB, S3, API Gateway, Lambda, and CloudFront.
4. Reads the generated CloudFormation stack outputs (`ApiUrl`, `HostingBucketName`, `CloudFrontUrl`, `CloudFrontDistributionId`).
5. Configures `.env.production` with the live API Gateway endpoint.
6. Builds the Next.js static production export into `out/`.
7. Uploads and syncs all frontend files to the S3 hosting bucket with `--delete`.
8. Creates a CloudFront cache invalidation (`/*`) so changes reflect immediately across worldwide edge locations.
9. Prints the live public CloudFront HTTPS URL.

---

## 🌐 Option 2: AWS Amplify Hosting (GitOps Continuous Deployment)

If you prefer continuous deployment linked directly to your GitHub repository:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Configure AWS hosting"
   git push -u origin main
   ```

2. **Connect to AWS Amplify Console**:
   - Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify/).
   - Click **Host web app** and choose **GitHub**.
   - Select repository: `DaKaufeeBoii/API-Cemetery` and branch: `main`.
   - Amplify will automatically detect `amplify.yml` included in the root directory.

3. **Build Settings**:
   The `amplify.yml` file is preconfigured:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: out
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

4. **Deploy**:
   - Click **Save and Deploy**. Every subsequent push to `main` will trigger a new build and deploy automatically.

---

## 🛠️ Backend API Endpoints

Once deployed, the API Gateway provides the following endpoints:

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/projects` | `listProjects.js` | Returns all projects |
| `GET` | `/projects/{projectId}` | `getProject.js` | Retrieves project details |
| `GET` | `/projects/{projectId}/endpoints` | `listEndpoints.js` | Lists all endpoints for a project |
| `GET` | `/projects/{projectId}/endpoints/{endpointId}` | `getEndpoint.js` | Retrieves detailed endpoint data |
| `POST` | `/projects/{projectId}/ingest` | `ingest.js` | Ingests OpenAPI spec or traffic logs |
| `POST` | `/projects/{projectId}/analyze` | `analyze.js` | Runs risk engine and updates DynamoDB |
| `POST` | `/endpoints/{endpointId}/delete-analysis` | `deleteAnalysis.js` | Blast radius & safety verdict |

---

## 🧹 Teardown / Cleanup

To delete all AWS cloud resources when no longer needed:

```powershell
sam delete --stack-name api-cemetery-prod --no-prompts
```

*(Ensure S3 buckets are emptied first if deletion encounters bucket retention rules).*
