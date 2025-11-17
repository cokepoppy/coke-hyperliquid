# Google OAuth Redirect 模式配置指南

## ✅ 已完成的改动

已将 Google 登录从 popup 模式改为 **redirect 模式**（标准 OAuth 2.0 流程）。

### 前端改动
1. ✅ `GoogleLogin.vue` - 改为 redirect 模式，点击按钮跳转到 Google
2. ✅ `GoogleCallback.vue` - 新建回调页面处理返回的 code
3. ✅ `router/index.ts` - 添加 `/auth/google/callback` 路由

### 后端改动
1. ✅ `AuthService.ts` - 添加 `loginWithGoogleCode()` 方法
2. ✅ `AuthController.ts` - 添加 `googleCallback` 控制器
3. ✅ `routes/auth.ts` - 添加 `POST /api/auth/google/callback` 路由
4. ✅ 配置 OAuth2Client 使用 Client Secret

## 🔧 Google Cloud Console 配置

### 步骤 1：访问 OAuth 客户端配置页面

```
https://console.cloud.google.com/apis/credentials/oauthclient/240275389988-s32vl4lt6djaphpu5ll8kfb2odd36spo?project=turnkey-channel-421502
```

### 步骤 2：配置授权的 JavaScript 来源

在 **"授权的 JavaScript 来源"** 部分，添加：

```
http://localhost:5173
http://127.0.0.1:5173
```

**重要**：不要添加尾部斜杠！

### 步骤 3：配置授权的重定向 URI（重要！）

在 **"已获授权的重定向 URI"** 部分，添加：

```
http://localhost:5173/auth/google/callback
http://127.0.0.1:5173/auth/google/callback
```

这是 **redirect 模式必需的配置**！

### 步骤 4：保存配置

点击页面底部的 **"保存"** 按钮。

---

## 🚀 启动服务

### 1. 重启后端服务

```bash
cd /mnt/d/home/coke-hyperliquid/backend
npm run dev
```

### 2. 重启前端服务

```bash
cd /mnt/d/home/coke-hyperliquid/frontend
npm run dev
```

---

## 🔄 登录流程

### 用户体验流程：

1. 用户访问 `http://localhost:5173/login`
2. 点击 "使用 Google 账号登录" 按钮
3. **浏览器跳转到 Google 登录页面**
4. 用户在 Google 页面登录并授权
5. **Google 重定向回** `http://localhost:5173/auth/google/callback?code=xxx`
6. 前端回调页面获取 code
7. 前端发送 code 到后端 `/api/auth/google/callback`
8. 后端用 code 换取 access token 和用户信息
9. 后端返回 JWT token
10. 前端保存 token 并跳转到 `/trade`

### 技术流程：

```
用户 → 前端 → Google OAuth → 前端回调 → 后端 API → 数据库
     (点击)    (授权)      (code)     (验证)    (创建/查找用户)
```

---

## 📋 完整配置检查清单

### Google Cloud Console
- [ ] 已添加 JavaScript 来源：`http://localhost:5173`
- [ ] 已添加重定向 URI：`http://localhost:5173/auth/google/callback`
- [ ] 点击了保存按钮
- [ ] （可选）发布应用或添加测试用户

### 后端
- [ ] `.env` 中有 `GOOGLE_CLIENT_ID`
- [ ] `.env` 中有 `GOOGLE_CLIENT_SECRET`
- [ ] `.env` 中 `CORS_ORIGIN=http://localhost:5173`
- [ ] 后端服务运行在 4000 端口
- [ ] 数据库迁移已完成

### 前端
- [ ] `.env` 中有 `VITE_GOOGLE_CLIENT_ID`
- [ ] 前端服务运行在 5173 端口
- [ ] 能访问 `http://localhost:5173/login`

---

## 🧪 测试步骤

1. 打开浏览器，访问 `http://localhost:5173/login`

2. 点击 "使用 Google 账号登录" 按钮

3. 应该会跳转到 Google 登录页面，URL 类似：
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=http://localhost:5173/auth/google/callback...
   ```

4. 登录 Google 账号并授权

5. 应该会重定向回：
   ```
   http://localhost:5173/auth/google/callback?code=4/0AanRR...
   ```

6. 页面显示 "正在处理 Google 登录..."

7. 成功后自动跳转到 `/trade` 页面

---

## ❓ 常见问题

### Q1: 403 错误 - origin not allowed
**原因**：JavaScript 来源未配置
**解决**：在 Google Console 添加 `http://localhost:5173`

### Q2: redirect_uri_mismatch 错误
**原因**：重定向 URI 未配置或不匹配
**解决**：
- 确保添加了 `http://localhost:5173/auth/google/callback`
- 检查 URL 是否完全匹配（包括协议、端口、路径）
- 没有多余的斜杠

### Q3: CORS 错误
**原因**：后端 CORS 配置错误
**解决**：
- 检查后端 `.env` 中 `CORS_ORIGIN=http://localhost:5173`
- 重启后端服务

### Q4: 回调页面一直转圈
**原因**：后端 API 错误
**解决**：
- 打开浏览器控制台查看错误
- 检查后端日志
- 确认 GOOGLE_CLIENT_SECRET 已配置

### Q5: 用户不在测试用户列表中
**症状**：能跳转到 Google，但提示账号无权访问
**解决方案**：
- 方式 1：发布应用（允许所有用户）
- 方式 2：添加测试用户邮箱
- 方式 3：用户点击 "高级" → "继续"

---

## 📊 Redirect vs Popup 对比

| 特性 | Redirect 模式 ✅ (当前) | Popup 模式 |
|------|----------------------|-----------|
| 用户体验 | 页面跳转 | 弹窗 |
| 安全性 | 更安全 | 一般 |
| 兼容性 | 更好 | 可能被拦截 |
| 配置 | 需要重定向 URI | 只需 JS 来源 |
| 标准性 | OAuth 2.0 标准 | Google 特有 |
| 移动端 | 更友好 | 不太友好 |

---

## 🎯 关键配置对比

### Redirect 模式（当前使用）

**Google Console 配置：**
```
授权的 JavaScript 来源：
  http://localhost:5173

已获授权的重定向 URI：
  http://localhost:5173/auth/google/callback  ← 必需！
```

**流程：**
```
用户点击登录
  → 跳转到 Google
  → Google 重定向回 callback
  → 前端获取 code
  → 后端换取 token
```

---

## ✨ 优势

1. **更标准**：遵循 OAuth 2.0 标准流程
2. **更安全**：code 换 token 在后端完成
3. **更可靠**：不依赖弹窗，不会被拦截
4. **更友好**：移动端体验更好
5. **更灵活**：可以获取 refresh token

---

## 🔐 安全注意事项

1. **Client Secret** 只在后端使用，永远不要暴露到前端
2. **Authorization Code** 只使用一次，不可重复
3. **JWT Token** 存储在 localStorage，生产环境建议使用 httpOnly cookie
4. **HTTPS** 生产环境必须使用 HTTPS

---

## 📝 总结

现在使用的是 **OAuth 2.0 Authorization Code Flow（授权码模式）**，这是最标准、最安全的 OAuth 流程。

**必须配置的重定向 URI：**
```
http://localhost:5173/auth/google/callback
```

配置完成后，用户点击登录会跳转到 Google，授权后自动返回并完成登录！🎉
