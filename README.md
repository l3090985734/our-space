# 「我们的空间」💕

一个只属于两个人的私密小空间——照片、纸条、倒计时，用淡粉色包裹的温柔。

## 技术栈

React 19 + TypeScript + Tailwind CSS 4 + Framer Motion + Supabase

## 功能

- 📷 **照片墙**：大图轮播，支持配文，两人都能上传/删除
- 📝 **小纸条**：碎碎念风格，支持回复，无限下滑
- ⏳ **倒计时**：多个倒计时，见面/纪念日/生日
- 🎀 **粉色主题**：樱花粉配色，圆润可爱

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量（复制 .env.example 为 .env 并填入你的 Supabase 密钥）
cp .env.example .env

# 启动开发服务器
npm run dev
```

没有 Supabase 密钥也能跑——自动进入演示模式，数据存浏览器本地。

## 部署

推送到 GitHub 后自动部署到 GitHub Pages。详见 [部署指南](./部署指南.md)。

## 项目结构

```
src/
├── components/
│   ├── layout/         # 布局（底部导航）
│   ├── home/           # 首页
│   ├── photos/         # 照片墙
│   ├── notes/          # 纸条
│   ├── countdowns/     # 倒计时
│   └── identity/       # 身份选择
├── hooks/              # 数据 hooks
├── lib/                # 工具函数（Supabase 客户端、图片压缩、演示模式）
└── types/              # TypeScript 类型
```