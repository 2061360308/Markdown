<div style="text-align: center;">
    <img src="public/cover.png" alt='砚台封面'/>
    <p>
    <img src="https://img.shields.io/badge/vue-3.x-brightgreen.svg" alt="Vue 3">
    <img src="https://img.shields.io/badge/github-api-blue.svg" alt="GitHub API">
    <img src="https://img.shields.io/badge/typescript-4.x-007ACC.svg" alt="TypeScript">
    <img src="https://img.shields.io/github/stars/2061360308/InkStone.svg?style=social" alt="Stars">
    <img src="https://img.shields.io/github/forks/2061360308/InkStone.svg?style=social" alt="Forks">
    <img src="https://img.shields.io/github/issues/2061360308/InkStone.svg?color=yellow" alt="Issues">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License">
</p>
</div>

# 砚台/InkStone

## 介绍

《砚台》是一款由 Vue 开发的在线 Markdown 编辑器，特意为 Hexo、Hugo 等静态站点生成器设计，支持同步到 Github，可视化编辑 yaml front matter 等贴心功能。《砚台》完全运行在浏览器，可以和静态站点一起发布。

![展示图](docs/images/屏幕截图%202025-01-15%20232457.png)

<div style="text-align: center;">
    <a href="docs/screenshots.md">@更多截图</a>
</div>

### 补充强调

1. 项目需要随时拉取，提交 Github，如果不能流畅访问 Github 则只能使用基础编辑功能。

2. 目前 token 都会保存在浏览器本地（简单加密，但是加密算法写死在前端项目中），所以务必注意秘钥安全。如果需要自己创建秘钥使用，最好能够给予最小权限。

### 体验地址

[Vercel](https://hugo-editor.1think2program.cn)

<!-- 1. [Github Pages](https://www.1think2program.cn/HugoEditor) -->

> 由于以上体验方式中 Github 认证服务所用服务器均由 Vercel 支持,且 Github Pages 无法重写路由规则，登录回调中重定向到/login 路径无法识别，所以暂不提供 Github Pages 体验方式。请等待后续修复路由模式。

## 特性

- 纯前端静态页面，可无需服务器
- 支持直接从 Github 仓库获取文件
- 支持批量提交文件到 Github
- 支持根据更改内容自动生成提交信息
- 本地缓存数据使用 IndexDB 保存
- 支持可视化编辑 Yaml Front Matter
- Markdown 编辑器支持所见即所得，及时渲染，分屏预览三种模式
- 支持大纲列表

## 预计开发任务

- [x] 迁移整理图标相关代码
- [x] GitHub 拉取/提交文件策略更新
- [x] 文件管理器优化，外观，功能
- [ ] 主题统一，支持切换
- [x] 允许加载/保存全局配置
- [x] 编辑器添加处理格式字符串的功能
- [x] 事件总线完善
- [x] 更加完整的底部状态条功能
- [x] 提供更多登录方式,注册成为 GitHub App
- [x] 大纲列表
- [x] 搜索列表
- [x] 更完整的设置面板，支持更多可选项配置
- [ ] 图床开发
- [ ] 适配 history 和 hash 两种模式
- [ ] 自定义 Github 接口代理

> 如有新的需求或者急需上述某个功能可在 issue 中提出

## 开发/自部署

1. clone
2. pnpm install
3. pnpm run dev / pnpm build

自己部署需要：

1. 将 build 构建内容（dist 下）部署到自己服务器（可以和静态站点一同发布）
2. 如需自行配置 Github 登录服务器，则需自行申请 Github App，之后将 api 下接口部署到服务器

目前访问量较少不需要这么操作,如果觉得页面网速慢的话可以把静态文件放在自己服务器上，加快访问速度
