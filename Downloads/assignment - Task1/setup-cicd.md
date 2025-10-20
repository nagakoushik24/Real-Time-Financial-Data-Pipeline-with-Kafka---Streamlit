# CI/CD Setup Guide

## 🚀 Quick Setup Steps

### 1. Docker Hub Setup
1. Go to [Docker Hub](https://hub.docker.com/) and create an account
2. Create a new public repository named `task-api`
3. Go to Account Settings → Security → New Access Token
4. Create token with Read, Write, Delete permissions
5. Copy the token (you won't see it again!)

### 2. GitHub Secrets Setup
1. Go to your GitHub repository
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add these secrets:
   - **Name**: `DOCKERHUB_USERNAME` **Value**: Your Docker Hub username
   - **Name**: `DOCKERHUB_TOKEN` **Value**: Your Docker Hub access token

### 3. Push to GitHub
```bash
# Add all files
git add .

# Commit changes
git commit -m "feat: Add CI/CD pipeline with GitHub Actions and Docker"

# Push to main branch
git push origin main
```

### 4. Verify Pipeline
1. Go to Actions tab in your GitHub repository
2. You should see "Java CI-CD Pipeline" running
3. Click on it to see live logs
4. Wait for green checkmark ✅

### 5. Check Docker Hub
1. Go to your Docker Hub repository
2. You should see a new image with `latest` tag
3. The image will be named: `yourusername/task-api:latest`

## 🔧 Manual Testing

### Test Docker Image Locally
```bash
# Pull and run the image
docker run -p 8080:8080 yourusername/task-api:latest

# Test the API
curl http://localhost:8080/tasks
```

### Test with Docker Compose
```bash
# Run the full stack
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f
```

## 📋 Pipeline Features

✅ **Code Build**: Maven compilation and testing  
✅ **Docker Build**: Multi-stage optimized container  
✅ **Docker Push**: Automatic upload to Docker Hub  
✅ **Caching**: Maven and Docker layer caching  
✅ **Security**: Non-root user, minimal attack surface  
✅ **Health Checks**: Container health monitoring  

## 🚨 Troubleshooting

### Pipeline Fails
- Check GitHub Secrets are set correctly
- Verify Docker Hub repository exists
- Check Maven build logs for errors

### Docker Build Fails
- Ensure Dockerfile is in root directory
- Check .dockerignore excludes unnecessary files
- Verify all source files are present

### Memory Issues
- The Dockerfile uses minimal memory settings
- Backend optimized for low-resource environments
- Uses OpenJDK slim image for smaller size

## 📊 What Gets Built

1. **Backend JAR**: `target/assignment.jar`
2. **Docker Image**: `yourusername/task-api:latest`
3. **Frontend**: React app (if using docker-compose)
4. **Database**: MongoDB container

## 🎯 Next Steps

1. **Monitor Pipeline**: Check Actions tab regularly
2. **Update Secrets**: If Docker Hub credentials change
3. **Scale Up**: Add more environments (staging, production)
4. **Add Tests**: Include integration tests in pipeline
5. **Security**: Add vulnerability scanning

---

**Your CI/CD pipeline is now ready! 🎉**
