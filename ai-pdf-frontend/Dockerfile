# 1. Aşama: Build
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Next.js build al
RUN npm run build

# 2. Aşama: Production
FROM nginx:stable-alpine as production-stage
# Derlenen dosyaları kopyala
COPY --from=build-stage /app/out /usr/share/nginx/html

# --- KRİTİK DÜZELTME ---
# Görselindeki yapıya göre default.conf bir üst dizinde.
# Eğer Docker build komutunu kök dizinden (root) veriyorsan:
COPY ./default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]