# Google OAuth 正确配置指南 ✅

## 🎯 标准 OAuth 2.0 Flow

你说得对！标准的 OAuth 2.0 配置应该是：

1. **授权的 JavaScript 来源** = 前端地址
2. **已获授权的重定向 URI** = **后端 API 地址**

---

## ✅ Google Cloud Console 正确配置

访问：https://console.cloud.google.com/apis/credentials/oauthclient/240275389988-s32vl4lt6djaphpu5ll8kfb2odd36spo?project=turnkey-channel-421502

### 1. 授权的 JavaScript 来源（前端）

```
http://localhost:5173
http://127.0.0.1:5173
```

### 2. 已获授权的重定向 URI（后端 API）⭐

```
http://localhost:4000/api/auth/google/callback
```

**重要**：这是**后端服务器地址**，不是前端！

---

## 🔄 完整登录流程

```
1. 用户在前端点击 "Google 登录"
   ↓
2. 前端跳转到 Google 授权页面
   URL: https://accounts.google.com/o/oauth2/v2/auth
   参数:
     - client_id
     - redirect_uri = http://localhost:4000/api/auth/google/callback (后端！)
     - response_type = code
     - scope = openid email profile
     - state = http://localhost:5173 (前端地址)
   ↓
3. 用户在 Google 页面登录并授权
   ↓
4. Google 重定向到后端 ⭐
   http://localhost:4000/api/auth/google/callback?code=xxx&state=http://localhost:5173
   ↓
5. 后端接收 code
   - 用 code 换取 access_token 和 id_token
   - 验证 id_token 获取用户信息
   - 创建/查找用户
   - 生成 JWT token
   ↓
6. 后端重定向回前端，带上 token
   http://localhost:5173/auth/callback#token=xxx&user=xxx
   ↓
7. 前端接收 token
   - 保存到 localStorage
   - 跳转到 /trade
```

---

## 📁 项目配置

### 后端 `.env`
```env
CORS_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=240275389988-s32vl4lt6djaphpu5ll8kfb2odd36spo.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 前端 `.env`
```env
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_CLIENT_ID=240275389988-s32vl4lt6djaphpu5ll8kfb2odd36spo.apps.googleusercontent.com
```

---

## 🚀 启动服务

### 后端（端口 4000）
```bash
cd /mnt/d/home/coke-hyperliquid/backend
npm run dev
```

### 前端（端口 5173）
```bash
cd /mnt/d/home/coke-hyperliquid/frontend
npm run dev
```

---

## 🧪 测试

1. 访问：`http://localhost:5173/login`

2. 点击 "使用 Google 账号登录"

3. 浏览器跳转到 Google，URL 应该是：
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=240275389988-s32vl4lt6djaphpu5ll8kfb2odd36spo.apps.googleusercontent.com
     &redirect_uri=http://localhost:4000/api/auth/google/callback  ← 后端地址！
     &response_type=code
     &scope=openid+email+profile
     &state=http://localhost:5173  ← 前端地址
   ```

4. 授权后，Google 重定向到后端：
   ```
   http://localhost:4000/api/auth/google/callback?code=4/0Aa...&state=http://localhost:5173
   ```

5. 后端处理完后，重定向到前端：
   ```
   http://localhost:5173/auth/callback#token=eyJhb...&user=%7B%22id%22...
   ```

6. 前端解析 token，保存并跳转到 `/trade`

---

## ⚙️ 关键实现代码

### 前端：GoogleLogin.vue
```typescript
const REDIRECT_URI = `${API_URL}/auth/google/callback` // 后端 API 地址！

const handleGoogleLogin = () => {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI) // 后端！
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', 'openid email profile')
  authUrl.searchParams.append('state', window.location.origin) // 前端地址

  window.location.href = authUrl.toString()
}
```

### 后端：AuthController.ts
```typescript
// GET /api/auth/google/callback
static googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.query

  // Exchange code for tokens
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`
  const result = await AuthService.loginWithGoogleCode(code, redirectUri)

  // Redirect back to frontend with token
  const frontendUrl = state || 'http://localhost:5173'
  res.redirect(`${frontendUrl}/auth/callback#token=${result.token.token}&user=...`)
})
```

---

## 🔐 为什么这样设计？

### ✅ 优势

1. **Client Secret 只在后端**
   前端永远不接触 Client Secret，更安全

2. **Code 只使用一次**
   Authorization code 换取 token 在后端完成，更安全

3. **标准 OAuth 2.0 流程**
   遵循行业标准，兼容性好

4. **减少 CORS 问题**
   Token 交换在服务端完成，不需要前端跨域请求 Google API

### 🚫 错误的做法（我之前的错误）

❌ 重定向 URI 配置为前端地址 `http://localhost:5173/auth/google/callback`
❌ 前端接收 code 后再发送给后端
❌ 增加了一次网络请求，降低安全性

---

## 📊 配置对比

| 项目 | 错误配置 ❌ | 正确配置 ✅ |
|------|-----------|-----------|
| JS 来源 | `http://localhost:5173` | `http://localhost:5173` |
| 重定向 URI | `http://localhost:5173/auth/google/callback` | `http://localhost:4000/api/auth/google/callback` |
| Google 回调到 | 前端 | **后端** |
| code 交换 | 前端 → 后端 | 后端直接处理 |
| Client Secret | 可能暴露 | 永远在后端 |

---

## ❓ 常见问题

### Q: 为什么要用 URL hash (#) 传递 token？

A: 因为：
- URL hash 不会发送到服务器（不会记录在后端日志中）
- 更安全，只在前端 JS 中可见
- 避免 token 暴露在服务器日志或 referrer 中

### Q: redirect_uri_mismatch 错误怎么办？

A: 确保 Google Console 中配置的重定向 URI 完全匹配：
```
http://localhost:4000/api/auth/google/callback
```
- 必须包含 `/api`
- 端口必须是 4000
- 不能有尾部斜杠

### Q: state 参数的作用？

A:
- 前端传递给 Google
- Google 原样返回给后端
- 后端用它知道应该重定向到哪个前端地址
- 也可用于防止 CSRF 攻击

---

## 🎉 总结

正确的配置是：

**Google Console:**
- JavaScript 来源：`http://localhost:5173` （前端）
- 重定向 URI：`http://localhost:4000/api/auth/google/callback` （**后端**）

**流程：**
前端 → Google → **后端** → 前端

这才是标准的 OAuth 2.0 Authorization Code Flow！
