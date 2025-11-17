# Google OAuth 配置指南

## 🔴 当前错误

如果你看到以下错误：
```
403 - The given origin is not allowed for the given client ID
```

这表示需要在 Google Cloud Console 中配置授权来源。

## ✅ 配置步骤

### 1. 访问 Google Cloud Console

打开链接：https://console.cloud.google.com/apis/credentials?project=turnkey-channel-421502

### 2. 编辑 OAuth 2.0 客户端

- 找到你的客户端 ID：`240275389988-s32vl4lt6djaphpu5ll8kfb2odd36spo.apps.googleusercontent.com`
- 点击右侧的 ✏️ 编辑按钮

### 3. 配置授权的 JavaScript 来源

在 **"授权的 JavaScript 来源"** 部分，点击 "添加 URI"，添加以下所有地址：

```
http://localhost:3000
http://localhost:5173
http://127.0.0.1:3000
http://127.0.0.1:5173
```

**重要**：每个 URI 都要单独添加，不要包含尾部斜杠 `/`

### 4. 配置授权的重定向 URI（可选）

在 **"授权的重定向 URI"** 部分，添加：

```
http://localhost:3000
http://localhost:5173
```

### 5. 保存配置

点击页面底部的 **"保存"** 按钮

### 6. 添加测试用户

由于应用处于测试模式，需要添加测试用户：

1. 访问：https://console.cloud.google.com/apis/credentials/consent?project=turnkey-channel-421502
2. 滚动到 **"测试用户"** 部分
3. 点击 **"添加用户"**
4. 输入你的 Google 账号邮箱（用于测试的邮箱）
5. 点击 **"保存"**

## 🔄 配置生效

- 通常配置会立即生效
- 有时可能需要等待 5-10 分钟
- 清除浏览器缓存或使用无痕模式测试

## 📋 配置检查清单

- [ ] OAuth 客户端 ID 已创建
- [ ] 已添加授权的 JavaScript 来源（至少包含 `http://localhost:5173`）
- [ ] 已添加测试用户的邮箱
- [ ] 后端环境变量已配置（GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET）
- [ ] 前端环境变量已配置（VITE_GOOGLE_CLIENT_ID）
- [ ] 数据库迁移已完成
- [ ] 后端服务正在运行（端口 4000）
- [ ] 前端服务正在运行（端口 5173）

## 🧪 测试

配置完成后：

1. 重启前端服务（如果正在运行）
   ```bash
   cd frontend
   npm run dev
   ```

2. 打开浏览器访问：`http://localhost:5173/login`

3. 点击 "Sign in with Google" 按钮

4. 选择你添加的测试用户账号

5. 授权应用访问你的 Google 账号信息

6. 登录成功后应该跳转到 `/trade` 页面

## ⚠️ 常见问题

### 问题 1：403 错误
**原因**：授权的 JavaScript 来源未配置或配置错误
**解决**：按照上述步骤添加正确的来源 URI

### 问题 2：账号未被允许登录
**原因**：测试用户未添加
**解决**：在 OAuth 权限请求页面添加测试用户

### 问题 3：CORS 错误
**原因**：浏览器跨域策略限制
**解决**：
- 确保 Vite 配置中已添加 CORS headers
- 重启前端服务
- 清除浏览器缓存

### 问题 4：Google 按钮不显示
**原因**：网络问题或脚本加载失败
**解决**：
- 检查网络连接
- 查看浏览器控制台是否有错误
- 确认可以访问 `accounts.google.com`

## 📝 当前配置

### 客户端信息
- **Client ID**: `240275389988-s32vl4lt6djaphpu5ll8kfb2odd36spo.apps.googleusercontent.com`
- **Client Secret**: `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`
- **创建日期**: 2025年11月13日

### 服务端口
- 后端 API: `http://localhost:4000`
- 前端开发服务器: `http://localhost:5173`

## 🚀 发布到生产环境

当你准备发布到生产环境时：

1. 将 OAuth 应用从"测试"改为"生产"模式
2. 添加生产环境的域名到授权来源
3. 更新环境变量使用生产域名
4. 使用 HTTPS（必需）
5. 更新 CORS 配置
