# 1. Base Image
FROM python:3.9-slim

# 2. Set Working Directory
WORKDIR /app

# 3. Install Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy Code
COPY . .

# 5. Expose Port
EXPOSE 8000

# 6. Run Application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
