FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# 컨테이너 내부 리슨 포트. 스테이징 등은 .env 의 API_PORT 만 바꾸면 됨(nginx 템플릿과 동일 값).
ENV API_PORT=1217
EXPOSE 1217

CMD ["sh", "-c", "exec uvicorn apps.api.main:app --host 0.0.0.0 --port ${API_PORT}"]